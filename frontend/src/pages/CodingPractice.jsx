import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

const TOPICS = [
  "DSA Core",
  "Arrays",
  "Strings",
  "Searching",
  "Sorting",
  "Hashing",
  "Two Pointers",
  "Sliding Window",
  "Prefix Sum",
  "Linked List",
  "Stack",
  "Queue",
  "Recursion",
  "Backtracking",
  "Trees",
  "Binary Search Tree",
  "Heap / Priority Queue",
  "Greedy",
  "Graphs",
  "Dynamic Programming",
  "Bit Manipulation",
  "Trie",
  "Divide and Conquer",
];

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function formatListItem(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(formatListItem).join(", ");
  }
  if (typeof value === "object") {
    if (value.name !== undefined && value.value !== undefined) {
      return `${value.name}: ${value.value}`;
    }
    if (value.name !== undefined) return String(value.name);
    if (value.value !== undefined) return String(value.value);
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${formatListItem(item)}`)
      .join(", ");
  }
  return String(value);
}

function CodingPractice() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("DSA Core");
  const [difficulty, setDifficulty] = useState("Medium");
  const [language, setLanguage] = useState("python");

  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [testPanelTab, setTestPanelTab] = useState("testcase");
  const [selectedResultCase, setSelectedResultCase] = useState(0);

  const token = localStorage.getItem("access_token");

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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
  }, [token]);

  const loadHistory = async () => {
    if (!token) return;

    setHistoryLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/api/coding/history`,
        authConfig
      );

      setHistory(response.data?.history || []);
    } catch (err) {
      console.error("Coding history error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateQuestion = async () => {
    setError("");
    setMessage("");
    setEvaluation(null);
    setTestPanelTab("testcase");
    setSelectedResultCase(0);
    setQuestion(null);
    setCode("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/coding/generate`,
        {
          topic,
          difficulty,
          language,
        },
        authConfig
      );

      const generated = response.data?.question;

      if (!generated) {
        throw new Error("No coding question received from server.");
      }

      setQuestion(generated);
      setCode(
        generated.starter_code ||
          generated.function_signature ||
          "# Write your solution here"
      );

      setMessage(
        "Fresh problem generated. Previously shown problems are excluded."
      );

      await loadHistory();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Coding generation error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to generate a coding question."
      );
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    setError("");
    setMessage("");
    setEvaluation(null);

    if (!question) {
      setError("Please generate a coding question first.");
      return;
    }

    if (!code.trim()) {
      setError("Please write your solution before submitting.");
      return;
    }

    setEvaluating(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/coding/evaluate`,
        {
          problem_id: question.problem_id,
          language,
          code,
        },
        authConfig
      );

      setEvaluation(response.data?.evaluation || null);
      setSelectedResultCase(0);
      setTestPanelTab("result");
      await loadHistory();
    } catch (err) {
      console.error("Coding evaluation error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to evaluate your solution."
      );
    } finally {
      setEvaluating(false);
    }
  };

  const loadHistoryItem = (item) => {
    if (!item) return;

    setSelectedHistory(item);

    if (item.problem) {
      setQuestion(item.problem);
    }

    if (item.submission?.code) {
      setCode(item.submission.code);
    }

    if (item.submission?.evaluation) {
      setEvaluation(item.submission.evaluation);
      setSelectedResultCase(0);
      setTestPanelTab("result");
    } else {
      setEvaluation(null);
      setTestPanelTab("testcase");
    }

    if (item.problem?.language) {
      setLanguage(item.problem.language);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeHistory = () => {
    setSelectedHistory(null);
  };

  const selectedLanguageLabel =
    LANGUAGES.find((item) => item.value === language)?.label || language;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.topbar}>
          <div>
            <div style={styles.eyebrow}>CAREERPILOT AI</div>
            <h1 style={styles.title}>Coding Practice</h1>
            <p style={styles.subtitle}>
              Placement-style DSA practice with AI-generated unique problems.
              Write only the required function.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            style={styles.backButton}
          >
            ← Dashboard
          </button>
        </div>

        <section style={styles.generatorCard}>
          <div>
            <h2 style={styles.cardTitle}>⚡ Generate a Coding Problem</h2>
            <p style={styles.cardText}>
              Choose DSA Core or a specific topic. Each new problem is checked
              against your previous coding history to reduce repetition.
            </p>
          </div>

          <div style={styles.controls}>
            <div style={styles.control}>
              <label style={styles.label}>Topic</label>
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                style={styles.select}
                disabled={loading || evaluating}
              >
                {TOPICS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.control}>
              <label style={styles.label}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                style={styles.select}
                disabled={loading || evaluating}
              >
                {DIFFICULTIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div style={styles.control}>
              <label style={styles.label}>Language</label>
              <select
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                  setEvaluation(null);
                }}
                style={styles.select}
                disabled={loading || evaluating}
              >
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generateQuestion}
              disabled={loading || evaluating}
              style={{
                ...styles.generateButton,
                opacity: loading || evaluating ? 0.65 : 1,
              }}
            >
              {loading ? "🤖 Generating..." : "✨ New Problem"}
            </button>
          </div>
        </section>

        {message ? <div style={styles.message}>{message}</div> : null}
        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.mainGrid}>
          <section style={styles.problemCard}>
            {question ? (
              <>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.problemKicker}>
                      {question.topic || topic}
                    </div>
                    <h2 style={styles.problemTitle}>{question.title}</h2>
                  </div>

                  <div style={styles.badges}>
                    <span style={styles.badge}>{question.difficulty}</span>
                    <span style={styles.badge}>
                      {selectedLanguageLabel}
                    </span>
                  </div>
                </div>

                <div style={styles.problemBody}>
                  <h3 style={styles.sectionHeading}>Problem</h3>
                  <div style={styles.description}>
                    {question.description}
                  </div>

                  {question.examples?.length ? (
                    <div style={styles.sectionBlock}>
                      <h3 style={styles.sectionHeading}>Examples</h3>

                      {question.examples.map((example, index) => (
                        <div key={index} style={styles.exampleCard}>
                          <div style={styles.exampleHeading}>
                            Example {index + 1}
                          </div>
                          <pre style={styles.exampleText}>
                            {typeof example === "string"
                              ? example
                              : JSON.stringify(example, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {question.constraints?.length ? (
                    <div style={styles.sectionBlock}>
                      <h3 style={styles.sectionHeading}>Constraints</h3>

                      <ul style={styles.constraintList}>
                        {question.constraints.map((item, index) => (
                          <li key={index}>{formatListItem(item)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {question.hints?.length ? (
                    <div style={styles.sectionBlock}>
                      <details>
                        <summary style={styles.hintSummary}>
                          💡 Show Hints
                        </summary>

                        <div style={styles.hintBox}>
                          {question.hints.map((hint, index) => (
                            <div key={index} style={styles.hintRow}>
                              <strong>Hint {index + 1}</strong>
                              <span>{formatListItem(hint)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>⌨</div>
                <h2 style={styles.emptyTitle}>Ready for your next problem?</h2>
                <p style={styles.emptyText}>
                  Select a topic and difficulty, then generate an AI-created
                  DSA problem. Your resume is not used to choose coding
                  questions.
                </p>
              </div>
            )}
          </section>

          <section style={styles.editorCard}>
            <div style={styles.editorHeader}>
              <div>
                <div style={styles.problemKicker}>YOUR SOLUTION</div>
                <h3 style={styles.editorTitle}>Function Only</h3>
              </div>

              <span style={styles.languageChip}>{selectedLanguageLabel}</span>
            </div>

            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              style={styles.editor}
              spellCheck="false"
              placeholder={
                question
                  ? "Write only the required function..."
                  : "Generate a problem to receive the function template..."
              }
              disabled={loading || !question}
            />

            <div style={styles.editorFooter}>
              <button
                onClick={submitCode}
                disabled={!question || evaluating || loading}
                style={{
                  ...styles.submitButton,
                  opacity:
                    !question || evaluating || loading ? 0.55 : 1,
                }}
              >
                {evaluating ? "🤖 Evaluating..." : "🚀 Submit Solution"}
              </button>
            </div>

            <div style={styles.testPanel}>
              <div style={styles.testTabs}>
                <button
                  type="button"
                  onClick={() => setTestPanelTab("testcase")}
                  style={{
                    ...styles.testTab,
                    ...(testPanelTab === "testcase"
                      ? styles.testTabActive
                      : {}),
                  }}
                >
                  <span style={styles.testTabIcon}>▣</span>
                  Testcase
                </button>

                <button
                  type="button"
                  onClick={() => setTestPanelTab("result")}
                  style={{
                    ...styles.testTab,
                    ...(testPanelTab === "result"
                      ? styles.testTabActive
                      : {}),
                  }}
                >
                  <span style={styles.testTabIcon}>›_</span>
                  Test Result
                  {evaluation?.test_results?.length ? (
                    <span
                      style={{
                        ...styles.testCountBadge,
                        ...(evaluation.correct
                          ? styles.testCountBadgePassed
                          : styles.testCountBadgeFailed),
                      }}
                    >
                      {evaluation.passed_tests ?? 0}/{evaluation.total_tests ?? 0}
                    </span>
                  ) : null}
                </button>
              </div>

              <div style={styles.testPanelBody}>
                {testPanelTab === "testcase" ? (
                  question?.examples?.length ? (
                    <div style={styles.caseList}>
                      {question.examples.map((example, index) => (
                        <div key={index} style={styles.visibleCase}>
                          <div style={styles.visibleCaseHeader}>
                            <strong>
                              Test Case {index + 1}
                            </strong>
                          </div>
                          <pre style={styles.visibleCaseText}>
                            {typeof example === "string"
                              ? example
                              : JSON.stringify(example, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.testEmptyState}>
                      Generate a problem to see its test cases.
                    </div>
                  )
                ) : evaluation?.test_results?.length ? (
                  <div>
                    <div style={styles.resultHeadline}>
                      <div style={styles.resultHeadlineLeft}>
                        <strong
                          style={
                            evaluation.correct
                              ? styles.resultAccepted
                              : evaluation.runner_status &&
                                evaluation.runner_status !== "Accepted"
                              ? styles.resultFailed
                              : styles.resultWrong
                          }
                        >
                          {evaluation.correct
                            ? "Accepted"
                            : evaluation.runner_status &&
                              evaluation.runner_status !== "Accepted"
                            ? "Execution Failed"
                            : "Wrong Answer"}
                        </strong>
                        <span>
                          {evaluation.passed_tests ?? 0}/
                          {evaluation.total_tests ?? 0} test cases passed
                        </span>
                      </div>
                      <span style={styles.resultScore}>
                        {evaluation.runtime != null
                          ? `Runtime: ${evaluation.runtime} ms`
                          : `${evaluation.score ?? 0}/100`}
                      </span>
                    </div>

                    <div style={styles.resultCaseTabs}>
                      {evaluation.test_results.map((test, index) => (
                        <button
                          key={test.index ?? index}
                          type="button"
                          onClick={() => setSelectedResultCase(index)}
                          style={{
                            ...styles.resultCaseTab,
                            ...(selectedResultCase === index
                              ? styles.resultCaseTabActive
                              : {}),
                            ...(test.passed
                              ? styles.resultCaseTabPassed
                              : styles.resultCaseTabFailed),
                          }}
                        >
                          <span
                            style={{
                              ...styles.resultCaseIcon,
                              ...(test.passed
                                ? styles.resultCaseIconPassed
                                : styles.resultCaseIconFailed),
                            }}
                          >
                            {test.passed ? "✓" : "✕"}
                          </span>
                          <span>
                            {test.hidden
                              ? `Case ${index + 1}`
                              : `Case ${index + 1}`}
                          </span>
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const test =
                        evaluation.test_results[
                          Math.min(
                            selectedResultCase,
                            evaluation.test_results.length - 1
                          )
                        ];

                      if (!test) return null;

                      return (
                        <div
                          style={{
                            ...styles.selectedResultCase,
                            ...(test.passed
                              ? styles.selectedResultCasePassed
                              : styles.selectedResultCaseFailed),
                          }}
                        >
                          <div style={styles.selectedResultHeader}>
                            <div>
                              <strong>{`Case ${test.index}`}</strong>
                              <span
                                style={
                                  test.passed
                                    ? styles.casePassedLabel
                                    : styles.caseFailedLabel
                                }
                              >
                                {test.passed ? "PASSED" : "FAILED"}
                              </span>
                            </div>
                            <span style={styles.selectedResultLabel}>
                              {test.hidden ? "Hidden test case" : test.label || "Visible test case"}
                            </span>
                          </div>

                          {!test.passed && test.error ? (
                            <pre style={styles.resultError}>
                              {test.error}
                            </pre>
                          ) : null}

                          <div style={styles.selectedResultIO}>
                            <div style={styles.selectedResultIOCard}>
                              <span style={styles.selectedResultIOLabel}>Input</span>
                              <code style={styles.selectedResultIOCode}>
                                {test.input ||
                                  (test.args
                                    ? JSON.stringify(test.args, null, 2)
                                    : test.hidden
                                    ? "Hidden input"
                                    : "See testcase") }
                              </code>
                            </div>

                            <div style={styles.selectedResultIOCard}>
                              <span style={styles.selectedResultIOLabel}>Output</span>
                              <code style={styles.selectedResultIOCode}>
                                {test.actual_output || "No output"}
                              </code>
                            </div>

                            <div style={styles.selectedResultIOCard}>
                              <span style={styles.selectedResultIOLabel}>Expected</span>
                              <code style={styles.selectedResultIOCode}>
                                {test.hidden
                                  ? "Hidden output"
                                  : test.expected_output || ""}
                              </code>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={styles.testEmptyState}>
                    You must run your code first
                  </div>
                )}
              </div>
            </div>

            {evaluation ? (
              <div
                style={
                  evaluation.correct
                    ? styles.successPanel
                    : styles.failedPanel
                }
              >
                <div style={styles.evaluationTop}>
                  <div>
                    <div style={styles.evaluationVerdict}>
                      {evaluation.correct
                        ? "✓ Accepted"
                        : evaluation.runner_status && evaluation.runner_status !== "Accepted"
                        ? "✗ Execution Failed"
                        : "✗ Wrong Answer"}
                    </div>
                    <div style={styles.evaluationText}>
                      {evaluation.verdict || "AI evaluation completed."}
                    </div>
                  </div>

                  <div style={styles.score}>
                    {evaluation.score ?? 0}
                    <small>/100</small>
                  </div>
                </div>

                {evaluation.feedback ? (
                  <div style={styles.evaluationSection}>
                    <h4>💬 Feedback</h4>
                    <p>{evaluation.feedback}</p>
                  </div>
                ) : null}

                <div style={styles.complexityGrid}>
                  <div style={styles.metricCard}>
                    <span>Time Complexity</span>
                    <strong>
                      {evaluation.time_complexity || "N/A"}
                    </strong>
                  </div>

                  <div style={styles.metricCard}>
                    <span>Space Complexity</span>
                    <strong>
                      {evaluation.space_complexity || "N/A"}
                    </strong>
                  </div>

                  <div style={styles.metricCard}>
                    <span>Runtime</span>
                    <strong>
                      {evaluation.runtime ? `${evaluation.runtime}s` : "N/A"}
                    </strong>
                  </div>

                  <div style={styles.metricCard}>
                    <span>Memory</span>
                    <strong>
                      {evaluation.memory ? `${evaluation.memory} KB` : "N/A"}
                    </strong>
                  </div>
                </div>

                {evaluation.strengths?.length ? (
                  <div style={styles.evaluationSection}>
                    <h4>✅ Strengths</h4>
                    <ul style={styles.cleanList}>
                      {evaluation.strengths.map((item, index) => (
                        <li key={index}>{formatListItem(item)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {evaluation.weaknesses?.length ? (
                  <div style={styles.evaluationSection}>
                    <h4>⚠ Areas to Improve</h4>
                    <ul style={styles.cleanList}>
                      {evaluation.weaknesses.map((item, index) => (
                        <li key={index}>{formatListItem(item)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {evaluation.bugs?.length ? (
                  <div style={styles.evaluationSection}>
                    <h4>🐛 Possible Bugs</h4>
                    <ul style={styles.cleanList}>
                      {evaluation.bugs.map((item, index) => (
                        <li key={index}>{formatListItem(item)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {evaluation.suggestions?.length ? (
                  <div style={styles.evaluationSection}>
                    <h4>💡 Suggestions</h4>
                    <ul style={styles.cleanList}>
                      {evaluation.suggestions.map((item, index) => (
                        <li key={index}>{formatListItem(item)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <section style={styles.historyCard}>
          <div style={styles.historyHeader}>
            <div>
              <div style={styles.problemKicker}>PROGRESS</div>
              <h2 style={styles.cardTitle}>Coding History</h2>
              <p style={styles.cardText}>
                Click any entry to reopen the full problem and your previous
                submission.
              </p>
            </div>

            <div style={styles.historyCount}>
              {history.length} problems
            </div>
          </div>

          <div style={styles.historyBody}>
            {historyLoading ? (
              <div style={styles.historyEmpty}>Loading coding history...</div>
            ) : history.length === 0 ? (
              <div style={styles.historyEmpty}>
                No coding problems yet. Generate your first one above.
              </div>
            ) : (
              history.map((item, index) => (
                <button
                  key={item.problem_id || index}
                  onClick={() => loadHistoryItem(item)}
                  style={styles.historyItem}
                >
                  <div style={styles.historyLeft}>
                    <div style={styles.historyTitle}>
                      {item.problem?.title || "Coding Problem"}
                    </div>
                    <div style={styles.historyMeta}>
                      {item.problem?.topic || "DSA"} •{" "}
                      {item.problem?.difficulty || "Medium"} •{" "}
                      {item.problem?.language || "python"}
                    </div>
                  </div>

                  <div style={styles.historyRight}>
                    <span
                      style={{
                        ...styles.status,
                        ...(item.status === "accepted"
                          ? styles.statusAccepted
                          : {}),
                      }}
                    >
                      {item.status === "accepted"
                        ? "ACCEPTED"
                        : item.status === "evaluated"
                        ? "EVALUATED"
                        : "GENERATED"}
                    </span>
                    <span style={styles.openArrow}>→</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      {selectedHistory ? (
        <div style={styles.modalOverlay} onClick={closeHistory}>
          <div
            style={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.problemKicker}>CODING HISTORY</div>
                <h2 style={styles.modalTitle}>
                  {selectedHistory.problem?.title || "Coding Problem"}
                </h2>
              </div>

              <button onClick={closeHistory} style={styles.closeButton}>
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.modalMeta}>
                <span>{selectedHistory.problem?.topic}</span>
                <span>{selectedHistory.problem?.difficulty}</span>
                <span>{selectedHistory.problem?.language}</span>
              </div>

              <h3 style={styles.sectionHeading}>Problem</h3>
              <div style={styles.description}>
                {selectedHistory.problem?.description}
              </div>

              <h3 style={styles.sectionHeading}>Your Previous Code</h3>
              <pre style={styles.codePreview}>
                {selectedHistory.submission?.code || "No submission saved."}
              </pre>

              {selectedHistory.submission?.evaluation ? (
                <>
                  <h3 style={styles.sectionHeading}>Evaluation</h3>
                  <div style={styles.historyEvaluation}>
                    <strong>
                      Score:{" "}
                      {selectedHistory.submission.evaluation.score ?? 0}/100
                    </strong>
                    <p>
                      {selectedHistory.submission.evaluation.feedback ||
                        selectedHistory.submission.evaluation.verdict ||
                        "No feedback available."}
                    </p>
                  </div>
                </>
              ) : (
                <div style={styles.historyEvaluation}>
                  This problem has not been submitted yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "28px",
    background:
      "radial-gradient(circle at top left, rgba(126, 92, 255, 0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(0, 194, 255, 0.10), transparent 30%), #080a13",
    color: "#f7f8ff",
    fontFamily: "Inter, Arial, sans-serif",
  },
  shell: {
    maxWidth: "1480px",
    margin: "0 auto",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
  },
  eyebrow: {
    color: "#9d8cff",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.15em",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(34px, 4vw, 48px)",
  },
  subtitle: {
    margin: "12px 0 0",
    color: "#aab0c5",
    lineHeight: 1.6,
    maxWidth: "820px",
  },
  backButton: {
    background: "#111422",
    color: "#f1f2fb",
    border: "1px solid #2b3047",
    borderRadius: "12px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: 800,
  },
  generatorCard: {
    padding: "20px",
    background: "rgba(16, 19, 34, 0.9)",
    border: "1px solid #292e46",
    borderRadius: "18px",
    marginBottom: "16px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "21px",
  },
  cardText: {
    margin: "8px 0 0",
    color: "#9098b2",
    lineHeight: 1.55,
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr auto",
    gap: "12px",
    marginTop: "18px",
  },
  control: {
    minWidth: 0,
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 800,
    color: "#8e96b0",
    letterSpacing: "0.08em",
    marginBottom: "7px",
    textTransform: "uppercase",
  },
  select: {
    width: "100%",
    padding: "12px",
    background: "#0a0d18",
    color: "#f4f5fe",
    border: "1px solid #32384f",
    borderRadius: "10px",
    outline: "none",
  },
  generateButton: {
    alignSelf: "end",
    border: 0,
    borderRadius: "11px",
    padding: "12px 18px",
    color: "#fff",
    background: "linear-gradient(135deg, #7357ff, #a66aff)",
    cursor: "pointer",
    fontWeight: 900,
    minWidth: "160px",
  },
  message: {
    padding: "13px 16px",
    background: "#0d192c",
    border: "1px solid #27405e",
    borderRadius: "13px",
    color: "#b9d8ff",
    marginBottom: "14px",
  },
  error: {
    padding: "13px 16px",
    background: "#241016",
    border: "1px solid #62293a",
    borderRadius: "13px",
    color: "#ffb4c0",
    marginBottom: "14px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(360px, 1fr) minmax(420px, 1fr)",
    gap: "16px",
    alignItems: "start",
  },
  problemCard: {
    background: "rgba(15, 18, 31, 0.92)",
    border: "1px solid #292e46",
    borderRadius: "18px",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "18px 20px",
    borderBottom: "1px solid #262b42",
  },
  problemKicker: {
    fontSize: "10px",
    fontWeight: 900,
    color: "#9b8eff",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  problemTitle: {
    margin: "7px 0 0",
    fontSize: "28px",
    lineHeight: 1.15,
  },
  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "flex-end",
  },
  badge: {
    border: "1px solid #373d57",
    background: "#111528",
    color: "#bfc5da",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
    padding: "6px 9px",
    whiteSpace: "nowrap",
  },
  problemBody: {
    padding: "20px",
  },
  sectionHeading: {
    margin: "0 0 10px",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#e4e7f4",
  },
  description: {
    color: "#bec4d8",
    lineHeight: 1.72,
    whiteSpace: "pre-wrap",
  },
  sectionBlock: {
    marginTop: "22px",
  },
  exampleCard: {
    background: "#090c16",
    border: "1px solid #292f47",
    borderRadius: "12px",
    padding: "13px",
    marginTop: "10px",
  },
  exampleHeading: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#a7afca",
  },
  exampleText: {
    margin: "8px 0 0",
    color: "#c9cee0",
    whiteSpace: "pre-wrap",
    fontFamily: "Consolas, monospace",
    fontSize: "13px",
  },
  constraintList: {
    color: "#b8bfd3",
    lineHeight: 1.75,
    paddingLeft: "20px",
  },
  hintSummary: {
    cursor: "pointer",
    color: "#b8c5ff",
    fontWeight: 800,
  },
  hintBox: {
    marginTop: "10px",
    display: "grid",
    gap: "8px",
  },
  hintRow: {
    background: "#0b1020",
    border: "1px solid #2b3452",
    borderRadius: "11px",
    padding: "11px",
    display: "grid",
    gap: "5px",
    color: "#aab3cc",
  },
  emptyState: {
    minHeight: "560px",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    padding: "50px",
    textAlign: "center",
  },
  emptyIcon: {
    width: "76px",
    height: "76px",
    borderRadius: "20px",
    display: "grid",
    placeItems: "center",
    fontSize: "34px",
    marginBottom: "18px",
    background: "#111529",
    border: "1px solid #303752",
  },
  emptyTitle: {
    margin: 0,
    fontSize: "22px",
  },
  emptyText: {
    maxWidth: "560px",
    color: "#8f97b1",
    lineHeight: 1.65,
  },
  editorCard: {
    background: "rgba(11, 14, 24, 0.96)",
    border: "1px solid #292e46",
    borderRadius: "18px",
    overflow: "hidden",
  },
  editorHeader: {
    padding: "15px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #262b42",
  },
  editorTitle: {
    margin: "5px 0 0",
    fontSize: "19px",
  },
  languageChip: {
    border: "1px solid #343b59",
    background: "#111629",
    color: "#c5cbff",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: 900,
  },
  editor: {
    display: "block",
    width: "100%",
    minHeight: "535px",
    resize: "vertical",
    border: 0,
    outline: 0,
    padding: "20px",
    background: "#070912",
    color: "#e8eaf7",
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  editorFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "12px 14px",
    borderTop: "1px solid #262b42",
  },
  submitButton: {
    border: 0,
    borderRadius: "11px",
    padding: "11px 17px",
    background: "#f3f5ff",
    color: "#0c0e17",
    cursor: "pointer",
    fontWeight: 900,
  },
  successPanel: {
    margin: "14px",
    padding: "16px",
    borderRadius: "14px",
    background: "#0b2017",
    border: "1px solid #2c7655",
    color: "#d5f8e7",
  },
  failedPanel: {
    margin: "14px",
    padding: "16px",
    borderRadius: "14px",
    background: "#231117",
    border: "1px solid #743044",
    color: "#ffdce3",
  },
  evaluationTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },
  evaluationVerdict: {
    fontWeight: 900,
    fontSize: "17px",
  },
  evaluationText: {
    marginTop: "6px",
    color: "#b6bfd0",
    lineHeight: 1.5,
  },
  score: {
    minWidth: "74px",
    height: "74px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#11182a",
    border: "1px solid #3a4665",
    fontSize: "22px",
    fontWeight: 900,
  },
  scoreSmall: {},
  evaluationSection: {
    marginTop: "17px",
  },
  complexityGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "16px",
  },
  metricCard: {
    border: "1px solid #2c344d",
    borderRadius: "11px",
    background: "#0d1220",
    padding: "12px",
    display: "grid",
    gap: "6px",
  },
  cleanList: {
    margin: "8px 0 0",
    paddingLeft: "18px",
    color: "#bcc3d4",
    lineHeight: 1.65,
  },
  testSummary: {
    marginTop: "17px",
    padding: "13px",
    borderRadius: "12px",
    background: "#0c1220",
    border: "1px solid #2b3550",
  },
  testSummaryTitle: {
    display: "block",
    color: "#8f99b2",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "4px",
  },
  testBar: {
    marginTop: "10px",
    height: "6px",
    background: "#20283a",
    borderRadius: "999px",
    overflow: "hidden",
  },
  testBarFill: {
    height: "100%",
    background: "#56d364",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },
  testCasesBox: {
    marginTop: "14px",
    display: "grid",
    gap: "8px",
  },
  testCaseRow: {
    display: "flex",
    gap: "11px",
    padding: "11px",
    borderRadius: "11px",
    border: "1px solid",
  },
  testCasePassed: {
    background: "#0b1913",
    borderColor: "#245f43",
  },
  testCaseFailed: {
    background: "#1d1014",
    borderColor: "#612a39",
  },
  testCaseIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#111a27",
    fontWeight: 900,
    flex: "0 0 auto",
  },
  testCaseMain: {
    minWidth: 0,
    width: "100%",
  },
  testCaseHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "12px",
  },
  ioGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "9px",
  },
  ioGridItem: {},
  testError: {
    margin: "8px 0 0",
    padding: "8px",
    whiteSpace: "pre-wrap",
    overflowX: "auto",
    borderRadius: "8px",
    background: "#0a0b10",
    color: "#ffb4c0",
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "11px",
  },
  testPanel: {
    margin: "0",
    background: "#0a0d16",
    borderTop: "1px solid #252b40",
  },
  testTabs: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #252b40",
    background: "#0c101a",
  },
  testTab: {
    border: 0,
    borderBottom: "2px solid transparent",
    background: "transparent",
    color: "#7f8aa3",
    padding: "11px 15px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },
  testTabActive: {
    color: "#eef2ff",
    borderBottomColor: "#b8c1ff",
    background: "#101522",
  },
  testTabIcon: {
    fontFamily: "Consolas, monospace",
    color: "#a7b0c8",
  },
  testCountBadge: {
    marginLeft: "2px",
    padding: "2px 6px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 900,
  },
  testCountBadgePassed: {
    background: "#143a29",
    color: "#7ee2ae",
  },
  testCountBadgeFailed: {
    background: "#421c26",
    color: "#ff9aad",
  },
  testPanelBody: {
    minHeight: "175px",
    maxHeight: "300px",
    overflowY: "auto",
    padding: "12px",
    background: "#080b13",
  },
  testEmptyState: {
    minHeight: "150px",
    display: "grid",
    placeItems: "center",
    color: "#717b94",
    fontSize: "12px",
  },
  caseList: {
    display: "grid",
    gap: "8px",
  },
  visibleCase: {
    border: "1px solid #232a3d",
    borderRadius: "10px",
    background: "#0d111c",
    overflow: "hidden",
  },
  visibleCaseHeader: {
    padding: "8px 11px",
    borderBottom: "1px solid #20263a",
    color: "#aeb7ce",
    fontSize: "11px",
  },
  visibleCaseText: {
    margin: 0,
    padding: "10px 11px",
    whiteSpace: "pre-wrap",
    color: "#dfe4f4",
    fontFamily: "Consolas, monospace",
    fontSize: "11px",
    lineHeight: 1.5,
  },
  resultHeadline: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "6px 2px 11px",
    color: "#dce2f1",
  },
  resultHeadline: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "6px 2px 11px",
    color: "#dce2f1",
  },
  resultScore: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#9da7bf",
  },
  resultHeadlineLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  resultAccepted: {
    color: "#57e389",
  },
  resultWrong: {
    color: "#ffcc66",
  },
  resultFailed: {
    color: "#ff6f91",
  },
  resultCaseTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    marginBottom: "11px",
  },
  resultCaseTab: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid #293047",
    borderRadius: "8px",
    padding: "7px 10px",
    background: "#0d111c",
    color: "#aeb5c8",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 800,
  },
  resultCaseTabActive: {
    background: "#171d2c",
    color: "#f2f4fb",
    boxShadow: "0 0 0 1px #3b4664 inset",
  },
  resultCaseTabPassed: {
    borderColor: "#254f39",
  },
  resultCaseTabFailed: {
    borderColor: "#542633",
  },
  resultCaseIcon: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontSize: "9px",
    fontWeight: 900,
  },
  resultCaseIconPassed: {
    background: "#123b28",
    color: "#72e0ae",
  },
  resultCaseIconFailed: {
    background: "#421a25",
    color: "#ff9aad",
  },
  selectedResultCase: {
    border: "1px solid",
    borderRadius: "10px",
    overflow: "hidden",
  },
  selectedResultCasePassed: {
    background: "#0b1712",
    borderColor: "#214f3a",
  },
  selectedResultCaseFailed: {
    background: "#1a0e13",
    borderColor: "#512734",
  },
  selectedResultHeader: {
    padding: "10px 12px",
    borderBottom: "1px solid #253047",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  selectedResultLabel: {
    color: "#78829b",
    fontSize: "10px",
  },
  casePassedLabel: {
    marginLeft: "8px",
    color: "#63d99a",
    fontSize: "10px",
    fontWeight: 900,
  },
  caseFailedLabel: {
    marginLeft: "8px",
    color: "#ff7e99",
    fontSize: "10px",
    fontWeight: 900,
  },
  selectedResultIO: {
    display: "grid",
    gap: "9px",
    padding: "12px",
  },
  selectedResultIOCard: {
    display: "grid",
    gap: "6px",
  },
  selectedResultIOLabel: {
    color: "#818ba3",
    fontSize: "10px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  selectedResultIOCode: {
    display: "block",
    padding: "9px 10px",
    borderRadius: "7px",
    background: "#090c14",
    color: "#dce2f1",
    fontFamily: "Consolas, monospace",
    fontSize: "11px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  resultList: {
    display: "grid",
    gap: "7px",
  },
  resultRow: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    padding: "9px 10px",
    borderRadius: "9px",
    border: "1px solid",
  },
  resultRowPassed: {
    background: "#0b1712",
    borderColor: "#214f3a",
  },
  resultRowFailed: {
    background: "#1a0e13",
    borderColor: "#512734",
  },
  resultStatusIcon: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontSize: "12px",
    fontWeight: 900,
    flex: "0 0 auto",
  },
  resultStatusPassed: {
    background: "#123b28",
    color: "#72e0ae",
  },
  resultStatusFailed: {
    background: "#421a25",
    color: "#ff9aad",
  },
  resultRowMain: {
    minWidth: 0,
    width: "100%",
  },
  resultRowTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "11px",
    color: "#dfe4f1",
  },
  resultIO: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "8px",
  },
  resultError: {
    margin: "7px 0 0",
    padding: "7px",
    borderRadius: "7px",
    background: "#0a0b10",
    color: "#ffabb9",
    whiteSpace: "pre-wrap",
    fontFamily: "Consolas, monospace",
    fontSize: "10px",
  },
  historyCard: {
    marginTop: "16px",
    background: "rgba(15, 18, 31, 0.94)",
    border: "1px solid #292e46",
    borderRadius: "18px",
    overflow: "hidden",
  },
  historyHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #262b42",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
  },
  historyCount: {
    border: "1px solid #303750",
    borderRadius: "999px",
    padding: "8px 11px",
    fontSize: "11px",
    color: "#abb3ca",
    fontWeight: 900,
  },
  historyBody: {
    padding: "14px",
    display: "grid",
    gap: "8px",
  },
  historyEmpty: {
    color: "#8f97af",
    padding: "16px",
  },
  historyItem: {
    width: "100%",
    border: "1px solid #2a3049",
    borderRadius: "12px",
    background: "#0b0e18",
    color: "#f4f5fd",
    cursor: "pointer",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    textAlign: "left",
  },
  historyLeft: {
    minWidth: 0,
  },
  historyTitle: {
    fontWeight: 900,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  historyMeta: {
    marginTop: "5px",
    color: "#858da6",
    fontSize: "11px",
  },
  historyRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    whiteSpace: "nowrap",
  },
  status: {
    color: "#9ca5ba",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  statusAccepted: {
    color: "#72e0ae",
  },
  openArrow: {
    color: "#8e96ab",
    fontSize: "18px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 3, 9, 0.78)",
    display: "grid",
    placeItems: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modal: {
    width: "min(880px, 100%)",
    maxHeight: "90vh",
    overflow: "auto",
    background: "#0e1220",
    border: "1px solid #343b57",
    borderRadius: "18px",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
  },
  modalHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #2a3048",
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },
  modalTitle: {
    margin: "6px 0 0",
    fontSize: "25px",
  },
  closeButton: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #343b57",
    background: "#121629",
    color: "#fff",
    fontSize: "23px",
    cursor: "pointer",
  },
  modalContent: {
    padding: "20px",
  },
  modalMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "19px",
    color: "#9fa7bd",
    fontSize: "11px",
    fontWeight: 800,
  },
  codePreview: {
    margin: "10px 0 0",
    padding: "15px",
    borderRadius: "12px",
    background: "#070912",
    border: "1px solid #282e45",
    color: "#d8dcee",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontFamily: "Consolas, monospace",
    fontSize: "13px",
    lineHeight: 1.65,
  },
  historyEvaluation: {
    marginTop: "10px",
    padding: "13px",
    borderRadius: "12px",
    background: "#10162a",
    border: "1px solid #2c3653",
    color: "#b8c0d3",
    lineHeight: 1.55,
  },
};

export default CodingPractice;
