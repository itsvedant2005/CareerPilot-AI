import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          CareerPilot<span>-AI</span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>

          <Link to="/login" className="login-btn">
            Login
          </Link>

          <Link to="/register" className="register-btn">
            Get Started
          </Link>
        </div>
      </nav>


      {/* Hero Section */}
      <section className="hero">

        <div className="hero-content">

          <div className="badge">
            AI-POWERED CAREER PLATFORM
          </div>

          <h1>
            Your Career.
            <br />
            <span>Your AI Copilot.</span>
          </h1>

          <p>
            Prepare smarter for placements with AI-powered resume analysis,
            mock interviews, skill-gap analysis and personalized career guidance.
          </p>

          <div className="hero-buttons">

            <Link to="/register" className="primary-btn">
              Start Your Journey
            </Link>

            <a href="#features" className="secondary-btn">
              Explore Features
            </a>

          </div>

        </div>


        {/* Career Score Card */}
        <div className="hero-card">

          <div className="card-header">
            <span>Career Readiness</span>
            <span className="status">LIVE</span>
          </div>

          <div className="score">
            <strong>78</strong>
            <span>/100</span>
          </div>

          <p>Overall Career Score</p>

          <div className="progress">
            <div></div>
          </div>

          <div className="stats">

            <div>
              <strong>86%</strong>
              <span>Resume</span>
            </div>

            <div>
              <strong>72%</strong>
              <span>Skills</span>
            </div>

            <div>
              <strong>75%</strong>
              <span>Interview</span>
            </div>

          </div>

        </div>

      </section>


      {/* Features */}
      <section id="features" className="features-section">

        <div className="section-heading">

          <span>POWERFUL TOOLS</span>

          <h2>
            Everything you need to prepare.
          </h2>

          <p>
            One platform for your complete placement preparation journey.
          </p>

        </div>


        <div className="feature-grid">

          <Feature
            icon="01"
            title="AI Resume Analyzer"
            description="Analyze your resume and get actionable ATS and improvement suggestions."
          />

          <Feature
            icon="02"
            title="Job Matcher"
            description="Compare your resume with job descriptions and discover missing skills."
          />

          <Feature
            icon="03"
            title="Skill Gap Analysis"
            description="Identify the skills you need and get a personalized learning roadmap."
          />

          <Feature
            icon="04"
            title="AI Mock Interview"
            description="Practice interviews with AI and receive detailed feedback."
          />

          <Feature
            icon="05"
            title="Coding Practice"
            description="Improve your coding skills with placement-focused problems."
          />

          <Feature
            icon="06"
            title="Aptitude Practice"
            description="Prepare for quantitative, logical and verbal aptitude tests."
          />

          <Feature
            icon="07"
            title="Resume Builder"
            description="Create a professional ATS-friendly resume with AI assistance."
          />

          <Feature
            icon="08"
            title="Progress Tracking"
            description="Track your placement preparation and see how you are improving."
          />

        </div>

      </section>


      {/* About */}
      <section id="about" className="about-section">

        <div>

          <span>ABOUT CAREERPILOT</span>

          <h2>
            Stop guessing.
            <br />
            Start preparing.
          </h2>

          <p>
            CareerPilot-AI brings your placement preparation tools together
            in one intelligent platform. Upload your resume, discover your
            skill gaps, practice interviews and continuously improve.
          </p>

          <Link to="/register" className="primary-btn">
            Create Free Account
          </Link>

        </div>

      </section>


      {/* Footer */}
      <footer>

        <div className="logo">
          CareerPilot<span>-AI</span>
        </div>

        <p>
          AI-powered placement preparation for students.
        </p>

        <p className="copyright">
          Copyright 2026 CareerPilot-AI. All rights reserved.
        </p>

      </footer>

    </div>
  );
}


/* Feature Component */
function Feature({ icon, title, description }) {
  return (
    <div className="feature-card">

      <div className="feature-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>

      <span className="feature-arrow">
        →
      </span>

    </div>
  );
}


export default Home;