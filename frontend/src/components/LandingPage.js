import React, { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './LandingPage.css';

gsap.registerPlugin(ScrollTrigger);

// --- Premium SVG Icons ---
const AcademicIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const UserIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BuildingIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
const SparklesIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/></svg>;
const LockIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const TargetIcon = () => <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;

function LandingPage() {
  const navigate = useNavigate();
  const main = useRef();
  
  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      let mm = gsap.matchMedia();
      
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Cinematic Scroll Sequence for Audience Section
        let tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".audience-wrapper",
            start: "top top",
            end: "+=300%",
            pin: true,
            scrub: 1
          }
        });
        
        // Dynamic Savings Counter
        let savingsObj = { val: 0 };
        gsap.to(savingsObj, {
          val: 15000,
          duration: 2.5,
          ease: "power3.out",
          delay: 0.5,
          onUpdate: () => {
            const el = document.querySelector('.savings-val');
            if (el) el.innerHTML = "+ ₹" + Math.floor(savingsObj.val).toLocaleString('en-IN');
          }
        });
        
        tl.to('.card-1', { opacity: 1, y: 0, duration: 1 })
          .to('.card-1', { opacity: 0, y: -50, duration: 1, delay: 0.5 })
          .to('.card-2', { opacity: 1, y: 0, duration: 1 })
          .to('.card-2', { opacity: 0, y: -50, duration: 1, delay: 0.5 })
          .to('.card-3', { opacity: 1, y: 0, duration: 1 })
          .to('.card-3', { opacity: 0, y: -50, duration: 1, delay: 0.5 })
          .to('.foryou-text', { opacity: 1, duration: 1 });
        
        // Image Scale & Fade for Mockup
        gsap.to('.hero-visual', {
          scrollTrigger: {
            trigger: '.hero-visual',
            start: "top center",
            end: "bottom top",
            scrub: true
          },
          y: 150,
          opacity: 0.2,
          scale: 0.9,
        });
        
        // Scrubbing Reveal for paragraph
        const words = document.querySelectorAll('.scrub-text span');
        gsap.fromTo(words, { opacity: 0.1 }, {
          opacity: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '.process-section',
            start: "top center",
            end: "center center",
            scrub: true
          }
        });
      });
    }, main);
    
    return () => ctx.revert();
  }, []);

  return (
    <main ref={main} className="landing-container">
      
      {/* Navbar (Floating Pill style) */}
      <nav className="landing-nav-pill">
        <div className="logo">Personalized CA</div>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/login')}>Login</button>
        </div>
      </nav>

      {/* Hero Section - EDITORIAL SPLIT */}
      <header className="hero editorial-hero">
        <div className="hero-content-split">
          <h1 className="cinematic-h1">
            Master your money. <br />
            <span className="highlight-inline">Without the chaos.</span>
          </h1>
          <p className="hero-subtext">
            Intelligent tracking tailored specifically for Students, Individuals, and Businesses.
          </p>
          <div className="cta-group">
            <button className="cta-button" onClick={() => navigate('/register')}>
              Get Started Free 
            </button>
          </div>
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
              <h4 className="savings-val">+ ₹0</h4>
            </div>
          </div>
        </div>
      </header>
      
      {/* Infinite Marquee */}
      <div className="marquee-container">
        <div className="marquee-content">
          <span>SECURE BANK SYNC</span> &bull; <span>AI PREDICTIONS</span> &bull; <span>GAMIFIED SAVINGS</span> &bull; <span>EXPENSE TRACKING</span> &bull; <span>SECURE BANK SYNC</span> &bull; <span>AI PREDICTIONS</span> &bull; <span>GAMIFIED SAVINGS</span> &bull; <span>EXPENSE TRACKING</span>
        </div>
      </div>

      {/* Cinematic Pinned Audience Section */}
      <div className="audience-wrapper" style={{ width: '100%' }}>
        <section className="audience-section pinned-audience-section">
          <div className="audience-left">
            <h2 className="massive-title">
              <span className="engineered-text">Engineered</span><br/>
              <span className="foryou-text">For You</span>
            </h2>
          </div>
          <div className="audience-right">
            <div className="scroll-card card-1">
              <span className="icon"><AcademicIcon /></span>
              <h3>For Students</h3>
              <p>Track pocket money, set gadget goals, and learn financial discipline early.</p>
            </div>
            <div className="scroll-card card-2">
              <span className="icon"><UserIcon /></span>
              <h3>For Individuals</h3>
              <p>Analyze spending patterns, track investments, and optimize tax savings.</p>
            </div>
            <div className="scroll-card card-3">
              <span className="icon"><BuildingIcon /></span>
              <h3>For Business</h3>
              <p>Automate payroll, manage GST compliance, and track revenue streams in real-time.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Process Pipeline Section with Text Scrubbing */}
      <section className="process-section gapless-bento-section">
        <h2 className="section-title text-center">
          <div className="scrub-text">
             <span>From</span> <span>chaos</span> <span>to</span> <span>complete</span> <span>financial</span> <span>clarity.</span>
          </div>
        </h2>
        
        <div className="bento-grid gapless-grid">
          <div className="bento-tile col-span-2 row-span-2 primary-tile">
            <img src="/bento_track.jpg" alt="Track Everything" className="bento-image" />
            <span className="icon"><TargetIcon /></span>
            <h3>Track Everything</h3>
            <p>Link your accounts for real-time tracking.</p>
          </div>
          <div className="bento-tile col-span-1 row-span-1 secondary-tile">
            <img src="/bento_ai.jpg" alt="AI Insights" className="bento-image" />
            <span className="icon"><SparklesIcon /></span>
            <h3>AI Insights</h3>
            <p>Smart categorisation.</p>
          </div>
          <div className="bento-tile col-span-1 row-span-2 dark-tile">
            <img src="/bento_security.jpg" alt="Security" className="bento-image" />
            <span className="icon"><LockIcon /></span>
            <h3>Bank-Level Security</h3>
            <p>Your data is encrypted.</p>
          </div>
          <div className="bento-tile col-span-2 row-span-1 accent-tile">
            <img src="/bento_visualise.jpg" alt="Visualise" className="bento-image" />
            <h3>Visualise</h3>
            <p>Stunning charts.</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="landing-footer py-48">
        <div className="footer-content text-center">
          <h2 className="massive-title">Ready to level up?</h2>
          <button className="cta-button mt-10" onClick={() => navigate('/register')}>Start Your Journey</button>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;