import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LandingPage.css';

// --- Premium SVG Icons ---
const AcademicIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const UserIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BuildingIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
const LockIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const TargetIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;

function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="landing-container">
      
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="logo">Personalized CA</div>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/login')}>Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">System 2.0 is Live</div>
          <h1 className="hero-title">Financial truth for the modern operator.</h1>
          <p className="hero-subtitle">
            A central command system that replaces your accountant, your spreadsheets, and your assumptions. Take complete control of your financial destiny today.
          </p>
          <div className="hero-actions">
            <button className="cta-button primary" onClick={() => navigate('/register')}>Deploy Now</button>
            <button className="cta-button secondary" onClick={() => navigate('/login')}>Access System</button>
          </div>
        </div>
      </section>

      {/* Feature 1 */}
      <section className="feature-row">
        <div className="feature-text">
          <div className="feature-icon"><LockIcon /></div>
          <h2>Bank Grade Security</h2>
          <p>Your financial data is encrypted at rest and in transit. We enforce strict data policies to ensure your competitive intelligence never leaks.</p>
        </div>
        <div className="feature-block bg-block-1"></div>
      </section>

      {/* Feature 2 */}
      <section className="feature-row reverse">
        <div className="feature-text">
          <div className="feature-icon"><TargetIcon /></div>
          <h2>Precision Cash Flow</h2>
          <p>Stop guessing your runway. We aggregate all your incoming ledgers and outbound operational costs to project exactly when you hit zero or reach profitability.</p>
        </div>
        <div className="feature-block bg-block-2"></div>
      </section>

      {/* Feature 3 */}
      <section className="feature-row">
        <div className="feature-text">
          <div className="feature-icon"><BuildingIcon /></div>
          <h2>Multi-Tier Architecture</h2>
          <p>Whether you are a student, an individual contractor, or operating a multi-location retail business, the system adapts to your scale.</p>
        </div>
        <div className="feature-block bg-block-3"></div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-logo">Personalized CA</span>
            <span className="footer-copy">© 2026. All rights reserved.</span>
          </div>
          <div className="footer-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </footer>
      
    </main>
  );
}

export default LandingPage;