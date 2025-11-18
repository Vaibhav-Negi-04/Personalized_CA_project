import React from 'react';
import TransactionHistory from '../TransactionHistory';
import GoalsList from '../GoalsList';
import '../Dashboard.css'; // Ensure main CSS is loaded

function StudentView({ userData }) {
  const allowance = userData?.monthlyAllowance || 0;
  const spent = userData?.totalSpent || 0;
  const remaining = allowance - spent;

  return (
    <div className="student-dashboard-layout">
      
      {/* 1. TOP ROW: STATS */}
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

      {/* 2. BOTTOM ROW: SPLIT SCREEN */}
      <div className="main-dashboard-grid">
        
        {/* Left Column: Transactions & Charts */}
        <div className="dashboard-left">
          <TransactionHistory /> 
        </div>

        {/* Right Column: Goals */}
        <div className="dashboard-right">
          <GoalsList />
        </div>

      </div>
    </div>
  );
}

export default StudentView;