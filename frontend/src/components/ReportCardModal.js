import React from 'react';
import './Dashboard.css'; // or Dashboard2.css, wherever you keep the student styles

function ReportCardModal({ transactions, onClose }) {
  // ... (Logic stays exactly the same) ...
  const now = new Date();
  const currentMonthTrans = transactions.filter(t => {
    const tDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
  });

  const income = currentMonthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const expense = currentMonthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  let grade = "F";
  let gradeColor = "#ef4444"; 
  let remark = "Critical Condition.";

  if (savingsRate >= 0) { grade = "C"; gradeColor = "#f59e0b"; remark = "You survived."; }
  if (savingsRate >= 10) { grade = "B"; gradeColor = "#3b82f6"; remark = "Decent savings."; }
  if (savingsRate >= 30) { grade = "A"; gradeColor = "var(--accent)"; remark = "Excellent!"; }
  if (savingsRate >= 50) { grade = "S"; gradeColor = "#facc15"; remark = "LEGENDARY."; }

  const monthName = now.toLocaleString('default', { month: 'long' });

  return (
    // 👇 CHANGED CLASS NAMES HERE
    <div className="gamified-overlay" onClick={onClose}>
      <div className="gamified-card" onClick={e => e.stopPropagation()}>
        
        <div className="report-header">
          <h2>MONTHLY EVALUATION</h2>
          <span className="report-date">{monthName} {now.getFullYear()}</span>
        </div>

        <div className="grade-container">
          <div className="grade-stamp" style={{ borderColor: gradeColor, color: gradeColor }}>
            {grade}
          </div>
          <p className="grade-remark" style={{ color: gradeColor }}>{remark}</p>
        </div>

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
            <span style={{ color: savings >= 0 ? 'var(--accent)' : '#ef4444' }}>
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