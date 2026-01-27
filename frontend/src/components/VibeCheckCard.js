import React, { useMemo } from 'react';
import './Dashboard.css';

function VibeCheckCard({ transactions }) {
  
  // 🧠 THE ANALYTICS ENGINE
  const stats = useMemo(() => {
    // 1. Filter only expenses
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((acc, t) => acc + Number(t.amount), 0);

    if (total === 0) return null; // Hide if no data

    // 2. Sum up by Vibe
    const essential = expenses
      .filter(t => t.vibe === 'essential' || !t.vibe) // Default to essential if missing
      .reduce((acc, t) => acc + Number(t.amount), 0);
    
    const joy = expenses
      .filter(t => t.vibe === 'joy')
      .reduce((acc, t) => acc + Number(t.amount), 0);
    
    const regret = expenses
      .filter(t => t.vibe === 'regret')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    // 3. Calculate Percentages
    return {
      total,
      pEssential: (essential / total) * 100,
      pJoy: (joy / total) * 100,
      pRegret: (regret / total) * 100,
      regretAmount: regret
    };
  }, [transactions]);

  if (!stats) return null; // Don't show empty card

  // 🤖 AI VERDICT GENERATOR
  let verdict = "Balanced";
  let verdictClass = "verdict-good";
  let message = "You're spending wisely.";

  if (stats.pRegret > 40) {
    verdict = "Critical";
    verdictClass = "verdict-bad";
    message = "Stop the impulse buys! 💀";
  } else if (stats.pRegret > 15) {
    verdict = "Slip-up";
    verdictClass = "verdict-warn";
    message = "Regret is creeping up.";
  } else if (stats.pJoy > 40) {
    verdict = "Living Life";
    verdictClass = "verdict-warn"; // Yellow/Gold
    message = "High joy, watch the savings though.";
  } else if (stats.pEssential > 80) {
    verdict = "Survival Mode";
    verdictClass = "verdict-good";
    message = "Mostly essentials. Treat yourself?";
  }

  return (
    <div className="vibe-glass-card">
      <div className="vibe-header">
        <div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Emotional Spend Analysis
          </div>
          <div className={`vibe-verdict ${verdictClass}`}>
            {verdict}
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '4px' }}>
            {message}
          </div>
        </div>
        
        {/* Regret Stat Highlight */}
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.pRegret > 0 ? '#f43f5e' : '#94a3b8' }}>
             {Math.round(stats.pRegret)}%
           </div>
           <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Regret Rate</div>
        </div>
      </div>

      {/* 📊 THE MULTI-COLOR BAR */}
      <div className="vibe-bar-track">
        <div className="vibe-segment seg-essential" style={{ width: `${stats.pEssential}%` }}></div>
        <div className="vibe-segment seg-joy" style={{ width: `${stats.pJoy}%` }}></div>
        <div className="vibe-segment seg-regret" style={{ width: `${stats.pRegret}%` }}></div>
      </div>

    {/* LEGEND */}
      <div className="vibe-legend">
        <div className="legend-item">
          <div className="vibe-dot seg-essential"></div>
          <span>Essential ({Math.round(stats.pEssential)}%)</span>
        </div>
        <div className="legend-item">
          <div className="vibe-dot seg-joy"></div>
          <span>Joy ({Math.round(stats.pJoy)}%)</span>
        </div>
        <div className="legend-item">
          <div className="vibe-dot seg-regret"></div>
          <span>Regret ({Math.round(stats.pRegret)}%)</span>
        </div>
      </div>

    </div>
  );
}

export default VibeCheckCard;