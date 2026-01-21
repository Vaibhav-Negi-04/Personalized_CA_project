import React from 'react';
import './Dashboard.css';

function ReportCardModal({ transactions, onClose }) {
  // 1. Filter Transactions for THIS MONTH
  const now = new Date();
  const currentMonthTrans = transactions.filter(t => {
    const tDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return (
      tDate.getMonth() === now.getMonth() &&
      tDate.getFullYear() === now.getFullYear()
    );
  });

  // 2. Calculate Stats
  const income = currentMonthTrans
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const expense = currentMonthTrans
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // 3. Determine Grade & Color
  let grade = "F";
  let gradeColor = "#ef4444"; // Red
  let remark = "Critical Condition. Stop Spending!";

  if (savingsRate >= 0) { grade = "C"; gradeColor = "#f59e0b"; remark = "You survived. barely."; } // Orange
  if (savingsRate >= 10) { grade = "B"; gradeColor = "#3b82f6"; remark = "Decent. You have some savings."; } // Blue
  if (savingsRate >= 30) { grade = "A"; gradeColor = "#10b981"; remark = "Excellent! Great discipline."; } // Green
  if (savingsRate >= 50) { grade = "S"; gradeColor = "#facc15"; remark = "LEGENDARY. FINANCIAL GOD."; } // Gold

  // Month Name
  const monthName = now.toLocaleString('default', { month: 'long' });

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-card" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="report-header">
          <h2>MONTHLY EVALUATION</h2>
          <span className="report-date">{monthName} {now.getFullYear()}</span>
        </div>

        {/* The Big Grade Stamp */}
        <div className="grade-container">
          <div className="grade-stamp" style={{ borderColor: gradeColor, color: gradeColor }}>
            {grade}
          </div>
          <p className="grade-remark" style={{ color: gradeColor }}>{remark}</p>
        </div>

        {/* Stats Grid */}
        <div className="report-stats">
          <div className="r-stat-row">
            <span>Total Earnings</span>
            <span className="green">+₹{income}</span>
          </div>
          <div className="r-stat-row">
            <span>Total Spent</span>
            <span className="red">-₹{expense}</span>
          </div>
          <div className="r-divider"></div>
          <div className="r-stat-row total-row">
            <span>Net Savings</span>
            <span style={{ color: savings >= 0 ? '#10b981' : '#ef4444' }}>
              {savings >= 0 ? '+' : ''}₹{savings}
            </span>
          </div>
        </div>

        <button className="close-report-btn" onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}

export default ReportCardModal;