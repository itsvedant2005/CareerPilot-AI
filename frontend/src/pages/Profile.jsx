import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [targetRole, setTargetRole] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =====================================================
  // GET CURRENT STUDENT PROFILE
  // =====================================================

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;

        setStudent(data);

        setName(data.name || "");
        setCollege(data.college || "");
        setTargetRole(data.target_role || "");
      } catch (error) {
        console.error("Profile loading error:", error);

        localStorage.removeItem("access_token");

        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSave = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!name.trim()) {
      setMessage("Name cannot be empty.");
      setMessageType("error");
      return;
    }

    if (!college.trim()) {
      setMessage("College cannot be empty.");
      setMessageType("error");
      return;
    }

    if (!targetRole.trim()) {
      setMessage("Target role cannot be empty.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      await axios.put(
        "http://127.0.0.1:8000/api/auth/me",
        {
          name: name.trim(),
          college: college.trim(),
          target_role: targetRole.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update displayed profile immediately
      setStudent((previous) => ({
        ...previous,
        name: name.trim(),
        college: college.trim(),
        target_role: targetRole.trim(),
      }));

      setMessage("Profile updated successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Profile update error:", error);

      setMessage(
        error.response?.data?.detail ||
          "Failed to update profile. Please try again."
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="profile-loading">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }

  // =====================================================
  // PROFILE PAGE
  // =====================================================

  return (
    <>
      <style>{styles}</style>

      <div className="profile-page">

        {/* ===============================================
            HEADER
        =============================================== */}

        <header className="profile-header">

          <div className="header-left">

            <div className="page-badge">
              PROFILE
            </div>

            <h1>My Profile</h1>

            <p>
              Manage your CareerPilot-AI profile information.
            </p>

          </div>

          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            <span>←</span>
            Dashboard
          </button>

        </header>


        {/* ===============================================
            MAIN PROFILE CONTENT
        =============================================== */}

        <main className="profile-layout">

          {/* =============================================
              PROFILE SUMMARY
          ============================================= */}

          <section className="profile-card profile-summary">

            <div className="avatar-container">

              <div className="large-avatar">
                {student?.name
                  ? student.name.charAt(0).toUpperCase()
                  : "S"}
              </div>

              <div className="online-dot"></div>

            </div>


            <h2>
              {student?.name || "Student"}
            </h2>

            <p className="target-role">
              {student?.target_role || "Target Role"}
            </p>


            <div className="profile-line"></div>


            {/* EMAIL */}

            <div className="summary-item">

              <div className="summary-icon">
                @
              </div>

              <div>
                <span>Email</span>

                <strong>
                  {student?.email || "Not available"}
                </strong>
              </div>

            </div>


            {/* COLLEGE */}

            <div className="summary-item">

              <div className="summary-icon">
                C
              </div>

              <div>
                <span>College</span>

                <strong>
                  {student?.college || "Not available"}
                </strong>
              </div>

            </div>


            {/* TARGET ROLE */}

            <div className="summary-item">

              <div className="summary-icon">
                R
              </div>

              <div>
                <span>Target Role</span>

                <strong>
                  {student?.target_role || "Not available"}
                </strong>
              </div>

            </div>


            <div className="profile-status">

              <div className="status-dot"></div>

              <span>
                Career profile active
              </span>

            </div>

          </section>


          {/* =============================================
              EDIT PROFILE
          ============================================= */}

          <section className="profile-card edit-card">

            <div className="card-title">

              <div>

                <div className="section-label">
                  ACCOUNT SETTINGS
                </div>

                <h2>
                  Personal Information
                </h2>

                <p>
                  Keep your information up to date so
                  CareerPilot-AI can personalize your
                  career preparation.
                </p>

              </div>

            </div>


            <form
              className="profile-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >

              {/* NAME */}

              <div className="form-group">

                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setMessage("");
                  }}
                  placeholder="Enter your full name"
                />

              </div>


              {/* EMAIL */}

              <div className="form-group">

                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={student?.email || ""}
                  disabled
                />

                <small>
                  Your registered email address cannot be changed.
                </small>

              </div>


              {/* COLLEGE */}

              <div className="form-group">

                <label htmlFor="college">
                  College / University
                </label>

                <input
                  id="college"
                  type="text"
                  value={college}
                  onChange={(e) => {
                    setCollege(e.target.value);
                    setMessage("");
                  }}
                  placeholder="Enter your college or university"
                />

              </div>


              {/* TARGET ROLE */}

              <div className="form-group">

                <label htmlFor="targetRole">
                  Target Job Role
                </label>

                <input
                  id="targetRole"
                  type="text"
                  value={targetRole}
                  onChange={(e) => {
                    setTargetRole(e.target.value);
                    setMessage("");
                  }}
                  placeholder="Example: Software Engineer"
                />

                <small>
                  This helps CareerPilot-AI personalize your
                  job matching and skill recommendations.
                </small>

              </div>


              {/* MESSAGE */}

              {message && (
                <div
                  className={`profile-message ${
                    messageType === "success"
                      ? "success-message"
                      : "error-message"
                  }`}
                >
                  <span>
                    {messageType === "success" ? "✓" : "!"}
                  </span>

                  {message}
                </div>
              )}


              {/* SAVE */}

              <div className="form-actions">

                <button
                  type="submit"
                  className="save-profile-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                      <span>→</span>
                    </>
                  )}
                </button>

              </div>

            </form>

          </section>

        </main>

      </div>
    </>
  );
}


/* =========================================================
   CSS
   Everything is intentionally inside Profile.jsx
========================================================= */

const styles = `

* {
  box-sizing: border-box;
}

.profile-page {
  min-height: 100vh;

  background:
    radial-gradient(
      circle at 80% 10%,
      rgba(118, 87, 255, 0.08),
      transparent 30%
    ),
    #08090d;

  color: #ffffff;

  padding: 35px 45px;

  font-family:
    Arial,
    Helvetica,
    sans-serif;
}


/* =====================================================
   HEADER
===================================================== */

.profile-header {
  max-width: 1100px;

  margin: 0 auto 32px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.page-badge {
  color: #8c72ff;

  font-size: 10px;

  font-weight: bold;

  letter-spacing: 2px;

  margin-bottom: 8px;
}

.profile-header h1 {
  margin: 0 0 7px;

  font-size: 30px;

  letter-spacing: -0.5px;
}

.profile-header p {
  margin: 0;

  color: #777988;

  font-size: 13px;
}


/* =====================================================
   BACK BUTTON
===================================================== */

.back-button {
  display: flex;

  align-items: center;

  gap: 9px;

  background: #15161e;

  color: #ffffff;

  border: 1px solid #292a35;

  padding: 11px 17px;

  border-radius: 9px;

  cursor: pointer;

  font-size: 13px;

  transition: 0.2s;
}

.back-button:hover {
  background: #1d1a2a;

  border-color: #7657ff;

  transform: translateY(-1px);
}

.back-button span {
  color: #9b85ff;

  font-size: 17px;
}


/* =====================================================
   MAIN LAYOUT
===================================================== */

.profile-layout {
  max-width: 1100px;

  margin: 0 auto;

  display: grid;

  grid-template-columns: 340px 1fr;

  gap: 22px;

  align-items: start;
}


/* =====================================================
   CARD
===================================================== */

.profile-card {
  background:
    linear-gradient(
      145deg,
      #111219,
      #0f1016
    );

  border: 1px solid #20212b;

  border-radius: 17px;

  padding: 28px;

  box-shadow:
    0 15px 40px rgba(0, 0, 0, 0.18);
}


/* =====================================================
   PROFILE SUMMARY
===================================================== */

.profile-summary {
  text-align: center;

  position: relative;

  overflow: hidden;
}

.profile-summary::before {
  content: "";

  position: absolute;

  width: 180px;

  height: 180px;

  border-radius: 50%;

  background: rgba(118, 87, 255, 0.06);

  top: -90px;

  left: 50%;

  transform: translateX(-50%);
}


/* =====================================================
   AVATAR
===================================================== */

.avatar-container {
  position: relative;

  width: 94px;

  height: 94px;

  margin: 0 auto 18px;
}

.large-avatar {
  width: 94px;

  height: 94px;

  border-radius: 50%;

  background:
    linear-gradient(
      135deg,
      #7657ff,
      #4e38c8
    );

  display: flex;

  align-items: center;

  justify-content: center;

  color: white;

  font-size: 34px;

  font-weight: bold;

  box-shadow:
    0 0 35px rgba(118, 87, 255, 0.28);
}

.online-dot {
  position: absolute;

  width: 13px;

  height: 13px;

  background: #6ee7a0;

  border: 3px solid #101117;

  border-radius: 50%;

  right: 3px;

  bottom: 4px;
}

.profile-summary h2 {
  position: relative;

  margin: 0 0 7px;

  font-size: 21px;
}

.target-role {
  position: relative;

  margin: 0;

  color: #8c72ff;

  font-size: 13px;

  font-weight: 500;
}


/* =====================================================
   DIVIDER
===================================================== */

.profile-line {
  height: 1px;

  background: #252630;

  margin: 25px 0;
}


/* =====================================================
   SUMMARY ITEMS
===================================================== */

.summary-item {
  display: flex;

  align-items: center;

  gap: 12px;

  text-align: left;

  margin-bottom: 18px;
}

.summary-icon {
  flex-shrink: 0;

  width: 35px;

  height: 35px;

  border-radius: 9px;

  background: #1c1830;

  color: #967fff;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 12px;

  font-weight: bold;
}

.summary-item div:last-child {
  min-width: 0;
}

.summary-item span {
  display: block;

  color: #666875;

  font-size: 10px;

  margin-bottom: 5px;
}

.summary-item strong {
  display: block;

  color: #d5d5dc;

  font-size: 12px;

  font-weight: 500;

  word-break: break-word;
}


/* =====================================================
   PROFILE STATUS
===================================================== */

.profile-status {
  display: flex;

  align-items: center;

  justify-content: center;

  gap: 7px;

  margin-top: 22px;

  padding: 10px;

  border-radius: 8px;

  background: #111c18;

  border: 1px solid #1d3529;

  color: #7bdc9d;

  font-size: 10px;
}

.status-dot {
  width: 6px;

  height: 6px;

  background: #6ee7a0;

  border-radius: 50%;
}


/* =====================================================
   EDIT CARD
===================================================== */

.edit-card {
  padding: 32px;
}

.card-title {
  margin-bottom: 28px;
}

.section-label {
  color: #8c72ff;

  font-size: 9px;

  font-weight: bold;

  letter-spacing: 1.5px;

  margin-bottom: 7px;
}

.card-title h2 {
  margin: 0 0 7px;

  font-size: 20px;
}

.card-title p {
  max-width: 650px;

  margin: 0;

  color: #70717e;

  font-size: 12px;

  line-height: 1.6;
}


/* =====================================================
   FORM
===================================================== */

.profile-form {
  display: flex;

  flex-direction: column;

  gap: 21px;
}

.form-group {
  display: flex;

  flex-direction: column;

  gap: 8px;
}

.form-group label {
  color: #aaaab5;

  font-size: 12px;

  font-weight: 500;
}

.form-group input {
  width: 100%;

  background: #15161e;

  border: 1px solid #292a35;

  color: white;

  padding: 13px 14px;

  border-radius: 9px;

  outline: none;

  font-size: 13px;

  transition: 0.2s;
}

.form-group input:hover {
  border-color: #383946;
}

.form-group input:focus {
  border-color: #7657ff;

  box-shadow:
    0 0 0 2px rgba(118, 87, 255, 0.08);
}

.form-group input:disabled {
  color: #666875;

  background: #111219;

  cursor: not-allowed;
}

.form-group small {
  color: #5f606b;

  font-size: 10px;

  line-height: 1.4;
}


/* =====================================================
   MESSAGE
===================================================== */

.profile-message {
  display: flex;

  align-items: center;

  gap: 9px;

  padding: 11px 13px;

  border-radius: 8px;

  font-size: 11px;
}

.profile-message span {
  width: 18px;

  height: 18px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  font-weight: bold;
}

.success-message {
  background: #101d17;

  border: 1px solid #1e3a2a;

  color: #7ee7a1;
}

.success-message span {
  background: #214f35;
}

.error-message {
  background: #211416;

  border: 1px solid #442326;

  color: #ff8585;
}

.error-message span {
  background: #59272b;
}


/* =====================================================
   ACTIONS
===================================================== */

.form-actions {
  display: flex;

  justify-content: flex-end;

  margin-top: 4px;
}

.save-profile-button {
  min-width: 150px;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 10px;

  background:
    linear-gradient(
      135deg,
      #7657ff,
      #6545e8
    );

  border: none;

  color: white;

  padding: 13px 20px;

  border-radius: 9px;

  cursor: pointer;

  font-weight: bold;

  font-size: 12px;

  transition: 0.2s;

  box-shadow:
    0 7px 20px rgba(118, 87, 255, 0.15);
}

.save-profile-button:hover:not(:disabled) {
  background:
    linear-gradient(
      135deg,
      #876cff,
      #7657ff
    );

  transform: translateY(-1px);

  box-shadow:
    0 9px 25px rgba(118, 87, 255, 0.22);
}

.save-profile-button:disabled {
  opacity: 0.7;

  cursor: not-allowed;
}

.save-profile-button span:last-child {
  font-size: 16px;
}


/* =====================================================
   SPINNERS
===================================================== */

.loading-content {
  display: flex;

  flex-direction: column;

  align-items: center;

  gap: 15px;
}

.profile-loading {
  min-height: 100vh;

  background: #08090d;

  color: white;

  display: flex;

  align-items: center;

  justify-content: center;

  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.loading-content p {
  color: #777988;

  font-size: 12px;
}

.loading-spinner,
.button-spinner {
  border: 2px solid #292536;

  border-top-color: #8c72ff;

  border-radius: 50%;

  animation: spin 0.8s linear infinite;
}

.loading-spinner {
  width: 30px;

  height: 30px;
}

.button-spinner {
  width: 14px;

  height: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}


/* =====================================================
   RESPONSIVE
===================================================== */

@media (max-width: 800px) {

  .profile-page {
    padding: 25px 20px;
  }

  .profile-layout {
    grid-template-columns: 1fr;
  }

  .profile-header {
    align-items: flex-start;
  }

}


@media (max-width: 550px) {

  .profile-page {
    padding: 20px 15px;
  }

  .profile-header {
    flex-direction: column;

    align-items: flex-start;
  }

  .back-button {
    width: 100%;

    justify-content: center;
  }

  .profile-card {
    padding: 22px;
  }

  .edit-card {
    padding: 22px;
  }

  .form-actions {
    width: 100%;
  }

  .save-profile-button {
    width: 100%;
  }

}

`;

export default Profile;