import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = "https://careerpilot-ai-pcqc.onrender.com";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const message = location.state?.successMessage;

    if (message) {
      setSuccess(message);

      // Clear the navigation state so the message does not reappear
      // after a later refresh/navigation back to Login.
      navigate("/login", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const token = response.data?.access_token;

      if (!token) {
        throw new Error("Login token was not returned by the server.");
      }

      localStorage.setItem("access_token", token);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to login. Please check your email and password.";

      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <div className="login-shell">
        <div className="brand-block">
          <div className="brand-mark">CP</div>

          <div>
            <h1>
              CareerPilot<span>-AI</span>
            </h1>
            <p>Student Career Preparation Platform</p>
          </div>
        </div>

        <div className="login-card">
          <div className="card-header">
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Login to your account</h2>
            <p className="subtitle">
              Continue your career preparation journey with CareerPilot-AI.
            </p>
          </div>

          {success ? (
            <div className="success-box">
              <span>✓</span>
              <p>{success}</p>
            </div>
          ) : null}

          {error ? (
            <div className="error-box">
              <span>!</span>
              <p>{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <span className="input-icon">●</span>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="card-divider">
            <span />
            <p>NEW TO CAREERPILOT?</p>
            <span />
          </div>

          <button
            type="button"
            className="register-button"
            onClick={() => navigate("/register")}
          >
            Create Student Account
          </button>

          <button
            type="button"
            className="back-home"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>
        </div>

        <p className="footer-note">
          CareerPilot-AI • Built for students preparing for placements
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; }

        .login-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 18px;
          background:
            radial-gradient(circle at 15% 20%, rgba(124, 58, 237, 0.20), transparent 28%),
            radial-gradient(circle at 85% 80%, rgba(79, 70, 229, 0.16), transparent 30%),
            #070712;
          color: #f8f7ff;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .background-orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(2px);
        }

        .orb-one {
          width: 320px;
          height: 320px;
          top: -150px;
          left: -130px;
          background: rgba(124, 58, 237, 0.08);
          box-shadow: 0 0 120px rgba(124, 58, 237, 0.18);
        }

        .orb-two {
          width: 260px;
          height: 260px;
          right: -100px;
          bottom: -90px;
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 120px rgba(99, 102, 241, 0.16);
        }

        .login-shell {
          width: 100%;
          max-width: 470px;
          position: relative;
          z-index: 2;
        }

        .brand-block {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          margin-bottom: 22px;
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
          letter-spacing: 0.7px;
        }

        .brand-block h1 {
          margin: 0;
          font-size: 23px;
          line-height: 1;
          letter-spacing: -0.5px;
        }

        .brand-block h1 span {
          color: #a78bfa;
        }

        .brand-block p {
          margin: 5px 0 0;
          color: #888ba5;
          font-size: 12px;
        }

        .login-card {
          padding: 30px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          background: rgba(18, 18, 31, 0.92);
          box-shadow: 0 24px 80px rgba(0,0,0,0.42);
          backdrop-filter: blur(18px);
        }

        .card-header { margin-bottom: 22px; }

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

        .success-box,
        .error-box {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 12px;
        }

        .success-box {
          border: 1px solid rgba(52, 211, 153, 0.28);
          background: rgba(6, 78, 59, 0.20);
          color: #86efac;
        }

        .error-box {
          border: 1px solid rgba(248, 113, 113, 0.25);
          background: rgba(127, 29, 29, 0.18);
          color: #fca5a5;
        }

        .success-box span,
        .error-box span {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 50%;
          font-weight: 800;
        }

        .success-box span { background: rgba(52, 211, 153, 0.16); }
        .error-box span { background: rgba(248, 113, 113, 0.18); }

        .success-box p,
        .error-box p {
          margin: 2px 0 0;
          font-size: 13px;
          line-height: 1.5;
        }

        .field { margin-bottom: 16px; }

        .field label {
          display: block;
          margin-bottom: 7px;
          color: #dedff1;
          font-size: 13px;
          font-weight: 700;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #6f728a;
          font-size: 13px;
          z-index: 1;
          pointer-events: none;
        }

        .field input {
          width: 100%;
          height: 48px;
          padding: 0 14px 0 40px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          outline: none;
          background: rgba(255,255,255,0.035);
          color: #f7f7ff;
          font-size: 14px;
        }

        .field input::placeholder { color: #62657c; }

        .field input:focus {
          border-color: rgba(139, 92, 246, 0.72);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
        }

        .login-button,
        .register-button {
          width: 100%;
          min-height: 50px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
        }

        .login-button {
          border: 0;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 16px 35px rgba(99, 102, 241, 0.22);
        }

        .login-button:disabled { opacity: 0.65; cursor: not-allowed; }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .card-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 22px 0 14px;
        }

        .card-divider span {
          height: 1px;
          flex: 1;
          background: rgba(255,255,255,0.08);
        }

        .card-divider p {
          margin: 0;
          color: #666980;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .register-button {
          border: 1px solid rgba(139,92,246,0.35);
          background: rgba(139,92,246,0.08);
          color: #c4b5fd;
        }

        .back-home {
          display: block;
          margin: 15px auto 0;
          border: 0;
          background: transparent;
          color: #777a93;
          font-size: 13px;
          cursor: pointer;
        }

        .footer-note {
          margin: 18px 0 0;
          color: #5d6077;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 600px) {
          .login-page { align-items: flex-start; padding: 22px 14px; }
          .login-card { padding: 22px; }
          .card-header h2 { font-size: 26px; }
        }
      `}</style>
    </div>
  );
}

export default Login;
