import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://careerpilot-ai-pcqc.onrender.com";

const CATEGORY_OPTIONS = [
  "Mixed",
  "Quantitative",
  "Logical Reasoning",
  "Verbal",
  "Data Interpretation",
];

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];
const QUESTION_COUNT_OPTIONS = [10, 15, 20];

function Aptitude() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("setup");
  const [category, setCategory] = useState("Mixed");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(10);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [testId, setTestId] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const token = localStorage.getItem("access_token");

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadHistory();
    loadActiveTest();
  }, [token, navigate]);

  useEffect(() => {
    if (mode !== "test" || submitted) return;

    if (timeLeft <= 0) {
      if (questions.length > 0) {
        submitTest(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, timeLeft, submitted, questions.length]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get(
        `${API_URL}/api/aptitude/history`,
        authConfig
      );

      setHistory(response.data?.history || []);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      console.error("Failed to load aptitude history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadActiveTest = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/aptitude/active`,
        authConfig
      );

      if (!response.data?.active || !response.data?.test) {
        return;
      }

      const activeTest = response.data.test;
      const activeQuestions = activeTest.questions || [];

      if (!activeQuestions.length) {
        return;
      }

      setTestId(activeTest.test_id || "");
      setCategory(activeTest.category || "Mixed");
      setDifficulty(activeTest.difficulty || "Medium");
      setQuestionCount(activeTest.question_count || activeQuestions.length);
      setQuestions(activeQuestions);
      setCurrentIndex(0);
      setAnswers({});
      setSubmitted(false);

      const startedAt = new Date(activeTest.started_at).getTime();
      const limit = Number(activeTest.time_limit_seconds || 0);
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const remaining = Math.max(0, limit - elapsed);

      setTimeLeft(remaining);
      setMode("test");
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      console.error("Failed to load active aptitude test:", err);
    }
  };

  const startTest = async () => {
    try {
      setError("");
      setLoading(true);
      setResult(null);
      setSelectedHistory(null);
      setAnswers({});
      setCurrentIndex(0);
      setSubmitted(false);

      const response = await axios.post(
        `${API_URL}/api/aptitude/start`,
        {
          category,
          difficulty,
          question_count: questionCount,
        },
        authConfig
      );

      const data = response.data;

      const newQuestions = data?.questions || [];

      if (!newQuestions.length) {
        setError("No questions were returned by the server.");
        return;
      }

      setTestId(data.test_id || "");
      setQuestions(newQuestions);
      setTimeLeft(Number(data.time_limit_seconds || questionCount * 60));
      setMode("test");
    } catch (err) {
      console.error("Failed to start aptitude test:", err);

      const status = err?.response?.status;

      if (status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        err?.response?.data?.detail ||
          "Unable to start the aptitude test."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionId, option) => {
    if (submitted) return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: option,
    }));
  };

  const goToQuestion = (index) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
  };

  const submitTest = async (automatic = false) => {
    if (submitted || !questions.length) return;

    try {
      setSubmitted(true);
      setLoading(true);
      setError("");

      const payloadAnswers = questions.map((question) => ({
        question_id: question.id,
        selected_answer:
          answers[question.id] !== undefined
            ? answers[question.id]
            : null,
      }));

      const response = await axios.post(
        `${API_URL}/api/aptitude/submit`,
        {
          answers: payloadAnswers,
        },
        authConfig
      );

      const finalResult = response.data?.result;

      if (!finalResult) {
        throw new Error("Result was not returned by the server.");
      }

      setResult(finalResult);
      setMode("result");
      setSubmitted(false);

      await loadHistory();

      if (automatic) {
        setError("");
      }
    } catch (err) {
      console.error("Failed to submit aptitude test:", err);

      setSubmitted(false);

      const status = err?.response?.status;

      if (status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to submit the aptitude test."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearActiveTest = async () => {
    try {
      await axios.delete(
        `${API_URL}/api/aptitude/active`,
        authConfig
      );
    } catch (err) {
      console.error("Failed to clear active aptitude test:", err);
    }
  };

  const quitTest = async () => {
    await clearActiveTest();

    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(0);
    setTestId("");
    setSubmitted(false);
    setMode("setup");
    setError("");
  };

  const openHistoryItem = (item) => {
    setSelectedHistory(item);
  };

  const closeHistoryItem = () => {
    setSelectedHistory(null);
  };

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const getScoreColor = (percentage) => {
    const value = Number(percentage || 0);

    if (value >= 70) return "#4ade80";
    if (value >= 40) return "#fbbf24";
    return "#fb7185";
  };

  const currentQuestion = questions[currentIndex];

  const answeredCount = questions.filter(
    (question) =>
      answers[question.id] !== undefined &&
      answers[question.id] !== null &&
      answers[question.id] !== ""
  ).length;

  const progress =
    questions.length > 0
      ? ((currentIndex + 1) / questions.length) * 100
      : 0;

  const getHistoryDate = (value) => {
    if (!value) return "Unknown date";

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <div className="aptitude-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .aptitude-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.16), transparent 32%),
            radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.10), transparent 32%),
            #0b0c18;
          color: #f7f7fb;
          font-family: Arial, Helvetica, sans-serif;
          padding: 24px;
        }

        .aptitude-container {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          font-weight: 800;
          font-size: 20px;
          box-shadow: 0 12px 32px rgba(124, 58, 237, 0.28);
        }

        .brand h1 {
          margin: 0;
          font-size: 23px;
        }

        .brand p {
          margin: 4px 0 0;
          color: #9da0b7;
          font-size: 13px;
        }

        .back-button,
        .secondary-button,
        .primary-button,
        .danger-button,
        .close-button {
          border: 0;
          cursor: pointer;
          border-radius: 10px;
          font-weight: 700;
          transition: 0.18s ease;
        }

        .back-button {
          padding: 11px 16px;
          background: #1a1c31;
          color: #e7e8f2;
          border: 1px solid #30334d;
        }

        .back-button:hover,
        .secondary-button:hover {
          background: #232640;
          transform: translateY(-1px);
        }

        .panel {
          background: rgba(20, 22, 39, 0.94);
          border: 1px solid #2b2e48;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
        }

        .setup-panel {
          padding: 28px;
        }

        .section-title {
          margin: 0 0 8px;
          font-size: 28px;
        }

        .section-subtitle {
          margin: 0 0 26px;
          color: #9da0b7;
          line-height: 1.5;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .field {
          background: #17192c;
          border: 1px solid #2b2e48;
          border-radius: 14px;
          padding: 16px;
        }

        .field label {
          display: block;
          font-size: 12px;
          color: #a9acc0;
          margin-bottom: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .field select {
          width: 100%;
          border: 1px solid #343750;
          background: #101223;
          color: #fff;
          padding: 12px;
          border-radius: 10px;
          outline: none;
          font-size: 14px;
        }

        .setup-info {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .info-card {
          background: #16182b;
          border: 1px solid #2b2e48;
          border-radius: 14px;
          padding: 15px;
        }

        .info-card strong {
          display: block;
          font-size: 18px;
          margin-bottom: 5px;
        }

        .info-card span {
          color: #9296ae;
          font-size: 12px;
        }

        .start-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 22px;
        }

        .primary-button {
          padding: 13px 21px;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #5b46d8);
          box-shadow: 0 12px 28px rgba(124, 58, 237, 0.25);
        }

        .primary-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 15px 34px rgba(124, 58, 237, 0.33);
        }

        .primary-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .error-box {
          background: rgba(127, 29, 29, 0.18);
          color: #fda4af;
          border: 1px solid rgba(244, 63, 94, 0.35);
          padding: 13px 15px;
          border-radius: 12px;
          margin-bottom: 18px;
          font-size: 14px;
        }

        .history-section {
          margin-top: 22px;
          padding: 22px;
        }

        .history-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .history-heading h2 {
          margin: 0;
          font-size: 20px;
        }

        .history-heading span {
          color: #9296ae;
          font-size: 12px;
        }

        .history-list {
          max-height: 340px;
          overflow-y: auto;
          padding-right: 4px;
          display: grid;
          gap: 10px;
        }

        .history-card {
          background: #181a2e;
          border: 1px solid #2b2e48;
          border-radius: 14px;
          padding: 14px;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .history-card:hover {
          transform: translateY(-2px);
          border-color: #6652d9;
          background: #1b1e35;
        }

        .history-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .history-name {
          font-weight: 700;
          font-size: 14px;
        }

        .history-score {
          font-weight: 800;
          font-size: 15px;
        }

        .history-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .meta-pill {
          background: #22253d;
          color: #b2b5c7;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 10px;
        }

        .history-bottom {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 9px;
          color: #8589a2;
          font-size: 11px;
        }

        .test-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 250px;
          gap: 18px;
        }

        .test-panel {
          padding: 24px;
        }

        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .test-header h2 {
          margin: 0;
          font-size: 21px;
        }

        .test-header p {
          margin: 5px 0 0;
          color: #8f93ac;
          font-size: 12px;
        }

        .timer {
          min-width: 110px;
          text-align: center;
          padding: 11px 14px;
          border-radius: 12px;
          background: #17192c;
          border: 1px solid #30334d;
          font-weight: 800;
          font-size: 18px;
        }

        .timer.warning {
          color: #fda4af;
          border-color: rgba(244, 63, 94, 0.45);
          background: rgba(127, 29, 29, 0.18);
        }

        .progress-track {
          height: 7px;
          background: #252841;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .progress-value {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #4f46e5);
          transition: width 0.2s ease;
        }

        .question-number {
          color: #8e92aa;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .question-text {
          font-size: 24px;
          line-height: 1.45;
          margin: 0 0 22px;
        }

        .topic-row {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 18px;
        }

        .topic-pill {
          padding: 6px 9px;
          border-radius: 999px;
          background: #21233a;
          color: #abaec0;
          font-size: 10px;
          border: 1px solid #2e314a;
        }

        .options {
          display: grid;
          gap: 11px;
        }

        .option {
          width: 100%;
          text-align: left;
          border: 1px solid #30334d;
          background: #17192c;
          color: #f4f4f8;
          padding: 15px;
          border-radius: 13px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1.45;
          transition: 0.18s ease;
        }

        .option:hover {
          border-color: #6552d7;
          background: #1c1f35;
        }

        .option.selected {
          border-color: #8b6cf1;
          background: rgba(124, 58, 237, 0.17);
          box-shadow: inset 0 0 0 1px rgba(139, 108, 241, 0.16);
        }

        .bottom-actions {
          margin-top: 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .action-group {
          display: flex;
          gap: 9px;
        }

        .secondary-button {
          padding: 11px 15px;
          color: #e6e7ee;
          background: #1a1c31;
          border: 1px solid #30334d;
        }

        .danger-button {
          padding: 11px 15px;
          background: rgba(127, 29, 29, 0.19);
          color: #fda4af;
          border: 1px solid rgba(244, 63, 94, 0.25);
        }

        .danger-button:hover {
          background: rgba(127, 29, 29, 0.3);
        }

        .question-sidebar {
          padding: 18px;
          height: fit-content;
          position: sticky;
          top: 18px;
        }

        .side-stat {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding-bottom: 13px;
          margin-bottom: 13px;
          border-bottom: 1px solid #2a2d45;
          font-size: 12px;
        }

        .side-stat span {
          color: #8f93ac;
        }

        .question-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 7px;
        }

        .question-jump {
          width: 100%;
          aspect-ratio: 1;
          border: 1px solid #30334d;
          background: #17192c;
          color: #9da0b7;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 700;
          font-size: 11px;
        }

        .question-jump.answered {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.3);
          color: #86efac;
        }

        .question-jump.active {
          background: #5b46d8;
          border-color: #8b6cf1;
          color: #fff;
        }

        .result-panel {
          padding: 26px;
        }

        .result-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .result-header h2 {
          margin: 0;
          font-size: 28px;
        }

        .result-header p {
          color: #9296ae;
          margin: 8px 0 0;
        }

        .result-score {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          margin: 20px auto;
          display: grid;
          place-items: center;
          border: 10px solid #272a43;
          background: #131528;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
        }

        .result-score strong {
          font-size: 34px;
        }

        .result-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }

        .result-stat {
          padding: 16px;
          background: #17192c;
          border: 1px solid #2b2e48;
          border-radius: 13px;
          text-align: center;
        }

        .result-stat strong {
          display: block;
          font-size: 21px;
          margin-bottom: 5px;
        }

        .result-stat span {
          color: #8f93aa;
          font-size: 11px;
        }

        .review-title {
          margin: 0 0 14px;
          font-size: 19px;
        }

        .review-item {
          background: #17192c;
          border: 1px solid #2b2e48;
          border-radius: 14px;
          padding: 17px;
          margin-bottom: 12px;
        }

        .review-item.correct {
          border-left: 4px solid #4ade80;
        }

        .review-item.incorrect {
          border-left: 4px solid #fb7185;
        }

        .review-item.unanswered {
          border-left: 4px solid #fbbf24;
        }

        .review-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .review-question-number {
          color: #8f93aa;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .status-label {
          font-size: 10px;
          font-weight: 800;
          padding: 5px 8px;
          border-radius: 999px;
          background: #252840;
          color: #d1d3dd;
        }

        .review-question {
          font-size: 15px;
          line-height: 1.55;
          margin: 0 0 10px;
        }

        .review-answer {
          font-size: 13px;
          line-height: 1.5;
          color: #c7c9d4;
          margin: 5px 0;
        }

        .review-explanation {
          margin-top: 11px;
          color: #969bb2;
          font-size: 12px;
          line-height: 1.55;
          padding-top: 10px;
          border-top: 1px solid #292c43;
        }

        .result-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(4, 5, 12, 0.78);
          backdrop-filter: blur(5px);
          z-index: 1000;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .history-modal {
          width: min(900px, 95vw);
          max-height: 90vh;
          overflow-y: auto;
          background: #141627;
          border: 1px solid #31344f;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 22px;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #9195ad;
          font-size: 12px;
        }

        .close-button {
          width: 36px;
          height: 36px;
          background: #23253d;
          color: #fff;
          font-size: 15px;
        }

        .close-button:hover {
          background: #30334d;
        }

        .modal-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 21px;
        }

        .modal-summary-card {
          background: #1a1c2e;
          border: 1px solid #2d3049;
          border-radius: 12px;
          padding: 13px;
          text-align: center;
        }

        .modal-summary-card strong {
          display: block;
          font-size: 19px;
          margin-bottom: 4px;
        }

        .modal-summary-card span {
          font-size: 10px;
          color: #8f93a9;
        }

        .empty-state {
          padding: 22px;
          text-align: center;
          color: #8589a2;
          border: 1px dashed #30334d;
          border-radius: 12px;
          font-size: 13px;
        }

        @media (max-width: 900px) {
          .test-shell {
            grid-template-columns: 1fr;
          }

          .question-sidebar {
            position: static;
          }

          .settings-grid {
            grid-template-columns: 1fr;
          }

          .setup-info,
          .result-stats,
          .modal-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .aptitude-page {
            padding: 12px;
          }

          .topbar {
            align-items: flex-start;
          }

          .brand h1 {
            font-size: 19px;
          }

          .setup-panel,
          .test-panel,
          .result-panel,
          .history-section {
            padding: 17px;
          }

          .question-text {
            font-size: 19px;
          }

          .test-header {
            align-items: flex-start;
          }

          .bottom-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .action-group {
            width: 100%;
          }

          .action-group button {
            flex: 1;
          }
        }
      `}</style>

      <div className="aptitude-container">
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark">🧠</div>

            <div>
              <h1>Aptitude Practice</h1>
              <p>Practice aptitude questions and track your performance.</p>
            </div>
          </div>

          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* =====================================================
            SETUP
        ====================================================== */}
        {mode === "setup" && (
          <>
            <div className="panel setup-panel">
              <h2 className="section-title">
                Start a New Aptitude Test
              </h2>

              <p className="section-subtitle">
                Choose your category, difficulty and number of
                questions. Questions are selected randomly without
                repeating previously served questions until the
                available question bank is exhausted.
              </p>

              <div className="settings-grid">
                <div className="field">
                  <label>Category</label>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Difficulty</label>

                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Questions</label>

                  <select
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(Number(e.target.value))
                    }
                  >
                    {QUESTION_COUNT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} Questions
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="setup-info">
                <div className="info-card">
                  <strong>{questionCount}</strong>
                  <span>Questions</span>
                </div>

                <div className="info-card">
                  <strong>{questionCount} min</strong>
                  <span>Time limit</span>
                </div>

                <div className="info-card">
                  <strong>Random</strong>
                  <span>Question order</span>
                </div>

                <div className="info-card">
                  <strong>No Repeat</strong>
                  <span>Until bank cycle ends</span>
                </div>
              </div>

              <div className="start-row">
                <button
                  className="primary-button"
                  onClick={startTest}
                  disabled={loading}
                >
                  {loading ? "Starting..." : "Start Test →"}
                </button>
              </div>
            </div>

            <div className="panel history-section">
              <div className="history-heading">
                <div>
                  <h2>Test History</h2>
                  <span>
                    Click any test to view its complete result.
                  </span>
                </div>

                <span>
                  {historyLoading
                    ? "Loading..."
                    : `${history.length} attempt${
                        history.length === 1 ? "" : "s"
                      }`}
                </span>
              </div>

              {!historyLoading && history.length === 0 ? (
                <div className="empty-state">
                  No aptitude attempts yet. Start your first test.
                </div>
              ) : (
                <div className="history-list">
                  {history.map((item, index) => (
                    <div
                      className="history-card"
                      key={
                        item.test_id ||
                        `${item.completed_at || "history"}-${index}`
                      }
                      onClick={() => openHistoryItem(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openHistoryItem(item);
                        }
                      }}
                    >
                      <div className="history-top">
                        <div className="history-name">
                          {item.category || "Mixed"}{" "}
                          •{" "}
                          {item.difficulty || "Medium"}
                        </div>

                        <div
                          className="history-score"
                          style={{
                            color: getScoreColor(item.percentage),
                          }}
                        >
                          {item.percentage ?? 0}%
                        </div>
                      </div>

                      <div className="history-meta">
                        <span className="meta-pill">
                          {item.question_count || 0} Questions
                        </span>

                        <span className="meta-pill">
                          {item.correct_count || 0} Correct
                        </span>

                        <span className="meta-pill">
                          {item.wrong_count || 0} Wrong
                        </span>

                        <span className="meta-pill">
                          {item.unanswered_count || 0} Unanswered
                        </span>
                      </div>

                      <div className="history-bottom">
                        <span>
                          {getHistoryDate(item.completed_at)}
                        </span>

                        <span>
                          Click to view →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* =====================================================
            TEST
        ====================================================== */}
        {mode === "test" && currentQuestion && (
          <div className="test-shell">
            <div className="panel test-panel">
              <div className="test-header">
                <div>
                  <h2>
                    {category} Aptitude Test
                  </h2>

                  <p>
                    {difficulty} • {questions.length} Questions
                  </p>
                </div>

                <div
                  className={`timer ${
                    timeLeft <= 60 ? "warning" : ""
                  }`}
                >
                  ⏱ {formatTime(timeLeft)}
                </div>
              </div>

              <div className="progress-track">
                <div
                  className="progress-value"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="question-number">
                Question {currentIndex + 1} of {questions.length}
              </div>

              <div className="topic-row">
                {currentQuestion.topic && (
                  <span className="topic-pill">
                    {currentQuestion.topic}
                  </span>
                )}

                {currentQuestion.category && (
                  <span className="topic-pill">
                    {currentQuestion.category}
                  </span>
                )}

                {currentQuestion.difficulty && (
                  <span className="topic-pill">
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>

              <h3 className="question-text">
                {currentQuestion.question}
              </h3>

              <div className="options">
                {(currentQuestion.options || []).map(
                  (option) => (
                    <button
                      key={option}
                      className={`option ${
                        answers[currentQuestion.id] === option
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        selectAnswer(
                          currentQuestion.id,
                          option
                        )
                      }
                    >
                      {option}
                    </button>
                  )
                )}
              </div>

              <div className="bottom-actions">
                <button
                  className="danger-button"
                  onClick={quitTest}
                  disabled={loading}
                >
                  Exit Test
                </button>

                <div className="action-group">
                  <button
                    className="secondary-button"
                    onClick={() =>
                      goToQuestion(currentIndex - 1)
                    }
                    disabled={currentIndex === 0}
                  >
                    ← Previous
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      className="primary-button"
                      onClick={() =>
                        goToQuestion(currentIndex + 1)
                      }
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      className="primary-button"
                      onClick={() => submitTest(false)}
                      disabled={loading || submitted}
                    >
                      {loading
                        ? "Submitting..."
                        : "Submit Test"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="panel question-sidebar">
              <div className="side-stat">
                <span>Answered</span>
                <strong>
                  {answeredCount}/{questions.length}
                </strong>
              </div>

              <div className="side-stat">
                <span>Remaining</span>
                <strong>
                  {Math.max(
                    0,
                    questions.length - answeredCount
                  )}
                </strong>
              </div>

              <div className="side-stat">
                <span>Test ID</span>
                <strong
                  style={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {testId || "-"}
                </strong>
              </div>

              <div className="question-grid">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    className={`question-jump ${
                      currentIndex === index ? "active" : ""
                    } ${
                      answers[question.id] !== undefined &&
                      answers[question.id] !== null &&
                      answers[question.id] !== ""
                        ? "answered"
                        : ""
                    }`}
                    onClick={() => goToQuestion(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            RESULT
        ====================================================== */}
        {mode === "result" && result && (
          <div className="panel result-panel">
            <div className="result-header">
              <h2>Test Completed 🎉</h2>

              <p>
                {result.category} • {result.difficulty}
              </p>

              <div
                className="result-score"
                style={{
                  borderColor: getScoreColor(
                    result.percentage
                  ),
                }}
              >
                <strong
                  style={{
                    color: getScoreColor(result.percentage),
                  }}
                >
                  {result.percentage}%
                </strong>
              </div>
            </div>

            <div className="result-stats">
              <div className="result-stat">
                <strong>
                  {result.correct_count}
                </strong>
                <span>Correct</span>
              </div>

              <div className="result-stat">
                <strong>
                  {result.wrong_count}
                </strong>
                <span>Wrong</span>
              </div>

              <div className="result-stat">
                <strong>
                  {result.unanswered_count}
                </strong>
                <span>Unanswered</span>
              </div>

              <div className="result-stat">
                <strong>
                  {result.score}/{result.total_score}
                </strong>
                <span>Score</span>
              </div>
            </div>

            <h3 className="review-title">
              Question Review
            </h3>

            {(result.review || []).map((item, index) => (
              <div
                key={item.question_id || index}
                className={`review-item ${
                  item.status || "unanswered"
                }`}
              >
                <div className="review-head">
                  <div>
                    <div className="review-question-number">
                      Question {index + 1} •{" "}
                      {item.topic || "Aptitude"}
                    </div>
                  </div>

                  <span className="status-label">
                    {item.status === "correct"
                      ? "Correct"
                      : item.status === "incorrect"
                      ? "Incorrect"
                      : "Unanswered"}
                  </span>
                </div>

                <p className="review-question">
                  {item.question}
                </p>

                <p className="review-answer">
                  <strong>Your Answer:</strong>{" "}
                  {item.selected_answer || "Not answered"}
                </p>

                <p className="review-answer">
                  <strong>Correct Answer:</strong>{" "}
                  {item.correct_answer}
                </p>

                <div className="review-explanation">
                  <strong>Explanation:</strong>{" "}
                  {item.explanation || "No explanation available."}
                </div>
              </div>
            ))}

            <div className="result-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setSelectedHistory(result);
                }}
              >
                View This Result
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  setResult(null);
                  setQuestions([]);
                  setAnswers({});
                  setCurrentIndex(0);
                  setMode("setup");
                  setError("");
                }}
              >
                New Test
              </button>
            </div>
          </div>
        )}

        {/* =====================================================
            HISTORY MODAL
        ====================================================== */}
        {selectedHistory && (
          <div
            className="modal-backdrop"
            onClick={closeHistoryItem}
          >
            <div
              className="history-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>Aptitude Test History</h2>

                  <p>
                    {selectedHistory.category ||
                      "Mixed"}{" "}
                    •{" "}
                    {selectedHistory.difficulty ||
                      "Medium"}{" "}
                    •{" "}
                    {selectedHistory.question_count ||
                      0}{" "}
                    questions
                  </p>
                </div>

                <button
                  className="close-button"
                  onClick={closeHistoryItem}
                >
                  ✕
                </button>
              </div>

              <div className="modal-summary">
                <div className="modal-summary-card">
                  <strong
                    style={{
                      color: getScoreColor(
                        selectedHistory.percentage
                      ),
                    }}
                  >
                    {selectedHistory.percentage ?? 0}%
                  </strong>
                  <span>Score</span>
                </div>

                <div className="modal-summary-card">
                  <strong>
                    {selectedHistory.correct_count || 0}
                  </strong>
                  <span>Correct</span>
                </div>

                <div className="modal-summary-card">
                  <strong>
                    {selectedHistory.wrong_count || 0}
                  </strong>
                  <span>Wrong</span>
                </div>

                <div className="modal-summary-card">
                  <strong>
                    {selectedHistory.unanswered_count || 0}
                  </strong>
                  <span>Unanswered</span>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    color: "#898da6",
                    fontSize: "11px",
                    marginBottom: "6px",
                  }}
                >
                  Completed
                </div>

                <div
                  style={{
                    color: "#d9dae4",
                    fontSize: "13px",
                  }}
                >
                  {getHistoryDate(
                    selectedHistory.completed_at
                  )}
                </div>
              </div>

              {(selectedHistory.review || []).map(
                (item, index) => (
                  <div
                    key={
                      item.question_id || index
                    }
                    className={`review-item ${
                      item.status || "unanswered"
                    }`}
                  >
                    <div className="review-head">
                      <div className="review-question-number">
                        Question {index + 1}
                        {item.topic
                          ? ` • ${item.topic}`
                          : ""}
                      </div>

                      <span className="status-label">
                        {item.status === "correct"
                          ? "Correct"
                          : item.status === "incorrect"
                          ? "Incorrect"
                          : "Unanswered"}
                      </span>
                    </div>

                    <p className="review-question">
                      {item.question}
                    </p>

                    <p className="review-answer">
                      <strong>Your Answer:</strong>{" "}
                      {item.selected_answer ||
                        "Not answered"}
                    </p>

                    <p className="review-answer">
                      <strong>Correct Answer:</strong>{" "}
                      {item.correct_answer}
                    </p>

                    <div className="review-explanation">
                      <strong>Explanation:</strong>{" "}
                      {item.explanation ||
                        "No explanation available."}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Aptitude;
