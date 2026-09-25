import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "https://careerpilot-ai-pcqc.onrender.com";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    target_role: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.password) {
      setError("Please create a password.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (!form.college.trim()) {
      setError("Please enter your college or university.");
      return;
    }

    if (!form.target_role.trim()) {
      setError("Please enter your target job role.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          college: form.college.trim(),
          target_role: form.target_role.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Registration could not be completed."
        );
      }

      navigate("/login", {
        replace: true,
        state: {
          successMessage:
            "Registration successful! Your student account has been created. Please login to continue.",
        },
      });
    } catch (err) {
      console.error("Registration error:", err);

      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Unable to create your account. Please try again.";

      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-glow register-glow-one" />
      <div className="register-glow register-glow-two" />

      <div className="register-shell">
        <div className="brand-block">
          <Link to="/" className="brand-link">
            <div className="brand-mark">CP</div>

            <div>
              <h1>
                CareerPilot<span>-AI</span>
              </h1>
              <p>Student Career Preparation Platform</p>
            </div>
          </Link>
        </div>

        <div className="register-card">
          <div className="card-header">
            <p className="eyebrow">JOIN CAREERPILOT</p>
            <h2>Create your student account</h2>
            <p className="subtitle">
              Create your account to access resume tools, job matching,
              aptitude, mock interviews, and coding practice.
            </p>
          </div>

          {error ? (
            <div className="error-box">
              <span>!</span>
              <p>{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleRegister}>
            <div className="field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div className="field">
              <label htmlFor="college">College / University</label>
              <input
                id="college"
                name="college"
                type="text"
                placeholder="Enter your college or university"
                value={form.college}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="target_role">Target Job Role</label>
              <input
                id="target_role"
                name="target_role"
                type="text"
                placeholder="e.g. Software Engineer"
                value={form.target_role}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Student Account
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span />
            <p>ALREADY REGISTERED?</p>
            <span />
          </div>

          <Link to="/login" className="login-link-button">
            Login to your account
          </Link>

          <Link to="/" className="back-home">
            ← Back to Home
          </Link>
        </div>

        <p className="footer-note">
          CareerPilot-AI • Built for students preparing for placements
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; }

        .register-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 18px;
          background:
            radial-gradient(circle at 15% 15%, rgba(124, 58, 237, 0.20), transparent 28%),
            radial-gradient(circle at 85% 85%, rgba(79, 70, 229, 0.16), transparent 30%),
            #070712;
          color: #f8f7ff;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .register-glow {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(4px);
        }

        .register-glow-one {
          width: 300px;
          height: 300px;
          left: -150px;
          top: -120px;
          background: rgba(139, 92, 246, 0.07);
          box-shadow: 0 0 120px rgba(139, 92, 246, 0.18);
        }

        .register-glow-two {
          width: 280px;
          height: 280px;
          right: -130px;
          bottom: -120px;
          background: rgba(99, 102, 241, 0.06);
          box-shadow: 0 0 120px rgba(99, 102, 241, 0.16);
        }

        .register-shell {
          width: 100%;
          max-width: 520px;
          position: relative;
          z-index: 2;
        }

        .brand-block {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .brand-link {
          display: flex;
          align-items: center;
          gap: 13px;
          text-decoration: none;
          color: inherit;
        }

        .brand-mark {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          box-shadow: 0 14px 35px rgba(99, 102, 241, 0.28);
          color: #fff;
          font-size: 16px;
          font-weight: 900;
        }

        .brand-link h1 {
          margin: 0;
          font-size: 23px;
          line-height: 1;
          letter-spacing: -0.5px;
        }

        .brand-link h1 span {
          color: #a78bfa;
        }

        .brand-link p {
          margin: 5px 0 0;
          color: #888ba5;
          font-size: 12px;
        }

        .register-card {
          padding: 30px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          background: rgba(18, 18, 31, 0.92);
          box-shadow: 0 24px 80px rgba(0,0,0,0.42);
          backdrop-filter: blur(18px);
        }

        .card-header {
          margin-bottom: 22px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #a78bfa;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .card-header h2 {
          margin: 0;
          font-size: 30px;
          line-height: 1.12;
        }

        .subtitle {
          margin: 10px 0 0;
          color: #9799ae;
          font-size: 14px;
          line-height: 1.65;
        }

        .error-box {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 18px;
          padding: 12px 14px;
          border: 1px solid rgba(248, 113, 113, 0.25);
          border-radius: 12px;
          background: rgba(127, 29, 29, 0.18);
          color: #fca5a5;
        }

        .error-box span {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 50%;
          background: rgba(248,113,113,0.18);
          font-weight: 800;
        }

        .error-box p {
          margin: 2px 0 0;
          font-size: 13px;
          line-height: 1.5;
        }

        .field {
          margin-bottom: 15px;
        }

        .field label {
          display: block;
          margin-bottom: 7px;
          color: #dedff1;
          font-size: 13px;
          font-weight: 700;
        }

        .field input {
          width: 100%;
          height: 48px;
          padding: 0 14px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          outline: none;
          background: rgba(255,255,255,0.035);
          color: #f7f7ff;
          font-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .field input::placeholder {
          color: #62657c;
        }

        .field input:focus {
          border-color: rgba(139, 92, 246, 0.72);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
          background: rgba(255,255,255,0.05);
        }

        .register-button {
          width: 100%;
          min-height: 50px;
          margin-top: 6px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 16px 35px rgba(99, 102, 241, 0.22);
        }

        .register-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 22px 0 14px;
        }

        .divider span {
          height: 1px;
          flex: 1;
          background: rgba(255,255,255,0.08);
        }

        .divider p {
          margin: 0;
          color: #666980;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .login-link-button {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(139,92,246,0.35);
          border-radius: 12px;
          color: #c4b5fd;
          background: rgba(139,92,246,0.08);
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
        }

        .back-home {
          display: block;
          margin: 15px auto 0;
          color: #777a93;
          text-decoration: none;
          font-size: 13px;
          text-align: center;
        }

        .footer-note {
          margin: 18px 0 0;
          color: #5d6077;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 600px) {
          .register-page {
            align-items: flex-start;
            padding: 22px 14px;
          }

          .register-card {
            padding: 22px;
          }

          .card-header h2 {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}

export default Register;
