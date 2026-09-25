import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ResumeAnalyzer() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFile = (selectedFile) => {
    setError("");
    setResult(null);

    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files[0];

    handleFile(droppedFile);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select your resume first.");
      return;
    }

   

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();

    formData.append("file", file);

    try {
      const token = localStorage.getItem("access_token");

if (!token) {
  setError("Your login session has expired. Please login again.");
  return;
}

const response = await axios.post(
  "https://careerpilot-ai-pcqc.onrender.com/api/resume/analyze",
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  }
);

      setResult(response.data.analysis);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Resume analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAnalyzer = () => {
    setFile(null);
    setResult(null);
    setError("");
  };

  return (
    <>
      <style>{styles}</style>

      <div className="resume-page">

        {/* HEADER */}

        <header className="resume-header">

          <div>
            <div className="page-label">
              AI CAREER TOOLS
            </div>

            <h1>Resume Analyzer</h1>

            <p>
              Get an AI-powered analysis of your resume
              and discover how to improve your chances
              of getting shortlisted.
            </p>
          </div>

          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

        </header>


        {!result && (
          <section className="upload-section">

            <div
              className={`upload-box ${
                dragActive ? "drag-active" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >

              {!file ? (
                <>
                  <div className="upload-icon">
                    ↑
                  </div>

                  <h2>
                    Upload your resume
                  </h2>

                  <p>
                    Drag and drop your resume here,
                    or select a file from your computer.
                  </p>

                  <label className="choose-button">
                    Choose Resume

                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      hidden
                    />
                  </label>

                  <span className="file-info">
                    PDF or DOCX · Maximum 5 MB
                  </span>
                </>
              ) : (
                <>
                  <div className="file-icon">
                    {file.name.toLowerCase().endsWith(".pdf")
                      ? "PDF"
                      : "DOCX"}
                  </div>

                  <h2>
                    {file.name}
                  </h2>

                  <p>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  <div className="selected-actions">

                    <button
                      className="change-button"
                      onClick={() =>
                        document
                          .getElementById("resume-input")
                          .click()
                      }
                    >
                      Change File
                    </button>

                    <input
                      id="resume-input"
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      hidden
                    />

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
                          Analyze Resume →
                        </>
                      )}
                    </button>

                  </div>
                </>
              )}

            </div>


            {error && (
              <div className="error-box">
                <span>!</span>
                {error}
              </div>
            )}


            {/* WHAT WE ANALYZE */}

            <div className="analysis-info">

              <div className="info-title">
                <span>✦</span>
                What CareerPilot-AI analyzes
              </div>

              <div className="analysis-grid">

                <div>
                  <strong>ATS Compatibility</strong>
                  <span>
                    Resume structure and keyword optimization
                  </span>
                </div>

                <div>
                  <strong>Technical Skills</strong>
                  <span>
                    Skills identified from your resume
                  </span>
                </div>

                <div>
                  <strong>Skill Gaps</strong>
                  <span>
                    Skills you may need for your target role
                  </span>
                </div>

                <div>
                  <strong>Improvements</strong>
                  <span>
                    Actionable recommendations
                  </span>
                </div>

              </div>

            </div>

          </section>
        )}


        {/* RESULTS */}

        {result && (
          <section className="results-section">

            <div className="results-top">

              <div>
                <div className="page-label">
                  AI ANALYSIS COMPLETE
                </div>

                <h2>
                  Your Resume Results
                </h2>

                <p>
                  Here's what CareerPilot-AI found in
                  your resume.
                </p>
              </div>

              <button
                className="new-analysis-button"
                onClick={resetAnalyzer}
              >
                Analyze Another Resume
              </button>

            </div>


            {/* TOP SCORE CARDS */}

            <div className="result-summary">

              {/* ATS */}

              <div className="score-card">

                <div className="score-circle">

                  <span>
                    {result.ats_score ?? 0}
                  </span>

                  <small>
                    /100
                  </small>

                </div>

                <div>
                  <span className="card-label">
                    ATS SCORE
                  </span>

                  <h3>
                    Resume Score
                  </h3>

                  <p>
                    Overall resume compatibility
                  </p>
                </div>

              </div>


              {/* SKILLS */}

              <div className="mini-result-card">

                <span className="mini-icon">
                  ◆
                </span>

                <div>
                  <span className="card-label">
                    SKILLS FOUND
                  </span>

                  <h3>
                    {result.skills?.length || 0}
                  </h3>

                  <p>
                    Technical and professional skills
                  </p>
                </div>

              </div>


              {/* MISSING */}

              <div className="mini-result-card">

                <span className="mini-icon">
                  ◇
                </span>

                <div>
                  <span className="card-label">
                    SKILL GAPS
                  </span>

                  <h3>
                    {result.missing_skills?.length || 0}
                  </h3>

                  <p>
                    Skills to consider learning
                  </p>
                </div>

              </div>

            </div>


            {/* SUMMARY */}

            <div className="result-card">

              <div className="result-card-header">

                <span className="result-icon">
                  AI
                </span>

                <div>
                  <h3>
                    AI Summary
                  </h3>

                  <p>
                    Overall assessment
                  </p>
                </div>

              </div>

              <p className="summary-text">
                {result.summary}
              </p>

            </div>


            {/* TWO COLUMNS */}

            <div className="result-columns">

              {/* STRENGTHS */}

              <div className="result-card">

                <div className="result-card-header">

                  <span className="success-icon">
                    ✓
                  </span>

                  <div>
                    <h3>
                      Strengths
                    </h3>

                    <p>
                      What's working well
                    </p>
                  </div>

                </div>

                <ul className="result-list">

                  {result.strengths?.map(
                    (item, index) => (
                      <li key={index}>
                        <span>✓</span>
                        {item}
                      </li>
                    )
                  )}

                </ul>

              </div>


              {/* WEAKNESSES */}

              <div className="result-card">

                <div className="result-card-header">

                  <span className="warning-icon">
                    !
                  </span>

                  <div>
                    <h3>
                      Weaknesses
                    </h3>

                    <p>
                      Areas to improve
                    </p>
                  </div>

                </div>

                <ul className="result-list">

                  {result.weaknesses?.map(
                    (item, index) => (
                      <li key={index}>
                        <span>!</span>
                        {item}
                      </li>
                    )
                  )}

                </ul>

              </div>

            </div>


            {/* SKILLS */}

            <div className="result-columns">

              <div className="result-card">

                <div className="result-card-header">

                  <span className="purple-icon">
                    ◆
                  </span>

                  <div>
                    <h3>
                      Skills Detected
                    </h3>

                    <p>
                      Skills found in your resume
                    </p>
                  </div>

                </div>

                <div className="skill-tags">

                  {result.skills?.map(
                    (skill, index) => (
                      <span key={index}>
                        {skill}
                      </span>
                    )
                  )}

                </div>

              </div>


              {/* MISSING SKILLS */}

              <div className="result-card">

                <div className="result-card-header">

                  <span className="warning-icon">
                    ◇
                  </span>

                  <div>
                    <h3>
                      Missing Skills
                    </h3>

                    <p>
                      Skills worth developing
                    </p>
                  </div>

                </div>

                <div className="skill-tags missing">

                  {result.missing_skills?.map(
                    (skill, index) => (
                      <span key={index}>
                        {skill}
                      </span>
                    )
                  )}

                </div>

              </div>

            </div>


            {/* IMPROVEMENTS */}

            <div className="result-card">

              <div className="result-card-header">

                <span className="purple-icon">
                  ✦
                </span>

                <div>
                  <h3>
                    AI Improvement Plan
                  </h3>

                  <p>
                    Recommended changes to your resume
                  </p>
                </div>

              </div>

              <div className="recommendation-list">

                {result.improvements?.map(
                  (item, index) => (
                    <div
                      className="recommendation-item"
                      key={index}
                    >
                      <span>
                        {index + 1}
                      </span>

                      <p>
                        {item}
                      </p>
                    </div>
                  )
                )}

              </div>

            </div>


            {/* KEYWORDS */}

            <div className="result-card">

              <div className="result-card-header">

                <span className="purple-icon">
                  #
                </span>

                <div>
                  <h3>
                    Keyword Suggestions
                  </h3>

                  <p>
                    Keywords that may strengthen
                    your resume
                  </p>
                </div>

              </div>

              <div className="skill-tags">

                {result.keyword_suggestions?.map(
                  (keyword, index) => (
                    <span key={index}>
                      {keyword}
                    </span>
                  )
                )}

              </div>

            </div>


            {/* EXPERIENCE + PROJECTS */}

            <div className="result-columns">

              <div className="result-card">

                <div className="result-card-header">

                  <span className="purple-icon">
                    E
                  </span>

                  <div>
                    <h3>
                      Experience Feedback
                    </h3>

                    <p>
                      Career experience analysis
                    </p>
                  </div>

                </div>

                <ul className="result-list">

                  {result.experience_feedback?.map(
                    (item, index) => (
                      <li key={index}>
                        <span>•</span>
                        {item}
                      </li>
                    )
                  )}

                </ul>

              </div>


              <div className="result-card">

                <div className="result-card-header">

                  <span className="purple-icon">
                    P
                  </span>

                  <div>
                    <h3>
                      Project Feedback
                    </h3>

                    <p>
                      Project presentation analysis
                    </p>
                  </div>

                </div>

                <ul className="result-list">

                  {result.project_feedback?.map(
                    (item, index) => (
                      <li key={index}>
                        <span>•</span>
                        {item}
                      </li>
                    )
                  )}

                </ul>

              </div>

            </div>

          </section>
        )}

      </div>
    </>
  );
}


/* =========================================================
   CSS
   Everything is intentionally inside ResumeAnalyzer.jsx
========================================================= */

const styles = `

* {
  box-sizing: border-box;
}

.resume-page {
  min-height: 100vh;

  background:
    radial-gradient(
      circle at 80% 5%,
      rgba(118, 87, 255, 0.08),
      transparent 28%
    ),
    #08090d;

  color: white;

  padding: 35px 45px;

  font-family:
    Arial,
    Helvetica,
    sans-serif;
}


/* HEADER */

.resume-header {
  max-width: 1100px;

  margin: 0 auto 32px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;
}

.page-label {
  color: #8c72ff;

  font-size: 9px;

  font-weight: bold;

  letter-spacing: 1.8px;

  margin-bottom: 8px;
}

.resume-header h1 {
  margin: 0 0 8px;

  font-size: 30px;
}

.resume-header p {
  max-width: 650px;

  margin: 0;

  color: #777988;

  font-size: 13px;

  line-height: 1.6;
}


/* BUTTONS */

.back-button,
.new-analysis-button,
.change-button {
  background: #15161e;

  color: white;

  border: 1px solid #292a35;

  padding: 11px 17px;

  border-radius: 9px;

  cursor: pointer;

  font-size: 12px;

  transition: 0.2s;
}

.back-button:hover,
.new-analysis-button:hover,
.change-button:hover {
  border-color: #7657ff;

  background: #1c1928;
}


/* UPLOAD */

.upload-section {
  max-width: 1100px;

  margin: 0 auto;
}

.upload-box {
  min-height: 360px;

  background:
    linear-gradient(
      145deg,
      #111219,
      #0f1016
    );

  border: 1px dashed #343144;

  border-radius: 18px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  text-align: center;

  padding: 40px;

  transition: 0.2s;
}

.upload-box:hover,
.upload-box.drag-active {
  border-color: #7657ff;

  background: #12111b;
}

.upload-icon {
  width: 65px;

  height: 65px;

  border-radius: 17px;

  background: #211b38;

  color: #9b85ff;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 28px;

  margin-bottom: 20px;

  box-shadow:
    0 0 30px rgba(118, 87, 255, 0.12);
}

.upload-box h2 {
  margin: 0 0 8px;

  font-size: 20px;
}

.upload-box p {
  margin: 0 0 22px;

  color: #70717e;

  font-size: 12px;
}

.choose-button {
  background: #7657ff;

  color: white;

  padding: 12px 20px;

  border-radius: 9px;

  cursor: pointer;

  font-size: 12px;

  font-weight: bold;

  transition: 0.2s;
}

.choose-button:hover {
  background: #876cff;

  transform: translateY(-1px);
}

.file-info {
  color: #555763;

  font-size: 10px;

  margin-top: 13px;
}


/* SELECTED FILE */

.file-icon {
  width: 65px;

  height: 65px;

  border-radius: 15px;

  background: #211b38;

  color: #9b85ff;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 12px;

  font-weight: bold;

  margin-bottom: 18px;
}

.selected-actions {
  display: flex;

  gap: 10px;

  margin-top: 12px;
}

.analyze-button {
  background: #7657ff;

  color: white;

  border: none;

  padding: 12px 20px;

  border-radius: 9px;

  cursor: pointer;

  font-size: 12px;

  font-weight: bold;

  display: flex;

  align-items: center;

  gap: 8px;
}

.analyze-button:hover:not(:disabled) {
  background: #876cff;
}

.analyze-button:disabled {
  opacity: 0.7;

  cursor: not-allowed;
}


/* ERROR */

.error-box {
  max-width: 700px;

  margin: 15px auto 0;

  padding: 12px 15px;

  border-radius: 9px;

  background: #211416;

  border: 1px solid #442326;

  color: #ff8585;

  font-size: 11px;

  display: flex;

  align-items: center;

  gap: 9px;
}

.error-box span {
  width: 18px;

  height: 18px;

  border-radius: 50%;

  background: #59272b;

  display: flex;

  align-items: center;

  justify-content: center;

  font-weight: bold;
}


/* ANALYSIS INFO */

.analysis-info {
  margin-top: 20px;

  background: #101117;

  border: 1px solid #20212b;

  border-radius: 14px;

  padding: 22px;
}

.info-title {
  display: flex;

  align-items: center;

  gap: 8px;

  font-size: 13px;

  font-weight: bold;

  margin-bottom: 18px;
}

.info-title span {
  color: #8c72ff;
}

.analysis-grid {
  display: grid;

  grid-template-columns: repeat(4, 1fr);

  gap: 15px;
}

.analysis-grid div {
  padding: 15px;

  background: #15161e;

  border-radius: 10px;
}

.analysis-grid strong {
  display: block;

  font-size: 11px;

  margin-bottom: 7px;
}

.analysis-grid span {
  color: #666875;

  font-size: 10px;

  line-height: 1.5;
}


/* RESULTS */

.results-section {
  max-width: 1100px;

  margin: 0 auto;
}

.results-top {
  display: flex;

  align-items: flex-end;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 22px;
}

.results-top h2 {
  margin: 0 0 7px;

  font-size: 24px;
}

.results-top p {
  margin: 0;

  color: #777988;

  font-size: 12px;
}


/* SCORE */

.result-summary {
  display: grid;

  grid-template-columns: 1.4fr 1fr 1fr;

  gap: 15px;

  margin-bottom: 18px;
}

.score-card,
.mini-result-card {
  background: #101117;

  border: 1px solid #20212b;

  border-radius: 14px;

  padding: 20px;

  display: flex;

  align-items: center;

  gap: 18px;
}

.score-circle {
  width: 82px;

  height: 82px;

  flex-shrink: 0;

  border-radius: 50%;

  border: 5px solid #7657ff;

  display: flex;

  align-items: center;

  justify-content: center;

  flex-direction: column;

  box-shadow:
    0 0 25px rgba(118, 87, 255, 0.15);
}

.score-circle span {
  font-size: 23px;

  font-weight: bold;
}

.score-circle small {
  color: #666875;

  font-size: 9px;
}

.card-label {
  display: block;

  color: #8c72ff;

  font-size: 8px;

  letter-spacing: 1px;

  font-weight: bold;

  margin-bottom: 5px;
}

.score-card h3,
.mini-result-card h3 {
  margin: 0 0 5px;

  font-size: 16px;
}

.score-card p,
.mini-result-card p {
  margin: 0;

  color: #666875;

  font-size: 10px;
}

.mini-icon {
  width: 40px;

  height: 40px;

  flex-shrink: 0;

  border-radius: 10px;

  background: #211b38;

  color: #967fff;

  display: flex;

  align-items: center;

  justify-content: center;
}


/* RESULT CARD */

.result-card {
  background: #101117;

  border: 1px solid #20212b;

  border-radius: 14px;

  padding: 22px;

  margin-bottom: 18px;
}

.result-card-header {
  display: flex;

  align-items: center;

  gap: 12px;

  margin-bottom: 18px;
}

.result-card-header h3 {
  margin: 0 0 4px;

  font-size: 15px;
}

.result-card-header p {
  margin: 0;

  color: #666875;

  font-size: 10px;
}

.result-icon,
.success-icon,
.warning-icon,
.purple-icon {
  width: 38px;

  height: 38px;

  flex-shrink: 0;

  border-radius: 10px;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 11px;

  font-weight: bold;
}

.result-icon,
.purple-icon {
  background: #211b38;

  color: #9b85ff;
}

.success-icon {
  background: #112219;

  color: #70dc99;
}

.warning-icon {
  background: #261d13;

  color: #e8b66c;
}


/* SUMMARY TEXT */

.summary-text {
  margin: 0;

  color: #a3a4ae;

  font-size: 12px;

  line-height: 1.7;
}


/* COLUMNS */

.result-columns {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 18px;
}


/* LIST */

.result-list {
  list-style: none;

  padding: 0;

  margin: 0;

  display: flex;

  flex-direction: column;

  gap: 12px;
}

.result-list li {
  display: flex;

  align-items: flex-start;

  gap: 9px;

  color: #9697a2;

  font-size: 11px;

  line-height: 1.5;
}

.result-list li span {
  flex-shrink: 0;

  color: #8c72ff;

  font-weight: bold;
}


/* SKILLS */

.skill-tags {
  display: flex;

  flex-wrap: wrap;

  gap: 8px;
}

.skill-tags span {
  background: #1b1730;

  border: 1px solid #30265a;

  color: #a895ff;

  padding: 7px 10px;

  border-radius: 7px;

  font-size: 10px;
}

.skill-tags.missing span {
  background: #211b16;

  border-color: #493624;

  color: #d5a867;
}


/* RECOMMENDATIONS */

.recommendation-list {
  display: flex;

  flex-direction: column;

  gap: 11px;
}

.recommendation-item {
  display: flex;

  align-items: flex-start;

  gap: 12px;

  padding: 12px;

  background: #15161e;

  border-radius: 9px;
}

.recommendation-item > span {
  width: 24px;

  height: 24px;

  flex-shrink: 0;

  border-radius: 7px;

  background: #251e40;

  color: #9b85ff;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 10px;

  font-weight: bold;
}

.recommendation-item p {
  margin: 2px 0 0;

  color: #999aa5;

  font-size: 11px;

  line-height: 1.5;
}


/* SPINNER */

.spinner {
  width: 13px;

  height: 13px;

  border: 2px solid #9d8dff;

  border-top-color: transparent;

  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* RESPONSIVE */

@media (max-width: 900px) {

  .resume-page {
    padding: 25px 20px;
  }

  .analysis-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .result-summary {
    grid-template-columns: 1fr 1fr;
  }

  .score-card {
    grid-column: span 2;
  }

}


@media (max-width: 650px) {

  .resume-header {
    flex-direction: column;

    align-items: flex-start;
  }

  .back-button {
    width: 100%;
  }

  .selected-actions {
    flex-direction: column;

    width: 100%;
  }

  .change-button,
  .analyze-button {
    width: 100%;

    justify-content: center;
  }

  .analysis-grid,
  .result-summary,
  .result-columns {
    grid-template-columns: 1fr;
  }

  .score-card {
    grid-column: auto;
  }

  .results-top {
    flex-direction: column;

    align-items: flex-start;
  }

  .new-analysis-button {
    width: 100%;
  }

}

`;

export default ResumeAnalyzer;