import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    careerReadiness: 0,
    resumeScore: null,
    jobsMatched: 0,
    interviewScore: null,
    resumeProgress: 0,
    codingProgress: 0,
    aptitudeProgress: 0,
    interviewProgress: 0,
  });

  const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

  const getScore = (value) => {
    if (value === null || value === undefined || value === "") return null;

    if (typeof value === "object") {
      return getScore(
        value.score ??
        value.ats_score ??
        value.atsScore ??
        value.overall_score ??
        value.percentage
      );
    }

    const number = Number(value);
    return Number.isFinite(number) ? clamp(number) : null;
  };

  const getResumeScore = (resumeResponse, studentResponse) => {
    const analysis =
      resumeResponse?.analysis ||
      resumeResponse?.resume?.analysis ||
      studentResponse?.resume?.analysis ||
      {};

    const score =
      getScore(analysis.ats_score) ??
      getScore(analysis.atsScore) ??
      getScore(analysis.resume_score) ??
      getScore(analysis.score) ??
      getScore(resumeResponse?.ats_score) ??
      getScore(studentResponse?.resume?.ats_score);

    return score;
  };

  const getLatestInterviewScore = (history) => {
    if (!Array.isArray(history) || history.length === 0) return null;

    const latest = history[0] || {};
    return getScore(
      latest.overall_score ??
      latest.score ??
      latest.percentage
    );
  };

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const authConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        const [studentResult, resumeResult, jobsResult, codingResult, aptitudeResult, interviewResult] =
          await Promise.allSettled([
            axios.get("https://careerpilot-ai-pcqc.onrender.com/api/auth/me", authConfig),
            axios.get("https://careerpilot-ai-pcqc.onrender.com/api/resume/latest", authConfig),
            axios.get("https://careerpilot-ai-pcqc.onrender.com/api/jobs/history", authConfig),
            axios.get("https://careerpilot-ai-pcqc.onrender.com/api/coding/history", authConfig),
            axios.get("https://careerpilot-ai-pcqc.onrender.com/api/aptitude/history", authConfig),
            axios.get("https://careerpilot-ai-pcqc.onrender.com/api/interview/history", authConfig),
          ]);

        const studentResponse =
          studentResult.status === "fulfilled" ? studentResult.value.data : null;

        if (!studentResponse) {
          if (studentResult.reason?.response?.status === 401) {
            localStorage.removeItem("access_token");
            navigate("/login");
            return;
          }
          throw studentResult.reason || new Error("Unable to load student profile.");
        }

        if (!mounted) return;
        setStudent(studentResponse);

        const resumeData =
          resumeResult.status === "fulfilled" ? resumeResult.value.data : null;
        const jobsData =
          jobsResult.status === "fulfilled" ? jobsResult.value.data : {};
        const codingData =
          codingResult.status === "fulfilled" ? codingResult.value.data : {};
        const aptitudeData =
          aptitudeResult.status === "fulfilled" ? aptitudeResult.value.data : {};
        const interviewData =
          interviewResult.status === "fulfilled" ? interviewResult.value.data : {};

        const resumeScore = getResumeScore(resumeData, studentResponse);

        const jobsHistory = Array.isArray(jobsData?.history)
          ? jobsData.history
          : [];
        const jobsMatched = Number.isFinite(Number(jobsData?.count))
          ? Number(jobsData.count)
          : jobsHistory.length;

        const codingHistory = Array.isArray(codingData?.history)
          ? codingData.history
          : [];
        const acceptedCoding = codingHistory.filter(
          (item) => String(item?.status || "").toLowerCase() === "accepted"
        ).length;
        const codingProgress = codingHistory.length
          ? clamp((acceptedCoding / codingHistory.length) * 100)
          : 0;

        const aptitudeHistory = Array.isArray(aptitudeData?.history)
          ? aptitudeData.history
          : [];
        const latestAptitude = aptitudeHistory[0] || null;
        const aptitudeProgress = latestAptitude
          ? clamp(
              latestAptitude.percentage ??
              (Number(latestAptitude.score) / Math.max(1, Number(latestAptitude.total_score))) * 100
            )
          : 0;

        const interviewHistory = Array.isArray(interviewData?.history)
          ? interviewData.history
          : [];
        const interviewScore = getLatestInterviewScore(interviewHistory);
        const interviewProgress = interviewScore ?? 0;

        const resumeProgress = resumeScore === null ? 0 : 100;
        const readinessParts = [
          resumeProgress,
          codingProgress,
          aptitudeProgress,
          interviewProgress,
        ];
        const careerReadiness = Math.round(
          readinessParts.reduce((sum, value) => sum + value, 0) / readinessParts.length
        );

        setDashboardStats({
          careerReadiness,
          resumeScore,
          jobsMatched,
          interviewScore,
          resumeProgress,
          codingProgress: Math.round(codingProgress),
          aptitudeProgress: Math.round(aptitudeProgress),
          interviewProgress: Math.round(interviewProgress),
        });
      } catch (error) {
        console.error("Failed to load dashboard:", error);

        if (error?.response?.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login");
          return;
        }
      } finally {
        if (mounted) setLoadingStudent(false);
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const getInitial = () => {
    if (!student?.name) return "C";
    return student.name.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="dashboard-container">

        {/* ================= SIDEBAR ================= */}

        <aside className="dashboard-sidebar">

          {/* LOGO */}
          <div className="dashboard-logo">
            <div className="logo-mark">C</div>

            <div className="logo-text">
              <h2>CareerPilot</h2>
              <span>AI</span>
            </div>
          </div>

          <div className="sidebar-label">
            WORKSPACE
          </div>

          {/* NAVIGATION */}

          <nav className="dashboard-nav">

            <button className="nav-item active">
              <span className="nav-icon">⌂</span>
              <span>Dashboard</span>
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/resume-analyzer")}
            >
              <span className="nav-icon">▣</span>
              <span>Resume Analyzer</span>
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/job-matcher")}
            >
              <span className="nav-icon">⌕</span>
              <span>Job Matcher</span>
            </button>

            <button
            className="nav-item"
            onClick={() => navigate("/job-match-history")}
          >
            <span>📜</span>
            Job Match History
          </button>

            <button
              className="nav-item"
              onClick={() => {
               navigate("/skill-gap-analysis")
              }}
            >
              <span>🎯</span>
              <span>Skill Gap</span>
            </button>

            <button
              className="nav-item"
              onClick={() => {
                navigate("/mock-interview")
              }}
            >
              <span>🎤</span>
              <span>Mock Interview</span>
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/coding-practice")}
            >
              <span className="nav-icon">&lt;/&gt;</span>
              <span>Coding Practice</span>
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/aptitude")}
            >
              <span className="nav-icon">✓</span>
              <span>Aptitude Practice</span>
            </button>

           <button
            className="nav-item"
            onClick={() =>{navigate("/resume-builder")}}
          >
            <span>📝</span>
            <span>ATS Resume Builder</span>
    
          </button>

          </nav>

          {/* SIDEBAR BOTTOM */}

          <div className="sidebar-bottom">

            <button
              className="nav-item"
              onClick={() => navigate("/profile")}
            >
              <span className="nav-icon">◯</span>
              <span>Profile</span>
            </button>

            <button
              className="nav-item logout-button"
              onClick={handleLogout}
            >
              <span className="nav-icon">↪</span>
              <span>Logout</span>
            </button>

          </div>

        </aside>


        {/* ================= MAIN ================= */}

        <main className="dashboard-main">

          {/* HEADER */}

          <header className="dashboard-header">

            <div>
              <div className="header-badge">
                STUDENT WORKSPACE
              </div>

              <h1>Dashboard</h1>

              <p>
                Track your preparation and build your career step by step.
              </p>
            </div>

            <div className="header-profile">

              <div className="notification">
                ♢
              </div>

              <div className="profile-avatar">
                {loadingStudent ? "..." : getInitial()}
              </div>

              <div className="profile-info">

                <strong>
                  {loadingStudent
                    ? "Loading..."
                    : student?.name || "Student"}
                </strong>

                <span>
                  {loadingStudent
                    ? "Loading..."
                    : student?.target_role || "Software Engineer"}
                </span>

              </div>

            </div>

          </header>


          {/* ================= WELCOME ================= */}

          <section className="welcome-card">

            <div className="welcome-content">

              <div className="welcome-label">
                YOUR CAREER JOURNEY
              </div>

              <h2>
                Welcome back,
                <br />

                <span>
                  {loadingStudent
                    ? "Student"
                    : student?.name || "Student"}
                </span>
              </h2>

              <p>
                Prepare smarter for your next opportunity with
                AI-powered tools for resumes, skills, interviews,
                coding and aptitude.
              </p>

              <button
                className="primary-button"
                onClick={() => navigate("/resume-analyzer")}
              >
                <span>📄</span>
                Analyze My Resume
                <span className="button-arrow">→</span>
              </button>

            </div>


            {/* AI VISUAL */}

            <div className="welcome-visual">

              <div className="orbit orbit-one"></div>

              <div className="orbit orbit-two"></div>

              <div className="ai-core">
                <span>AI</span>
              </div>

              <div className="floating-dot dot-one"></div>
              <div className="floating-dot dot-two"></div>
              <div className="floating-dot dot-three"></div>

            </div>

          </section>


          {/* ================= STATS ================= */}

          <section className="stats-grid">

            <div className="stat-card">

              <div className="stat-header">
                <span>Career Readiness</span>
                <div className="stat-icon">◆</div>
              </div>

              <h3>{dashboardStats.careerReadiness}%</h3>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${dashboardStats.careerReadiness}%` }}
                />
              </div>

              <p>
                Based on your current preparation activity
              </p>

            </div>


            <div
              className="stat-card clickable"
              onClick={() => navigate("/resume-analyzer")}
            >

              <div className="stat-header">
                <span>Resume Score</span>
                <div className="stat-icon">▣</div>
              </div>

              <h3>
                {dashboardStats.resumeScore === null
                  ? "--"
                  : `${dashboardStats.resumeScore}%`}
              </h3>

              <p>
                {dashboardStats.resumeScore === null
                  ? "Analyze your resume"
                  : "Latest ATS resume score"}
              </p>

            </div>


            <div
              className="stat-card clickable"
              onClick={() => navigate("/job-match-history")}
            >

              <div className="stat-header">
                <span>Jobs Matched</span>
                <div className="stat-icon">⌕</div>
              </div>

              <h3>{dashboardStats.jobsMatched}</h3>

              <p>
                Saved job match analyses
              </p>

            </div>


            <div
              className="stat-card clickable"
              onClick={() => navigate("/mock-interview")}
            >

              <div className="stat-header">
                <span>Interview Score</span>
                <div className="stat-icon">◉</div>
              </div>

              <h3>
                {dashboardStats.interviewScore === null
                  ? "--"
                  : `${dashboardStats.interviewScore}%`}
              </h3>

              <p>
                {dashboardStats.interviewScore === null
                  ? "Take your first mock interview"
                  : "Latest interview score"}
              </p>

            </div>

          </section>


          {/* ================= MAIN GRID ================= */}

          <section className="dashboard-grid">

            {/* QUICK ACTIONS */}

            <div className="dashboard-card">

              <div className="card-heading">

                <div>
                  <h2>Quick Actions</h2>
                  <p>
                    Start your placement preparation
                  </p>
                </div>

                <span className="card-badge">
                  AI TOOLS
                </span>

              </div>


              <div className="quick-actions">

                {/* RESUME */}

                <button
                  onClick={() => navigate("/resume-analyzer")}
                >

                  <span className="action-icon">
                    📄
                  </span>

                  <div>
                    <strong>
                      Analyze Resume
                    </strong>

                    <small>
                      Get AI-powered ATS feedback
                    </small>
                  </div>

                  <b>→</b>

                </button>


                {/* SKILL GAP */}

                <button
                  onClick={() => navigate("/skill-gap-analysis")}
                >

                  <span className="action-icon">
                    🎯
                  </span>

                  <div>
                    <strong>
                      Find Skill Gaps
                    </strong>

                    <small>
                      Discover skills you need
                    </small>
                  </div>

                  <b>→</b>

                </button>


                {/* INTERVIEW */}

                <button
                  onClick={() => navigate("/mock-interview")}
                >

                  <span className="action-icon">
                    🎤
                  </span>

                  <div>
                    <strong>
                      Practice Interview
                    </strong>

                    <small>
                      Prepare with AI mock interviews
                    </small>
                  </div>

                  <b>→</b>

                </button>


                {/* CODING */}

                <button
                  onClick={() => navigate("/coding-practice")}
                >

                  <span className="action-icon">
                    💻
                  </span>

                  <div>
                    <strong>
                      Coding Practice
                    </strong>

                    <small>
                      Improve your programming skills
                    </small>
                  </div>

                  <b>→</b>

                </button>

              </div>

            </div>


            {/* PREPARATION */}

            <div className="dashboard-card">

              <div className="card-heading">

                <div>
                  <h2>
                    Preparation Progress
                  </h2>

                  <p>
                    Your current activity
                  </p>
                </div>

                <span className="card-badge">
                  {dashboardStats.careerReadiness}%
                </span>

              </div>


              <div className="progress-list">

                <div className="progress-item">

                  <div className="progress-label">
                    <span>Resume</span>
                    <strong>{dashboardStats.resumeProgress}%</strong>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${dashboardStats.resumeProgress}%` }}
                    />
                  </div>

                </div>


                <div className="progress-item">

                  <div className="progress-label">
                    <span>Coding</span>
                    <strong>{dashboardStats.codingProgress}%</strong>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${dashboardStats.codingProgress}%` }}
                    />
                  </div>

                </div>


                <div className="progress-item">

                  <div className="progress-label">
                    <span>Aptitude</span>
                    <strong>{dashboardStats.aptitudeProgress}%</strong>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${dashboardStats.aptitudeProgress}%` }}
                    />
                  </div>

                </div>


                <div className="progress-item">

                  <div className="progress-label">
                    <span>Interview</span>
                    <strong>{dashboardStats.interviewProgress}%</strong>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${dashboardStats.interviewProgress}%` }}
                    />
                  </div>

                </div>

              </div>


              <div className="progress-message">
                <span>💡</span>

                <div>
                  <strong>
                    Your journey starts here
                  </strong>

                  <p>
                    Complete resume analysis, coding, aptitude, and interview practice to build your preparation profile.
                  </p>
                </div>
              </div>

            </div>

          </section>


          {/* ================= AI RECOMMENDATION ================= */}

          <section className="recommendation-card">

            <div className="recommendation-icon">
              ✨
            </div>

            <div className="recommendation-content">

              <span>
                AI RECOMMENDATION
              </span>

              <h2>
                Continue building your preparation profile
              </h2>

              <p>
                Your dashboard updates automatically from the activities completed in your student account. Continue using the preparation tools to improve your progress.
              </p>

            </div>

            <button
              className="secondary-button"
              onClick={() => navigate("/resume-analyzer")}
            >
              Get Started →
            </button>

          </section>

        </main>

      </div>


      {/* ================= CSS ================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .dashboard-container {
          min-height: 100vh;
          display: flex;
          background: #08090d;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
        }


        /* ================= SIDEBAR ================= */

        .dashboard-sidebar {
          width: 260px;
          min-height: 100vh;
          background: #0c0d12;
          border-right: 1px solid #20212c;
          padding: 24px 14px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .dashboard-logo {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 4px 12px 30px;
        }

        .logo-mark {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            #7657ff,
            #9b7cff
          );
          font-size: 20px;
          font-weight: 800;
          box-shadow:
            0 0 25px rgba(118, 87, 255, 0.35);
        }

        .logo-text {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .logo-text h2 {
          margin: 0;
          font-size: 18px;
        }

        .logo-text span {
          color: #8c72ff;
          font-size: 10px;
          font-weight: 800;
        }

        .sidebar-label {
          color: #5f6170;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.7px;
          padding: 0 13px 12px;
        }

        .dashboard-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          width: 100%;
          border: 1px solid transparent;
          background: transparent;
          color: #858795;
          padding: 11px 12px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 12px;
          text-align: left;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background: #151620;
          color: #ffffff;
          border-color: #242532;
        }

        .nav-item.active {
          background: linear-gradient(
            90deg,
            #211a38,
            #171421
          );
          color: #ffffff;
          border-color: #302651;
        }

        .nav-icon {
          width: 22px;
          text-align: center;
          color: #8c72ff;
          font-size: 14px;
          font-weight: bold;
        }

        .sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid #20212b;
          padding-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .logout-button:hover {
          color: #ff7070;
        }


        /* ================= MAIN ================= */

        .dashboard-main {
          flex: 1;
          padding: 30px 38px 55px;
          overflow-x: hidden;
          max-width: 1600px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .header-badge {
          color: #8c72ff;
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 800;
          margin-bottom: 7px;
        }

        .dashboard-header h1 {
          margin: 0 0 7px;
          font-size: 29px;
          letter-spacing: -0.5px;
        }

        .dashboard-header p {
          margin: 0;
          color: #777988;
          font-size: 13px;
        }

        .header-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notification {
          width: 38px;
          height: 38px;
          border: 1px solid #282936;
          border-radius: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #aaa;
          background: #101117;
        }

        .profile-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #7657ff,
            #a184ff
          );
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: bold;
          box-shadow: 0 0 18px rgba(118, 87, 255, 0.25);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .profile-info strong {
          font-size: 13px;
        }

        .profile-info span {
          font-size: 10px;
          color: #777988;
        }


        /* ================= WELCOME ================= */

        .welcome-card {
          min-height: 270px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 85% 50%,
              rgba(118, 87, 255, 0.25),
              transparent 32%
            ),
            linear-gradient(
              135deg,
              #18132a,
              #0f1017
            );
          border: 1px solid #2b2440;
          border-radius: 20px;
          padding: 38px 42px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(118, 87, 255, 0.03)
            );
          pointer-events: none;
        }

        .welcome-content {
          position: relative;
          z-index: 2;
          max-width: 650px;
        }

        .welcome-label {
          color: #917aff;
          font-size: 9px;
          letter-spacing: 1.8px;
          font-weight: 800;
        }

        .welcome-content h2 {
          font-size: 32px;
          line-height: 1.15;
          margin: 11px 0;
          letter-spacing: -0.8px;
        }

        .welcome-content h2 span {
          color: #927aff;
        }

        .welcome-content p {
          color: #9293a0;
          max-width: 590px;
          line-height: 1.65;
          font-size: 13px;
          margin: 0 0 22px;
        }

        .primary-button {
          border: none;
          border-radius: 10px;
          padding: 13px 18px;
          background: linear-gradient(
            135deg,
            #7657ff,
            #8d6fff
          );
          color: white;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          box-shadow:
            0 10px 25px rgba(118, 87, 255, 0.22);
          transition: all 0.25s ease;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 14px 30px rgba(118, 87, 255, 0.35);
        }

        .button-arrow {
          font-size: 16px;
          margin-left: 3px;
        }


        /* ================= AI VISUAL ================= */

        .welcome-visual {
          width: 260px;
          height: 230px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-core {
          width: 105px;
          height: 105px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              #21174a,
              #110e1d
            );
          border: 1px solid #856cff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 35px rgba(118, 87, 255, 0.35),
            inset 0 0 30px rgba(118, 87, 255, 0.15);
          position: relative;
          z-index: 3;
        }

        .ai-core span {
          color: #b0a0ff;
          font-size: 25px;
          font-weight: 800;
          text-shadow:
            0 0 15px rgba(170, 150, 255, 0.7);
        }

        .orbit {
          position: absolute;
          border: 1px solid rgba(134, 109, 255, 0.4);
          border-radius: 50%;
        }

        .orbit-one {
          width: 155px;
          height: 155px;
          transform: rotate(30deg);
        }

        .orbit-two {
          width: 210px;
          height: 95px;
          transform: rotate(-25deg);
        }

        .floating-dot {
          width: 6px;
          height: 6px;
          position: absolute;
          border-radius: 50%;
          background: #9b85ff;
          box-shadow:
            0 0 12px #7657ff;
        }

        .dot-one {
          top: 32px;
          right: 48px;
        }

        .dot-two {
          bottom: 35px;
          left: 35px;
        }

        .dot-three {
          top: 80px;
          left: 15px;
        }


        /* ================= STATS ================= */

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-top: 20px;
        }

        .stat-card {
          background: #101117;
          border: 1px solid #20212b;
          border-radius: 14px;
          padding: 19px;
          transition: all 0.2s ease;
        }

        .stat-card.clickable {
          cursor: pointer;
        }

        .stat-card:hover {
          border-color: #393151;
          transform: translateY(-2px);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          color: #888a97;
          font-size: 11px;
        }

        .stat-icon {
          color: #8c72ff;
        }

        .stat-card h3 {
          font-size: 27px;
          margin: 15px 0 10px;
        }

        .stat-card p {
          color: #686a77;
          font-size: 10px;
          margin: 10px 0 0;
        }


        /* ================= PROGRESS ================= */

        .progress-bar {
          width: 100%;
          height: 5px;
          background: #252630;
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            #7657ff,
            #a28dff
          );
          border-radius: 10px;
        }


        /* ================= GRID ================= */

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }

        .dashboard-card {
          background: #101117;
          border: 1px solid #20212b;
          border-radius: 15px;
          padding: 22px;
        }

        .card-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .card-heading h2 {
          font-size: 16px;
          margin: 0 0 5px;
        }

        .card-heading p {
          color: #696b78;
          font-size: 10px;
          margin: 0;
        }

        .card-badge {
          color: #927cff;
          background: #1d1830;
          border: 1px solid #302651;
          border-radius: 20px;
          padding: 5px 8px;
          font-size: 8px;
          font-weight: 700;
        }


        /* ================= QUICK ACTIONS ================= */

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .quick-actions button {
          width: 100%;
          border: 1px solid transparent;
          background: #15161e;
          color: white;
          border-radius: 10px;
          padding: 13px;
          display: flex;
          align-items: center;
          gap: 13px;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .quick-actions button:hover {
          border-color: #393151;
          background: #1a1824;
          transform: translateX(2px);
        }

        .action-icon {
          width: 37px;
          height: 37px;
          flex-shrink: 0;
          border-radius: 9px;
          background: #211b38;
          color: #967fff;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
        }

        .quick-actions button div {
          flex: 1;
        }

        .quick-actions strong {
          display: block;
          font-size: 12px;
        }

        .quick-actions small {
          display: block;
          color: #696b78;
          font-size: 10px;
          margin-top: 4px;
        }

        .quick-actions b {
          color: #686a77;
          font-size: 16px;
        }


        /* ================= PREPARATION ================= */

        .progress-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 7px;
          font-size: 11px;
        }

        .progress-label strong {
          color: #8c72ff;
        }

        .progress-message {
          display: flex;
          gap: 12px;
          margin-top: 22px;
          padding: 13px;
          border-radius: 10px;
          background: #151321;
          border: 1px solid #28223b;
        }

        .progress-message > span {
          font-size: 17px;
        }

        .progress-message strong {
          display: block;
          font-size: 10px;
          color: #aaa0d9;
          margin-bottom: 4px;
        }

        .progress-message p {
          margin: 0;
          color: #666875;
          font-size: 9px;
          line-height: 1.5;
        }


        /* ================= RECOMMENDATION ================= */

        .recommendation-card {
          margin-top: 20px;
          padding: 20px;
          background:
            linear-gradient(
              135deg,
              #151226,
              #111118
            );
          border: 1px solid #2b2543;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 17px;
        }

        .recommendation-icon {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #251d42;
          color: #a08bff;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 18px;
        }

        .recommendation-content {
          flex: 1;
        }

        .recommendation-content span {
          color: #8c72ff;
          font-size: 8px;
          letter-spacing: 1.2px;
          font-weight: 800;
        }

        .recommendation-content h2 {
          font-size: 14px;
          margin: 6px 0;
        }

        .recommendation-content p {
          color: #777988;
          font-size: 10px;
          line-height: 1.5;
          margin: 0;
        }

        .secondary-button {
          border: none;
          border-radius: 9px;
          padding: 11px 15px;
          background: #7657ff;
          color: white;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .secondary-button:hover {
          background: #896fff;
          transform: translateY(-1px);
        }


        /* ================= RESPONSIVE ================= */

        @media (max-width: 1200px) {

          .dashboard-sidebar {
            width: 230px;
          }

          .dashboard-main {
            padding: 25px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

        }


        @media (max-width: 850px) {

          .dashboard-sidebar {
            width: 72px;
            padding: 20px 9px;
          }

          .logo-text,
          .sidebar-label,
          .nav-item > span:last-child {
            display: none;
          }

          .dashboard-logo {
            justify-content: center;
            padding: 5px 0 30px;
          }

          .nav-item {
            justify-content: center;
            padding: 12px;
          }

          .nav-icon {
            width: auto;
          }

          .dashboard-main {
            padding: 20px;
          }

          .welcome-card {
            padding: 28px;
          }

          .welcome-visual {
            display: none;
          }

        }


        @media (max-width: 600px) {

          .dashboard-main {
            padding: 15px;
          }

          .dashboard-header {
            align-items: flex-start;
          }

          .header-profile {
            display: none;
          }

          .dashboard-header h1 {
            font-size: 24px;
          }

          .welcome-content h2 {
            font-size: 25px;
          }

          .welcome-card {
            min-height: auto;
            padding: 25px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .recommendation-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .secondary-button {
            width: 100%;
          }

        }

      `}</style>
    </>
  );
}

export default Dashboard;