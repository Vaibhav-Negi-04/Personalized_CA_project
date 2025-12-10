import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import './Dashboard.css'; // Use standard styles

function DailyTracker() {
  const { transactions } = useTransactions();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- Helper: Change Date ---
  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // --- Helper: Check if date is Today ---
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // --- FILTER: Get only transactions for the selected date ---
  const dailyTransactions = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.toDateString() === selectedDate.toDateString();
  });

  // --- MATH: Calculate Total for that day ---
  const dailyTotal = dailyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="stat-card" style={{ gridColumn: 'span 3', background: 'linear-gradient(145deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))' }}>
      
      {/* 1. Header with Date Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => changeDate(-1)} 
          style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}
        >
          ←
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem' }}>
            {isToday(selectedDate) ? "Today's Spending" : selectedDate.toLocaleDateString()}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {dailyTransactions.length} transactions
          </span>
        </div>

        <button 
          onClick={() => changeDate(1)} 
          disabled={isToday(selectedDate)} // Disable 'Next' if it's today
          style={{ 
            background: 'none', border: '1px solid #334155', 
            color: isToday(selectedDate) ? '#334155' : '#94a3b8', 
            borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' 
          }}
        >
          →
        </button>
      </div>

      {/* 2. Big Total Display */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
          ₹{dailyTotal}
        </span>
      </div>

      {/* 3. Mini List for that Day */}
      <div style={{ maxHeight: '150px', overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
        {dailyTransactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#475569', fontStyle: 'italic', fontSize: '0.9rem' }}>
            No transactions on this day.
          </p>
        ) : (
          dailyTransactions.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: '#cbd5e1' }}>{t.category} <span style={{color: '#64748b'}}>({t.description})</span></span>
              <span style={{ color: t.type === 'income' ? 'var(--accent)' : 'var(--danger)' }}>
                {t.type === 'income' ? '+' : '-'} ₹{t.amount}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default DailyTracker;