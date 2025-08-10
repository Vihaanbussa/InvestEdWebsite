import React from "react";
import "./WelcomePage.css";

const WelcomePage = ({ onEnter }) => (
  <div className="welcome-bg">
    <div className="welcome-glass">
      <h1 className="welcome-title">
        <span className="gradient-text">InvestEdu</span>
      </h1>
      <p className="welcome-subtitle">
        <span className="futuristic-icon">🚀</span>
        Welcome to the Future of Financial Learning
      </p>
      <p className="welcome-desc">
        Experience next-gen finance simulation, interactive learning, and personalized insights.<br/>
        <span className="highlight">Empower your future—start your investing journey today.</span>
      </p>
      <button className="welcome-enter" onClick={onEnter}>
        Enter Simulator
      </button>
      <div className="welcome-aurora">
        <div className="aurora-layer aurora1"></div>
        <div className="aurora-layer aurora2"></div>
        <div className="aurora-layer aurora3"></div>
      </div>
    </div>
    <footer className="welcome-footer">
      <span>© {new Date().getFullYear()} InvestEdu • Designed for the next generation</span>
    </footer>
  </div>
);

export default WelcomePage;
