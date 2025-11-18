import React from 'react';
import TransactionHistory from '../TransactionHistory';
function BusinessView({ userData }) {
  const revenue = userData?.totalRevenue || 0;
  const profit = userData?.netProfit || 0;
  const pendingInvoices = userData?.pendingInvoices || 0;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Net Profit</h3>
          <div className="value green">₹{profit}</div>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <div className="value blue">₹{revenue}</div>
        </div>
        <div className="stat-card">
          <h3>Pending Invoices</h3>
          <div className="value red">{pendingInvoices}</div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>🏢 Business Overview</h3>
        <p style={{color: '#94a3b8', marginTop: '10px'}}>
          No reports generated yet.
        </p>
      </div>
      <TransactionHistory />
    </div>
  );
}

export default BusinessView;