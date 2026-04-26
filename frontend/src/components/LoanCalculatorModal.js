import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './dashboards/Dashboard2.css'; 

function LoanCalculatorModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('calculate'); 
  
  // Calculate Tab State
  const [loan, setLoan] = useState({ amount: '', rate: '', tenure: '', prepayment: '', type: 'home' });
  const [result, setResult] = useState(null);
  const [strategies, setStrategies] = useState(null);
  const [amortization, setAmortization] = useState([]);

  // Compare Tab State
  const [compareA, setCompareA] = useState({ amount: '', rate: '', tenure: '' });
  const [compareB, setCompareB] = useState({ amount: '', rate: '', tenure: '' });
  const [compareResult, setCompareResult] = useState(null);

  useEffect(() => { 
    if (isOpen) { setResult(null); setStrategies(null); setAmortization([]); setCompareResult(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const benchmarks = {
    home: { excellent: 8.5, good: 9.0, avg: 9.5, label: 'Home Loan' },
    car: { excellent: 8.75, good: 9.5, avg: 10.5, label: 'Car Loan' },
    personal: { excellent: 10.5, good: 12.0, avg: 14.0, label: 'Personal Loan' },
    education: { excellent: 9.0, good: 10.5, avg: 12.0, label: 'Education Loan' }
  };

  // --- CALCULATION LOGIC ---
  const calculateEMI = (P, r, n) => {
    const R = r / 12 / 100;
    const N = n * 12;
    return (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
  };

  const calculateScenario = (P, r, n, extraMonthly, extraYearly, yearlyIncrementPercent) => {
    let balance = P;
    let months = 0;
    let totalInterest = 0;
    let currentEMI = calculateEMI(P, r, n);
    const monthlyRate = r / 12 / 100;
    let schedule = [];

    while (balance > 10 && months < n * 12) {
      if (months > 0 && months % 12 === 0) currentEMI = currentEMI * (1 + yearlyIncrementPercent / 100);
      const interest = balance * monthlyRate;
      let monthlyPay = currentEMI + extraMonthly;
      if ((months + 1) % 12 === 0) monthlyPay += extraYearly;
      
      let principal = monthlyPay - interest;
      if (balance < principal) { principal = balance; monthlyPay = principal + interest; }

      totalInterest += interest;
      balance -= principal;
      months++;

      if (months % 12 === 0 || balance <= 0) {
        schedule.push({ year: Math.ceil(months/12), balance: Math.max(0, balance), paidInterest: totalInterest, paidPrincipal: P - balance });
      }
    }
    return { months, totalInterest, totalPaid: P + totalInterest, schedule };
  };

  const handleCalculate = () => {
    const P = parseFloat(loan.amount);
    const R = parseFloat(loan.rate);
    const N = parseFloat(loan.tenure);
    const extraEMI = parseFloat(loan.prepayment) || 0;

    if (!P || !R || !N) return;

    const baseEMI = calculateEMI(P, R, N);
    const baseScenario = calculateScenario(P, R, N, extraEMI, 0, 0);
    const strat1 = calculateScenario(P, R, N, 0, baseEMI, 0); 
    const strat2 = calculateScenario(P, R, N, 0, 0, 5); 
    const strat3 = calculateScenario(P, R, N, 5000, 0, 0); 

    const bench = benchmarks[loan.type];
    let rateVerdict = R <= bench.excellent ? "🌟 Market Leader" : R <= bench.good ? "✅ Competitive" : R <= bench.avg ? "⚠️ Average" : "🚨 High Rate Alert";

    setResult({
      emi: baseEMI, principal: P, totalInterest: baseScenario.totalInterest, totalPaid: baseScenario.totalPaid,
      months: baseScenario.months, interestRatio: (baseScenario.totalInterest / baseScenario.totalPaid) * 100,
      payoffDate: new Date(new Date().setMonth(new Date().getMonth() + baseScenario.months)).toLocaleDateString(),
    });
    setStrategies({ oneExtra: strat1, stepUp: strat2, fixedExtra: strat3, verdict: rateVerdict, benchmark: bench });
    setAmortization(baseScenario.schedule);
  };

  const handleCompare = () => {
    const emiA = calculateEMI(parseFloat(compareA.amount), parseFloat(compareA.rate), parseFloat(compareA.tenure));
    const totalA = emiA * parseFloat(compareA.tenure) * 12;
    const interestA = totalA - parseFloat(compareA.amount);
    const emiB = calculateEMI(parseFloat(compareB.amount), parseFloat(compareB.rate), parseFloat(compareB.tenure));
    const totalB = emiB * parseFloat(compareB.tenure) * 12;
    const interestB = totalB - parseFloat(compareB.amount);

    setCompareResult({
      loanA: { emi: emiA, total: totalA, interest: interestA },
      loanB: { emi: emiB, total: totalB, interest: interestB },
      winner: totalA < totalB ? 'Loan A' : 'Loan B',
      savings: Math.abs(totalA - totalB),
      emiDiff: Math.abs(emiA - emiB)
    });
  };

  // --- PDF 1: MINI STRATEGY REPORT (1 Page) ---
  const downloadStrategyPDF = (stratName, stratData, actionText) => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255); doc.setFontSize(20); doc.text("Strategic Insight Report", 14, 20);
    doc.setFontSize(12); doc.text(`Plan: ${stratName}`, 14, 30);
    let y = 50;
    const baseInterest = (result.emi * parseFloat(loan.tenure) * 12) - result.principal;
    const savedAmt = baseInterest - stratData.totalInterest;
    autoTable(doc, {
      startY: y + 10, head: [['Metric', 'Standard Loan', 'With Strategy']],
      body: [['Total Interest', `Rs. ${Math.round(baseInterest).toLocaleString()}`, `Rs. ${Math.round(stratData.totalInterest).toLocaleString()}`], ['Payoff Time', `${parseFloat(loan.tenure)} Years`, `${(stratData.months/12).toFixed(1)} Years`], ['Net Savings', '-', `Rs. ${Math.round(savedAmt).toLocaleString()}`]],
      theme: 'grid', headStyles: { fillColor: [37, 99, 235] }
    });
    y = doc.lastAutoTable.finalY + 20;
    doc.setTextColor(0); doc.text("Execution Plan", 14, y); y += 10;
    doc.setFillColor(240, 253, 250); doc.rect(14, y, 180, 20, 'F');
    doc.setTextColor(6, 78, 59); doc.setFontSize(11); doc.text(`Action: ${actionText}`, 20, y + 10);
    doc.save(`${stratName.replace(/ /g, "_")}_Mini_Report.pdf`);
  };

  // --- PDF 2: MASTER CALCULATOR REPORT (5 Pages) ---
  const downloadFullPDF = () => {
    if (!result || !strategies) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    doc.setFillColor(6, 78, 59); doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255); doc.setFontSize(22); doc.text("Loan Master Report", 14, 25);
    
    // Page 1: Summary
    let y = 55; doc.setTextColor(0); doc.setFontSize(16); doc.text("1. Loan DNA", 14, y);
    autoTable(doc, { startY: y + 10, head: [['Metric', 'Value']], body: [['Amount', `Rs. ${result.principal.toLocaleString()}`], ['EMI', `Rs. ${Math.round(result.emi).toLocaleString()}`], ['Total Interest', `Rs. ${Math.round(result.totalInterest).toLocaleString()}`]], theme: 'grid', headStyles: { fillColor: [16, 185, 129] } });
    
    // Page 2: Amortization
    doc.addPage(); doc.text("Yearly Schedule", 14, 20);
    const amortRows = amortization.map(r => [`Year ${r.year}`, Math.round(r.paidPrincipal), Math.round(r.paidInterest), Math.round(r.balance)]);
    autoTable(doc, { startY: 30, head: [['Time', 'Principal', 'Interest', 'Balance']], body: amortRows });
    
    // Page 3: Strategy
    doc.addPage(); doc.text("Strategy Analysis", 14, 20);
    const baseInt = (result.emi * parseFloat(loan.tenure) * 12) - result.principal;
    const stratRows = [['1 Extra/Yr', `Rs. ${Math.round(baseInt - strategies.oneExtra.totalInterest).toLocaleString()}`, 'Recommended'], ['+5k/Mo', `Rs. ${Math.round(baseInt - strategies.fixedExtra.totalInterest).toLocaleString()}`, 'Fastest']];
    autoTable(doc, { startY: 30, head: [['Strategy', 'Saved', 'Verdict']], body: stratRows });

    doc.save("Loan_Master_Report.pdf");
  };

  // --- 🌟 PDF 3: COMPARISON BATTLE REPORT (4 Pages) ---
  const downloadComparisonPDF = () => {
    if (!compareResult) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // === PAGE 1: THE VERDICT ===
    doc.setFillColor(6, 78, 59); doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255); doc.setFontSize(22); doc.text("Loan Comparison Battle Report", 14, 25);
    doc.setFontSize(10); doc.text("Head-to-Head Analysis", 14, 32);

    let y = 60;
    doc.setTextColor(0); doc.setFontSize(16); doc.text("1. The Verdict", 14, y);
    y += 10;
    
    // Winner Box
    doc.setFillColor(220, 252, 231); doc.setDrawColor(22, 163, 74);
    doc.rect(14, y, pageWidth - 28, 30, 'FD');
    doc.setTextColor(22, 163, 74); doc.setFont(undefined, 'bold'); doc.setFontSize(14);
    doc.text(`WINNER: ${compareResult.winner}`, 20, y + 10);
    doc.setTextColor(0); doc.setFont(undefined, 'normal'); doc.setFontSize(11);
    doc.text(`By choosing ${compareResult.winner}, you will save Rs. ${Math.round(compareResult.savings).toLocaleString()} in total cost.`, 20, y + 20);
    
    // === PAGE 2: HEAD-TO-HEAD DATA ===
    doc.addPage();
    doc.setFillColor(6, 78, 59); doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255); doc.setFontSize(16); doc.text("Detailed Side-by-Side Comparison", 14, 14);

    const compRows = [
      ['Loan Amount', `Rs. ${compareA.amount}`, `Rs. ${compareB.amount}`, '-'],
      ['Interest Rate', `${compareA.rate}%`, `${compareB.rate}%`, `${Math.abs(compareA.rate - compareB.rate).toFixed(2)}% Diff`],
      ['Tenure', `${compareA.tenure} Years`, `${compareB.tenure} Years`, '-'],
      ['Monthly EMI', `Rs. ${Math.round(compareResult.loanA.emi).toLocaleString()}`, `Rs. ${Math.round(compareResult.loanB.emi).toLocaleString()}`, `Rs. ${Math.round(compareResult.emiDiff).toLocaleString()}`],
      ['Total Interest', `Rs. ${Math.round(compareResult.loanA.interest).toLocaleString()}`, `Rs. ${Math.round(compareResult.loanB.interest).toLocaleString()}`, `Rs. ${Math.round(Math.abs(compareResult.loanA.interest - compareResult.loanB.interest)).toLocaleString()}`],
      ['Total Cost', `Rs. ${Math.round(compareResult.loanA.total).toLocaleString()}`, `Rs. ${Math.round(compareResult.loanB.total).toLocaleString()}`, `Rs. ${Math.round(compareResult.savings).toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 30,
      head: [['Metric', 'Loan A', 'Loan B', 'Difference']],
      body: compRows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 3: { fontStyle: 'bold', textColor: [234, 88, 12] } }
    });

    // === PAGE 3: VISUAL BATTLE ===
    doc.addPage();
    doc.setFillColor(6, 78, 59); doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255); doc.setFontSize(16); doc.text("Visual Cost Battle", 14, 14);

    y = 40;
    doc.setTextColor(0); doc.setFontSize(12); doc.text("Total Repayment Amount (Lower is Better)", 14, y);
    y += 15;

    const maxVal = Math.max(compareResult.loanA.total, compareResult.loanB.total);
    const scale = 150 / maxVal;
    
    // Bar A
    doc.text("Loan A", 14, y+5);
    doc.setFillColor(compareResult.winner === 'Loan A' ? 16 : 100, compareResult.winner === 'Loan A' ? 185 : 116, compareResult.winner === 'Loan A' ? 129 : 139);
    doc.rect(40, y, compareResult.loanA.total * scale, 10, 'F');
    doc.text(`Rs. ${Math.round(compareResult.loanA.total/1000)}k`, 45 + (compareResult.loanA.total * scale), y+7);
    
    y += 20;
    // Bar B
    doc.text("Loan B", 14, y+5);
    doc.setFillColor(compareResult.winner === 'Loan B' ? 16 : 100, compareResult.winner === 'Loan B' ? 185 : 116, compareResult.winner === 'Loan B' ? 129 : 139);
    doc.rect(40, y, compareResult.loanB.total * scale, 10, 'F');
    doc.text(`Rs. ${Math.round(compareResult.loanB.total/1000)}k`, 45 + (compareResult.loanB.total * scale), y+7);

    // === PAGE 4: OPPORTUNITY COST ANALYSIS ===
    doc.addPage();
    doc.setFillColor(6, 78, 59); doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255); doc.setFontSize(16); doc.text("Strategic Opportunity Analysis", 14, 14);

    y = 40;
    doc.setTextColor(0); doc.setFontSize(14); doc.text("What is the 'Opportunity Cost'?", 14, y);
    y += 10;
    doc.setFontSize(11); doc.setTextColor(50);
    const oppText = `You are saving Rs. ${Math.round(compareResult.savings).toLocaleString()} by choosing ${compareResult.winner}. If you invested this savings amount in a simple Index Fund (SIP) over the loan tenure, it could grow significantly.`;
    doc.text(doc.splitTextToSize(oppText, pageWidth - 28), 14, y);
    
    y += 30;
    doc.setFontSize(14); doc.setTextColor(0); doc.text("Final Recommendation:", 14, y);
    y += 10;
    doc.setFontSize(11); doc.setTextColor(50);
    doc.text(`👉 Go with ${compareResult.winner}.`, 14, y);
    doc.text(`👉 Use the monthly saving of Rs. ${Math.round(compareResult.emiDiff).toLocaleString()} to start a new SIP.`, 14, y+8);

    doc.save("Loan_Comparison_Battle_Report.pdf");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content theme-wealth" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header"><h2>🏦 Loan Command Center</h2><button className="close-btn" onClick={onClose}>&times;</button></div>

        <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
          {['calculate', 'compare', 'amortization'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{flex: 1, padding: '12px', borderRadius: '8px', background: activeTab === tab ? '#10b981' : 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 'bold', border:'none', cursor:'pointer'}}>{tab.toUpperCase()}</button>
          ))}
        </div>

        {/* --- TAB 1: CALCULATE --- */}
        {activeTab === 'calculate' && (
          <div className="fade-in">
             <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'15px', marginBottom:'20px'}}>
                <div className="input-group"><label>Type</label><select className="money-input" value={loan.type} onChange={e => setLoan({...loan, type: e.target.value})}><option value="home">Home Loan</option><option value="car">Car Loan</option><option value="personal">Personal Loan</option></select></div>
                <div className="input-group"><label>Amount</label><input type="number" className="money-input" value={loan.amount} onChange={e=>setLoan({...loan, amount:e.target.value})} /></div>
                <div className="input-group"><label>Rate (%)</label><input type="number" className="money-input" value={loan.rate} onChange={e=>setLoan({...loan, rate:e.target.value})} /></div>
                <div className="input-group"><label>Tenure (Yrs)</label><input type="number" className="money-input" value={loan.tenure} onChange={e=>setLoan({...loan, tenure:e.target.value})} /></div>
             </div>
             <button className="save-btn" onClick={handleCalculate} style={{width:'100%'}}>Run Analysis</button>

             {result && strategies && (
               <div style={{marginTop:'25px'}}>
                  <h4 style={{color:'#e2e8f0', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'5px'}}>🧬 Loan DNA Analysis</h4>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'20px'}}>
                     <div className="stat-box"><span>Monthly EMI</span><h3>₹{Math.round(result.emi).toLocaleString()}</h3></div>
                     <div className="stat-box"><span>Total Interest</span><h3 style={{color:'#fda4af'}}>₹{Math.round(result.totalInterest).toLocaleString()}</h3></div>
                     <div className="stat-box"><span>Rate Verdict</span><h3 style={{fontSize:'0.9rem', color:'#34d399'}}>{strategies.verdict}</h3></div>
                  </div>

                  <h4 style={{color:'#e2e8f0', marginTop:'20px'}}>⚔️ Strategy Battle</h4>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'15px'}}>
                     <div className="strategy-card">
                        <h5>1 Extra EMI/Yr</h5>
                        <p className="save-tag">Save ₹{Math.round((result.emi * loan.tenure * 12 - result.principal) - strategies.oneExtra.totalInterest).toLocaleString()}</p>
                        <button className="mini-btn" onClick={() => downloadStrategyPDF("1 Extra EMI Strategy", strategies.oneExtra, "Pay 1 extra EMI every year.")}>📄 Mini Report</button>
                     </div>
                     <div className="strategy-card">
                        <h5>+5% EMI/Yr</h5>
                        <p className="save-tag">Save ₹{Math.round((result.emi * loan.tenure * 12 - result.principal) - strategies.stepUp.totalInterest).toLocaleString()}</p>
                        <button className="mini-btn" onClick={() => downloadStrategyPDF("Step-Up Strategy", strategies.stepUp, "Increase EMI by 5% yearly.")}>📄 Mini Report</button>
                     </div>
                     <div className="strategy-card">
                        <h5>+5k Monthly</h5>
                        <p className="save-tag">Save ₹{Math.round((result.emi * loan.tenure * 12 - result.principal) - strategies.fixedExtra.totalInterest).toLocaleString()}</p>
                        <button className="mini-btn" onClick={() => downloadStrategyPDF("Fixed Extra Pay Strategy", strategies.fixedExtra, "Add Rs. 5000 to monthly pay.")}>📄 Mini Report</button>
                     </div>
                  </div>

                  <button className="save-btn" onClick={downloadFullPDF} style={{width:'100%', marginTop:'20px', background:'#3b82f6'}}>📄 Download 5-Page Master Report</button>
               </div>
             )}
          </div>
        )}

        {/* --- TAB 2: COMPARE --- */}
        {activeTab === 'compare' && (
          <div className="fade-in">
             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'15px'}}>
                   <h4 style={{textAlign:'center', color:'#34d399'}}>Loan A</h4>
                   <input className="money-input" placeholder="Amount" onChange={e=>setCompareA({...compareA, amount:e.target.value})} style={{marginBottom:'5px'}}/>
                   <input className="money-input" placeholder="Rate" onChange={e=>setCompareA({...compareA, rate:e.target.value})} style={{marginBottom:'5px'}}/>
                   <input className="money-input" placeholder="Years" onChange={e=>setCompareA({...compareA, tenure:e.target.value})} />
                </div>
                <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'15px'}}>
                   <h4 style={{textAlign:'center', color:'#f472b6'}}>Loan B</h4>
                   <input className="money-input" placeholder="Amount" onChange={e=>setCompareB({...compareB, amount:e.target.value})} style={{marginBottom:'5px'}}/>
                   <input className="money-input" placeholder="Rate" onChange={e=>setCompareB({...compareB, rate:e.target.value})} style={{marginBottom:'5px'}}/>
                   <input className="money-input" placeholder="Years" onChange={e=>setCompareB({...compareB, tenure:e.target.value})} />
                </div>
             </div>
             <button className="save-btn" onClick={handleCompare} style={{width:'100%', marginBottom:'20px'}}>Compare Loans</button>

             {compareResult && (
                <div className="fade-in">
                   <div style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding:'20px', borderRadius:'15px', textAlign:'center', marginBottom:'20px'}}>
                      <h2 style={{margin:0, color:'white', fontSize:'1.5rem'}}>🏆 {compareResult.winner} Wins!</h2>
                      <p style={{color:'#ecfdf5', margin:'5px 0 0 0'}}>Savings: <span style={{fontWeight:'bold'}}>₹{Math.round(compareResult.savings).toLocaleString()}</span></p>
                   </div>
                   <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'15px'}}>
                      <div className="stat-box"><span>EMI Diff</span><h3>₹{Math.round(compareResult.emiDiff).toLocaleString()}</h3></div>
                      <div className="stat-box"><span>Loan A Int</span><h3>₹{Math.round(compareResult.loanA.interest).toLocaleString()}</h3></div>
                      <div className="stat-box"><span>Loan B Int</span><h3>₹{Math.round(compareResult.loanB.interest).toLocaleString()}</h3></div>
                   </div>
                   
                   {/* 🌟 NEW BUTTON FOR COMPARISON REPORT */}
                   <button className="save-btn" onClick={downloadComparisonPDF} style={{width:'100%', marginTop:'20px', background:'#8b5cf6'}}>📄 Download 4-Page Battle Report</button>
                </div>
             )}
          </div>
        )}

        {/* --- TAB 3: AMORTIZATION --- */}
        {activeTab === 'amortization' && (
           <div className="fade-in">
              {!result ? <p style={{color:'white', textAlign:'center', padding:'20px'}}>Calculate first.</p> : (
                 <div style={{maxHeight:'400px', overflowY:'auto'}}>
                    <table style={{width:'100%', color:'#cbd5e1', borderCollapse:'collapse'}}>
                       <thead style={{background:'#1e293b', position:'sticky', top:0}}><tr><th>Year</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
                       <tbody>
                          {amortization.map(row => (
                             <tr key={row.year} style={{borderBottom:'1px solid rgba(255,255,255,0.05)', textAlign:'center'}}>
                                <td style={{padding:'10px'}}>{row.year}</td>
                                <td style={{color:'#a7f3d0'}}>₹{Math.round(row.paidPrincipal).toLocaleString()}</td>
                                <td style={{color:'#fda4af'}}>₹{Math.round(row.paidInterest).toLocaleString()}</td>
                                <td>₹{Math.round(row.balance).toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}
           </div>
        )}
      </div>
      <style>{`
        .mini-btn { margin-top: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; width: 100%; }
        .mini-btn:hover { background: #3b82f6; border-color: #3b82f6; }
        .stat-box { background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center; }
        .strategy-card { background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(59, 130, 246, 0.3); text-align: center; }
        .save-tag { color: #34d399; font-weight: bold; margin: 0; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}

export default LoanCalculatorModal;