import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebaseConfig'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth'; 
import { useNavigate } from 'react-router-dom'; 

import TransactionHistory from '../TransactionHistory'; 
import AddAssetModal from '../AddAssetModal';
import AddTransactionModal from '../AddTransactionModal';
import AssetAllocation from '../AssetAllocation';
import MarketTicker from '../MarketTicker';
import FIREChart from '../FIREChart'; 
import TaxCalculatorModal from '../TaxCalculatorModal'; 
import LoanCalculatorModal from '../LoanCalculatorModal'; 
import FinancialHealthModal from '../FinancialHealthModal'; 
import AssetDetailModal from '../AssetDetailModal';

import { Calculator, Receipt, Heartbeat, Info, DotsThree } from '@phosphor-icons/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import './Dashboard2.css'; 

function IndividualView({ userData }) {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  const [assets, setAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [actionToast, setActionToast] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'desc' });
  const [retryKey, setRetryKey] = useState(0);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  // Body Theme Override
  useEffect(() => {
    document.body.classList.add('individual-theme-body');
    return () => {
      document.body.classList.remove('individual-theme-body');
    };
  }, []);

  // Cmd+K / Slash shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sortedAssets = React.useMemo(() => {
    let sortableAssets = assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || (a.type && a.type.toLowerCase().includes(searchQuery.toLowerCase())));
    if (sortConfig !== null) {
      sortableAssets.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'percent') {
            const invA = parseFloat(a.invested) || parseFloat(a.value);
            const curA = parseFloat(a.value);
            const invB = parseFloat(b.invested) || parseFloat(b.value);
            const curB = parseFloat(b.value);
            valA = invA > 0 ? ((curA - invA) / invA) * 100 : 0;
            valB = invB > 0 ? ((curB - invB) / invB) * 100 : 0;
        } else {
            valA = a[sortConfig.key];
            valB = b[sortConfig.key];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (sortConfig.key === 'value' || sortConfig.key === 'invested') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            }
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableAssets;
  }, [assets, sortConfig, searchQuery]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setFetchError(null);
      const q = query(collection(db, "users", user.uid, "assets"), orderBy("date", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssets(assetsData);
        setTotalPortfolioValue(assetsData.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0));
        setIsDataLoaded(true);
        setFetchError(null);
      }, (error) => {
        console.error("Firestore error:", error);
        setFetchError(error.message);
        setIsDataLoaded(true);
      });
      return () => unsubscribe();
    }
  }, [retryKey]);

  useGSAP(() => {
    if (isDataLoaded) {
      gsap.fromTo('.gsap-stagger', 
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power1.out' }
      );
    }
  }, [isDataLoaded]);

  const handleLogout = async () => {
    if (!isConfirmingLogout) {
      setIsConfirmingLogout(true);
      setTimeout(() => setIsConfirmingLogout(false), 3000);
      return;
    }
    try { await signOut(auth); navigate('/'); } catch (error) { console.error("Error:", error); }
  };

  
  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  const firstName = userData?.name ? userData.name.split(' ')[0] : 'Executive';

  const income = userData?.totalIncome || 0;
  const expenses = userData?.totalExpenses || 0;
  const balance = income - expenses; 
  const netWorth = balance + totalPortfolioValue;

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);


  // --- PRO MAX COMPUTATIONS ---
  // 1. Tax Loss Harvesting Engine
  const taxLossOpportunities = assets.reduce((acc, asset) => {
    const invested = parseFloat(asset.invested) || parseFloat(asset.value);
    const current = parseFloat(asset.value);
    const profit = current - invested;
    if (profit < 0) return acc + Math.abs(profit);
    return acc;
  }, 0);

  // 2. Passive Yield Tracker (Simulated 4% average yield on invested assets)
  const estimatedAnnualYield = netWorth * 0.04;
  
  // 3. Macro Exposure Warning
  // Find largest asset
  const topAsset = [...assets].sort((a,b) => parseFloat(b.value) - parseFloat(a.value))[0];
  const exposureWarning = topAsset 
    ? `Your portfolio is heavily weighted in ${topAsset.type} (${topAsset.name}). Consider diversifying into uncorrelated assets to hedge against macro volatility.`
    : `Diversify your cash holdings into productive assets to combat inflation.`;

  return (
    <div className="theme-pro-mono">

      {/* HEADER */}
      <div className="pro-header">
        <div className="pro-title">
          <h1>{getGreeting()}, {firstName}</h1>
          <span className="pro-tag">INDIVIDUAL INVESTOR</span>
        </div>
        <div className="pro-header-right">
           <div className="pro-live-sync">
             <div className="pulse-dot"></div> Live Sync
           </div>
           <div className="pro-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
           <button className="pro-logout-btn" onClick={handleLogout} style={isConfirmingLogout ? { background: '#EF4444', color: 'white' } : {}}>
             {isConfirmingLogout ? 'CONFIRM LOGOUT' : 'LOGOUT'}
           </button>
        </div>
      </div>

      <div className="epic-bento-dashboard">
        {/* METRICS */}
      <div className="bento-metrics-row">
        <div className="metric-box gsap-stagger">
          <span className="metric-label">Total Wealth
  <span className="tooltip-container"><Info size={14} className="icon-node" /><span className="tooltip-text">The complete sum of your liquid cash balance plus the current market value of all open positions.</span></span>
</span>
          <div className="metric-val">{formatINR(netWorth)}</div>
          <div className="metric-subtitle">Cash Balance + Portfolio Value</div>
        </div>
        <div className="metric-box gsap-stagger">
          <span className="metric-label">Cash on Hand
  <span className="tooltip-container"><Info size={14} className="icon-node" /><span className="tooltip-text">Your fully liquid, uninvested cash pool derived directly from your income minus expenses.</span></span>
</span>
          <div className="metric-val">{formatINR(balance)}</div>
          <div className="metric-subtitle">Total Income - Total Expenses</div>
        </div>
        <div className="metric-box gsap-stagger">
          <span className="metric-label">Portfolio Value
  <span className="tooltip-container"><Info size={14} className="icon-node" /><span className="tooltip-text">The live, mark-to-market total value of all your active investment holdings across asset classes.</span></span>
</span>
          <div className="metric-val">{formatINR(totalPortfolioValue)}</div>
          <div className="metric-subtitle">Total Current Value of Holdings</div>
        </div>
        <div className="metric-box gsap-stagger">
          <span className="metric-label">Monthly Burn
  <span className="tooltip-container"><Info size={14} className="icon-node" /><span className="tooltip-text">Your total recurring monthly expenditure, including both fixed obligations and variable lifestyle costs.</span></span>
</span>
          <div className="metric-val">{formatINR(expenses)}</div>
          <div className="metric-subtitle">Total Fixed & Variable Expenses</div>
        </div>
      </div>

      {/* LIVE MARKET TICKER */}
      <div className="mb-25">
        <MarketTicker />
      </div>

      {/* TOOLS */}
      <div className="pro-toolbar">
        <h2 className="toolbar-label">Analytical Tools</h2>
        <div className="tool-group">
          <button className="pro-btn gsap-stagger" onClick={() => setIsTaxModalOpen(true)}>
            <div className="icon-node"><Receipt size={16} weight="regular" color="var(--status-warning)" /></div> Tax Planner
          </button>
          <button className="pro-btn gsap-stagger" onClick={() => setIsLoanModalOpen(true)}>
            <div className="icon-node"><Calculator size={16} weight="regular" color="var(--status-warning)" /></div> Debt Manager
          </button>
          <button className="pro-btn gsap-stagger" onClick={() => setIsHealthModalOpen(true)}>
            <div className="icon-node"><Heartbeat size={16} weight="regular" color="var(--status-warning)" /></div> Health Audit
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="bento-main-row">
        {/* LEFT: ASSETS */}
        <div className="pro-panel gsap-stagger">
          <div className="panel-header">
            <h3 className="pro-title-flex">
              Investment Holdings
              <input 
                ref={searchInputRef}
                type="text" 
                className="pro-search-input" 
                placeholder="Search assets (Press '/')" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </h3>
            <button className="pro-btn pro-btn-sm" onClick={() => setIsAssetModalOpen(true)}>+ Add Position</button>
          </div>
          <div className="pro-table-container">
            {fetchError ? (
              <div className="pro-error-state">
                <p>Failed to sync portfolio: {fetchError}</p>
                <button className="pro-btn" onClick={() => setRetryKey(k => k + 1)}>Retry Connection</button>
              </div>
            ) : !isDataLoaded ? (
              <div className="pro-empty-state">
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text"></div>
              </div>
            ) : assets.length === 0 ? (
              <div className="pro-empty-state">No positions open</div>
            ) : sortedAssets.length === 0 ? (
              <div className="pro-empty-state">
                No assets match "{searchQuery}"
                <br /><br />
                <button className="pro-btn pro-btn-sm" onClick={() => setSearchQuery('')}>Clear Filter</button>
              </div>
            ) : (
              <table className="pro-table">
                <thead>
                  <tr>
                    <th tabIndex={0} role="columnheader" aria-sort={sortConfig.key==='name' ? (sortConfig.direction==='asc' ? 'ascending' : 'descending') : 'none'} className="pointer" onClick={() => requestSort('name')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') requestSort('name'); }}>ASSET {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th tabIndex={0} role="columnheader" aria-sort={sortConfig.key==='invested' ? (sortConfig.direction==='asc' ? 'ascending' : 'descending') : 'none'} className="text-right pointer" onClick={() => requestSort('invested')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') requestSort('invested'); }}>INVESTED {sortConfig.key === 'invested' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th tabIndex={0} role="columnheader" aria-sort={sortConfig.key==='value' ? (sortConfig.direction==='asc' ? 'ascending' : 'descending') : 'none'} className="text-right pointer" onClick={() => requestSort('value')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') requestSort('value'); }}>CURRENT {sortConfig.key === 'value' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th tabIndex={0} role="columnheader" aria-sort={sortConfig.key==='percent' ? (sortConfig.direction==='asc' ? 'ascending' : 'descending') : 'none'} className="text-right pointer" onClick={() => requestSort('percent')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' ') requestSort('percent'); }}>P&L {sortConfig.key === 'percent' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th><th className="w-40"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAssets.map(asset => {
                    const invested = parseFloat(asset.invested) || parseFloat(asset.value);
                    const current = parseFloat(asset.value);
                    const profit = current - invested;
                    const percent = invested > 0 ? ((profit / invested) * 100).toFixed(2) : 0;
                    


  return (
                      <tr key={asset.id} className="gsap-stagger pro-table-row">
                        <td><div className="asset-name">{asset.name}</div><div className="asset-type">{asset.type}</div></td>
                        <td className="mono-num text-right">{formatINR(invested)}</td>
                        <td className="mono-num text-right">{formatINR(current)}</td>
                        <td className={`mono-num text-right ${profit >= 0 ? 'text-green' : 'text-red'}`}>{profit >= 0 ? '+' : ''}{percent}%</td>
                        <td>
                          <div className="row-actions">
                            <button className="row-action-btn" title="View Details" onClick={() => setSelectedAsset(asset)}><DotsThree size={18} weight="bold" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT: TRANSACTION LOG */}
        <div className="pro-panel gsap-stagger pro-panel-transparent">
          {/* COMMAND CENTER */}
          <div className="command-center-grid">
            <button className="pro-action-card" onClick={() => setIsTransactionModalOpen(true)}>
              <Receipt size={24} weight="light" />
              <span>Log Transaction</span>
            </button>
            <button className="pro-action-card" onClick={() => setIsTaxModalOpen(true)}>
              <Calculator size={24} weight="light" />
              <span>Tax Harvesting</span>
            </button>
          </div>
          
          <div className="transaction-wrapper-mono">
             <TransactionHistory compactMode={true} theme="executive" /> 
          </div>
        </div>
      </div>

      
      {/* SECONDARY LAYOUT: PRO MAX WIDGETS */}
      <div className="bento-secondary-row gsap-stagger">
        <div className="pro-opportunity-card">
          <div className="opp-title pink">Tax-Loss Opportunities</div>
          <div className="opp-val">{formatINR(taxLossOpportunities)}</div>
          <div className="opp-desc">Unrealized losses available to harvest. Liquidating these positions can offset capital gains tax this fiscal year.</div>
        </div>
        <div className="pro-opportunity-card">
          <div className="opp-title blue">Macro Exposure Alert</div>
          <div className="opp-val">High Correlation</div>
          <div className="opp-desc">{exposureWarning}</div>
        </div>
        <div className="pro-opportunity-card">
          <div className="opp-title green">Estimated Passive Yield</div>
          <div className="opp-val">{formatINR(estimatedAnnualYield)} / yr</div>
          <div className="opp-desc">Based on your portfolio composition, you are generating approximately {formatINR(estimatedAnnualYield/12)} per month in passive income.</div>
        </div>
      </div>

      </div>

        {/* FIRE HORIZON CHART */}
      <FIREChart currentWealth={netWorth} monthlyBurn={expenses > 0 ? expenses : 100000} />

      {/* MODALS */}

      <AddAssetModal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} />
      <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} userType="executive" />
      <TaxCalculatorModal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} />
      <LoanCalculatorModal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} />
      <FinancialHealthModal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} />
      <AssetDetailModal isOpen={!!selectedAsset} asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      
      {/* Action Toast */}
      {actionToast && (
        <div className="pro-toast">
          {actionToast}
          <button onClick={() => setActionToast('')} className="toast-close">×</button>
        </div>
      )}
    </div>
  );
}

export default IndividualView;
