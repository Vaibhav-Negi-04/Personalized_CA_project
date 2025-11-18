import React from 'react';
import TransactionHistory from '../TransactionHistory';
function IndividualView({ userData }) {
  const income = userData?.totalIncome || 0;
  const expenses = userData?.totalExpenses || 0;
  const balance = income - expenses; // Simple calculation

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Current Balance</h3>
          <div className="value green">₹{balance}</div>
        </div>
        <div className="stat-card">
          <h3>Total Income</h3>
          <div className="value blue">₹{income}</div>
        </div>
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <div className="value red">₹{expenses}</div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>💼 Financial Insights</h3>
        <p style={{color: '#94a3b8', marginTop: '10px'}}>
          Track your expenses to generate AI insights here.
        </p>
      </div>
      <TransactionHistory />
    </div>
  );
}

export default IndividualView;