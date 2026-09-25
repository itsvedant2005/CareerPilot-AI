import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import JobMatcher from "./pages/JobMatcher";
import JobMatchHistory from "./pages/JobMatchHistory";
import MockInterview from "./pages/MockInterview";
import ATSResumeBuilder from "./pages/ATSResumeBuilder";
import Aptitude from "./pages/Aptitude";
import SkillGapAnalysis from "./pages/SkillGapAnalysis";
import CodingPractice from "./pages/CodingPractice";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />

      <Route
        path="/resume-analyzer"
        element={<ResumeAnalyzer />}
      />

      <Route
        path="/resume-builder"
        element={<ATSResumeBuilder />}
      />

      <Route
        path="/job-matcher"
        element={<JobMatcher />}
      />

      <Route
        path="/job-match-history"
        element={<JobMatchHistory />}
      />

      <Route
        path="/mock-interview"
        element={<MockInterview />}
      />

      <Route
        path="/aptitude"
        element={<Aptitude />}
      />

      <Route
        path="/skill-gap-analysis"
        element={<SkillGapAnalysis />}
      />

      <Route
        path="/skill-gap"
        element={<SkillGapAnalysis />}
      />

      <Route
        path="/coding-practice"
        element={<CodingPractice />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;