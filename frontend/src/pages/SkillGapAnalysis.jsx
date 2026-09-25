import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SkillGapAnalysis() {
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadLatestAnalysis();
  }, []);

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  const loadLatestAnalysis = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(
        "https://careerpilot-ai-pcqc.onrender.com/api/skills/latest",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.exists) {
        setAnalysis(response.data.analysis);
      }
    } catch (err) {
      console.error("Skill Gap Load Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Failed to load skill gap analysis."
      );
    } finally {
      setPageLoading(false);
    }
  };

  const analyzeSkillGap = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        "https://careerpilot-ai-pcqc.onrender.com/api/skills/analyze",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnalysis(response.data.analysis);
      setMessage(
        "Your personalized skill gap analysis has been updated."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Skill Gap Analysis Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Failed to generate skill gap analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    const value = String(priority || "").toLowerCase();

    if (value === "high") return "priority-high";
    if (value === "medium") return "priority-medium";
    return "priority-low";
  };

  const getLevelClass = (level) => {
    const value = String(level || "").toLowerCase();

    if (value === "strong") return "level-strong";
    if (value === "intermediate") return "level-intermediate";
    return "level-beginner";
  };

  if (pageLoading) {
    return (
      <div className="loading-page">
        <div className="loading-box">
          <div className="spinner"></div>
          <h3>Loading Skill Gap Analysis...</h3>
          <p>
            Preparing your personalized career insights.
          </p>
        </div>

        <style>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #070712;
            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
            color: #f5f5ff;
          }

          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(
                circle at 20% 10%,
                rgba(124, 58, 237, 0.18),
                transparent 30%
              ),
              #070712;
          }

          .loading-box {
            text-align: center;
          }

          .spinner {
            width: 42px;
            height: 42px;
            margin: 0 auto 20px;
            border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #a78bfa;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .loading-box h3 {
            margin: 0 0 8px;
          }

          .loading-box p {
            margin: 0;
            color: #85859b;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="skill-page">

      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">CP</div>

          <div>
            <h2>CareerPilot-AI</h2>
            <span>Skill Gap Analysis</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          <button
            className="primary-btn small"
            onClick={analyzeSkillGap}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "↻ Re-analyze"}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="container">

        {/* HERO */}
        <section className="hero-section">
          <div>
            <p className="eyebrow">PERSONALIZED CAREER DEVELOPMENT</p>

            <h1>
              Close Your
              <span> Skill Gaps.</span>
            </h1>

            <p className="hero-description">
              Discover what you already know, identify the
              skills you need next, and follow a personalized
              roadmap to become more job-ready.
            </p>
          </div>

          <button
            className="primary-btn large"
            onClick={analyzeSkillGap}
            disabled={loading}
          >
            {loading
              ? "Generating Roadmap..."
              : analysis
              ? "Generate Fresh Analysis"
              : "Analyze My Skills"}
          </button>
        </section>

        {/* MESSAGES */}
        {message && (
          <div className="success-message">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠ {error}
          </div>
        )}

        {/* NO ANALYSIS */}
        {!analysis && !error && (
          <section className="empty-card">
            <div className="empty-icon">🎯</div>

            <h2>Ready to Find Your Skill Gaps?</h2>

            <p>
              We'll analyze your stored resume, current
              skills, target role, and latest job match to
              create a personalized learning plan.
            </p>

            <button
              className="primary-btn large"
              onClick={analyzeSkillGap}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "Start Skill Gap Analysis"}
            </button>
          </section>
        )}

        {analysis && (
          <>
            {/* TARGET ROLE */}
            <section className="role-card">
              <div className="role-icon">🚀</div>

              <div>
                <p>YOUR TARGET ROLE</p>
                <h2>
                  {analysis.target_role ||
                    "Software Engineer"}
                </h2>
              </div>

              <div className="role-status">
                Personalized
              </div>
            </section>

            {/* SUMMARY */}
            <section className="summary-card">
              <div className="section-title">
                <div className="section-icon">💡</div>

                <div>
                  <h2>Career Snapshot</h2>
                  <p>
                    AI-generated overview of your current
                    profile and development needs.
                  </p>
                </div>
              </div>

              <div className="summary-content">
                {analysis.overall_summary ||
                  "Your personalized skill analysis is ready."}
              </div>
            </section>

            {/* CURRENT SKILLS */}
            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="section-label">
                    WHAT YOU ALREADY HAVE
                  </p>

                  <h2>Current Skills</h2>

                  <p>
                    Skills identified from your resume.
                  </p>
                </div>

                <div className="count-badge">
                  {Array.isArray(
                    analysis.current_skills
                  )
                    ? analysis.current_skills.length
                    : 0}{" "}
                  skills
                </div>
              </div>

              {Array.isArray(analysis.current_skills) &&
              analysis.current_skills.length > 0 ? (
                <div className="skills-grid">
                  {analysis.current_skills.map(
                    (item, index) => (
                      <div
                        className="skill-card"
                        key={index}
                      >
                        <div className="skill-name">
                          <span className="check">
                            ✓
                          </span>

                          <strong>
                            {item.skill ||
                              "Skill"}
                          </strong>
                        </div>

                        <span
                          className={`level-badge ${getLevelClass(
                            item.level
                          )}`}
                        >
                          {item.level ||
                            "Beginner"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="not-found">
                  No current skills were identified.
                </div>
              )}
            </section>

            {/* SKILL GAPS */}
            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="section-label">
                    WHAT TO LEARN NEXT
                  </p>

                  <h2>Skill Gaps</h2>

                  <p>
                    Prioritized skills based on your
                    target role and job requirements.
                  </p>
                </div>

                <div className="gap-summary">
                  {Array.isArray(
                    analysis.skill_gaps
                  )
                    ? analysis.skill_gaps.length
                    : 0}{" "}
                  gaps
                </div>
              </div>

              {Array.isArray(analysis.skill_gaps) &&
              analysis.skill_gaps.length > 0 ? (
                <div className="gap-list">
                  {analysis.skill_gaps.map(
                    (gap, index) => (
                      <article
                        className="gap-card"
                        key={index}
                      >
                        <div className="gap-top">
                          <div className="gap-number">
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </div>

                          <div className="gap-title">
                            <h3>
                              {gap.skill ||
                                "Skill Gap"}
                            </h3>

                            <span
                              className={`priority ${getPriorityClass(
                                gap.priority
                              )}`}
                            >
                              {gap.priority ||
                                "Medium"}{" "}
                              Priority
                            </span>
                          </div>
                        </div>

                        <div className="gap-detail">
                          <div>
                            <h4>Why it matters</h4>
                            <p>
                              {gap.reason ||
                                "This skill can strengthen your profile for your target role."}
                            </p>
                          </div>

                          <div>
                            <h4>Recommended action</h4>
                            <p>
                              {gap.suggested_action ||
                                "Practice this skill through a hands-on project."}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="not-found">
                  No major skill gaps were identified.
                </div>
              )}
            </section>

            {/* ROADMAP */}
            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="section-label">
                    YOUR LEARNING PLAN
                  </p>

                  <h2>Personalized Roadmap</h2>

                  <p>
                    A practical week-by-week plan based
                    on your skill gaps.
                  </p>
                </div>
              </div>

              {Array.isArray(analysis.roadmap) &&
              analysis.roadmap.length > 0 ? (
                <div className="roadmap">
                  {analysis.roadmap.map(
                    (week, index) => (
                      <article
                        className="roadmap-card"
                        key={index}
                      >
                        <div className="week-marker">
                          <span>W</span>
                          <strong>
                            {week.week ||
                              index + 1}
                          </strong>
                        </div>

                        <div className="roadmap-content">
                          <div className="roadmap-header">
                            <div>
                              <p>
                                WEEK{" "}
                                {week.week ||
                                  index + 1}
                              </p>

                              <h3>
                                {week.focus ||
                                  "Learning Focus"}
                              </h3>
                            </div>
                          </div>

                          <div className="roadmap-columns">

                            <div>
                              <h4>Topics</h4>

                              <div className="topic-list">
                                {Array.isArray(
                                  week.topics
                                ) &&
                                week.topics.length >
                                  0 ? (
                                  week.topics.map(
                                    (
                                      topic,
                                      topicIndex
                                    ) => (
                                      <span
                                        key={
                                          topicIndex
                                        }
                                      >
                                        {topic}
                                      </span>
                                    )
                                  )
                                ) : (
                                  <span>
                                    No topics listed
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4>Tasks</h4>

                              {Array.isArray(
                                week.tasks
                              ) &&
                              week.tasks.length >
                                0 ? (
                                <ul className="task-list">
                                  {week.tasks.map(
                                    (
                                      task,
                                      taskIndex
                                    ) => (
                                      <li
                                        key={
                                          taskIndex
                                        }
                                      >
                                        <span>
                                          ✓
                                        </span>

                                        {task}
                                      </li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                <p className="muted">
                                  No tasks listed.
                                </p>
                              )}
                            </div>

                          </div>

                          <div className="outcome">
                            <strong>
                              Expected Outcome
                            </strong>

                            <p>
                              {week.outcome ||
                                "Build practical understanding of this week's focus."}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="not-found">
                  No roadmap available yet.
                </div>
              )}
            </section>

            {/* PROJECTS */}
            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="section-label">
                    BUILD TO LEARN
                  </p>

                  <h2>Recommended Projects</h2>

                  <p>
                    Practical projects to turn your new
                    skills into portfolio evidence.
                  </p>
                </div>
              </div>

              {Array.isArray(analysis.projects) &&
              analysis.projects.length > 0 ? (
                <div className="projects-grid">
                  {analysis.projects.map(
                    (project, index) => (
                      <article
                        className="project-card"
                        key={index}
                      >
                        <div className="project-number">
                          PROJECT{" "}
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </div>

                        <h3>
                          {project.title ||
                            "Recommended Project"}
                        </h3>

                        <p>
                          {project.description ||
                            "Build a practical project related to your target role."}
                        </p>

                        <div className="project-skills">
                          {Array.isArray(
                            project.skills
                          ) &&
                            project.skills.map(
                              (
                                skill,
                                skillIndex
                              ) => (
                                <span
                                  key={
                                    skillIndex
                                  }
                                >
                                  {skill}
                                </span>
                              )
                            )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="not-found">
                  No project recommendations available.
                </div>
              )}
            </section>

            {/* INTERVIEW TOPICS */}
            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="section-label">
                    INTERVIEW PREPARATION
                  </p>

                  <h2>Interview Topics</h2>

                  <p>
                    Topics you should prepare for your
                    target role.
                  </p>
                </div>
              </div>

              {Array.isArray(
                analysis.interview_topics
              ) &&
              analysis.interview_topics.length >
                0 ? (
                <div className="interview-grid">
                  {analysis.interview_topics.map(
                    (topic, index) => (
                      <div
                        className="interview-topic"
                        key={index}
                      >
                        <span>{index + 1}</span>
                        <strong>{topic}</strong>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="not-found">
                  No interview topics available.
                </div>
              )}
            </section>

            {/* BOTTOM CTA */}
            <section className="bottom-cta">
              <div>
                <p className="section-label">
                  READY FOR THE NEXT STEP?
                </p>

                <h2>
                  Turn your skill gaps into progress.
                </h2>

                <p>
                  Practice the skills from your roadmap
                  and keep checking your job matches as
                  your profile improves.
                </p>
              </div>

              <div className="cta-actions">
                <button
                  className="secondary-btn"
                  onClick={() =>
                    navigate("/job-matcher")
                  }
                >
                  Job Matcher
                </button>

                <button
                  className="primary-btn"
                  onClick={() =>
                    navigate("/resume-analyzer")
                  }
                >
                  Improve Resume
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          background: #070712;
          color: #f5f5ff;
        }

        button {
          font-family: inherit;
        }

        .skill-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 10% 5%,
              rgba(124, 58, 237, 0.17),
              transparent 26%
            ),
            radial-gradient(
              circle at 90% 15%,
              rgba(79, 70, 229, 0.13),
              transparent 27%
            ),
            #070712;
        }

        .topbar {
          height: 76px;
          padding: 0 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 20;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(8,8,20,0.83);
          backdrop-filter: blur(16px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #4f46e5
            );
          box-shadow:
            0 10px 30px rgba(124,58,237,0.28);
        }

        .brand h2 {
          margin: 0;
          font-size: 17px;
        }

        .brand span {
          display: block;
          margin-top: 2px;
          color: #85859c;
          font-size: 12px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .primary-btn,
        .secondary-btn {
          border: none;
          cursor: pointer;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .primary-btn {
          padding: 12px 18px;
          color: white;
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #5b21b6
            );
          box-shadow:
            0 10px 28px rgba(124,58,237,0.18);
        }

        .primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 14px 32px rgba(124,58,237,0.27);
        }

        .primary-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .primary-btn.small {
          padding: 10px 14px;
        }

        .primary-btn.large {
          padding: 14px 20px;
          font-size: 14px;
        }

        .secondary-btn {
          padding: 11px 15px;
          color: #d8d2f5;
          background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.2);
        }

        .secondary-btn:hover {
          background: rgba(124,58,237,0.18);
        }

        .container {
          width: min(1120px, calc(100% - 36px));
          margin: 0 auto;
          padding: 52px 0 70px;
        }

        .hero-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
          margin-bottom: 30px;
        }

        .eyebrow,
        .section-label {
          margin: 0;
          color: #a78bfa;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.15em;
        }

        .hero-section h1 {
          margin: 11px 0 0;
          font-size: clamp(38px, 5vw, 58px);
          line-height: 1.02;
          letter-spacing: -0.045em;
        }

        .hero-section h1 span {
          color: #a78bfa;
        }

        .hero-description {
          max-width: 690px;
          margin: 17px 0 0;
          color: #9b9bad;
          line-height: 1.7;
          font-size: 15px;
        }

        .success-message,
        .error-message {
          padding: 13px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 13px;
        }

        .success-message {
          color: #86efac;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.14);
        }

        .error-message {
          color: #fca5a5;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.14);
        }

        .empty-card {
          min-height: 400px;
          padding: 45px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
        }

        .empty-icon {
          width: 75px;
          height: 75px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          font-size: 34px;
          background: rgba(124,58,237,0.13);
          margin-bottom: 18px;
        }

        .empty-card h2 {
          margin: 0 0 10px;
          font-size: 25px;
        }

        .empty-card p {
          max-width: 590px;
          margin: 0 0 24px;
          color: #87879b;
          line-height: 1.7;
        }

        .role-card {
          display: flex;
          align-items: center;
          gap: 17px;
          padding: 21px;
          border-radius: 18px;
          border: 1px solid rgba(124,58,237,0.16);
          background:
            linear-gradient(
              135deg,
              rgba(124,58,237,0.1),
              rgba(255,255,255,0.035)
            );
          margin-bottom: 18px;
        }

        .role-icon {
          width: 51px;
          height: 51px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 15px;
          background: rgba(124,58,237,0.16);
          font-size: 23px;
        }

        .role-card p {
          margin: 0 0 4px;
          color: #8f8fa5;
          font-size: 10px;
          letter-spacing: 0.13em;
          font-weight: 800;
        }

        .role-card h2 {
          margin: 0;
          font-size: 20px;
        }

        .role-status {
          margin-left: auto;
          padding: 7px 11px;
          border-radius: 999px;
          color: #c4b5fd;
          font-size: 10px;
          font-weight: 800;
          background: rgba(124,58,237,0.12);
        }

        .summary-card {
          padding: 23px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
          margin-bottom: 35px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .section-icon {
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 12px;
          background: rgba(124,58,237,0.12);
        }

        .section-title h2 {
          margin: 0;
          font-size: 18px;
        }

        .section-title p {
          margin: 3px 0 0;
          color: #77778d;
          font-size: 12px;
        }

        .summary-content {
          margin-top: 17px;
          padding: 17px;
          border-radius: 13px;
          background: rgba(0,0,0,0.16);
          color: #adadc0;
          line-height: 1.7;
          font-size: 14px;
        }

        .content-section {
          margin-top: 42px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 18px;
        }

        .section-heading h2 {
          margin: 7px 0 5px;
          font-size: 27px;
          letter-spacing: -0.025em;
        }

        .section-heading p:not(.section-label) {
          margin: 0;
          color: #77778d;
          font-size: 13px;
        }

        .count-badge,
        .gap-summary {
          padding: 8px 12px;
          border-radius: 9px;
          color: #bbb0e9;
          background: rgba(124,58,237,0.1);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .skills-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .skill-card {
          padding: 17px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-radius: 15px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
        }

        .skill-name {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .skill-name strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
        }

        .check {
          width: 23px;
          height: 23px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(34,197,94,0.1);
          color: #86efac;
          font-size: 11px;
        }

        .level-badge {
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .level-strong {
          color: #86efac;
          background: rgba(34,197,94,0.09);
        }

        .level-intermediate {
          color: #fcd34d;
          background: rgba(234,179,8,0.09);
        }

        .level-beginner {
          color: #c4b5fd;
          background: rgba(124,58,237,0.1);
        }

        .gap-list {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .gap-card {
          padding: 20px;
          border-radius: 17px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
        }

        .gap-top {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .gap-number {
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: rgba(124,58,237,0.11);
          color: #a78bfa;
          font-size: 10px;
          font-weight: 800;
        }

        .gap-title h3 {
          margin: 0 0 6px;
          font-size: 16px;
        }

        .priority {
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
        }

        .priority-high {
          color: #fca5a5;
          background: rgba(239,68,68,0.1);
        }

        .priority-medium {
          color: #fcd34d;
          background: rgba(234,179,8,0.1);
        }

        .priority-low {
          color: #86efac;
          background: rgba(34,197,94,0.1);
        }

        .gap-detail {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 17px;
          padding-top: 17px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .gap-detail h4,
        .roadmap-columns h4 {
          margin: 0 0 6px;
          color: #ddd6fe;
          font-size: 11px;
        }

        .gap-detail p {
          margin: 0;
          color: #9696ab;
          line-height: 1.6;
          font-size: 12px;
        }

        .roadmap {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .roadmap-card {
          display: grid;
          grid-template-columns: 76px 1fr;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
        }

        .week-marker {
          min-height: 170px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(124,58,237,0.09);
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .week-marker span {
          color: #8c7ad5;
          font-size: 10px;
          font-weight: 800;
        }

        .week-marker strong {
          margin-top: 3px;
          color: #d8d2f5;
          font-size: 28px;
        }

        .roadmap-content {
          padding: 21px;
        }

        .roadmap-header p {
          margin: 0 0 4px;
          color: #8d7dc9;
          font-size: 9px;
          letter-spacing: 0.14em;
          font-weight: 800;
        }

        .roadmap-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .roadmap-columns {
          display: grid;
          grid-template-columns:
            0.8fr 1.2fr;
          gap: 25px;
          margin-top: 18px;
        }

        .topic-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .topic-list span {
          padding: 6px 9px;
          border-radius: 8px;
          color: #b8afd9;
          background: rgba(124,58,237,0.09);
          font-size: 10px;
        }

        .task-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .task-list li {
          display: flex;
          gap: 7px;
          color: #9b9bad;
          font-size: 12px;
          line-height: 1.5;
        }

        .task-list li span {
          color: #86efac;
          flex-shrink: 0;
        }

        .outcome {
          margin-top: 17px;
          padding: 13px;
          border-radius: 11px;
          background: rgba(0,0,0,0.13);
        }

        .outcome strong {
          display: block;
          margin-bottom: 4px;
          color: #c4b5fd;
          font-size: 11px;
        }

        .outcome p {
          margin: 0;
          color: #9494a7;
          font-size: 12px;
          line-height: 1.5;
        }

        .projects-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .project-card {
          padding: 21px;
          border-radius: 17px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
        }

        .project-number {
          margin-bottom: 10px;
          color: #8f7bcb;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .project-card h3 {
          margin: 0 0 8px;
          font-size: 17px;
        }

        .project-card p {
          margin: 0;
          color: #9191a5;
          font-size: 12px;
          line-height: 1.65;
        }

        .project-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 15px;
        }

        .project-skills span {
          padding: 6px 9px;
          border-radius: 8px;
          color: #bdb5d5;
          background: rgba(255,255,255,0.05);
          font-size: 10px;
        }

        .interview-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .interview-topic {
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
        }

        .interview-topic span {
          width: 25px;
          height: 25px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #c4b5fd;
          background: rgba(124,58,237,0.12);
          font-size: 9px;
          font-weight: 800;
        }

        .interview-topic strong {
          color: #b4b4c5;
          font-size: 12px;
        }

        .bottom-cta {
          margin-top: 48px;
          padding: 27px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          border-radius: 20px;
          border: 1px solid rgba(124,58,237,0.16);
          background:
            linear-gradient(
              135deg,
              rgba(124,58,237,0.11),
              rgba(255,255,255,0.035)
            );
        }

        .bottom-cta h2 {
          margin: 8px 0 7px;
          font-size: 22px;
        }

        .bottom-cta p:not(.section-label) {
          max-width: 620px;
          margin: 0;
          color: #8e8ea2;
          font-size: 12px;
          line-height: 1.6;
        }

        .cta-actions {
          display: flex;
          gap: 9px;
          flex-shrink: 0;
        }

        .not-found {
          padding: 25px;
          text-align: center;
          border-radius: 15px;
          color: #7f7f93;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 13px;
        }

        .muted {
          margin: 0;
          color: #6f6f83;
          font-size: 12px;
        }

        @media (max-width: 850px) {
          .hero-section,
          .bottom-cta {
            flex-direction: column;
            align-items: flex-start;
          }

          .skills-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .interview-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .bottom-cta .cta-actions {
            width: 100%;
          }
        }

        @media (max-width: 650px) {
          .topbar {
            padding: 0 16px;
          }

          .brand span {
            display: none;
          }

          .header-actions {
            gap: 6px;
          }

          .header-actions .secondary-btn {
            display: none;
          }

          .container {
            width: calc(100% - 24px);
            padding-top: 35px;
          }

          .hero-section h1 {
            font-size: 39px;
          }

          .skills-grid,
          .projects-grid,
          .interview-grid {
            grid-template-columns: 1fr;
          }

          .gap-detail,
          .roadmap-columns {
            grid-template-columns: 1fr;
          }

          .roadmap-card {
            grid-template-columns: 57px 1fr;
          }

          .week-marker strong {
            font-size: 23px;
          }

          .bottom-cta {
            padding: 21px;
          }

          .cta-actions {
            flex-direction: column;
          }

          .cta-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default SkillGapAnalysis;