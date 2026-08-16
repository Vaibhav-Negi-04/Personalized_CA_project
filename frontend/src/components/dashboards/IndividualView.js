import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth'; 
import { useNavigate } from 'react-router-dom'; 

import TransactionHistory from '../TransactionHistory'; 
import AddAssetModal from '../AddAssetModal'; 
import TaxCalculatorModal from '../TaxCalculatorModal'; 
import LoanCalculatorModal from '../LoanCalculatorModal'; 
import FinancialHealthModal from '../FinancialHealthModal'; 

import './Dashboard2.css'; 

function IndividualView({ userData }) {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const q = query(collection(db, "users", user.uid, "assets"), orderBy("date", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssets(assetsData);
        setTotalPortfolioValue(assetsData.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0));
        setIsDataLoaded(true);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); navigate('/'); } catch (error) { console.error("Error:", error); }
  };

  const income = userData?.totalIncome || 0;
  const expenses = userData?.totalExpenses || 0;
  const balance = income - expenses; 
  const netWorth = balance + totalPortfolioValue;

  return (
    <div className="theme-pro-mono">
      
      {/* HEADER */}
      <div className="pro-header">
        <div className="pro-title">
          <h1>EXECUTIVE DASHBOARD</h1>
          <span className="pro-tag">INDIVIDUAL INVESTOR</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
           <div className="pro-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</div>
           <button className="pro-logout-btn" onClick={handleLogout}>LOGOUT</button>
        </div>
      </div>

      {/* METRICS */}
      <div className="pro-metrics-grid">
        <div className="metric-box"><label>NET LIQUIDITY</label><div className="metric-val">₹{netWorth.toLocaleString()}</div></div>
        <div className="metric-box"><label>CASH ON HAND</label><div className="metric-val">₹{balance.toLocaleString()}</div></div>
        <div className="metric-box"><label>PORTFOLIO VALUE</label><div className="metric-val">₹{totalPortfolioValue.toLocaleString()}</div></div>
        <div className="metric-box"><label>MONTHLY BURN</label><div className="metric-val">₹{expenses.toLocaleString()}</div></div>
      </div>

      {/* TOOLS */}
      <div className="pro-toolbar">
        <label>ANALYTICAL TOOLS</label>
        <div className="tool-group">
          <button className="pro-btn" onClick={() => setIsTaxModalOpen(true)}>🧾 TAX PLANNER</button>
          <button className="pro-btn" onClick={() => setIsLoanModalOpen(true)}>🏦 DEBT MANAGER</button>
          <button className="pro-btn" onClick={() => setIsHealthModalOpen(true)}>🩺 HEALTH AUDIT</button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="pro-main-layout">
        {/* LEFT: ASSETS */}
        <div className="pro-panel">
          <div className="panel-header">
            <h3>INVESTMENT HOLDINGS</h3>
            <button className="pro-btn-small" onClick={() => setIsAssetModalOpen(true)}>+ ADD POSITION</button>
          </div>
          <div className="pro-table-container">
            {!isDataLoaded ? (
              <div style={{padding:'30px'}}>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text"></div>
              </div>
            ) : assets.length === 0 ? (
              <div style={{padding:'30px', textAlign:'center', color:'var(--text-tertiary)', fontSize:'0.8rem'}}>NO POSITIONS OPEN</div>
            ) : (
              <table className="pro-table">
                <thead><tr><th>ASSET</th><th style={{textAlign:'right'}}>INVESTED</th><th style={{textAlign:'right'}}>CURRENT</th><th style={{textAlign:'right'}}>P&L</th></tr></thead>
                <tbody>
                  {assets.map(asset => {
                    const invested = parseFloat(asset.invested) || parseFloat(asset.value);
                    const current = parseFloat(asset.value);
                    const profit = current - invested;
                    const percent = invested > 0 ? ((profit / invested) * 100).toFixed(2) : 0;
                    return (
                      <tr key={asset.id}>
                        <td><div className="asset-name">{asset.name}</div><div className="asset-type">{asset.type}</div></td>
                        <td className="mono-num" style={{textAlign:'right'}}>₹{invested.toLocaleString()}</td>
                        <td className="mono-num" style={{textAlign:'right'}}>₹{current.toLocaleString()}</td>
                        <td className={`mono-num ${profit >= 0 ? 'pos' : 'neg'}`} style={{textAlign:'right'}}>{profit >= 0 ? '+' : ''}{percent}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT: TRANSACTION LOG */}
        <div className="pro-panel" style={{ background: 'transparent', border: 'none' }}>
          <div className="transaction-wrapper-mono">
             {/* 🆕 PASSING PROPS TO FIX LAYOUT */}
             <TransactionHistory compactMode={true} theme="executive" /> 
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AddAssetModal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} />
      <TaxCalculatorModal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} />
      <LoanCalculatorModal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} />
      <FinancialHealthModal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} />
    </div>
  );
}

export default IndividualView;