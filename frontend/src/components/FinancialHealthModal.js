import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './dashboards/Dashboard2.css'; 

/**
 * FINANCIAL HEALTH ANALYZER - FIXED VERSION
 * Error Fix: Resolved jsPDF.f3 error by correctly spreading color arrays.
 */

function FinancialHealthModal({ isOpen, onClose }) {
  // --- 1. STATE ---
  const [inputs, setInputs] = useState({
    age: '',
    monthlyIncome: '',
    monthlyExpense: '',
    monthlyDebt: '', 
    cash: '',        
    investments: '', 
    realEstate: '',  
    loanBalance: '', 
    otherLiabilities: '' 
  });

  const [analysis, setAnalysis] = useState(null);

  if (!isOpen) return null;

  // --- 2. ANALYSIS ENGINE ---
  const runDiagnostics = () => {
    const age = parseFloat(inputs.age) || 30;
    const inc = parseFloat(inputs.monthlyIncome) || 0;
    const exp = parseFloat(inputs.monthlyExpense) || 0;
    const debtEMI = parseFloat(inputs.monthlyDebt) || 0;
    
    const assetCash = parseFloat(inputs.cash) || 0;
    const assetInv = parseFloat(inputs.investments) || 0;
    const assetProp = parseFloat(inputs.realEstate) || 0;
    
    const liabLoan = parseFloat(inputs.loanBalance) || 0;
    const liabOther = parseFloat(inputs.otherLiabilities) || 0;

    if (inc === 0) {
      alert("Please enter a valid monthly income.");
      return;
    }

    // Core Math
    const totalAssets = assetCash + assetInv + assetProp;
    const totalLiabilities = liabLoan + liabOther;
    const netWorth = totalAssets - totalLiabilities;
    const monthlySavings = inc - exp - debtEMI;
    const annualSavings = monthlySavings * 12;
    
    // Ratios
    const savingsRate = (monthlySavings / inc) * 100;
    const dtiRatio = (debtEMI / inc) * 100; 
    const runway = exp > 0 ? (assetCash / exp) : 0; 
    const solvencyRatio = totalLiabilities > 0 ? (totalAssets / totalLiabilities) : (totalAssets > 0 ? 100 : 0);
    const investmentRatio = totalAssets > 0 ? (assetInv / totalAssets) * 100 : 0;

    // FIRE Engine
    const annualExpense = (exp + debtEMI) * 12;
    const fireNumber = annualExpense * 25; 
    const currentCorpus = assetCash + assetInv; 
    
    let yearsToFreedom = 99;
    let projectedFreedomAge = 99;
    
    if (monthlySavings > 0) {
       let futureVal = currentCorpus;
       let years = 0;
       const r = 0.08; 
       
       while(futureVal < fireNumber && years < 60) {
         futureVal = (futureVal * (1 + r)) + annualSavings;
         years++;
       }
       yearsToFreedom = years;
       projectedFreedomAge = age + years;
    }

    // Scoring
    let score = 0;
    if (savingsRate >= 30) score += 30; else if (savingsRate >= 20) score += 20; else if (savingsRate >= 10) score += 10;
    if (dtiRatio === 0) score += 25; else if (dtiRatio <= 30) score += 20; else if (dtiRatio <= 40) score += 10;
    if (runway >= 6) score += 25; else if (runway >= 3) score += 15; else if (runway >= 1) score += 5;
    if (solvencyRatio >= 2.0 && netWorth > 0) score += 20; else if (solvencyRatio >= 1.1 && netWorth > 0) score += 10;

    let verdict = "";
    if (score >= 80) verdict = "Excellent - Wealth Builder";
    else if (score >= 60) verdict = "Healthy - Stable";
    else if (score >= 40) verdict = "Vulnerable - Needs Attention";
    else verdict = "Critical - Immediate Action Required";

    setAnalysis({
      metrics: { netWorth, totalAssets, totalLiabilities, monthlySavings, savingsRate, dtiRatio, runway, solvencyRatio, investmentRatio },
      fire: { fireNumber, yearsToFreedom, projectedFreedomAge, currentCorpus, annualExpense },
      score,
      verdict,
      inputs: { inc, exp, debtEMI }
    });
  };

  // --- 3. FIXED PDF ENGINE ---
  const downloadReport = () => {
    if (!analysis) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    const addHeader = (title) => {
        doc.setFillColor(6, 78, 59);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text(title, margin, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()} | Age: ${inputs.age}`, margin, 28);
    };

    const addFooter = (pageNum) => {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Financial Health Analysis - Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    // === PAGE 1: SUMMARY ===
    addHeader("Financial Diagnostic Report");
    let y = 50;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("1. Overall Financial Score", margin, y);
    y += 10;
    
    // Draw Background Bar
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, 180, 15, 'F');
    
    // Draw Score Bar
    // FIX: Pass explicit RGB values instead of array
    const scoreR = analysis.score >= 75 ? 16 : analysis.score >= 50 ? 251 : 244;
    const scoreG = analysis.score >= 75 ? 185 : analysis.score >= 50 ? 191 : 63;
    const scoreB = analysis.score >= 75 ? 129 : analysis.score >= 50 ? 36 : 94;
    
    doc.setFillColor(scoreR, scoreG, scoreB);
    doc.rect(margin, y, (analysis.score / 100) * 180, 15, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`${analysis.score} / 100 (${analysis.verdict})`, margin + 2, y + 22);
    y += 35;

    // Ratios Table
    doc.setFontSize(16);
    doc.text("2. Key Vital Signs", margin, y);
    autoTable(doc, {
        startY: y + 8,
        head: [['Diagnostic Metric', 'Your Result', 'Benchmark', 'Status']],
        body: [
            ['Savings Rate', `${analysis.metrics.savingsRate.toFixed(1)}%`, '> 20%', analysis.metrics.savingsRate >= 20 ? '✅ Healthy' : '⚠️ Low'],
            ['Debt-to-Income', `${analysis.metrics.dtiRatio.toFixed(1)}%`, '< 30%', analysis.metrics.dtiRatio <= 30 ? '✅ Safe' : '🚨 Risky'],
            ['Emergency Runway', `${analysis.metrics.runway.toFixed(1)} Months`, '6 Months', analysis.metrics.runway >= 6 ? '✅ Secure' : '🛡️ Vulnerable'],
            ['Net Worth', `Rs. ${analysis.metrics.netWorth.toLocaleString()}`, 'Positive', analysis.metrics.netWorth > 0 ? '✅ Positive' : '🚨 Negative']
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 11, cellPadding: 6 }
    });
    addFooter(1);

    // === PAGE 2: BALANCE SHEET ===
    doc.addPage();
    addHeader("Net Worth & Balance Sheet");
    y = 50;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Understanding Your Net Worth", margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text("Net Worth = Total Assets - Total Liabilities. It is your true financial scorecard.", margin, y);
    y += 20;

    autoTable(doc, {
      startY: y,
      head: [['Category', 'Item', 'Amount']],
      body: [
        [{ content: 'ASSETS', colSpan: 3, styles: { fillColor: [220, 252, 231], fontStyle: 'bold' } }],
        ['Liquid', 'Cash / Savings', `Rs. ${parseFloat(inputs.cash || 0).toLocaleString()}`],
        ['Investments', 'Stocks / MF', `Rs. ${parseFloat(inputs.investments || 0).toLocaleString()}`],
        ['Fixed', 'Real Estate', `Rs. ${parseFloat(inputs.realEstate || 0).toLocaleString()}`],
        [{ content: 'TOTAL ASSETS', styles: { fontStyle: 'bold' } }, '', `Rs. ${analysis.metrics.totalAssets.toLocaleString()}`],
        
        [{ content: 'LIABILITIES', colSpan: 3, styles: { fillColor: [254, 226, 226], fontStyle: 'bold' } }],
        ['Secured', 'Loan Principal', `Rs. ${parseFloat(inputs.loanBalance || 0).toLocaleString()}`],
        ['Unsecured', 'Other Debt', `Rs. ${parseFloat(inputs.otherLiabilities || 0).toLocaleString()}`],
        [{ content: 'TOTAL LIABILITIES', styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }, '', `Rs. ${analysis.metrics.totalLiabilities.toLocaleString()}`],
        
        [{ content: 'NET WORTH', styles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' } }, '', `Rs. ${analysis.metrics.netWorth.toLocaleString()}`]
      ],
      theme: 'plain'
    });
    addFooter(2);

    // === PAGE 3: FIRE PROJECTION ===
    doc.addPage();
    addHeader("Future Wealth (FIRE)");
    y = 50;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("Financial Independence Roadmap", margin, y);
    y += 10;
    
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(16, 185, 129);
    doc.rect(margin, y, pageWidth - 28, 30, 'FD');
    
    doc.setTextColor(6, 78, 59);
    doc.setFontSize(12);
    
    if (analysis.fire.yearsToFreedom > 60) {
        doc.text("⚠️ Status: FIRE not visible at current savings rate.", margin + 5, y + 10);
        doc.text("Action: Increase income or cut expenses to create a gap.", margin + 5, y + 20);
    } else {
        doc.text(`🚀 Status: On track to retire in ${analysis.fire.yearsToFreedom} Years.`, margin + 5, y + 10);
        doc.text(`Projected Freedom Age: ${analysis.fire.projectedFreedomAge}`, margin + 5, y + 20);
    }
    y += 40;

    const projections = [5, 10, 15, 20].map(yr => {
        const n = yr * 12;
        const r = 0.08 / 12;
        const fv = (analysis.fire.currentCorpus * Math.pow(1+r, n)) + (analysis.metrics.monthlySavings * ((Math.pow(1+r, n) - 1) / r));
        return [`In ${yr} Years`, `Age ${parseInt(inputs.age) + yr}`, `Rs. ${Math.round(fv).toLocaleString()}`];
    });

    doc.setTextColor(0, 0, 0);
    doc.text("Wealth Growth (@ 8% Return)", margin, y);
    autoTable(doc, {
        startY: y + 5,
        head: [['Timeline', 'Age', 'Projected Portfolio']],
        body: projections,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
    });
    addFooter(3);

    // === PAGE 4: ACTION PLAN (FIXED COLOR ARRAY ISSUE) ===
    doc.addPage();
    addHeader("Dr. Finance's Prescription");
    y = 50;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Strategic Action Plan", margin, y);
    y += 15;

    const actions = [];
    if (analysis.metrics.runway < 6) actions.push({ title: "🔴 CRITICAL: Build Emergency Fund", desc: "Hoard cash until you cover 6 months of expenses." });
    else actions.push({ title: "✅ SAFETY: Good Job", desc: "Emergency fund is solid." });

    if (analysis.metrics.dtiRatio > 35) actions.push({ title: "🔴 DEBT: Stop Borrowing", desc: "Your debt is too high. Pay off high-interest loans ASAP." });
    
    if (analysis.metrics.savingsRate < 20) actions.push({ title: "⚠️ LIFESTYLE: Cut Costs", desc: "Audit subscriptions and reduce wants to save 20%." });
    else actions.push({ title: "🚀 GROWTH: Invest More", desc: "Automate investments into Index Funds." });

    actions.forEach(action => {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        
        // FIX: Explicit RGB assignment instead of array spread
        if (action.title.includes("✅")) doc.setTextColor(22, 163, 74);
        else if (action.title.includes("🔴")) doc.setTextColor(220, 38, 38);
        else doc.setTextColor(234, 88, 12);
        
        doc.text(action.title, margin, y);
        y += 7;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(action.desc, margin, y);
        y += 15;
    });
    addFooter(4);

    // === PAGE 5: EDUCATION ===
    doc.addPage();
    addHeader("Financial Concepts");
    y = 50;
    
    const concepts = [
        { t: "1. The 50/30/20 Rule", d: "50% Needs, 30% Wants, 20% Savings. This is the golden ratio." },
        { t: "2. The 25x Rule (FIRE)", d: "You need 25 times your annual expense invested to retire early." }
    ];

    concepts.forEach(c => {
        doc.setFontSize(12); doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'bold');
        doc.text(c.t, margin, y);
        y += 7;
        doc.setFontSize(10); doc.setTextColor(80, 80, 80); doc.setFont(undefined, 'normal');
        doc.text(c.d, margin, y);
        y += 20;
    });
    addFooter(5);

    doc.save("Comprehensive_Financial_Checkup.pdf");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content theme-wealth" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
            <h2>🩺 Ultimate Health Analyzer</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="health-input-container">
            <div className="input-column">
                <h4 style={{color:'#93c5fd', borderBottom:'1px solid rgba(59,130,246,0.3)', paddingBottom:'5px'}}>1. Income & Flows (Monthly)</h4>
                <div className="input-group"><label>Age</label><input type="number" className="money-input" value={inputs.age} onChange={e=>setInputs({...inputs, age:e.target.value})} placeholder="e.g. 30"/></div>
                <div className="input-group"><label>Net Income (In Hand)</label><input type="number" className="money-input" value={inputs.monthlyIncome} onChange={e=>setInputs({...inputs, monthlyIncome:e.target.value})} /></div>
                <div className="input-group"><label>Living Expenses</label><input type="number" className="money-input" value={inputs.monthlyExpense} onChange={e=>setInputs({...inputs, monthlyExpense:e.target.value})} /></div>
                <div className="input-group"><label>Debt EMIs</label><input type="number" className="money-input" value={inputs.monthlyDebt} onChange={e=>setInputs({...inputs, monthlyDebt:e.target.value})} /></div>
            </div>
            
            <div className="input-column">
                <h4 style={{color:'#86efac', borderBottom:'1px solid rgba(34,197,94,0.3)', paddingBottom:'5px'}}>2. Assets & Liabilities (Total)</h4>
                <div className="input-group"><label>Liquid Cash</label><input type="number" className="money-input" value={inputs.cash} onChange={e=>setInputs({...inputs, cash:e.target.value})} /></div>
                <div className="input-group"><label>Investments</label><input type="number" className="money-input" value={inputs.investments} onChange={e=>setInputs({...inputs, investments:e.target.value})} /></div>
                <div className="input-group"><label>Principal Loan Balance</label><input type="number" className="money-input" value={inputs.loanBalance} onChange={e=>setInputs({...inputs, loanBalance:e.target.value})} /></div>
                <div className="input-group"><label>Real Estate Value</label><input type="number" className="money-input" value={inputs.realEstate} onChange={e=>setInputs({...inputs, realEstate:e.target.value})} /></div>
            </div>
        </div>

        <button className="save-btn" onClick={runDiagnostics} style={{width:'100%', marginTop:'20px', padding:'15px', fontSize:'1.1rem', background:'linear-gradient(135deg, var(--primary), #1d4ed8)'}}>
            🏥 Run Full Diagnostics
        </button>

        {analysis && (
           <div className="fade-in" style={{marginTop:'30px', borderTop:'1px dashed #334155', paddingTop:'20px'}}>
              <div style={{textAlign:'center', marginBottom:'30px'}}>
                 <div className="score-circle" style={{background: `conic-gradient(${analysis.score>75?'var(--accent)':analysis.score>50?'var(--status-warning)':'#f43f5e'} ${analysis.score}%, var(--surface-muted) 0)`}}>
                    <div className="score-inner">
                       <span style={{fontSize:'3.5rem', fontWeight:'bold', color:'white'}}>{analysis.score}</span>
                       <span style={{fontSize:'0.9rem', color: 'var(--border-strong)'}}>HEALTH SCORE</span>
                    </div>
                 </div>
                 <div style={{fontSize:'1.2rem', fontWeight:'bold', marginTop:'10px', color: analysis.score>75?'#4ade80':analysis.score>50?'#fcd34d':'var(--status-danger)'}}>Verdict: {analysis.verdict}</div>
              </div>

              <h4 style={{color:'var(--text-main)', marginBottom:'15px'}}>📊 Vital Signs</h4>
              <div className="vitals-grid">
                 <div className="vital-card">
                    <span className="v-label">Net Worth</span>
                    <div className="v-value">₹{(analysis.metrics.netWorth/100000).toFixed(1)} L</div>
                 </div>
                 <div className="vital-card">
                    <span className="v-label">Savings Rate</span>
                    <div className="v-value" style={{color: analysis.metrics.savingsRate<20?'#f43f5e':'#34d399'}}>{analysis.metrics.savingsRate.toFixed(1)}%</div>
                 </div>
                 <div className="vital-card">
                    <span className="v-label">Runway</span>
                    <div className="v-value" style={{color: analysis.metrics.runway<6?'var(--status-warning)':'#34d399'}}>{analysis.metrics.runway.toFixed(1)} Mo</div>
                 </div>
                 <div className="vital-card">
                    <span className="v-label">Freedom Year</span>
                    <div className="v-value" style={{color: 'var(--primary)'}}>{analysis.fire.yearsToFreedom < 60 ? analysis.fire.yearsToFreedom : '99+'} Yrs</div>
                 </div>
              </div>

              <h4 style={{color:'var(--text-main)', marginTop:'25px'}}>💰 Budget Allocation (50/30/20 Rule)</h4>
              <div style={{height:'30px', width:'100%', background:'#334155', borderRadius:'15px', overflow:'hidden', display:'flex', marginTop:'10px'}}>
                 <div style={{width: `${Math.min(100, (analysis.inputs.exp/analysis.inputs.inc)*100)}%`, background:'#f472b6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', color:'white'}}>Needs</div>
                 <div style={{width: `${Math.min(100, (analysis.metrics.monthlySavings/analysis.inputs.inc)*100)}%`, background:'#34d399', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', color:'white'}}>Savings</div>
                 <div style={{flex:1, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', color:'white'}}>Debt/Wants</div>
              </div>

              <button className="save-btn" onClick={downloadReport} style={{width:'100%', marginTop:'30px', padding:'15px', fontSize:'1.1rem', background:'linear-gradient(135deg, var(--accent), #059669)'}}>
                 📄 Download 5-Page Expert Report
              </button>
           </div>
        )}
      </div>
      <style>{`
        .health-input-container { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        .input-column { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .score-circle { width: 180px; height: 180px; borderRadius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 30px var(--overlay-dark); }
        .score-inner { width: 150px; height: 150px; background: #0f172a; borderRadius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .vitals-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; }
        .vital-card { background: rgba(15, 23, 42, 0.8); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; }
        .v-label { color: var(--border-strong); font-size: 0.8rem; display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
        .v-value { font-size: 1.4rem; font-weight: 800; color: white; }
        @media (max-width: 650px) { .health-input-container { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

export default FinancialHealthModal;