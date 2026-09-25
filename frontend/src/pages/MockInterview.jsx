import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://careerpilot-ai-pcqc.onrender.com";

function MockInterview() {
  const navigate = useNavigate();

  // =====================================================
  // PAGE STATE
  // =====================================================

  const [screen, setScreen] = useState("start");

  // =====================================================
  // INTERVIEW SELECTION
  // =====================================================

  const [selectedType, setSelectedType] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  // =====================================================
  // ACTIVE INTERVIEW
  // =====================================================

  const [sessionId, setSessionId] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [targetRole, setTargetRole] = useState("");

  const [question, setQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const [answer, setAnswer] = useState("");

  // =====================================================
  // AI EVALUATION
  // =====================================================

  const [evaluation, setEvaluation] = useState(null);
  const [result, setResult] = useState(null);

  // =====================================================
  // LOADING
  // =====================================================

  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [loadingActive, setLoadingActive] = useState(true);

  // =====================================================
  // MESSAGES
  // =====================================================

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =====================================================
  // HISTORY
  // =====================================================

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  // =====================================================
  // MICROPHONE
  // =====================================================

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  // =====================================================
  // OPTIONS
  // =====================================================

  const interviewTypes = [
    {
      id: "Technical Interview",
      icon: "💻",
      title: "Technical",
      description: "DSA, OOP, DBMS, APIs and coding concepts.",
    },
    {
      id: "Behavioral Interview",
      icon: "🧠",
      title: "Behavioral",
      description: "Situations, teamwork, ownership and problem solving.",
    },
    {
      id: "HR Interview",
      icon: "🤝",
      title: "HR",
      description: "Motivation, communication, goals and workplace.",
    },
    {
      id: "Mixed Interview",
      icon: "🎯",
      title: "Mixed",
      description: "Technical + Behavioral + HR in one session.",
    },
  ];

  const experienceLevels = [
    {
      id: "Fresher",
      icon: "🌱",
      title: "Fresher",
      description: "Student or no professional experience.",
    },
    {
      id: "0-2 Years",
      icon: "🚀",
      title: "0–2 Years",
      description: "Entry-level professional experience.",
    },
    {
      id: "3-5 Years",
      icon: "📈",
      title: "3–5 Years",
      description: "Intermediate professional experience.",
    },
    {
      id: "5+ Years",
      icon: "🏆",
      title: "5+ Years",
      description: "Senior professional experience.",
    },
  ];

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadActiveInterview();
    loadHistory();
    setupSpeechRecognition();

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
    };
  }, []);

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // =====================================================
  // AUTH
  // =====================================================

  const handleUnauthorized = () => {
    setError(
      "Your session could not be verified for this interview request. Your login has not been cleared."
    );
  };

  // =====================================================
  // SPEECH RECOGNITION
  // =====================================================

  const setupSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
      setMessage("");
    };

    recognition.onresult = (event) => {
      let spokenText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          spokenText += event.results[i][0].transcript;
        }
      }

      if (spokenText.trim()) {
        setAnswer((previous) => {
          const cleanedPrevious = previous.trim();

          if (!cleanedPrevious) {
            return spokenText.trim();
          }

          return `${cleanedPrevious} ${spokenText.trim()}`;
        });
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      setIsListening(false);

      if (event.error === "not-allowed") {
        setError(
          "Microphone permission was denied. Allow microphone access in your browser."
        );
      } else if (event.error === "no-speech") {
        setMessage(
          "No speech detected. Please try speaking again."
        );
      } else {
        setError(
          "Voice input failed. You can continue by typing your answer."
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  };

  const toggleMicrophone = () => {
    if (!voiceSupported) {
      setError(
        "Voice input is not supported by this browser."
      );
      return;
    }

    if (!recognitionRef.current) {
      setupSpeechRecognition();
      return;
    }

    setError("");
    setMessage("");

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }

      setIsListening(false);
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Microphone start error:", err);

      setError(
        "Could not start the microphone. Check browser microphone permissions."
      );
    }
  };

  // =====================================================
  // LOAD ACTIVE INTERVIEW
  // =====================================================

  const loadActiveInterview = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/api/interview/active`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.active) {
        const active = response.data.interview;

        setSessionId(active.session_id || "");
        setInterviewType(active.interview_type || "");
        setExperienceLevel(active.experience_level || "");
        setTargetRole(active.target_role || "");
        setQuestionNumber(active.question_number || 1);
        setQuestionsAnswered(active.questions_answered || 0);
        setQuestion(active.question || null);

        setScreen("interview");
      }
    } catch (err) {
      console.error("Active interview error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
      }
    } finally {
      setLoadingActive(false);
    }
  };

  // =====================================================
  // LOAD HISTORY
  // =====================================================

  const loadHistory = async () => {
    const token = getToken();

    if (!token) return;

    setHistoryLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/api/interview/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setHistory(response.data.history || []);
    } catch (err) {
      console.error("Interview history error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // =====================================================
  // START INTERVIEW
  // =====================================================

  const startInterview = async () => {
    if (!selectedType) {
      setError("Please select an interview type.");
      return;
    }

    if (!selectedLevel) {
      setError("Please select your experience level.");
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    setStarting(true);
    setError("");
    setMessage("");
    setEvaluation(null);
    setResult(null);
    setAnswer("");

    try {
      const response = await axios.post(
        `${API_URL}/api/interview/start`,
        {
          interview_type: selectedType,
          experience_level: selectedLevel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      setSessionId(data.session_id || "");
      setInterviewType(data.interview_type || "");
      setExperienceLevel(data.experience_level || "");
      setTargetRole(data.target_role || "");
      setQuestionNumber(data.question_number || 1);
      setQuestionsAnswered(0);
      setQuestion(data.question || null);
      setAnswer("");
      setEvaluation(null);

      setScreen("interview");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Start interview error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Failed to start the interview."
      );
    } finally {
      setStarting(false);
    }
  };

  // =====================================================
  // SUBMIT ANSWER
  // =====================================================

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError("Please answer the question before submitting.");
      return;
    }

    if (answer.trim().length < 5) {
      setError("Please provide a more complete answer.");
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }

      setIsListening(false);
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/api/interview/answer`,
        {
          session_id: sessionId,
          answer: answer.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      // Safety limit reached
      if (data.safety_limit_reached) {
        setEvaluation(data.evaluation || null);
        setQuestionsAnswered(
          data.progress?.questions_answered ||
            questionsAnswered + 1
        );

        setError(
          data.message ||
            "Maximum question limit reached. End the interview to get your final report."
        );

        return;
      }

      setEvaluation(data.evaluation || null);

      setQuestionsAnswered(
        data.progress?.questions_answered ||
          questionsAnswered + 1
      );

      setQuestionNumber(
        data.progress?.current_question ||
          questionNumber + 1
      );

      setQuestion(data.next_question || null);
      setAnswer("");

      setMessage(
        "Answer evaluated. Your next question is ready."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Submit answer error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Failed to evaluate your answer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // FINISH INTERVIEW
  // =====================================================

  const openFinishModal = () => {
    if (questionsAnswered < 1) {
      setError(
        "Answer at least one question before ending the interview."
      );
      return;
    }

    setError("");
    setMessage("");
    setShowFinishModal(true);
  };

  const closeFinishModal = () => {
    if (!finishing) {
      setShowFinishModal(false);
    }
  };

  const confirmFinishInterview = async () => {
    if (questionsAnswered < 1) {
      setShowFinishModal(false);
      setError(
        "Answer at least one question before ending the interview."
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }

      setIsListening(false);
    }

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    setShowFinishModal(false);
    setFinishing(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/api/interview/finish`,
        {
          session_id: sessionId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setResult(response.data.result || null);
      setScreen("result");

      await loadHistory();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Finish interview error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Failed to finish the interview."
      );
    } finally {
      setFinishing(false);
    }
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const cancelInterview = async () => {
    const confirmed = window.confirm(
      "Cancel this interview? The current session will be discarded."
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/interview/active`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }

      setIsListening(false);
      setScreen("start");
      setSessionId("");
      setQuestion(null);
      setAnswer("");
      setEvaluation(null);
      setError("");
      setMessage("");
      setQuestionsAnswered(0);
      setQuestionNumber(1);
      setSelectedType("");
      setSelectedLevel("");
      setShowFinishModal(false);
    } catch (err) {
      console.error("Cancel interview error:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to cancel the interview."
      );
    }
  };

  // =====================================================
  // NEW INTERVIEW
  // =====================================================

  const startNewInterview = () => {
    setScreen("start");
    setSelectedType("");
    setSelectedLevel("");
    setSessionId("");
    setInterviewType("");
    setExperienceLevel("");
    setTargetRole("");
    setQuestion(null);
    setQuestionNumber(1);
    setQuestionsAnswered(0);
    setAnswer("");
    setEvaluation(null);
    setResult(null);
    setError("");
    setMessage("");
    setShowFinishModal(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getScoreClass = (score) => {
    const value = Number(score || 0);

    if (value >= 80) return "score-good";
    if (value >= 60) return "score-mid";
    return "score-low";
  };

  const getScoreLabel = (score) => {
    const value = Number(score || 0);

    if (value >= 85) return "Excellent";
    if (value >= 75) return "Very Good";
    if (value >= 60) return "Good";
    if (value >= 40) return "Needs Improvement";
    return "Needs More Practice";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loadingActive) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <div className="spinner"></div>
          <h2>Preparing your interview...</h2>
          <p>Checking your active interview session.</p>
        </div>

        <style>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #070712;
            color: #fff;
            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(
                circle at 50% 0%,
                rgba(124,58,237,.16),
                transparent 30%
              ),
              #070712;
          }

          .loading-content {
            text-align: center;
          }

          .spinner {
            width: 38px;
            height: 38px;
            margin: 0 auto 15px;
            border: 3px solid rgba(255,255,255,.1);
            border-top-color: #a78bfa;
            border-radius: 50%;
            animation: spin .7s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .loading-content h2 {
            margin: 0 0 6px;
            font-size: 18px;
          }

          .loading-content p {
            margin: 0;
            color: #77778c;
            font-size: 11px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">
            CP
          </div>

          <div>
            <h2>CareerPilot-AI</h2>
            <span>AI Mock Interview</span>
          </div>

        </div>

        <div className="top-actions">

          <button
            className="secondary-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          {screen !== "result" && (
            <button
              className="secondary-btn"
              onClick={() =>
                document
                  .getElementById("history")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
              }
            >
              History
            </button>
          )}

        </div>

      </header>

      <main className="container">

        {/* =================================================
            START SCREEN
        ================================================= */}

        {screen === "start" && (
          <>
            <section className="compact-hero">

              <div>

                <p className="eyebrow">
                  AI INTERVIEW SIMULATOR
                </p>

                <h1>
                  Mock Interview
                  <span> Studio</span>
                </h1>

                <p>
                  Choose your interview type and
                  experience level. The AI continues
                  asking questions until you decide
                  to end the session.
                </p>

              </div>

              <div className="hero-status">

                <div className="status-dot"></div>

                <div>
                  <strong>
                    User Controlled
                  </strong>

                  <span>
                    Finish whenever you're ready
                  </span>
                </div>

              </div>

            </section>

            {error && (
              <div className="message error">
                ⚠️ {error}
              </div>
            )}

            <section className="selection-layout">

              {/* LEFT */}

              <div className="selection-main">

                {/* INTERVIEW TYPE */}

                <div className="select-block">

                  <div className="block-heading">

                    <div>
                      <span>01</span>

                      <div>
                        <h2>
                          Interview Type
                        </h2>

                        <p>
                          What do you want to practice?
                        </p>
                      </div>
                    </div>

                    {selectedType && (
                      <span className="chosen">
                        Selected
                      </span>
                    )}

                  </div>

                  <div className="type-grid">

                    {interviewTypes.map(
                      (type) => {

                        const selected =
                          selectedType === type.id;

                        return (
                          <button
                            key={type.id}
                            className={`type-card ${
                              selected
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedType(
                                type.id
                              );
                              setError("");
                            }}
                          >

                            <div className="type-icon">
                              {type.icon}
                            </div>

                            <div className="type-text">

                              <h3>
                                {type.title}
                              </h3>

                              <p>
                                {type.description}
                              </p>

                            </div>

                            <div className="radio">
                              {selected && "✓"}
                            </div>

                          </button>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* EXPERIENCE */}

                <div className="select-block">

                  <div className="block-heading">

                    <div>
                      <span>02</span>

                      <div>
                        <h2>
                          Experience Level
                        </h2>

                        <p>
                          Questions adapt to your experience.
                        </p>
                      </div>
                    </div>

                    {selectedLevel && (
                      <span className="chosen">
                        Selected
                      </span>
                    )}

                  </div>

                  <div className="level-grid">

                    {experienceLevels.map(
                      (level) => {

                        const selected =
                          selectedLevel === level.id;

                        return (
                          <button
                            key={level.id}
                            className={`level-card ${
                              selected
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedLevel(
                                level.id
                              );
                              setError("");
                            }}
                          >

                            <div className="level-icon">
                              {level.icon}
                            </div>

                            <div>
                              <h3>
                                {level.title}
                              </h3>

                              <p>
                                {level.description}
                              </p>
                            </div>

                            <div className="radio">
                              {selected && "✓"}
                            </div>

                          </button>
                        );
                      }
                    )}

                  </div>

                </div>

              </div>

              {/* RIGHT */}

              <aside className="preview-panel">

                <p className="eyebrow">
                  SESSION PREVIEW
                </p>

                <h2>
                  Ready to Practice?
                </h2>

                <div className="preview-list">

                  <div className="preview-row">
                    <span>Interview</span>
                    <strong>
                      {selectedType
                        ? selectedType.replace(
                            " Interview",
                            ""
                          )
                        : "Not selected"}
                    </strong>
                  </div>

                  <div className="preview-row">
                    <span>Level</span>
                    <strong>
                      {selectedLevel ||
                        "Not selected"}
                    </strong>
                  </div>

                  <div className="preview-row">
                    <span>Questions</span>
                    <strong>
                      User controlled
                    </strong>
                  </div>

                  <div className="preview-row">
                    <span>AI scoring</span>
                    <strong>
                      After every answer
                    </strong>
                  </div>

                  <div className="preview-row">
                    <span>Voice input</span>
                    <strong>
                      {voiceSupported
                        ? "Available"
                        : "Browser dependent"}
                    </strong>
                  </div>

                </div>

                <button
                  className="primary-btn start-btn"
                  onClick={startInterview}
                  disabled={
                    starting ||
                    !selectedType ||
                    !selectedLevel
                  }
                >
                  {starting
                    ? "Starting Interview..."
                    : "Start Interview →"}
                </button>

                <div className="preview-note">
                  <span>💡</span>
                  <p>
                    The interview has no fixed end.
                    Answer as many questions as you
                    want, then press End Interview.
                  </p>
                </div>

              </aside>

            </section>

            {/* HISTORY PREVIEW */}

            <section
              className="history-section"
              id="history"
            >

              <div className="section-head">

                <div>
                  <p className="eyebrow">
                    SAVED SESSIONS
                  </p>

                  <h2>
                    Interview History
                  </h2>
                </div>

                <span className="history-count">
                  {history.length} sessions
                </span>

              </div>

              {historyLoading ? (
                <div className="empty-history">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="empty-history">
                  No completed interviews yet.
                </div>
              ) : (
                <div className="history-list">

                  {history.slice(0, 4).map(
                    (item, index) => (
                      <button
                        className="history-card"
                        key={
                          item.session_id ||
                          index
                        }
                        onClick={() =>
                          setSelectedHistory(item)
                        }
                      >

                        <div className="history-left">

                          <div className="history-icon">
                            🎤
                          </div>

                          <div>

                            <h3>
                              {item.interview_type ||
                                "Mock Interview"}
                            </h3>

                            <div className="history-meta">

                              <span>
                                {item.experience_level ||
                                  "Fresher"}
                              </span>

                              <span>
                                {item.total_questions ||
                                  0}{" "}
                                questions
                              </span>

                              <span>
                                {formatDate(
                                  item.completed_at
                                )}
                              </span>

                            </div>

                          </div>

                        </div>

                        <div
                          className={`history-score ${getScoreClass(
                            item.overall_score
                          )}`}
                        >
                          {item.overall_score || 0}
                          <small>/100</small>
                        </div>

                      </button>
                    )
                  )}

                </div>
              )}

            </section>
          </>
        )}

        {/* =================================================
            INTERVIEW SCREEN
        ================================================= */}

        {screen === "interview" && (
          <>

            <section className="interview-header">

              <div>

                <div className="interview-labels">

                  <span className="eyebrow">
                    {interviewType}
                  </span>

                  <span className="level-label">
                    {experienceLevel}
                  </span>

                </div>

                <h1>
                  {targetRole}
                </h1>

              </div>

              <div className="interview-actions">

                <div className="answered-count">
                  <strong>
                    {questionsAnswered}
                  </strong>

                  <span>
                    answered
                  </span>
                </div>

                <button
                  className="end-btn"
                  onClick={openFinishModal}
                  disabled={
                    finishing ||
                    submitting
                  }
                >
                  {finishing
                    ? "Ending..."
                    : "End Interview"}
                </button>

              </div>

            </section>

            {message && (
              <div className="message success">
                ✓ {message}
              </div>
            )}

            {error && (
              <div className="message error">
                ⚠️ {error}
              </div>
            )}

            {/* QUESTION + SIDE PANEL */}

            <section className="interview-layout">

              <div className="question-panel">

                <div className="question-header">

                  <div className="question-number">
                    Q{questionNumber}
                  </div>

                  <span className="category-pill">
                    {question?.category ||
                      "Interview"}
                  </span>

                  <span className="question-status">
                    {questionsAnswered} answered
                  </span>

                </div>

                <h2 className="question-text">
                  {question?.question ||
                    "Preparing your next question..."}
                </h2>

                {question?.why_this_question && (
                  <p className="why-question">
                    Interview focus:{" "}
                    {question.why_this_question}
                  </p>
                )}

                <textarea
                  value={answer}
                  onChange={(e) =>
                    setAnswer(
                      e.target.value
                    )
                  }
                  placeholder="Type your answer here..."
                  disabled={submitting}
                />

                <div className="answer-tools">

                  <div className="voice-area">

                    {voiceSupported ? (
                      <button
                        type="button"
                        className={`mic-btn ${
                          isListening
                            ? "listening"
                            : ""
                        }`}
                        onClick={
                          toggleMicrophone
                        }
                        disabled={submitting}
                      >
                        <span>
                          {isListening
                            ? "⏹"
                            : "🎤"}
                        </span>

                        {isListening
                          ? "Stop Listening"
                          : "Answer with Microphone"}
                      </button>
                    ) : (
                      <span className="voice-off">
                        🎤 Voice input unavailable
                      </span>
                    )}

                    {isListening && (
                      <span className="listening">
                        ● Listening...
                      </span>
                    )}

                  </div>

                  <span className="char-count">
                    {answer.length} characters
                  </span>

                </div>

                <div className="question-actions">

                  <button
                    className="primary-btn submit-btn"
                    onClick={submitAnswer}
                    disabled={
                      submitting ||
                      finishing
                    }
                  >
                    {submitting
                      ? "Evaluating Answer..."
                      : "Submit Answer →"}
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={openFinishModal}
                    disabled={
                      questionsAnswered < 1 ||
                      submitting ||
                      finishing
                    }
                  >
                    End & Get Report
                  </button>

                </div>

              </div>

              <aside className="interview-side">

                <div className="live-card">

                  <div className="live-head">
                    <span className="live-dot"></span>
                    <strong>
                      LIVE INTERVIEW
                    </strong>
                  </div>

                  <div className="live-stat">
                    <strong>
                      {questionsAnswered}
                    </strong>

                    <span>
                      questions completed
                    </span>
                  </div>

                  <div className="live-divider"></div>

                  <p>
                    No fixed question count.
                    Continue until you are satisfied
                    with your preparation.
                  </p>

                </div>

                <div className="tip-card">

                  <span>💡</span>

                  <div>
                    <strong>
                      Interview Tip
                    </strong>

                    <p>
                      Explain your reasoning clearly
                      and use a real example when
                      appropriate.
                    </p>
                  </div>

                </div>

              </aside>

            </section>

            {/* PREVIOUS EVALUATION */}

            {evaluation && (
              <section className="evaluation-card">

                <div className="evaluation-header">

                  <div>
                    <p className="eyebrow">
                      PREVIOUS ANSWER
                    </p>

                    <h2>
                      AI Evaluation
                    </h2>
                  </div>

                  <div
                    className={`evaluation-score ${getScoreClass(
                      Number(
                        evaluation.score || 0
                      ) * 10
                    )}`}
                  >
                    <strong>
                      {evaluation.score || 0}
                    </strong>
                    <span>/10</span>
                  </div>

                </div>

                <p className="evaluation-feedback">
                  {evaluation.feedback ||
                    "No feedback available."}
                </p>

                <div className="evaluation-grid">

                  <div>

                    <h4>
                      Strengths
                    </h4>

                    {(evaluation.strengths || []).length >
                    0 ? (
                      <ul>
                        {evaluation.strengths.map(
                          (
                            item,
                            index
                          ) => (
                            <li key={index}>
                              <span>✓</span>
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="muted">
                        No specific strengths recorded.
                      </p>
                    )}

                  </div>

                  <div>

                    <h4>
                      Improvements
                    </h4>

                    {(evaluation.improvements || [])
                      .length > 0 ? (
                      <ul>
                        {evaluation.improvements.map(
                          (
                            item,
                            index
                          ) => (
                            <li key={index}>
                              <span>→</span>
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="muted">
                        No specific improvements recorded.
                      </p>
                    )}

                  </div>

                </div>

              </section>
            )}

          </>
        )}

        {/* =================================================
            RESULT SCREEN
        ================================================= */}

        {screen === "result" && result && (
          <>

            <section className="result-top">

              <div className="result-icon">
                🎉
              </div>

              <p className="eyebrow">
                INTERVIEW COMPLETED
              </p>

              <h1>
                Your Interview Report
              </h1>

              <p>
                {result.interview_type}
                {" • "}
                {result.experience_level}
                {" • "}
                {result.total_questions} questions
              </p>

            </section>

            <section className="result-overview">

              <div className="overall-score">

                <strong>
                  {result.overall_score || 0}
                </strong>

                <span>
                  /100
                </span>

              </div>

              <div>

                <p className="eyebrow">
                  OVERALL PERFORMANCE
                </p>

                <h2>
                  {getScoreLabel(
                    result.overall_score
                  )}
                </h2>

                <p>
                  Based on the questions you
                  answered during this session.
                </p>

              </div>

            </section>

            {/* CATEGORY SCORES */}

            {result.category_scores &&
              Object.keys(
                result.category_scores
              ).length > 0 && (
                <section className="result-section">

                  <div className="section-heading">

                    <div>
                      <p className="eyebrow">
                        PERFORMANCE
                      </p>

                      <h2>
                        Category Scores
                      </h2>
                    </div>

                  </div>

                  <div className="category-grid">

                    {Object.entries(
                      result.category_scores
                    ).map(
                      ([
                        category,
                        score,
                      ]) => (
                        <div
                          className="category-card"
                          key={category}
                        >

                          <div className="category-top">
                            <span>
                              {category}
                            </span>

                            <strong>
                              {score}%
                            </strong>
                          </div>

                          <div className="track">
                            <div
                              className="fill"
                              style={{
                                width: `${score}%`,
                              }}
                            ></div>
                          </div>

                        </div>
                      )
                    )}

                  </div>

                </section>
              )}

            {/* FINAL REPORT */}

            <section className="final-report">

              <div className="section-heading">

                <div>
                  <p className="eyebrow">
                    AI COACH
                  </p>

                  <h2>
                    Final Evaluation
                  </h2>
                </div>

              </div>

              <div className="final-summary">

                <h3>
                  Summary
                </h3>

                <p>
                  {result.final_report?.summary ||
                    "Interview completed successfully."}
                </p>

              </div>

              <div className="report-grid">

                <div className="report-box">

                  <h3>
                    Strengths
                  </h3>

                  <ul>
                    {(
                      result.final_report
                        ?.strengths || []
                    ).map(
                      (
                        item,
                        index
                      ) => (
                        <li key={index}>
                          <span>✓</span>
                          {item}
                        </li>
                      )
                    )}
                  </ul>

                </div>

                <div className="report-box">

                  <h3>
                    Improvements
                  </h3>

                  <ul>
                    {(
                      result.final_report
                        ?.improvements || []
                    ).map(
                      (
                        item,
                        index
                      ) => (
                        <li key={index}>
                          <span>→</span>
                          {item}
                        </li>
                      )
                    )}
                  </ul>

                </div>

              </div>

              <div className="final-advice">

                <span>💡</span>

                <div>
                  <strong>
                    Final Advice
                  </strong>

                  <p>
                    {result.final_report
                      ?.final_advice ||
                      "Continue practicing your weaker areas."}
                  </p>
                </div>

              </div>

            </section>

            {/* QUESTION REVIEW */}

            <section className="result-section">

              <div className="section-heading">

                <div>
                  <p className="eyebrow">
                    DETAILED REVIEW
                  </p>

                  <h2>
                    Questions & Answers
                  </h2>
                </div>

                <span className="history-count">
                  {result.questions?.length || 0}
                </span>

              </div>

              <div className="question-results">

                {(result.questions || []).map(
                  (
                    item,
                    index
                  ) => (

                    <article
                      className="result-question"
                      key={index}
                    >

                      <div className="result-q-head">

                        <div>

                          <strong>
                            Q
                            {item.question_number ||
                              index + 1}
                          </strong>

                          <span className="category-pill">
                            {item.category}
                          </span>

                        </div>

                        <span
                          className={`mark ${getScoreClass(
                            Number(
                              item.score || 0
                            ) * 10
                          )}`}
                        >
                          {item.score || 0}/10
                        </span>

                      </div>

                      <h3>
                        {item.question}
                      </h3>

                      <div className="answer-review">

                        <strong>
                          Your Answer
                        </strong>

                        <p>
                          {item.answer}
                        </p>

                      </div>

                      <div className="feedback-review">

                        <strong>
                          AI Feedback
                        </strong>

                        <p>
                          {item.feedback}
                        </p>

                      </div>

                    </article>
                  )
                )}

              </div>

            </section>

            <div className="result-actions">

              <button
                className="secondary-btn"
                onClick={startNewInterview}
              >
                Start New Interview
              </button>

              <button
                className="primary-btn"
                onClick={() =>
                  navigate("/dashboard")
                }
              >
                Back to Dashboard
              </button>

            </div>

          </>
        )}

        {/* =================================================
            HISTORY
        ================================================= */}

        {screen !== "start" && (
          <section
            className="history-section bottom-history"
            id="history"
          >

            <div className="section-head">

              <div>
                <p className="eyebrow">
                  SAVED SESSIONS
                </p>

                <h2>
                  Interview History
                </h2>
              </div>

              <span className="history-count">
                {history.length}
              </span>

            </div>

            {historyLoading ? (
              <div className="empty-history">
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="empty-history">
                No completed interviews yet.
              </div>
            ) : (
              <div className="history-list">

                {history.map(
                  (
                    item,
                    index
                  ) => (

                    <button
                      className="history-card"
                      key={
                        item.session_id ||
                        index
                      }
                      onClick={() =>
                        setSelectedHistory(
                          item
                        )
                      }
                    >

                      <div className="history-left">

                        <div className="history-icon">
                          🎤
                        </div>

                        <div>

                          <h3>
                            {item.interview_type ||
                              "Mock Interview"}
                          </h3>

                          <div className="history-meta">

                            <span>
                              {item.experience_level ||
                                "Fresher"}
                            </span>

                            <span>
                              {item.total_questions ||
                                0}{" "}
                              questions
                            </span>

                            <span>
                              {formatDate(
                                item.completed_at
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                      <div
                        className={`history-score ${getScoreClass(
                          item.overall_score
                        )}`}
                      >
                        <strong>
                          {item.overall_score || 0}
                        </strong>

                        <small>
                          /100
                        </small>
                      </div>

                    </button>
                  )
                )}

              </div>
            )}

          </section>
        )}

      </main>

      {/* ===================================================
          END INTERVIEW CONFIRMATION MODAL
      =================================================== */}

      {showFinishModal && (
        <div
          className="finish-overlay"
          onClick={closeFinishModal}
        >
          <div
            className="finish-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="finish-icon">✓</div>

            <div className="finish-content">
              <p className="eyebrow">END MOCK INTERVIEW</p>

              <h2>End this interview?</h2>

              <p>
                You have answered <strong>{questionsAnswered}</strong>{" "}
                {questionsAnswered === 1 ? "question" : "questions"}.
                Your answers will be evaluated and your final interview
                report will be generated.
              </p>
            </div>

            <div className="finish-summary">
              <div>
                <span>Interview</span>
                <strong>{interviewType || "Mock Interview"}</strong>
              </div>

              <div>
                <span>Level</span>
                <strong>{experienceLevel || "Fresher"}</strong>
              </div>

              <div>
                <span>Answered</span>
                <strong>{questionsAnswered}</strong>
              </div>
            </div>

            <div className="finish-actions">
              <button
                className="secondary-btn finish-cancel"
                type="button"
                onClick={closeFinishModal}
                disabled={finishing}
              >
                Continue Interview
              </button>

              <button
                className="end-btn finish-confirm"
                type="button"
                onClick={confirmFinishInterview}
                disabled={finishing}
              >
                {finishing ? "Ending..." : "End & Get Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          HISTORY DETAILS MODAL
      =================================================== */}

      {selectedHistory && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedHistory(null)
          }
        >

          <div
            className="history-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <p className="eyebrow">
                  SAVED INTERVIEW
                </p>

                <h2>
                  {selectedHistory.interview_type}
                </h2>

                <div className="modal-tags">

                  <span>
                    {selectedHistory.experience_level}
                  </span>

                  <span>
                    {selectedHistory.target_role}
                  </span>

                  <span>
                    {selectedHistory.total_questions}{" "}
                    questions
                  </span>

                </div>

                <p>
                  Completed{" "}
                  {formatDate(
                    selectedHistory.completed_at
                  )}
                </p>

              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setSelectedHistory(null)
                }
              >
                ✕
              </button>

            </div>

            {/* MODAL SCORE */}

            <div className="modal-overview">

              <div className="modal-main-score">

                <span>
                  Overall Score
                </span>

                <strong
                  className={getScoreClass(
                    selectedHistory.overall_score
                  )}
                >
                  {selectedHistory.overall_score ||
                    0}
                  <small>/100</small>
                </strong>

              </div>

              {selectedHistory.category_scores &&
                Object.keys(
                  selectedHistory.category_scores
                ).length > 0 && (
                  <div className="modal-category-grid">

                    {Object.entries(
                      selectedHistory.category_scores
                    ).map(
                      ([
                        category,
                        score,
                      ]) => (
                        <div
                          className="modal-category"
                          key={category}
                        >
                          <span>
                            {category}
                          </span>

                          <strong>
                            {score}%
                          </strong>
                        </div>
                      )
                    )}

                  </div>
                )}

            </div>

            {/* QUESTIONS */}

            <div className="modal-content">

              <div className="modal-title">

                <p className="eyebrow">
                  DETAILED REVIEW
                </p>

                <h3>
                  Questions, Answers & Feedback
                </h3>

              </div>

              {(selectedHistory.questions || []).map(
                (
                  item,
                  index
                ) => (

                  <article
                    className="modal-question"
                    key={index}
                  >

                    <div className="modal-q-head">

                      <div>

                        <strong>
                          Q
                          {item.question_number ||
                            index + 1}
                        </strong>

                        <span className="category-pill">
                          {item.category}
                        </span>

                      </div>

                      <span
                        className={`modal-mark ${getScoreClass(
                          Number(
                            item.score || 0
                          ) * 10
                        )}`}
                      >
                        {item.score || 0}/10
                      </span>

                    </div>

                    <div className="review-box question-box">

                      <label>
                        QUESTION
                      </label>

                      <p>
                        {item.question ||
                          "Question unavailable."}
                      </p>

                    </div>

                    <div className="review-box answer-box">

                      <label>
                        YOUR ANSWER
                      </label>

                      <p>
                        {item.answer ||
                          "No answer recorded."}
                      </p>

                    </div>

                    <div className="review-box feedback-box">

                      <label>
                        AI FEEDBACK
                      </label>

                      <p>
                        {item.feedback ||
                          "No feedback recorded."}
                      </p>

                    </div>

                    {Array.isArray(
                      item.strengths
                    ) &&
                    item.strengths.length > 0 && (
                      <div className="mini-review strengths">

                        <strong>
                          ✓ Strengths
                        </strong>

                        <ul>
                          {item.strengths.map(
                            (
                              strength,
                              strengthIndex
                            ) => (
                              <li
                                key={
                                  strengthIndex
                                }
                              >
                                {strength}
                              </li>
                            )
                          )}
                        </ul>

                      </div>
                    )}

                    {Array.isArray(
                      item.improvements
                    ) &&
                    item.improvements.length > 0 && (
                      <div className="mini-review improvements">

                        <strong>
                          → Improvements
                        </strong>

                        <ul>
                          {item.improvements.map(
                            (
                              improvement,
                              improvementIndex
                            ) => (
                              <li
                                key={
                                  improvementIndex
                                }
                              >
                                {improvement}
                              </li>
                            )
                          )}
                        </ul>

                      </div>
                    )}

                  </article>
                )
              )}

            </div>

            {/* FINAL REPORT */}

            {selectedHistory.final_report && (
              <div className="modal-final-report">

                <p className="eyebrow">
                  FINAL AI REPORT
                </p>

                <h3>
                  Interview Summary
                </h3>

                <p>
                  {selectedHistory.final_report
                    .summary ||
                    "No summary available."}
                </p>

                {selectedHistory.final_report
                  .final_advice && (
                  <div className="modal-advice">

                    <strong>
                      💡 Final Advice
                    </strong>

                    <p>
                      {
                        selectedHistory.final_report
                          .final_advice
                      }
                    </p>

                  </div>
                )}

              </div>
            )}

            <div className="modal-footer">

              <button
                className="primary-btn"
                onClick={() =>
                  setSelectedHistory(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          CSS
      =================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #070712;
          color: #f5f5ff;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        textarea {
          font-family: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 15% 0%,
              rgba(124,58,237,.12),
              transparent 23%
            ),
            radial-gradient(
              circle at 85% 10%,
              rgba(79,70,229,.08),
              transparent 22%
            ),
            #070712;
        }

        /* ================================
           HEADER
        ================================= */

        .topbar {
          height: 66px;
          padding: 0 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(8,8,20,.92);
          backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #4f46e5
            );
          font-size: 11px;
          font-weight: 900;
          box-shadow:
            0 8px 24px rgba(124,58,237,.25);
        }

        .brand h2 {
          margin: 0;
          font-size: 15px;
        }

        .brand span {
          display: block;
          margin-top: 1px;
          color: #737389;
          font-size: 9px;
        }

        .top-actions {
          display: flex;
          gap: 7px;
        }

        /* ================================
           COMMON BUTTONS
        ================================= */

        .primary-btn,
        .secondary-btn,
        .end-btn {
          border-radius: 9px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
          transition: .2s ease;
        }

        .primary-btn {
          padding: 10px 14px;
          color: white;
          border: none;
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #5b21b6
            );
        }

        .secondary-btn {
          padding: 9px 13px;
          color: #d4cfee;
          border: 1px solid rgba(124,58,237,.18);
          background: rgba(124,58,237,.07);
        }

        .primary-btn:hover:not(:disabled),
        .secondary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .primary-btn:disabled,
        .secondary-btn:disabled,
        .end-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .end-btn {
          padding: 10px 14px;
          color: #fca5a5;
          border: 1px solid rgba(239,68,68,.15);
          background: rgba(239,68,68,.07);
        }

        /* ================================
           CONTAINER
        ================================= */

        .container {
          width: min(
            1080px,
            calc(100% - 32px)
          );
          margin: 0 auto;
          padding: 25px 0 50px;
        }

        /* ================================
           HERO
        ================================= */

        .compact-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          margin-bottom: 24px;
        }

        .eyebrow {
          margin: 0;
          color: #a78bfa;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .15em;
        }

        .compact-hero h1 {
          margin: 6px 0 6px;
          font-size: 38px;
          line-height: 1;
          letter-spacing: -.04em;
        }

        .compact-hero h1 span {
          color: #a78bfa;
        }

        .compact-hero p:last-child {
          max-width: 670px;
          margin: 0;
          color: #77778c;
          line-height: 1.55;
          font-size: 11px;
        }

        .hero-status {
          min-width: 185px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid rgba(124,58,237,.13);
          background: rgba(124,58,237,.06);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #86efac;
          box-shadow:
            0 0 0 4px rgba(34,197,94,.08);
        }

        .hero-status strong {
          display: block;
          font-size: 10px;
        }

        .hero-status span {
          display: block;
          margin-top: 3px;
          color: #77778c;
          font-size: 8px;
        }

        /* ================================
           MESSAGES
        ================================= */

        .message {
          padding: 11px 13px;
          margin-bottom: 12px;
          border-radius: 9px;
          font-size: 10px;
        }

        .message.error {
          color: #fca5a5;
          background: rgba(239,68,68,.07);
          border: 1px solid rgba(239,68,68,.13);
        }

        .message.success {
          color: #86efac;
          background: rgba(34,197,94,.07);
          border: 1px solid rgba(34,197,94,.12);
        }

        /* ================================
           SELECTION
        ================================= */

        .selection-layout {
          display: grid;
          grid-template-columns:
            minmax(0,1.65fr)
            minmax(250px,.72fr);
          gap: 14px;
          align-items: start;
        }

        .select-block {
          padding: 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.025);
        }

        .select-block + .select-block {
          margin-top: 10px;
        }

        .block-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .block-heading > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .block-heading > div > span {
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          color: #a78bfa;
          background: rgba(124,58,237,.1);
          font-size: 8px;
          font-weight: 900;
        }

        .block-heading h2 {
          margin: 0 0 3px;
          font-size: 14px;
        }

        .block-heading p {
          margin: 0;
          color: #6f6f83;
          font-size: 9px;
        }

        .chosen {
          padding: 5px 7px;
          border-radius: 999px;
          color: #86efac;
          background: rgba(34,197,94,.07);
          font-size: 8px;
          font-weight: 800;
        }

        .type-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 8px;
        }

        .level-grid {
          display: grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          gap: 8px;
        }

        .type-card,
        .level-card {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
          text-align: left;
          color: #f5f5ff;
          cursor: pointer;
          transition: .2s ease;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.025);
        }

        .type-card {
          padding: 11px;
        }

        .level-card {
          padding: 10px;
        }

        .type-card:hover,
        .level-card:hover {
          border-color: rgba(124,58,237,.25);
          background: rgba(124,58,237,.045);
        }

        .type-card.selected,
        .level-card.selected {
          border-color: rgba(139,92,246,.45);
          background: rgba(124,58,237,.08);
        }

        .type-icon,
        .level-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: rgba(124,58,237,.1);
        }

        .type-icon {
          width: 34px;
          height: 34px;
          font-size: 16px;
        }

        .level-icon {
          width: 31px;
          height: 31px;
          font-size: 14px;
        }

        .type-text,
        .level-card > div:nth-child(2) {
          min-width: 0;
        }

        .type-card h3,
        .level-card h3 {
          margin: 0 0 3px;
          font-size: 10px;
        }

        .type-card p,
        .level-card p {
          margin: 0;
          color: #77778c;
          font-size: 8px;
          line-height: 1.4;
        }

        .radio {
          width: 17px;
          height: 17px;
          margin-left: auto;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.16);
          font-size: 8px;
        }

        .selected .radio {
          border-color: #8b5cf6;
          background: #7c3aed;
        }

        /* ================================
           PREVIEW
        ================================= */

        .preview-panel {
          position: sticky;
          top: 82px;
          padding: 18px;
          border-radius: 15px;
          border: 1px solid rgba(124,58,237,.13);
          background:
            linear-gradient(
              145deg,
              rgba(124,58,237,.09),
              rgba(255,255,255,.025)
            );
        }

        .preview-panel h2 {
          margin: 6px 0 15px;
          font-size: 19px;
        }

        .preview-list {
          display: flex;
          flex-direction: column;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,.05);
        }

        .preview-row span {
          color: #6e6e82;
          font-size: 9px;
        }

        .preview-row strong {
          max-width: 145px;
          text-align: right;
          color: #c8c3d7;
          font-size: 9px;
        }

        .start-btn {
          width: 100%;
          margin-top: 15px;
          padding: 12px;
        }

        .preview-note {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding: 10px;
          border-radius: 9px;
          background: rgba(255,255,255,.025);
        }

        .preview-note span {
          font-size: 14px;
        }

        .preview-note p {
          margin: 0;
          color: #77778c;
          font-size: 8px;
          line-height: 1.5;
        }

        /* ================================
           HISTORY
        ================================= */

        .history-section {
          margin-top: 27px;
          padding-top: 22px;
          border-top: 1px solid rgba(255,255,255,.06);
        }

        .bottom-history {
          margin-top: 42px;
        }

        .section-head,
        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 11px;
        }

        .section-head h2,
        .section-heading h2 {
          margin: 5px 0 0;
          font-size: 19px;
        }

        .history-count {
          min-width: 29px;
          padding: 6px 8px;
          text-align: center;
          border-radius: 8px;
          color: #c2b8e4;
          background: rgba(124,58,237,.09);
          font-size: 9px;
          font-weight: 800;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .history-card {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 11px 12px;
          text-align: left;
          color: #f5f5ff;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.055);
          background: rgba(255,255,255,.025);
          cursor: pointer;
          transition: .2s ease;
        }

        .history-card:hover {
          transform: translateY(-1px);
          border-color: rgba(124,58,237,.24);
          background: rgba(124,58,237,.04);
        }

        .history-left {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .history-icon {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: rgba(124,58,237,.09);
          font-size: 15px;
        }

        .history-card h3 {
          margin: 0 0 4px;
          font-size: 10px;
        }

        .history-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .history-meta span {
          padding: 4px 6px;
          border-radius: 6px;
          color: #77778b;
          background: rgba(255,255,255,.04);
          font-size: 7px;
        }

        .history-score {
          min-width: 55px;
          padding: 7px;
          text-align: center;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 900;
        }

        .history-score small {
          margin-left: 1px;
          font-size: 7px;
        }

        .score-good {
          color: #86efac;
          background: rgba(34,197,94,.09);
        }

        .score-mid {
          color: #fcd34d;
          background: rgba(234,179,8,.09);
        }

        .score-low {
          color: #fca5a5;
          background: rgba(239,68,68,.09);
        }

        .empty-history {
          padding: 28px;
          text-align: center;
          color: #707087;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.05);
          background: rgba(255,255,255,.02);
          font-size: 10px;
        }

        /* ================================
           INTERVIEW HEADER
        ================================= */

        .interview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 13px;
        }

        .interview-labels {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .level-label {
          padding: 5px 7px;
          border-radius: 7px;
          color: #9d96b0;
          background: rgba(255,255,255,.05);
          font-size: 8px;
          font-weight: 800;
        }

        .interview-header h1 {
          margin: 6px 0 0;
          font-size: 25px;
          letter-spacing: -.03em;
        }

        .interview-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .answered-count {
          min-width: 63px;
          padding: 8px;
          text-align: center;
          border-radius: 9px;
          background: rgba(124,58,237,.07);
        }

        .answered-count strong {
          display: block;
          font-size: 15px;
          color: #c4b5fd;
        }

        .answered-count span {
          color: #707087;
          font-size: 7px;
        }

        /* ================================
           INTERVIEW LAYOUT
        ================================= */

        .interview-layout {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            215px;
          gap: 12px;
          align-items: start;
        }

        .question-panel {
          min-height: 500px;
          display: flex;
          flex-direction: column;
          padding: 19px;
          border-radius: 15px;
          border: 1px solid rgba(124,58,237,.13);
          background:
            linear-gradient(
              145deg,
              rgba(124,58,237,.07),
              rgba(255,255,255,.025)
            );
        }

        .question-header {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .question-number {
          padding: 6px 8px;
          border-radius: 7px;
          color: #c4b5fd;
          background: rgba(124,58,237,.13);
          font-size: 8px;
          font-weight: 900;
        }

        .category-pill {
          padding: 5px 7px;
          border-radius: 999px;
          color: #aaa4b7;
          background: rgba(255,255,255,.055);
          font-size: 7px;
          font-weight: 800;
        }

        .question-status {
          margin-left: auto;
          color: #68687c;
          font-size: 8px;
        }

        .question-text {
          max-width: 830px;
          margin: 18px 0 8px;
          font-size: 24px;
          line-height: 1.38;
          letter-spacing: -.025em;
        }

        .why-question {
          margin: 0 0 12px;
          color: #747489;
          font-size: 9px;
          line-height: 1.5;
        }

        .question-panel textarea {
          flex: 1;
          width: 100%;
          min-height: 220px;
          resize: vertical;
          padding: 13px;
          outline: none;
          border-radius: 10px;
          color: #f1f1fa;
          background: rgba(0,0,0,.17);
          border: 1px solid rgba(255,255,255,.08);
          font-size: 11px;
          line-height: 1.7;
        }

        .question-panel textarea:focus {
          border-color: rgba(139,92,246,.4);
          box-shadow:
            0 0 0 3px rgba(124,58,237,.06);
        }

        .question-panel textarea::placeholder {
          color: #5c5c71;
        }

        .answer-tools {
          min-height: 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 8px;
        }

        .voice-area {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .mic-btn {
          padding: 8px 10px;
          border-radius: 8px;
          color: #d7d1eb;
          background: rgba(124,58,237,.08);
          border: 1px solid rgba(124,58,237,.16);
          cursor: pointer;
          font-size: 8px;
          font-weight: 800;
        }

        .mic-btn.listening {
          color: #fca5a5;
          background: rgba(239,68,68,.1);
          border-color: rgba(239,68,68,.18);
        }

        .listening {
          color: #fca5a5;
          font-size: 8px;
          font-weight: 800;
          animation: pulse 1.1s infinite;
        }

        @keyframes pulse {
          50% {
            opacity: .45;
          }
        }

        .voice-off,
        .char-count {
          color: #66667a;
          font-size: 8px;
        }

        .question-actions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
          margin-top: 8px;
        }

        /* ================================
           INTERVIEW SIDE
        ================================= */

        .interview-side {
          display: flex;
          flex-direction: column;
          gap: 9px;
          position: sticky;
          top: 82px;
        }

        .live-card,
        .tip-card {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.025);
        }

        .live-head {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #aaa3bb;
          font-size: 8px;
          letter-spacing: .08em;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #86efac;
          box-shadow:
            0 0 0 3px rgba(34,197,94,.07);
        }

        .live-stat {
          margin-top: 18px;
        }

        .live-stat strong {
          display: block;
          font-size: 32px;
          color: #c4b5fd;
        }

        .live-stat span {
          color: #717188;
          font-size: 8px;
        }

        .live-divider {
          margin: 15px 0;
          height: 1px;
          background: rgba(255,255,255,.05);
        }

        .live-card p,
        .tip-card p {
          margin: 0;
          color: #747489;
          font-size: 8px;
          line-height: 1.6;
        }

        .tip-card {
          display: flex;
          gap: 8px;
        }

        .tip-card > span {
          font-size: 16px;
        }

        .tip-card strong {
          display: block;
          margin-bottom: 3px;
          font-size: 9px;
        }

        /* ================================
           EVALUATION
        ================================= */

        .evaluation-card {
          margin-top: 11px;
          padding: 15px;
          border-radius: 13px;
          border: 1px solid rgba(34,197,94,.09);
          background: rgba(34,197,94,.035);
        }

        .evaluation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .evaluation-header h2 {
          margin: 5px 0 0;
          font-size: 16px;
        }

        .evaluation-score {
          min-width: 58px;
          padding: 9px;
          text-align: center;
          border-radius: 10px;
        }

        .evaluation-score strong {
          font-size: 20px;
        }

        .evaluation-score span {
          margin-left: 2px;
          font-size: 8px;
        }

        .evaluation-feedback {
          margin: 12px 0;
          color: #9292a6;
          font-size: 9px;
          line-height: 1.6;
        }

        .evaluation-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 12px;
        }

        .evaluation-grid h4 {
          margin: 0 0 7px;
          font-size: 9px;
        }

        .evaluation-grid ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .evaluation-grid li {
          color: #858598;
          font-size: 8px;
          line-height: 1.5;
        }

        .evaluation-grid li span {
          color: #86efac;
          margin-right: 5px;
        }

        .muted {
          margin: 0;
          color: #69697e;
          font-size: 8px;
        }

        /* ================================
           RESULT
        ================================= */

        .result-top {
          padding: 8px 0 20px;
          text-align: center;
        }

        .result-icon {
          width: 55px;
          height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 11px;
          border-radius: 16px;
          background: rgba(124,58,237,.1);
          font-size: 25px;
        }

        .result-top h1 {
          margin: 6px 0;
          font-size: 32px;
        }

        .result-top > p:last-child {
          margin: 0;
          color: #77778b;
          font-size: 9px;
        }

        .result-overview {
          display: flex;
          align-items: center;
          gap: 22px;
          padding: 18px;
          border-radius: 15px;
          border: 1px solid rgba(124,58,237,.13);
          background: rgba(124,58,237,.07);
        }

        .overall-score {
          display: flex;
          align-items: baseline;
        }

        .overall-score strong {
          font-size: 55px;
          line-height: 1;
        }

        .overall-score span {
          margin-left: 2px;
          color: #77778c;
          font-size: 10px;
        }

        .result-overview h2 {
          margin: 5px 0;
          font-size: 20px;
        }

        .result-overview p:last-child {
          margin: 0;
          color: #77778c;
          font-size: 8px;
        }

        .result-section,
        .final-report {
          margin-top: 24px;
        }

        .category-grid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 8px;
        }

        .category-card {
          padding: 12px;
          border-radius: 10px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.05);
        }

        .category-top {
          display: flex;
          justify-content: space-between;
          gap: 5px;
          margin-bottom: 9px;
        }

        .category-top span {
          color: #77778c;
          font-size: 8px;
        }

        .category-top strong {
          color: #c8c2d9;
          font-size: 13px;
        }

        .track {
          height: 5px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(255,255,255,.06);
        }

        .fill {
          height: 100%;
          border-radius: 99px;
          background:
            linear-gradient(
              90deg,
              #7c3aed,
              #a78bfa
            );
        }

        .final-report {
          padding: 15px;
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.025);
        }

        .final-summary {
          padding: 12px;
          border-radius: 9px;
          background: rgba(0,0,0,.12);
        }

        .final-summary h3,
        .report-box h3 {
          margin: 0 0 5px;
          font-size: 10px;
        }

        .final-summary p {
          margin: 0;
          color: #8b8b9f;
          font-size: 8px;
          line-height: 1.6;
        }

        .report-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 8px;
          margin-top: 8px;
        }

        .report-box {
          padding: 12px;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,.05);
        }

        .report-box ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .report-box li {
          color: #88889c;
          font-size: 8px;
          line-height: 1.5;
        }

        .report-box li span {
          color: #86efac;
          margin-right: 5px;
        }

        .final-advice {
          display: flex;
          gap: 9px;
          margin-top: 8px;
          padding: 11px;
          border-radius: 9px;
          background: rgba(124,58,237,.06);
        }

        .final-advice > span {
          font-size: 15px;
        }

        .final-advice strong {
          font-size: 9px;
        }

        .final-advice p {
          margin: 3px 0 0;
          color: #85859a;
          font-size: 8px;
          line-height: 1.5;
        }

        .question-results {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .result-question {
          padding: 13px;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.05);
          background: rgba(255,255,255,.025);
        }

        .result-q-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .result-q-head > div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .result-q-head strong {
          color: #a78bfa;
          font-size: 9px;
        }

        .mark {
          padding: 6px 8px;
          border-radius: 7px;
          font-size: 9px;
          font-weight: 900;
        }

        .result-question h3 {
          margin: 9px 0;
          font-size: 10px;
          line-height: 1.5;
        }

        .answer-review,
        .feedback-review {
          margin-top: 6px;
          padding: 9px;
          border-radius: 8px;
        }

        .answer-review {
          background: rgba(255,255,255,.025);
        }

        .feedback-review {
          background: rgba(124,58,237,.04);
        }

        .answer-review strong,
        .feedback-review strong {
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .answer-review p,
        .feedback-review p {
          margin: 4px 0 0;
          color: #858598;
          font-size: 8px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .result-actions {
          display: flex;
          justify-content: center;
          gap: 7px;
          margin-top: 18px;
        }

        /* ================================
           END INTERVIEW MODAL
        ================================= */

        .finish-overlay {
          position: fixed;
          inset: 0;
          z-index: 120;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(0,0,0,.78);
          backdrop-filter: blur(10px);
        }

        .finish-modal {
          width: min(470px, 100%);
          padding: 22px;
          border: 1px solid rgba(167,139,250,.18);
          border-radius: 18px;
          background:
            linear-gradient(145deg, #151526, #0d0d19);
          box-shadow:
            0 35px 100px rgba(0,0,0,.62),
            inset 0 1px 0 rgba(255,255,255,.035);
          animation: finish-pop .18s ease-out;
        }

        @keyframes finish-pop {
          from {
            opacity: 0;
            transform: translateY(8px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .finish-icon {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 13px;
          border-radius: 13px;
          background: rgba(167,139,250,.10);
          border: 1px solid rgba(167,139,250,.18);
          color: #c4b5fd;
          font-size: 20px;
          font-weight: 900;
        }

        .finish-content h2 {
          margin: 5px 0 7px;
          font-size: 22px;
        }

        .finish-content p:not(.eyebrow) {
          margin: 0;
          color: #858598;
          font-size: 10px;
          line-height: 1.7;
        }

        .finish-content strong {
          color: #dcd6ea;
        }

        .finish-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 7px;
          margin-top: 17px;
        }

        .finish-summary > div {
          min-width: 0;
          padding: 9px;
          border-radius: 9px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.04);
        }

        .finish-summary span {
          display: block;
          color: #66667a;
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: .07em;
        }

        .finish-summary strong {
          display: block;
          margin-top: 4px;
          overflow: hidden;
          color: #d7d1e2;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .finish-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 18px;
        }

        .finish-actions button {
          min-height: 38px;
        }

        .finish-confirm {
          min-width: 135px;
        }

        .finish-cancel {
          min-width: 135px;
        }

        /* ================================
           HISTORY MODAL
        ================================= */

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: rgba(0,0,0,.76);
          backdrop-filter: blur(8px);
        }

        .history-modal {
          width: min(
            880px,
            100%
          );
          max-height: 92vh;
          overflow-y: auto;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.09);
          background: #0d0d19;
          box-shadow:
            0 30px 90px rgba(0,0,0,.55);
        }

        .modal-header {
          position: sticky;
          top: 0;
          z-index: 3;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 17px;
          background: rgba(13,13,25,.96);
          border-bottom: 1px solid rgba(255,255,255,.06);
          backdrop-filter: blur(12px);
        }

        .modal-header h2 {
          margin: 5px 0 6px;
          font-size: 20px;
        }

        .modal-header > div > p:last-child {
          margin: 7px 0 0;
          color: #66667b;
          font-size: 8px;
        }

        .modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .modal-tags span {
          padding: 5px 7px;
          border-radius: 6px;
          color: #8d879e;
          background: rgba(255,255,255,.05);
          font-size: 7px;
        }

        .close-btn {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.07);
          color: #aaa5b7;
          background: rgba(255,255,255,.04);
          cursor: pointer;
        }

        .modal-overview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin: 13px;
          padding: 12px;
          border-radius: 10px;
          background: rgba(124,58,237,.06);
        }

        .modal-main-score span {
          display: block;
          color: #727286;
          font-size: 8px;
        }

        .modal-main-score strong {
          display: block;
          margin-top: 3px;
          font-size: 27px;
        }

        .modal-main-score small {
          margin-left: 2px;
          color: #727286;
          font-size: 9px;
        }

        .modal-category-grid {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .modal-category {
          min-width: 67px;
          padding: 7px;
          text-align: center;
          border-radius: 8px;
          background: rgba(255,255,255,.04);
        }

        .modal-category span {
          display: block;
          color: #717186;
          font-size: 7px;
        }

        .modal-category strong {
          display: block;
          margin-top: 3px;
          color: #d5d0e1;
          font-size: 12px;
        }

        .modal-content {
          padding: 0 13px 15px;
        }

        .modal-title {
          margin: 8px 5px 11px;
        }

        .modal-title h3 {
          margin: 5px 0 0;
          font-size: 15px;
        }

        .modal-question {
          margin-bottom: 8px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.05);
          background: rgba(255,255,255,.025);
        }

        .modal-q-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }

        .modal-q-head > div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .modal-q-head strong {
          color: #a78bfa;
          font-size: 9px;
        }

        .modal-mark {
          padding: 6px 8px;
          border-radius: 7px;
          font-size: 8px;
          font-weight: 900;
        }

        .review-box {
          margin-top: 6px;
          padding: 9px;
          border-radius: 8px;
        }

        .question-box {
          background: rgba(124,58,237,.05);
        }

        .answer-box {
          background: rgba(255,255,255,.025);
        }

        .feedback-box {
          background: rgba(34,197,94,.035);
        }

        .review-box label {
          display: block;
          margin-bottom: 4px;
          color: #8174af;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .review-box p {
          margin: 0;
          color: #8b8b9d;
          font-size: 8px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .mini-review {
          margin-top: 6px;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,.02);
        }

        .mini-review strong {
          color: #86efac;
          font-size: 8px;
        }

        .mini-review.improvements strong {
          color: #fcd34d;
        }

        .mini-review ul {
          margin: 5px 0 0;
          padding-left: 15px;
        }

        .mini-review li {
          margin-bottom: 3px;
          color: #7e7e92;
          font-size: 7px;
          line-height: 1.5;
        }

        .modal-final-report {
          margin: 0 13px 13px;
          padding: 13px;
          border-radius: 10px;
          background: rgba(124,58,237,.05);
          border: 1px solid rgba(124,58,237,.08);
        }

        .modal-final-report h3 {
          margin: 5px 0;
          font-size: 13px;
        }

        .modal-final-report > p:not(.eyebrow) {
          margin: 0;
          color: #858598;
          font-size: 8px;
          line-height: 1.6;
        }

        .modal-advice {
          margin-top: 8px;
          padding: 9px;
          border-radius: 8px;
          background: rgba(0,0,0,.12);
        }

        .modal-advice strong {
          font-size: 8px;
          color: #c4b5fd;
        }

        .modal-advice p {
          margin: 4px 0 0;
          color: #7e7e92;
          font-size: 8px;
          line-height: 1.5;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 11px 13px 14px;
          border-top: 1px solid rgba(255,255,255,.05);
        }

        /* ================================
           RESPONSIVE
        ================================= */

        @media (max-width: 900px) {

          .selection-layout {
            grid-template-columns: 1fr;
          }

          .preview-panel {
            position: static;
          }

          .interview-layout {
            grid-template-columns: 1fr;
          }

          .interview-side {
            position: static;
            display: grid;
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }

        }

        @media (max-width: 700px) {

          .topbar {
            padding: 0 14px;
          }

          .container {
            width: calc(100% - 22px);
            padding-top: 20px;
          }

          .brand span {
            display: none;
          }

          .top-actions .secondary-btn:last-child {
            display: none;
          }

          .compact-hero,
          .interview-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .hero-status {
            width: 100%;
          }

          .type-grid {
            grid-template-columns: 1fr;
          }

          .level-grid {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }

          .question-panel {
            min-height: auto;
          }

          .question-text {
            font-size: 20px;
          }

          .answer-tools,
          .question-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .question-actions button {
            width: 100%;
          }

          .interview-side {
            grid-template-columns: 1fr;
          }

          .evaluation-grid,
          .report-grid,
          .category-grid {
            grid-template-columns: 1fr;
          }

          .result-overview {
            align-items: flex-start;
            flex-direction: column;
          }

          .modal-overview {
            align-items: flex-start;
            flex-direction: column;
          }

          .finish-summary {
            grid-template-columns: 1fr;
          }

          .finish-actions {
            flex-direction: column-reverse;
          }

          .finish-actions button {
            width: 100%;
          }

        }

      `}</style>
    </div>
  );
}

export default MockInterview;