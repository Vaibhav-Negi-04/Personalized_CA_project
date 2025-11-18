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
        <button className="nav-btn" onClick={() => navigate('/login')}>
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <h1>
          Your AI-Powered <br />
          <span className="highlight">Financial Expert</span>
        </h1>
        <p>
          Master your money with our intelligent tracking system. 
          Tailored specifically for Students, Individuals, and Businesses.
        </p>
        <button className="cta-button" onClick={() => navigate('/register')}>
          Get Started Free 🚀
        </button>
      </header>

      {/* Target Audience Section */}
      <section className="audience-section">
        <h2 className="section-title">Who is this for?</h2>
        
        <div className="cards-grid">
          {/* Card 1: Student */}
          <div className="feature-card">
            <span className="icon">🎓</span>
            <h3>For Students</h3>
            <p>
              Stop wondering where your pocket money went. Track daily expenses, 
              set savings goals for that new gadget, and build financial discipline.
            </p>
          </div>

          {/* Card 2: Individual */}
          <div className="feature-card">
            <span className="icon">💼</span>
            <h3>For Individuals</h3>
            <p>
              Take control of your wealth. Track investments, analyze spending patterns, 
              and get AI-driven insights to save more on taxes.
            </p>
          </div>

          {/* Card 3: Business */}
          <div className="feature-card">
            <span className="icon">🏢</span>
            <h3>For Business</h3>
            <p>
              Streamline your operations. Automate payroll, generate professional invoices, 
              and get real-time GST compliance reports.
            </p>
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