import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function JobMatcher() {
  const navigate = useNavigate();

  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const token = localStorage.getItem("access_token");

if (!token) {
  setError("Your login session has expired. Please login again.");
  return;
}

const response = await axios.post(
  "https://careerpilot-ai-pcqc.onrender.com/api/jobs/match",
  {
    job_description: jobDescription,
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);

      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Job Matcher Error:", error);

      setError(
        error.response?.data?.detail ||
          "Failed to analyze the job description."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJobDescription("");
    setAnalysis(null);
    setError("");
  };

  const getScoreClass = (score) => {
    if (score >= 75) return "score-good";
    if (score >= 50) return "score-medium";
    return "score-low";
  };

  return (
    <div className="job-page">

      {/* HEADER */}

      <header className="job-header">

        <div className="header-left">

          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            ←
          </button>

          <div>
            <div className="page-label">
              CAREERPILOT AI
            </div>

            <h1>Job Matcher</h1>

            <p>
              Compare a job description with your career skills
              and discover what you need to improve.
            </p>
          </div>

        </div>

        <div className="ai-badge">
          ✨ AI POWERED
        </div>

      </header>


      {/* MAIN */}

      <main className="job-main">

        {/* INPUT CARD */}

        <section className="input-card">

          <div className="section-title">

            <div className="title-icon">
              💼
            </div>

            <div>
              <h2>Job Description</h2>

              <p>
                Paste the job description you want to analyze.
              </p>
            </div>

          </div>


          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder={`Paste the complete job description here...

Example:

Software Engineer Intern

Requirements:
• Python
• Java
• SQL
• MongoDB
• React
• REST APIs
• Git
• Data Structures and Algorithms
• Problem solving`}
          />


          <div className="input-footer">

            <span>
              {jobDescription.length} characters
            </span>

            <div className="input-actions">

              <button
                className="clear-button"
                onClick={handleClear}
                disabled={!jobDescription && !analysis}
              >
                Clear
              </button>

              <button
                className="analyze-button"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Job
                    <span>→</span>
                  </>
                )}
              </button>

            </div>

          </div>

        </section>


        {/* ERROR */}

        {error && (
          <div className="error-box">
            <span>⚠</span>
            <p>{error}</p>
          </div>
        )}


        {/* RESULTS */}

        {analysis && (

          <section className="results-section">

            <div className="results-heading">

              <div>
                <div className="page-label">
                  ANALYSIS COMPLETE
                </div>

                <h2>
                  Job Match Results
                </h2>
              </div>

              <button
                className="new-analysis"
                onClick={handleClear}
              >
                + New Analysis
              </button>

            </div>


            {/* SCORE */}

            <div className="score-card">

              <div className="score-info">

                <span className="result-label">
                  OVERALL MATCH
                </span>

                <h3>
                  {analysis.match_score}%
                </h3>

                <p>
                  Based on the requirements found in
                  this job description.
                </p>

              </div>


              <div
                className={`score-circle ${getScoreClass(
                  analysis.match_score
                )}`}
              >
                <div>
                  <strong>
                    {analysis.match_score}
                  </strong>

                  <span>
                    / 100
                  </span>
                </div>
              </div>

            </div>


            {/* ROLE + SUMMARY */}

            <div className="summary-card">

              <div className="summary-icon">
                💼
              </div>

              <div>
                <span className="result-label">
                  TARGET ROLE
                </span>

                <h3>
                  {analysis.role || "Software Role"}
                </h3>

                <p>
                  {analysis.summary}
                </p>
              </div>

            </div>


            {/* SKILLS GRID */}

            <div className="results-grid">

              {/* MATCHED */}

              <div className="result-card">

                <div className="result-card-heading">

                  <div className="green-icon">
                    ✓
                  </div>

                  <div>
                    <h3>
                      Matched Skills
                    </h3>

                    <p>
                      Skills relevant to this role
                    </p>
                  </div>

                </div>


                <div className="tag-container">

                  {analysis.matched_skills?.length > 0 ? (
                    analysis.matched_skills.map(
                      (skill, index) => (
                        <span
                          className="skill-tag matched"
                          key={index}
                        >
                          ✓ {skill}
                        </span>
                      )
                    )
                  ) : (
                    <p className="empty-text">
                      No matched skills found.
                    </p>
                  )}

                </div>

              </div>


              {/* MISSING */}

              <div className="result-card">

                <div className="result-card-heading">

                  <div className="red-icon">
                    !
                  </div>

                  <div>
                    <h3>
                      Missing Skills
                    </h3>

                    <p>
                      Skills you may need to improve
                    </p>
                  </div>

                </div>


                <div className="tag-container">

                  {analysis.missing_skills?.length > 0 ? (
                    analysis.missing_skills.map(
                      (skill, index) => (
                        <span
                          className="skill-tag missing"
                          key={index}
                        >
                          + {skill}
                        </span>
                      )
                    )
                  ) : (
                    <p className="empty-text">
                      No major missing skills found.
                    </p>
                  )}

                </div>

              </div>

            </div>


            {/* KEYWORDS */}

            <div className="result-card full-card">

              <div className="result-card-heading">

                <div className="purple-icon">
                  #
                </div>

                <div>
                  <h3>
                    Important Keywords
                  </h3>

                  <p>
                    Keywords worth knowing for this role
                  </p>
                </div>

              </div>


              <div className="tag-container">

                {analysis.important_keywords?.map(
                  (keyword, index) => (
                    <span
                      className="skill-tag keyword"
                      key={index}
                    >
                      {keyword}
                    </span>
                  )
                )}

              </div>

            </div>


            {/* EXPERIENCE */}

            <div className="result-card full-card">

              <div className="result-card-heading">

                <div className="blue-icon">
                  ◆
                </div>

                <div>
                  <h3>
                    Experience Requirements
                  </h3>

                  <p>
                    What the employer expects
                  </p>
                </div>

              </div>


              <ul className="result-list">

                {analysis.experience_requirements?.map(
                  (item, index) => (
                    <li key={index}>
                      <span>•</span>
                      {item}
                    </li>
                  )
                )}

              </ul>

            </div>


            {/* RECOMMENDATIONS */}

            <div className="recommendation-section">

              <div className="recommendation-header">

                <div className="recommendation-big-icon">
                  ✨
                </div>

                <div>
                  <span className="result-label">
                    CAREERPILOT AI
                  </span>

                  <h2>
                    What you should do next
                  </h2>
                </div>

              </div>


              <div className="recommendation-list">

                {analysis.recommendations?.map(
                  (item, index) => (

                    <div
                      className="recommendation-item"
                      key={index}
                    >

                      <div className="recommendation-number">
                        {index + 1}
                      </div>

                      <p>
                        {item}
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>

          </section>

        )}

      </main>


      {/* CSS */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .job-page {
          min-height: 100vh;
          background: #08090d;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
        }


        /* HEADER */

        .job-header {
          padding: 28px 42px;
          border-bottom: 1px solid #20212b;
          background: #0c0d12;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 17px;
        }

        .back-button {
          width: 42px;
          height: 42px;
          border: 1px solid #292a35;
          border-radius: 10px;
          background: #15161e;
          color: #ffffff;
          cursor: pointer;
          font-size: 20px;
          transition: 0.2s;
        }

        .back-button:hover {
          background: #211b38;
          border-color: #7657ff;
        }

        .page-label {
          color: #8c72ff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }

        .job-header h1 {
          margin: 0 0 5px;
          font-size: 27px;
        }

        .job-header p {
          margin: 0;
          color: #777988;
          font-size: 12px;
        }

        .ai-badge {
          padding: 8px 12px;
          border-radius: 20px;
          background: #1d1830;
          border: 1px solid #302651;
          color: #a08cff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.8px;
        }


        /* MAIN */

        .job-main {
          width: min(1100px, calc(100% - 50px));
          margin: 30px auto 60px;
        }


        /* INPUT */

        .input-card {
          background: #101117;
          border: 1px solid #20212b;
          border-radius: 16px;
          padding: 25px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 20px;
        }

        .title-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #211b38;
          font-size: 19px;
        }

        .section-title h2 {
          margin: 0 0 4px;
          font-size: 17px;
        }

        .section-title p {
          margin: 0;
          color: #696b78;
          font-size: 10px;
        }

        textarea {
          width: 100%;
          min-height: 270px;
          resize: vertical;
          padding: 17px;
          border-radius: 11px;
          border: 1px solid #282936;
          background: #0b0c11;
          color: #eeeeee;
          outline: none;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.7;
          transition: 0.2s;
        }

        textarea:focus {
          border-color: #7657ff;
          box-shadow:
            0 0 0 3px rgba(118, 87, 255, 0.08);
        }

        textarea::placeholder {
          color: #555764;
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
        }

        .input-footer > span {
          color: #555764;
          font-size: 10px;
        }

        .input-actions {
          display: flex;
          gap: 9px;
        }

        .clear-button {
          border: 1px solid #292a35;
          border-radius: 9px;
          padding: 11px 16px;
          background: transparent;
          color: #858795;
          cursor: pointer;
          font-size: 11px;
        }

        .clear-button:hover {
          background: #171820;
          color: white;
        }

        .clear-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .analyze-button {
          border: none;
          border-radius: 9px;
          padding: 11px 17px;
          background: linear-gradient(
            135deg,
            #7657ff,
            #916fff
          );
          color: white;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 9px;
          transition: 0.2s;
        }

        .analyze-button:hover {
          transform: translateY(-1px);
          box-shadow:
            0 8px 20px rgba(118, 87, 255, 0.25);
        }

        .analyze-button:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }


        /* ERROR */

        .error-box {
          margin-top: 15px;
          padding: 13px 15px;
          border-radius: 10px;
          border: 1px solid #542b35;
          background: #211216;
          color: #ff9a9a;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
        }

        .error-box p {
          margin: 0;
        }


        /* RESULTS */

        .results-section {
          margin-top: 30px;
        }

        .results-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .results-heading h2 {
          margin: 0;
          font-size: 22px;
        }

        .new-analysis {
          border: 1px solid #302651;
          background: #171324;
          color: #a18cff;
          padding: 9px 13px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 10px;
        }


        /* SCORE */

        .score-card {
          background:
            radial-gradient(
              circle at 85% 50%,
              rgba(118, 87, 255, 0.18),
              transparent 30%
            ),
            #101117;
          border: 1px solid #2b2440;
          border-radius: 16px;
          padding: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .result-label {
          color: #8c72ff;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }

        .score-info h3 {
          font-size: 42px;
          margin: 8px 0 5px;
        }

        .score-info p {
          color: #777988;
          font-size: 10px;
          margin: 0;
        }

        .score-circle {
          width: 115px;
          height: 115px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 8px solid #29233d;
          background: #0c0d12;
        }

        .score-circle > div {
          text-align: center;
        }

        .score-circle strong {
          display: block;
          font-size: 25px;
        }

        .score-circle span {
          color: #686a77;
          font-size: 9px;
        }

        .score-good {
          border-color: #7657ff;
          box-shadow:
            0 0 30px rgba(118, 87, 255, 0.2);
        }

        .score-medium {
          border-color: #a88b52;
        }

        .score-low {
          border-color: #a85461;
        }


        /* SUMMARY */

        .summary-card {
          margin-top: 15px;
          padding: 20px;
          border-radius: 14px;
          background: #101117;
          border: 1px solid #20212b;
          display: flex;
          gap: 15px;
        }

        .summary-icon {
          width: 45px;
          height: 45px;
          flex-shrink: 0;
          border-radius: 11px;
          background: #211b38;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-card h3 {
          margin: 5px 0 7px;
          font-size: 16px;
        }

        .summary-card p {
          color: #777988;
          font-size: 11px;
          line-height: 1.6;
          margin: 0;
        }


        /* RESULTS GRID */

        .results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }

        .result-card {
          background: #101117;
          border: 1px solid #20212b;
          border-radius: 14px;
          padding: 20px;
        }

        .full-card {
          margin-top: 15px;
        }

        .result-card-heading {
          display: flex;
          gap: 11px;
          align-items: center;
          margin-bottom: 17px;
        }

        .result-card-heading h3 {
          margin: 0 0 4px;
          font-size: 13px;
        }

        .result-card-heading p {
          margin: 0;
          color: #696b78;
          font-size: 9px;
        }

        .green-icon,
        .red-icon,
        .purple-icon,
        .blue-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .green-icon {
          background: #14251d;
          color: #70c896;
        }

        .red-icon {
          background: #29171c;
          color: #ef7e8a;
        }

        .purple-icon {
          background: #211b38;
          color: #a08bff;
        }

        .blue-icon {
          background: #16202c;
          color: #78a9db;
        }


        /* TAGS */

        .tag-container {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .skill-tag {
          padding: 7px 9px;
          border-radius: 7px;
          font-size: 9px;
          border: 1px solid;
        }

        .matched {
          background: #122019;
          border-color: #284b39;
          color: #7bd09b;
        }

        .missing {
          background: #241519;
          border-color: #4b2931;
          color: #ed8b96;
        }

        .keyword {
          background: #1c1730;
          border-color: #342b58;
          color: #a999ff;
        }

        .empty-text {
          color: #5e606c;
          font-size: 10px;
          margin: 0;
        }


        /* LIST */

        .result-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .result-list li {
          color: #9293a0;
          font-size: 10px;
          line-height: 1.5;
          display: flex;
          gap: 9px;
        }

        .result-list li span {
          color: #8c72ff;
        }


        /* RECOMMENDATIONS */

        .recommendation-section {
          margin-top: 15px;
          padding: 23px;
          border-radius: 15px;
          background:
            linear-gradient(
              135deg,
              #17132a,
              #101117
            );
          border: 1px solid #2b2440;
        }

        .recommendation-header {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 18px;
        }

        .recommendation-big-icon {
          width: 43px;
          height: 43px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #251d42;
          font-size: 18px;
        }

        .recommendation-header h2 {
          margin: 5px 0 0;
          font-size: 16px;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .recommendation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px;
          border-radius: 9px;
          background: #111119;
          border: 1px solid #232431;
        }

        .recommendation-number {
          width: 25px;
          height: 25px;
          flex-shrink: 0;
          border-radius: 7px;
          background: #211b38;
          color: #9a86ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .recommendation-item p {
          color: #999aa6;
          font-size: 10px;
          line-height: 1.5;
          margin: 0;
        }


        /* RESPONSIVE */

        @media (max-width: 750px) {

          .job-header {
            padding: 22px 20px;
          }

          .ai-badge {
            display: none;
          }

          .job-main {
            width: calc(100% - 30px);
            margin-top: 20px;
          }

          .results-grid {
            grid-template-columns: 1fr;
          }

          .score-card {
            padding: 22px;
          }

          .score-circle {
            width: 90px;
            height: 90px;
          }

          .score-info h3 {
            font-size: 34px;
          }

        }


        @media (max-width: 500px) {

          .header-left {
            gap: 10px;
          }

          .back-button {
            width: 36px;
            height: 36px;
          }

          .job-header h1 {
            font-size: 22px;
          }

          .job-header p {
            font-size: 10px;
          }

          .input-card {
            padding: 17px;
          }

          .input-footer {
            align-items: flex-end;
            flex-direction: column;
            gap: 10px;
          }

          .input-actions {
            width: 100%;
          }

          .clear-button,
          .analyze-button {
            flex: 1;
            justify-content: center;
          }

          .score-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .summary-card {
            flex-direction: column;
          }

        }

      `}</style>
    </div>
  );
}

export default JobMatcher;