import React from 'react';

const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
};

export const FinancialModal = ({ 
    showFinancials, setShowFinancials, openingBalance, totalRevenue, totalExpenses, takeHome, handleExportCSV 
}) => {
    if (!showFinancials) return null;
    
    return (
        <div className="report-overlay" onClick={() => setShowFinancials(false)}>
            <div className="report-card" onClick={e => e.stopPropagation()}>
                <div className="report-header">
                    <h2 className="b-title">Report</h2>
                    <button onClick={() => setShowFinancials(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'var(--text-primary)'}}>×</button>
                </div>
                <div className="report-body">
                    <div className="report-section">
                        <div className="report-row"><span>Opening Balance</span><span>{formatCurrency(openingBalance)}</span></div>
                        <div className="report-row"><span>+ Total Revenue</span><span>{formatCurrency(totalRevenue)}</span></div>
                        <div className="report-row"><span>- Total Expenses</span><span>{formatCurrency(totalExpenses)}</span></div>
                        <div className="report-row total"><span>= Net Cash</span><span>{formatCurrency(takeHome)}</span></div>
                    </div>
                    <div style={{marginTop:'20px', display:'flex', justifyContent:'flex-end'}}>
                        <button onClick={handleExportCSV} className="b-btn b-btn-primary">Download CSV</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
