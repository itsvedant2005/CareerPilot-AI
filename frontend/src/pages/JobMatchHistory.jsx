import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const JMH_API = "http://127.0.0.1:8000";

function JobMatchHistory() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD HISTORY
  // =====================================================

  useEffect(() => {
    fetchJobHistory();
  }, []);

  const fetchJobHistory = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${JMH_API}/api/jobs/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setHistory(response.data?.history || []);
    } catch (err) {
      console.error(
        "Job Match History Error:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session could not be verified for Job Match History. Your login has not been cleared."
        );
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to load job match history."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getScore = (item) =>
    Number(
      item?.analysis?.match_score || 0
    );

  const getRole = (item) =>
    item?.analysis?.role ||
    "Software Engineer";

  const getMatchedSkills = (item) =>
    Array.isArray(
      item?.analysis?.matched_skills
    )
      ? item.analysis.matched_skills
      : [];

  const getMissingSkills = (item) =>
    Array.isArray(
      item?.analysis?.missing_skills
    )
      ? item.analysis.missing_skills
      : [];

  const getKeywords = (item) =>
    Array.isArray(
      item?.analysis?.important_keywords
    )
      ? item.analysis.important_keywords
      : [];

  const getExperienceRequirements = (item) =>
    Array.isArray(
      item?.analysis?.experience_requirements
    )
      ? item.analysis.experience_requirements
      : [];

  const getRecommendations = (item) =>
    Array.isArray(
      item?.analysis?.recommendations
    )
      ? item.analysis.recommendations
      : [];

  const getScoreClass = (score) => {
    const value = Number(score || 0);

    if (value >= 80) return "jmh-score-good";
    if (value >= 60) return "jmh-score-medium";
    return "jmh-score-low";
  };

  const getScoreText = (score) => {
    const value = Number(score || 0);

    if (value >= 80) return "Strong Match";
    if (value >= 60) return "Moderate Match";
    return "Needs Improvement";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Unknown date";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const previewText = (text) => {
    if (!text) {
      return "No job description available.";
    }

    const clean = text
      .replace(/\s+/g, " ")
      .trim();

    if (clean.length <= 120) {
      return clean;
    }

    return `${clean.slice(0, 120)}...`;
  };

  // =====================================================
  // STATS
  // =====================================================

  const statistics = useMemo(() => {
    if (!history.length) {
      return {
        total: 0,
        average: 0,
        highest: 0,
        latest: 0,
      };
    }

    const scores = history.map(
      (item) => getScore(item)
    );

    const total = scores.length;

    const average = Math.round(
      scores.reduce(
        (sum, score) => sum + score,
        0
      ) / total
    );

    return {
      total,
      average,
      highest: Math.max(...scores),
      latest: scores[0] || 0,
    };
  }, [history]);

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeDetails = () => {
    setSelectedMatch(null);
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="jmh-page">

      {/* =================================================
          TOP NAV
      ================================================= */}

      <header className="jmh-topbar">

        <div className="jmh-brand">

          <div className="jmh-brand-icon">
            CP
          </div>

          <div className="jmh-brand-copy">
            <h2>
              CareerPilot-AI
            </h2>

            <span>
              Job Match History
            </span>
          </div>

        </div>

        <div className="jmh-top-actions">

          <button
            className="jmh-secondary-btn"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

          <button
            className="jmh-primary-btn"
            onClick={() =>
              navigate("/job-matcher")
            }
          >
            + New Analysis
          </button>

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="jmh-content">

        {/* =================================================
            TOP INTRO
        ================================================= */}

        <section className="jmh-intro">

          <div className="jmh-intro-copy">

            <p className="jmh-eyebrow">
              CAREER ANALYTICS
            </p>

            <h1>
              Job Match
              <span> History</span>
            </h1>

            <p className="jmh-intro-text">
              Review the jobs you analyzed,
              compare your match scores, and
              reopen complete personalized
              recommendations.
            </p>

          </div>

          <div className="jmh-total-box">

            <strong>
              {statistics.total}
            </strong>

            <span>
              Saved Matches
            </span>

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="jmh-error">

            <div className="jmh-error-icon">
              ⚠
            </div>

            <div className="jmh-error-copy">

              <strong>
                Unable to load history
              </strong>

              <p>
                {error}
              </p>

            </div>

            <button
              className="jmh-retry"
              onClick={fetchJobHistory}
            >
              Retry
            </button>

          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        {!loading && !error && (
          <section className="jmh-stats">

            <div className="jmh-stat-card">

              <div className="jmh-stat-icon">
                📊
              </div>

              <div>
                <span>
                  Total Analyses
                </span>

                <strong>
                  {statistics.total}
                </strong>
              </div>

            </div>

            <div className="jmh-stat-card">

              <div className="jmh-stat-icon">
                🎯
              </div>

              <div>
                <span>
                  Average Match
                </span>

                <strong>
                  {statistics.average}%
                </strong>
              </div>

            </div>

            <div className="jmh-stat-card">

              <div className="jmh-stat-icon">
                ⭐
              </div>

              <div>
                <span>
                  Highest Match
                </span>

                <strong>
                  {statistics.highest}%
                </strong>
              </div>

            </div>

            <div className="jmh-stat-card">

              <div className="jmh-stat-icon">
                🔥
              </div>

              <div>
                <span>
                  Latest Match
                </span>

                <strong>
                  {statistics.latest}%
                </strong>
              </div>

            </div>

          </section>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="jmh-state">

            <div className="jmh-spinner"></div>

            <h3>
              Loading job matches...
            </h3>

            <p>
              Fetching your saved analyses.
            </p>

          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          history.length === 0 && (
            <div className="jmh-state">

              <div className="jmh-empty-icon">
                🗂️
              </div>

              <h3>
                No Job Matches Yet
              </h3>

              <p>
                Analyze a job description to
                create your first saved match.
              </p>

              <button
                className="jmh-primary-btn"
                onClick={() =>
                  navigate("/job-matcher")
                }
              >
                Analyze First Job
              </button>

            </div>
          )}

        {/* =================================================
            HISTORY LIST
        ================================================= */}

        {!loading &&
          !error &&
          history.length > 0 && (
            <section className="jmh-history">

              <div className="jmh-section-head">

                <div>

                  <p className="jmh-eyebrow">
                    PREVIOUS ANALYSES
                  </p>

                  <h2>
                    Your Saved Matches
                  </h2>

                  <p>
                    Click a match to view the
                    complete analysis.
                  </p>

                </div>

                <span className="jmh-count">
                  {history.length} results
                </span>

              </div>

              <div className="jmh-grid">

                {history.map(
                  (item, index) => {

                    const score =
                      getScore(item);

                    const matched =
                      getMatchedSkills(item);

                    const missing =
                      getMissingSkills(item);

                    return (
                      <button
                        key={
                          item.matched_at ||
                          index
                        }
                        className="jmh-match-card"
                        onClick={() =>
                          setSelectedMatch(
                            item
                          )
                        }
                      >

                        {/* CARD HEADER */}

                        <div className="jmh-card-header">

                          <div className="jmh-job-icon">
                            💼
                          </div>

                          <div
                            className={`jmh-card-score ${getScoreClass(
                              score
                            )}`}
                          >

                            <strong>
                              {score}%
                            </strong>

                            <span>
                              match
                            </span>

                          </div>

                        </div>

                        {/* CARD BODY */}

                        <div className="jmh-card-body">

                          <span className="jmh-date">
                            {formatDate(
                              item.matched_at
                            )}
                          </span>

                          <h3>
                            {getRole(item)}
                          </h3>

                          <span
                            className={`jmh-match-status ${getScoreClass(
                              score
                            )}`}
                          >
                            {getScoreText(score)}
                          </span>

                          <p>
                            {previewText(
                              item.job_description
                            )}
                          </p>

                        </div>

                        {/* COUNTS */}

                        <div className="jmh-card-stats">

                          <div>

                            <span className="jmh-green-dot">
                              ✓
                            </span>

                            <strong>
                              {matched.length}
                            </strong>

                            <small>
                              matched
                            </small>

                          </div>

                          <div>

                            <span className="jmh-yellow-dot">
                              +
                            </span>

                            <strong>
                              {missing.length}
                            </strong>

                            <small>
                              gaps
                            </small>

                          </div>

                        </div>

                        {/* CARD FOOTER */}

                        <div className="jmh-card-footer">

                          <span>
                            View complete analysis
                          </span>

                          <strong>
                            →
                          </strong>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>

            </section>
          )}

      </main>

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {selectedMatch && (
        <div
          className="jmh-modal-overlay"
          onClick={closeDetails}
        >

          <div
            className="jmh-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="jmh-modal-header">

              <div>

                <p className="jmh-eyebrow">
                  JOB MATCH REPORT
                </p>

                <h2>
                  {getRole(selectedMatch)}
                </h2>

                <div className="jmh-modal-tags">

                  <span>
                    {formatDate(
                      selectedMatch.matched_at
                    )}
                  </span>

                  <span>
                    Personalized Match
                  </span>

                </div>

              </div>

              <button
                className="jmh-close"
                onClick={closeDetails}
              >
                ✕
              </button>

            </div>

            {/* MODAL SCORE */}

            <div className="jmh-modal-overview">

              <div className="jmh-modal-score">

                <span>
                  Overall Match
                </span>

                <strong
                  className={getScoreClass(
                    getScore(
                      selectedMatch
                    )
                  )}
                >
                  {getScore(
                    selectedMatch
                  )}%
                </strong>

                <small>
                  {getScoreText(
                    getScore(
                      selectedMatch
                    )
                  )}
                </small>

              </div>

              <div className="jmh-modal-stat-grid">

                <div>

                  <strong>
                    {
                      getMatchedSkills(
                        selectedMatch
                      ).length
                    }
                  </strong>

                  <span>
                    Matched Skills
                  </span>

                </div>

                <div>

                  <strong>
                    {
                      getMissingSkills(
                        selectedMatch
                      ).length
                    }
                  </strong>

                  <span>
                    Skill Gaps
                  </span>

                </div>

                <div>

                  <strong>
                    {
                      getKeywords(
                        selectedMatch
                      ).length
                    }
                  </strong>

                  <span>
                    Keywords
                  </span>

                </div>

              </div>

            </div>

            {/* JOB DESCRIPTION */}

            <section className="jmh-modal-section">

              <div className="jmh-section-title">

                <span>
                  01
                </span>

                <div>

                  <h3>
                    Job Description
                  </h3>

                  <p>
                    Job description used for
                    the matching process.
                  </p>

                </div>

              </div>

              <div className="jmh-description-box">

                {selectedMatch.job_description ||
                  "No job description available."}

              </div>

            </section>

            {/* SUMMARY */}

            <section className="jmh-modal-section">

              <div className="jmh-section-title">

                <span>
                  02
                </span>

                <div>

                  <h3>
                    AI Summary
                  </h3>

                  <p>
                    Personalized explanation
                    of your match.
                  </p>

                </div>

              </div>

              <div className="jmh-summary-box">

                <p>
                  {selectedMatch.analysis
                    ?.summary ||
                    "No summary available."}
                </p>

              </div>

            </section>

            {/* SKILLS */}

            <section className="jmh-modal-section">

              <div className="jmh-skill-columns">

                {/* MATCHED */}

                <div className="jmh-skill-panel">

                  <div className="jmh-skill-title">

                    <div className="jmh-skill-icon jmh-skill-green">
                      ✓
                    </div>

                    <div>

                      <h3>
                        Matched Skills
                      </h3>

                      <span>
                        Skills supported by your resume
                      </span>

                    </div>

                  </div>

                  <div className="jmh-tags">

                    {getMatchedSkills(
                      selectedMatch
                    ).length > 0 ? (
                      getMatchedSkills(
                        selectedMatch
                      ).map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            key={index}
                            className="jmh-tag jmh-tag-green"
                          >
                            ✓ {skill}
                          </span>
                        )
                      )
                    ) : (
                      <span className="jmh-no-data">
                        No matched skills recorded.
                      </span>
                    )}

                  </div>

                </div>

                {/* MISSING */}

                <div className="jmh-skill-panel">

                  <div className="jmh-skill-title">

                    <div className="jmh-skill-icon jmh-skill-yellow">
                      +
                    </div>

                    <div>

                      <h3>
                        Missing Skills
                      </h3>

                      <span>
                        Important requirements not demonstrated
                      </span>

                    </div>

                  </div>

                  <div className="jmh-tags">

                    {getMissingSkills(
                      selectedMatch
                    ).length > 0 ? (
                      getMissingSkills(
                        selectedMatch
                      ).map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            key={index}
                            className="jmh-tag jmh-tag-yellow"
                          >
                            + {skill}
                          </span>
                        )
                      )
                    ) : (
                      <span className="jmh-no-data">
                        No major skill gaps recorded.
                      </span>
                    )}

                  </div>

                </div>

              </div>

            </section>

            {/* KEYWORDS */}

            <section className="jmh-modal-section">

              <div className="jmh-section-title">

                <span>
                  03
                </span>

                <div>

                  <h3>
                    Important Keywords
                  </h3>

                  <p>
                    Important technologies,
                    tools and concepts from
                    the job.
                  </p>

                </div>

              </div>

              <div className="jmh-tags">

                {getKeywords(
                  selectedMatch
                ).length > 0 ? (
                  getKeywords(
                    selectedMatch
                  ).map(
                    (
                      keyword,
                      index
                    ) => (
                      <span
                        className="jmh-tag jmh-tag-purple"
                        key={index}
                      >
                        {keyword}
                      </span>
                    )
                  )
                ) : (
                  <span className="jmh-no-data">
                    No keywords available.
                  </span>
                )}

              </div>

            </section>

            {/* EXPERIENCE */}

            <section className="jmh-modal-section">

              <div className="jmh-section-title">

                <span>
                  04
                </span>

                <div>

                  <h3>
                    Experience Requirements
                  </h3>

                  <p>
                    Important eligibility and
                    responsibility requirements.
                  </p>

                </div>

              </div>

              {getExperienceRequirements(
                selectedMatch
              ).length > 0 ? (
                <div className="jmh-requirements">

                  {getExperienceRequirements(
                    selectedMatch
                  ).map(
                    (
                      requirement,
                      index
                    ) => (
                      <div
                        className="jmh-requirement"
                        key={index}
                      >

                        <span>
                          {index + 1}
                        </span>

                        <p>
                          {requirement}
                        </p>

                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="jmh-no-data-box">
                  No experience requirements recorded.
                </div>
              )}

            </section>

            {/* RECOMMENDATIONS */}

            <section className="jmh-modal-section">

              <div className="jmh-section-title">

                <span>
                  05
                </span>

                <div>

                  <h3>
                    Recommendations
                  </h3>

                  <p>
                    Personalized actions to improve
                    your job match.
                  </p>

                </div>

              </div>

              {getRecommendations(
                selectedMatch
              ).length > 0 ? (
                <div className="jmh-recommendations">

                  {getRecommendations(
                    selectedMatch
                  ).map(
                    (
                      recommendation,
                      index
                    ) => (
                      <div
                        className="jmh-recommendation"
                        key={index}
                      >

                        <span>
                          {index + 1}
                        </span>

                        <p>
                          {recommendation}
                        </p>

                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="jmh-no-data-box">
                  No recommendations available.
                </div>
              )}

            </section>

            {/* MODAL FOOTER */}

            <div className="jmh-modal-footer">

              <button
                className="jmh-secondary-btn"
                onClick={closeDetails}
              >
                Close
              </button>

              <button
                className="jmh-primary-btn"
                onClick={() => {
                  closeDetails();
                  navigate("/job-matcher");
                }}
              >
                Analyze Another Job →
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          CSS
      =================================================== */}

      <style>{`

        /* =================================================
           RESET ONLY INSIDE THIS PAGE
        ================================================= */

        .jmh-page,
        .jmh-page *,
        .jmh-page *::before,
        .jmh-page *::after {
          box-sizing: border-box;
        }

        .jmh-page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          color: #f5f5ff;
          background:
            radial-gradient(
              circle at 18% 0%,
              rgba(124,58,237,.12),
              transparent 23%
            ),
            radial-gradient(
              circle at 82% 5%,
              rgba(79,70,229,.08),
              transparent 20%
            ),
            #070712;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .jmh-page button {
          font-family: inherit;
        }

        /* =================================================
           TOPBAR
        ================================================= */

        .jmh-topbar {
          width: 100%;
          height: 66px;
          padding: 0 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 20;
          border-bottom: 1px solid rgba(255,255,255,.07);
          background: rgba(7,7,18,.94);
          backdrop-filter: blur(16px);
        }

        .jmh-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .jmh-brand-icon {
          width: 37px;
          height: 37px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: #fff;
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #4f46e5
            );
          font-size: 10px;
          font-weight: 900;
          box-shadow:
            0 8px 24px rgba(124,58,237,.25);
        }

        .jmh-brand-copy h2 {
          margin: 0;
          font-size: 15px;
          line-height: 1;
        }

        .jmh-brand-copy span {
          display: block;
          margin-top: 3px;
          color: #707087;
          font-size: 9px;
        }

        .jmh-top-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        /* =================================================
           BUTTONS
        ================================================= */

        .jmh-primary-btn,
        .jmh-secondary-btn,
        .jmh-retry {
          border-radius: 9px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
          transition: .2s ease;
        }

        .jmh-primary-btn {
          padding: 10px 14px;
          color: #fff;
          border: none;
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #5b21b6
            );
        }

        .jmh-secondary-btn {
          padding: 9px 13px;
          color: #d2cee7;
          border: 1px solid rgba(124,58,237,.18);
          background: rgba(124,58,237,.07);
        }

        .jmh-retry {
          padding: 8px 11px;
          color: #fff;
          border: none;
          background: #7c3aed;
        }

        .jmh-primary-btn:hover,
        .jmh-secondary-btn:hover,
        .jmh-retry:hover {
          transform: translateY(-1px);
        }

        /* =================================================
           MAIN
        ================================================= */

        .jmh-content {
          width: min(
            1080px,
            calc(100% - 32px)
          );
          margin: 0 auto;
          padding: 24px 0 50px;
        }

        /* =================================================
           INTRO
        ================================================= */

        .jmh-intro {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin: 0 0 18px;
        }

        .jmh-intro-copy {
          min-width: 0;
        }

        .jmh-eyebrow {
          margin: 0;
          color: #a78bfa;
          font-size: 8px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: .15em;
        }

        .jmh-intro-copy h1 {
          margin: 6px 0 6px;
          color: #f5f5ff;
          font-size: 38px;
          line-height: 1;
          letter-spacing: -.045em;
        }

        .jmh-intro-copy h1 span {
          color: #a78bfa;
        }

        .jmh-intro-text {
          max-width: 650px;
          margin: 0;
          color: #77778d;
          font-size: 11px;
          line-height: 1.55;
        }

        .jmh-total-box {
          width: 130px;
          flex-shrink: 0;
          padding: 13px;
          text-align: center;
          border: 1px solid rgba(124,58,237,.14);
          border-radius: 12px;
          background: rgba(124,58,237,.07);
        }

        .jmh-total-box strong {
          display: block;
          color: #c4b5fd;
          font-size: 25px;
          line-height: 1;
        }

        .jmh-total-box span {
          display: block;
          margin-top: 4px;
          color: #707087;
          font-size: 8px;
        }

        /* =================================================
           ERROR
        ================================================= */

        .jmh-error {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          margin-bottom: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(239,68,68,.13);
          border-radius: 10px;
          background: rgba(239,68,68,.06);
        }

        .jmh-error-icon {
          font-size: 15px;
        }

        .jmh-error-copy {
          min-width: 0;
        }

        .jmh-error-copy strong {
          display: block;
          color: #fca5a5;
          font-size: 9px;
        }

        .jmh-error-copy p {
          margin: 2px 0 0;
          color: #9c7777;
          font-size: 8px;
        }

        .jmh-error .jmh-retry {
          margin-left: auto;
          flex-shrink: 0;
        }

        /* =================================================
           STATS
        ================================================= */

        .jmh-stats {
          width: 100%;
          display: grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          gap: 8px;
          margin-bottom: 24px;
        }

        .jmh-stat-card {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 11px;
          background: rgba(255,255,255,.025);
        }

        .jmh-stat-icon {
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(124,58,237,.08);
          font-size: 13px;
        }

        .jmh-stat-card span {
          display: block;
          color: #6d6d82;
          font-size: 8px;
        }

        .jmh-stat-card strong {
          display: block;
          margin-top: 3px;
          color: #e0ddea;
          font-size: 19px;
        }

        /* =================================================
           STATE
        ================================================= */

        .jmh-state {
          min-height: 260px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 15px;
          background: rgba(255,255,255,.02);
        }

        .jmh-state h3 {
          margin: 10px 0 5px;
          font-size: 17px;
        }

        .jmh-state p {
          margin: 0 0 14px;
          color: #707087;
          font-size: 10px;
        }

        .jmh-empty-icon {
          font-size: 31px;
        }

        .jmh-spinner {
          width: 30px;
          height: 30px;
          border: 2px solid rgba(255,255,255,.08);
          border-top-color: #a78bfa;
          border-radius: 50%;
          animation: jmh-spin .7s linear infinite;
        }

        @keyframes jmh-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =================================================
           HISTORY HEADER
        ================================================= */

        .jmh-history {
          width: 100%;
        }

        .jmh-section-head {
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 10px;
        }

        .jmh-section-head h2 {
          margin: 5px 0 3px;
          color: #efedf7;
          font-size: 19px;
          letter-spacing: -.02em;
        }

        .jmh-section-head > div > p:last-child {
          margin: 0;
          color: #6d6d82;
          font-size: 9px;
        }

        .jmh-count {
          color: #727289;
          font-size: 9px;
        }

        /* =================================================
           MATCH GRID
        ================================================= */

        .jmh-grid {
          width: 100%;
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 9px;
        }

        .jmh-match-card {
          width: 100%;
          min-width: 0;
          padding: 14px;
          text-align: left;
          color: #f5f5ff;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 14px;
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.035),
              rgba(255,255,255,.02)
            );
          cursor: pointer;
          transition: .2s ease;
          appearance: none;
        }

        .jmh-match-card:hover {
          transform: translateY(-2px);
          border-color: rgba(124,58,237,.25);
          background:
            linear-gradient(
              145deg,
              rgba(124,58,237,.07),
              rgba(255,255,255,.025)
            );
        }

        .jmh-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .jmh-job-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(124,58,237,.09);
          font-size: 15px;
        }

        .jmh-card-score {
          min-width: 57px;
          padding: 7px 8px;
          text-align: center;
          border-radius: 9px;
        }

        .jmh-card-score strong {
          display: block;
          font-size: 17px;
          line-height: 1;
        }

        .jmh-card-score span {
          display: block;
          margin-top: 3px;
          font-size: 7px;
          opacity: .75;
        }

        .jmh-score-good {
          color: #86efac !important;
          background: rgba(34,197,94,.08);
        }

        .jmh-score-medium {
          color: #fcd34d !important;
          background: rgba(234,179,8,.08);
        }

        .jmh-score-low {
          color: #fca5a5 !important;
          background: rgba(239,68,68,.08);
        }

        .jmh-card-body {
          margin-top: 9px;
        }

        .jmh-date {
          display: block;
          color: #64647a;
          font-size: 8px;
        }

        .jmh-card-body h3 {
          margin: 4px 0 4px;
          color: #eeeef8;
          font-size: 14px;
          line-height: 1.3;
        }

        .jmh-match-status {
          display: inline-block;
          margin-bottom: 6px;
          font-size: 8px;
          font-weight: 800;
        }

        .jmh-card-body p {
          min-height: 31px;
          margin: 0;
          color: #7e7e92;
          font-size: 9px;
          line-height: 1.55;
        }

        .jmh-card-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          margin-top: 10px;
        }

        .jmh-card-stats > div {
          display: grid;
          grid-template-columns: 15px auto;
          column-gap: 5px;
          padding: 7px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,.025);
        }

        .jmh-card-stats span {
          grid-row: span 2;
          width: 15px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 8px;
        }

        .jmh-green-dot {
          color: #86efac;
          background: rgba(34,197,94,.08);
        }

        .jmh-yellow-dot {
          color: #fcd34d;
          background: rgba(234,179,8,.08);
        }

        .jmh-card-stats strong {
          color: #d3cedf;
          font-size: 11px;
        }

        .jmh-card-stats small {
          color: #66667a;
          font-size: 7px;
        }

        .jmh-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 9px;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,.05);
        }

        .jmh-card-footer span {
          color: #74748a;
          font-size: 8px;
        }

        .jmh-card-footer strong {
          color: #a78bfa;
          font-size: 12px;
        }

        /* =================================================
           MODAL
        ================================================= */

        .jmh-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: rgba(0,0,0,.78);
          backdrop-filter: blur(8px);
        }

        .jmh-modal {
          width: min(
            900px,
            100%
          );
          max-height: 91vh;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 17px;
          background: #0c0c18;
          box-shadow:
            0 30px 100px rgba(0,0,0,.55);
        }

        .jmh-modal-header {
          position: sticky;
          top: 0;
          z-index: 5;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 17px;
          background: rgba(12,12,24,.97);
          border-bottom: 1px solid rgba(255,255,255,.06);
          backdrop-filter: blur(13px);
        }

        .jmh-modal-header h2 {
          margin: 5px 0 7px;
          color: #f0eef8;
          font-size: 21px;
        }

        .jmh-modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .jmh-modal-tags span {
          padding: 5px 7px;
          color: #898399;
          background: rgba(255,255,255,.045);
          border-radius: 6px;
          font-size: 7px;
        }

        .jmh-close {
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          color: #aaa5b8;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 8px;
          cursor: pointer;
        }

        .jmh-close:hover {
          color: #fca5a5;
        }

        .jmh-modal-overview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin: 13px;
          padding: 13px;
          border: 1px solid rgba(124,58,237,.09);
          border-radius: 10px;
          background: rgba(124,58,237,.055);
        }

        .jmh-modal-score span {
          display: block;
          color: #717187;
          font-size: 8px;
        }

        .jmh-modal-score strong {
          display: block;
          margin-top: 3px;
          font-size: 29px;
        }

        .jmh-modal-score small {
          display: block;
          margin-top: 2px;
          color: #75758a;
          font-size: 8px;
        }

        .jmh-modal-stat-grid {
          display: flex;
          gap: 7px;
        }

        .jmh-modal-stat-grid > div {
          min-width: 76px;
          padding: 8px;
          text-align: center;
          border-radius: 8px;
          background: rgba(255,255,255,.04);
        }

        .jmh-modal-stat-grid strong {
          display: block;
          color: #d7d2e4;
          font-size: 16px;
        }

        .jmh-modal-stat-grid span {
          display: block;
          margin-top: 3px;
          color: #6d6d82;
          font-size: 7px;
        }

        /* =================================================
           MODAL SECTIONS
        ================================================= */

        .jmh-modal-section {
          padding: 0 13px 15px;
        }

        .jmh-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 7px 4px 9px;
        }

        .jmh-section-title > span {
          width: 21px;
          height: 21px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          color: #a78bfa;
          background: rgba(124,58,237,.09);
          font-size: 7px;
          font-weight: 900;
        }

        .jmh-section-title h3 {
          margin: 0;
          font-size: 12px;
        }

        .jmh-section-title p {
          margin: 2px 0 0;
          color: #67677b;
          font-size: 7px;
        }

        .jmh-description-box,
        .jmh-summary-box {
          padding: 12px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 9px;
          background: rgba(255,255,255,.025);
        }

        .jmh-description-box {
          max-height: 230px;
          overflow-y: auto;
          color: #8f8fa2;
          white-space: pre-wrap;
          font-size: 9px;
          line-height: 1.65;
        }

        .jmh-summary-box p {
          margin: 0;
          color: #8f8fa2;
          font-size: 9px;
          line-height: 1.65;
        }

        /* =================================================
           SKILLS
        ================================================= */

        .jmh-skill-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .jmh-skill-panel {
          padding: 12px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 10px;
          background: rgba(255,255,255,.025);
        }

        .jmh-skill-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
        }

        .jmh-skill-icon {
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 900;
        }

        .jmh-skill-green {
          color: #86efac;
          background: rgba(34,197,94,.08);
        }

        .jmh-skill-yellow {
          color: #fcd34d;
          background: rgba(234,179,8,.08);
        }

        .jmh-skill-title h3 {
          margin: 0;
          font-size: 10px;
        }

        .jmh-skill-title span {
          display: block;
          margin-top: 2px;
          color: #66667a;
          font-size: 7px;
        }

        .jmh-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .jmh-tag {
          padding: 5px 7px;
          border-radius: 6px;
          font-size: 7px;
        }

        .jmh-tag-green {
          color: #86efac;
          background: rgba(34,197,94,.07);
          border: 1px solid rgba(34,197,94,.08);
        }

        .jmh-tag-yellow {
          color: #fcd34d;
          background: rgba(234,179,8,.07);
          border: 1px solid rgba(234,179,8,.08);
        }

        .jmh-tag-purple {
          color: #c4b5fd;
          background: rgba(124,58,237,.07);
          border: 1px solid rgba(124,58,237,.08);
        }

        .jmh-no-data {
          color: #66667a;
          font-size: 8px;
        }

        /* =================================================
           REQUIREMENTS
        ================================================= */

        .jmh-requirements {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .jmh-requirement {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,.025);
        }

        .jmh-requirement > span {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          color: #a78bfa;
          background: rgba(124,58,237,.08);
          font-size: 7px;
          font-weight: 800;
        }

        .jmh-requirement p {
          margin: 2px 0 0;
          color: #89899c;
          font-size: 8px;
          line-height: 1.5;
        }

        .jmh-no-data-box {
          padding: 17px;
          text-align: center;
          color: #69697d;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 9px;
          background: rgba(255,255,255,.02);
          font-size: 8px;
        }

        /* =================================================
           RECOMMENDATIONS
        ================================================= */

        .jmh-recommendations {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .jmh-recommendation {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 9px;
          border: 1px solid rgba(124,58,237,.06);
          border-radius: 8px;
          background: rgba(124,58,237,.035);
        }

        .jmh-recommendation > span {
          width: 19px;
          height: 19px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #c4b5fd;
          background: rgba(124,58,237,.1);
          font-size: 7px;
          font-weight: 900;
        }

        .jmh-recommendation p {
          margin: 2px 0 0;
          color: #88889c;
          font-size: 8px;
          line-height: 1.55;
        }

        /* =================================================
           MODAL FOOTER
        ================================================= */

        .jmh-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
          padding: 11px 13px 14px;
          border-top: 1px solid rgba(255,255,255,.05);
        }

        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 850px) {

          .jmh-stats {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }

          .jmh-grid {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }

        }

        @media (max-width: 650px) {

          .jmh-topbar {
            height: 62px;
            padding: 0 13px;
          }

          .jmh-brand-copy span {
            display: none;
          }

          .jmh-top-actions .jmh-secondary-btn {
            display: none;
          }

          .jmh-content {
            width: calc(100% - 22px);
            padding-top: 20px;
          }

          .jmh-intro {
            align-items: flex-start;
            flex-direction: column;
          }

          .jmh-total-box {
            width: 100%;
          }

          .jmh-stats {
            grid-template-columns: 1fr 1fr;
          }

          .jmh-grid {
            grid-template-columns: 1fr;
          }

          .jmh-skill-columns {
            grid-template-columns: 1fr;
          }

          .jmh-modal-overview {
            align-items: flex-start;
            flex-direction: column;
          }

          .jmh-modal-stat-grid {
            width: 100%;
          }

          .jmh-modal-stat-grid > div {
            flex: 1;
            min-width: 0;
          }

          .jmh-modal-footer {
            flex-direction: column;
          }

          .jmh-modal-footer button {
            width: 100%;
          }

        }

        @media (max-width: 430px) {

          .jmh-stats {
            grid-template-columns: 1fr;
          }

          .jmh-intro-copy h1 {
            font-size: 32px;
          }

          .jmh-top-actions .jmh-primary-btn {
            padding: 9px 10px;
            font-size: 9px;
          }

        }

      `}</style>

    </div>
  );
}

export default JobMatchHistory;