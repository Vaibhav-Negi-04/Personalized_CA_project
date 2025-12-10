import React, { useState } from 'react';
import TransactionHistory from '../TransactionHistory';
import GoalsList from '../GoalsList';
import { useTransactions } from '../../hooks/useTransactions';
import axios from 'axios';
import '../Dashboard.css';

function StudentView({ userData }) {
  // 1. Basic Stats
  const allowance = userData?.monthlyAllowance || 0;
  const spent = userData?.totalSpent || 0;
  const remaining = allowance - spent;
  
  // 2. Daily Limit Logic
  const todayDate = new Date();
  const lastDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
  const daysLeft = Math.max(1, lastDayOfMonth.getDate() - todayDate.getDate());
  const dailyLimit = Math.floor(remaining / daysLeft);

  // 3. NEW: Calculate "Smart Savings" (Limit - Spent Today)
  const { transactions } = useTransactions(); // Get raw data
  
  const spentToday = transactions
    .filter(t => {
      // Filter for Expenses that happened TODAY
      if (!t.date || t.type !== 'expense') return false;
      return t.date.toDateString() === todayDate.toDateString();
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // If they spent LESS than the limit, the difference is "Smart Savings"
  const smartSavings = Math.max(0, dailyLimit - spentToday);

  // 4. AI State
  const [prediction, setPrediction] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handlePredict = async () => {
    setAiLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/predict', { transactions });
      setPrediction(response.data.message);
    } catch (error) {
      setPrediction("AI offline.");
    }
    setAiLoading(false);
  };

  return (
    <div className="dashboard-layout">
      
      {/* SMART TIP CARD */}
      <div style={{ 
        background: 'linear-gradient(90deg, #0f172a, #1e293b)', 
        padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap'
      }}>
        <div style={{ fontSize: '3rem' }}>💡</div>
        <div>
          <h3 style={{ margin: 0, color: '#fff' }}>Smart Daily Limit</h3>
          <p style={{ margin: '5px 0', color: '#94a3b8' }}>
            Spend under this amount to stay safe:
          </p>
          <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '2rem' }}>
            ₹{dailyLimit > 0 ? dailyLimit : 0} <span style={{fontSize: '1rem', color: '#94a3b8'}}>/ day</span>
          </h2>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{color: '#94a3b8', fontSize: '0.9rem'}}>Spent Today: <span style={{color: '#f43f5e'}}>₹{spentToday}</span></div>
            {smartSavings > 0 && (
              <div style={{color: '#10b981', fontWeight: 'bold', marginTop: '5px'}}>
                🎉 You saved ₹{smartSavings} today!
              </div>
            )}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Monthly Allowance</h3>
          <div className="value blue">₹{allowance}</div>
        </div>
        <div className="stat-card">
          <h3>Spent This Month</h3>
          <div className="value red">₹{spent}</div>
        </div>
        <div className="stat-card">
          <h3>Remaining</h3>
          <div className="value green">₹{remaining}</div>
        </div>
      </div>

      {/* AI INSIGHT */}
      <div className="goals-container" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))', borderColor: '#8b5cf6' }}>
        <div className="goals-header">
          <h3 style={{color: 'white'}}>🤖 AI Pocket Money Manager</h3>
          <button className="add-goal-btn" onClick={handlePredict} style={{background: '#8b5cf6', color: 'white', border: 'none'}}>
            {aiLoading ? 'Thinking...' : 'Get Advice'}
          </button>
        </div>
        {prediction && (
          <div style={{ padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', marginTop: '10px', color: '#c4b5fd', fontWeight: 'bold' }}>
            {prediction}
          </div>
        )}
      </div>

      {/* MAIN CONTENT - Pass smartSavings to GoalsList */}
      <div className="main-dashboard-grid">
        <div className="dashboard-left"><TransactionHistory /></div>
        <div className="dashboard-right">
          <GoalsList smartSavings={smartSavings} /> 
        </div>
      </div>
      
    </div>
  );
}

export default StudentView;