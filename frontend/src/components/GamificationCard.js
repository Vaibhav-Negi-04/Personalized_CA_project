import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { auth } from '../firebaseConfig'; 
import { signOut } from 'firebase/auth'; 
import './Dashboard.css';

// Import the Sound Hook
import useSoundFX from '../hooks/useSoundFX';

// Rank Images
import eRankImg from '../assets/ranks/erank.png';
import dRankImg from '../assets/ranks/drank.png';
import cRankImg from '../assets/ranks/crank.png';
import bRankImg from '../assets/ranks/brank.png';
import aRankImg from '../assets/ranks/arank.png';
import sRankImg from '../assets/ranks/srank.png';

function GamificationCard({ transactions, income, expense, goals = [] }) {
  const navigate = useNavigate();
  const [showRankModal, setShowRankModal] = useState(false);
  
  // Initialize Sound & Ref
  const playSound = useSoundFX();
  const prevLevelRef = useRef(1);

  const currentUser = auth.currentUser;

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    try {
      await signOut(auth); 
      navigate('/'); 
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Error logging out.");
    }
  };

  // --- XP Logic ---
  let xp = 0;
  xp += transactions.length * 150;
  xp += goals.length * 300;
  const totalSavedInGoals = goals.reduce((acc, g) => acc + (g.saved || 0), 0);
  xp += Math.floor(totalSavedInGoals / 10);
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  if (savingsRate > 30) xp += 1000;

  // --- Streak Logic ---
  const uniqueDates = [...new Set(transactions.map(t => {
    const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return date.toDateString();
  }))];
  const streakCount = uniqueDates.length;

  // --- Rank System ---
  const rankSystem = [
    { lvl: 1,  rank: "E", title: "Budget Novice", color: "#9ca3af", img: eRankImg }, 
    { lvl: 5,  rank: "D", title: "Smart Saver",   color: "#4ade80", img: dRankImg }, 
    { lvl: 15, rank: "C", title: "Wealth Builder", color: "#60a5fa", img: cRankImg }, 
    { lvl: 30, rank: "B", title: "Asset Commander", color: "#c084fc", img: bRankImg }, 
    { lvl: 50, rank: "A", title: "Fortune Master", color: "#f87171", img: aRankImg }, 
    { lvl: 75, rank: "S", title: "Financial Sovereign", color: "#facc15", img: sRankImg } 
  ];

  const level = Math.floor(xp / 500) + 1;

  // 4. --- LEVEL UP SOUND EFFECT (WITH DELAY FIX) ---
  useEffect(() => {
    // Only play if level INCREASED (ignore first load or decreases)
    if (level > prevLevelRef.current) {
      console.log("Level Up! Queuing sound...");
      
      // Wait 1 second (1000ms) for the Coin sound to finish
      const timer = setTimeout(() => {
        playSound('levelUp'); 
      }, 1000);

      // Cleanup if component unmounts fast
      return () => clearTimeout(timer);
    }
    
    // Update ref
    prevLevelRef.current = level;
  }, [level, playSound]);

  const nextLevelXp = level * 500;
  const progressPercent = Math.min(100, ((xp % 500) / 500) * 100);
  const currentRankObj = [...rankSystem].reverse().find(r => level >= r.lvl) || rankSystem[0];
  const { rank, title, color, img } = currentRankObj;

  return (
    <>
      <div className="status-bar-container" style={{ borderColor: color }}>
        
        {/* LEFT Section */}
        <div className="status-left">
          <div 
            className="rank-image-container radiant-pulse" 
            style={{ '--rank-color': color }}
          >
            <img src={img} alt={`${rank}-Rank`} className="rank-image-actual" />
          </div>

          <div className="user-details">
            <h2 className="user-greeting">
              Hello, <span style={{color: color}}>{currentUser?.displayName || 'User'}</span>
            </h2>
            <div className="rank-tag-row">
              <span className="rank-title-small" style={{ color: color }}>{title}</span>
              <button 
                className="rank-info-btn-small" 
                onClick={() => setShowRankModal(true)} 
                title="View Rank Roadmap"
                style={{color: color, borderColor: color}}
              >
                i
              </button>
            </div>
          </div>
        </div>

        {/* CENTER Section */}
        <div className="status-center">
          <div className="xp-info-row">
            <span className="lvl-indicator">LVL {level}</span>
            <span className="xp-numbers">
  {Math.floor(xp % 500)} / 500 XP
</span>
          </div>
          <div className="navbar-progress-track">
            <div 
              className="navbar-progress-fill" 
              style={{ width: `${progressPercent}%`, background: color, boxShadow: `0 0 12px ${color}` }}
            ></div>
          </div>
        </div>

        {/* RIGHT Section */}
        <div className="status-right">
          <div className="streak-pill">
            <span className="streak-icon">🔥</span>
            <span className="streak-text">{streakCount} DAY STREAK</span>
          </div>

          <button className="logout-btn-styled" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {showRankModal && (
        <div className="rank-modal-overlay" onClick={() => setShowRankModal(false)}>
          <div className="rank-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rank Hierarchy</h2>
              <button className="close-modal" onClick={() => setShowRankModal(false)}>×</button>
            </div>
            <div className="rank-list">
              {rankSystem.map((r) => {
                const isCurrent = r.rank === rank;
                const isUnlocked = level >= r.lvl;
                return (
                  <div key={r.rank} className={`rank-row ${isCurrent ? 'active-rank' : ''} ${!isUnlocked ? 'locked-rank' : ''}`} style={{ borderColor: isCurrent ? r.color : 'transparent' }}>
                    <div className="rank-row-left">
                      <img src={r.img} alt={r.rank} style={{width: '35px', height: '35px', opacity: isUnlocked ? 1 : 0.5}} />
                      <div className="rank-details">
                        <span className="rank-name" style={{ color: isUnlocked ? '#fff' : '#64748b' }}>{r.title}</span>
                        <span className="rank-req">Unlocks at Level {r.lvl}</span>
                      </div>
                    </div>
                    {isCurrent && <span className="current-tag" style={{background: r.color}}>YOU</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GamificationCard;