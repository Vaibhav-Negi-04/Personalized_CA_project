import React from 'react';
import './Dashboard.css';

function ExpenseHeatmap({ transactions }) {
  // 1. Generate last 90 days
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  // 2. Map spending to days
  const getIntensity = (dateObj) => {
    const dateStr = dateObj.toDateString();
    const dayTxns = transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return d.toDateString() === dateStr && t.type === 'expense';
    });
    
    const total = dayTxns.reduce((acc, t) => acc + Number(t.amount), 0);
    
    if (total === 0) return 'level-0'; // No spend (Gray)
    if (total < 200) return 'level-1'; // Low (Green)
    if (total < 1000) return 'level-2'; // Med (Yellow)
    return 'level-3'; // High (Red)
  };

  return (
    <div className="section-card" style={{ marginTop: '20px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#e2e8f0', fontSize:'1rem' }}>📅 Spending Activity</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(10px, 1fr))', 
        gap: '4px', 
        maxWidth: '100%' 
      }}>
        {days.map((day, i) => (
          <div key={i} className={`heatmap-box ${getIntensity(day)}`} title={day.toDateString()}></div>
        ))}
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '0.7rem', color: '#64748b' }}>
        <span style={{display:'flex', alignItems:'center', gap:'4px'}}><div className="heatmap-box level-0"></div> Clean</span>
        <span style={{display:'flex', alignItems:'center', gap:'4px'}}><div className="heatmap-box level-1"></div> Low</span>
        <span style={{display:'flex', alignItems:'center', gap:'4px'}}><div className="heatmap-box level-3"></div> High</span>
      </div>
    </div>
  );
}

export default ExpenseHeatmap;