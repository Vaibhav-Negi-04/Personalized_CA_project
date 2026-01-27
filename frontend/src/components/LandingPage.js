// frontend/src/components/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="logo">Personalized CA</div>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/login')}>Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <h1>
            Your AI-Powered <br />
            <span className="highlight">Financial Expert</span>
          </h1>
          <p>
            Master your money with our intelligent tracking system. 
            Tailored specifically for Students, Individuals, and Businesses.
          </p>
          <button className="cta-button" onClick={() => navigate('/register')}>
            Get Started Free 
          </button>
        </div>

        {/* Hero Visual */}
        <div className="hero-visual">
          <div className="glass-mockup">
            <div className="mockup-header">
              <div className="circle red"></div>
              <div className="circle yellow"></div>
              <div className="circle green"></div>
            </div>
            <div className="mockup-body">
              <div className="graph-area">
                <div className="bar bar-1"></div>
                <div className="bar bar-2"></div>
                <div className="bar bar-3"></div>
                <div className="bar bar-4"></div>
              </div>
              <div className="pie-placeholder"></div>
            </div>
            <div className="floating-card">
              <span>Savings</span>
              <h4>+ ₹5,000</h4>
            </div>
          </div>
        </div>
      </header>

      {/* Tailored Audience Section */}
      <section className="audience-section">
        <h2 className="section-title">Tailored For You</h2>
        <div className="cards-grid">
          <div className="feature-card">
            <span className="icon">🎓</span>
            <h3>For Students</h3>
            <p>Track pocket money, set gadget goals, and learn financial discipline early.</p>
          </div>
          <div className="feature-card">
            <span className="icon">💼</span>
            <h3>For Individuals</h3>
            <p>Analyze spending patterns, track investments, and optimize tax savings.</p>
          </div>
          <div className="feature-card">
            <span className="icon">🏢</span>
            <h3>For Business</h3>
            <p>Automate payroll, manage GST compliance, and track revenue streams in real-time.</p>
          </div>
        </div>
      </section>
{/* Process Pipeline Section */}
      <section className="process-section">
        <h2 className="section-title">From Chaos to Clarity</h2>
        
        <div className="process-container">
          {/* The Glowing Connecting Line */}
          <div className="process-line"></div>
          
          {/* Step 1 */}
          <div className="process-step">
            <div className="step-icon">1</div>
            <div className="step-content">
              <h4>Add Data</h4>
              <p>Log income or sync expenses in seconds.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="process-step">
            <div className="step-icon">2</div>
            <div className="step-content">
              <h4>AI Analysis</h4>
              <p>Our engine categorizes and predicts trends.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="process-step">
            <div className="step-icon">3</div>
            <div className="step-content">
              <h4>Growth</h4>
              <p>View reports and reach your savings goals.</p>
            </div>
          </div>

        </div>
      </section>
      {/* UPDATED: Bento Grid Section (Perfect Alignment) */}
      <section className="bento-section">
        <h2 className="section-title">Everything You Need</h2>
        <div className="bento-grid">
          
          {/* Row 1, Col 1-2: AI (Large) */}
          <div className="bento-tile tile-large">
            <div className="tile-content">
              <h3>🔮 Future-Ready AI</h3>
              <p>Stop guessing. Our predictive engine analyzes history to forecast next month's expenses with accuracy.</p>
            </div>
            <div className="tile-visual graph-visual">
              <div className="line-segment"></div>
              <div className="dot p1"></div>
              <div className="dot p2"></div>
              <div className="dot p3"></div>
            </div>
          </div>

          {/* Row 1, Col 3: Security (Square) */}
          <div className="bento-tile tile-square">
            <div className="icon-badge">🔒</div>
            <h3>Bank-Grade Encryption</h3>
            <p>Your data never leaves our secure cloud vault.</p>
          </div>

          {/* Row 2, Col 1: Gamification (Square) */}
          <div className="bento-tile tile-square">
            <div className="icon-badge">🎯</div>
            <h3>Goal Gamification</h3>
            <p>Turn savings into a game. Reach targets to unlock badges.</p>
          </div>

          {/* Row 2, Col 2-3: Reports (Large) - CHANGED from 'tile-wide' to 'tile-large' */}
          <div className="bento-tile tile-large">
            <div className="tile-content">
              <h3>📄 One-Click Tax Reports</h3>
              <p>Download clean PDF & Excel statements for your actual CA instantly.</p>
            </div>
            <div className="tile-visual doc-visual">
               <div className="doc-line"></div>
               <div className="doc-line short"></div>
               <div className="doc-badge">PDF</div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2025 Personalized CA. Empowering your financial future.</p>
      </footer>
    </div>
  );
}

export default LandingPage;