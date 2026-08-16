import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="mobile-only-menu">
      <style>
        {`
          @media (min-width: 769px) {
            .mobile-only-menu { display: none; }
          }
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}
      </style>
      <button 
        className="hamburger-btn" 
        onClick={() => setIsOpen(true)}
        aria-label="Open Mobile Menu"
        style={{
          background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {isOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'var(--overlay-heavy)', backdropFilter: 'blur(4px)', zIndex: 10000,
            animation: 'fadeIn 0.3s forwards'
          }}
        >
          <div 
            className="mobile-menu-drawer"
            onClick={(e) => e.stopPropagation()}
            ref={menuRef}
            tabIndex="-1"
            style={{
              position: 'fixed', top: 0, right: 0, width: '280px', height: '100%',
              background: 'var(--bg-main)', borderLeft: '1px solid var(--border-strong)',
              padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px',
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
              outline: 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>Menu</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.8rem' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <button onClick={handleLogout} style={{ background: 'var(--status-danger)', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileMenu;

