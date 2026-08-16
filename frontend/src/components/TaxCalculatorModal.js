import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './dashboards/Dashboard2.css'; 

function TaxCalculatorModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('income'); 
  const [income, setIncome] = useState({ salary: '', other: '', business: '' });
  const [deductions, setDeductions] = useState({
    section80C: '', section80D: '', hra: '', homeLoan: '', other: ''
  });
  const [calculation, setCalculation] = useState(null);

  useEffect(() => { 
    if (isOpen) setCalculation(null); 
  }, [isOpen]);

  if (!isOpen) return null;

  // --- LOGIC: CALCULATE ---
  const handleCalculate = () => {
    const grossSalary = parseFloat(income.salary) || 0;
    const otherIncome = (parseFloat(income.other) || 0) + (parseFloat(income.business) || 0);
    const totalGross = grossSalary + otherIncome;

    // --- NEW REGIME (FY 25) ---
    const stdDedNew = 75000;
    const taxableNew = Math.max(0, totalGross - stdDedNew);
    let taxNew = 0;
    
    // New Slabs
    if (taxableNew > 1500000) taxNew += (taxableNew - 1500000) * 0.30 + 150000;
    else if (taxableNew > 1200000) taxNew += (taxableNew - 1200000) * 0.20 + 90000;
    else if (taxableNew > 1000000) taxNew += (taxableNew - 1000000) * 0.15 + 60000;
    else if (taxableNew > 700000) taxNew += (taxableNew - 700000) * 0.10 + 30000;
    else if (taxableNew > 300000) taxNew += (taxableNew - 300000) * 0.05;

    if (taxableNew <= 700000) taxNew = 0; 
    const finalTaxNew = taxNew + (taxNew * 0.04);

    // --- OLD REGIME ---
    const stdDedOld = 50000;
    const declared80C = parseFloat(deductions.section80C) || 0;
    const declared80D = parseFloat(deductions.section80D) || 0;
    
    const totalDeclaredDeductions = Math.min(declared80C, 150000) + 
                    declared80D + 
                    (parseFloat(deductions.hra)||0) + 
                    (parseFloat(deductions.homeLoan)||0) + 
                    (parseFloat(deductions.other)||0);
    
    const taxableOld = Math.max(0, totalGross - stdDedOld - totalDeclaredDeductions);
    let taxOld = 0;

    // Old Slabs
    if (taxableOld > 1000000) taxOld += (taxableOld - 1000000) * 0.30 + 112500;
    else if (taxableOld > 500000) taxOld += (taxableOld - 500000) * 0.20 + 12500;
    else if (taxableOld > 250000) taxOld += (taxableOld - 250000) * 0.05;

    if (taxableOld <= 500000) taxOld = 0; 
    const finalTaxOld = taxOld + (taxOld * 0.04);

    // --- ANALYSIS ---
    const betterRegime = finalTaxNew < finalTaxOld ? 'New Regime' : 'Old Regime';
    const winningTax = Math.min(finalTaxNew, finalTaxOld);
    const taxPercent = totalGross > 0 ? (winningTax / totalGross) * 100 : 0;
    
    let reason = "";
    if (betterRegime === 'Old Regime') {
      reason = `You declared high deductions (Rs. ${totalDeclaredDeductions.toLocaleString()}). Since your deductions exceed the break-even threshold, the Old Regime saves you money.`;
    } else {
      reason = totalDeclaredDeductions === 0 
        ? "You didn't declare any deductions. The New Regime is automatically better due to lower tax rates." 
        : `Your deductions (Rs. ${totalDeclaredDeductions.toLocaleString()}) are not high enough to beat the lower rates of the New Regime.`;
    }

    // --- SUGGESTIONS GENERATOR ---
    let suggestions = [];
    
    if (betterRegime === 'New Regime') {
        suggestions.push("⚠️ Currently, the New Regime is better for you. Investments (80C, 80D) will NOT reduce your tax in this regime.");
        suggestions.push("ℹ️ However, if you switch to Old Regime, you need to increase your deductions significantly to beat the New Regime rates.");
    } else {
        // 80C Check
        if (declared80C < 150000) {
            const gap = 150000 - declared80C;
            suggestions.push(`💰 Invest Rs. ${gap.toLocaleString()} more in 80C (PPF, ELSS, LIC) to maximize your 1.5L limit.`);
        }
        // 80D Check
        if (declared80D < 25000) {
            const gap = 25000 - declared80D;
            suggestions.push(`🏥 Consider increasing Health Insurance coverage by Rs. ${gap.toLocaleString()} to maximize Section 80D.`);
        }
        suggestions.push("👴 Invest Rs. 50,000 in NPS (Tier 1) to claim an EXTRA deduction under Section 80CCD(1B) over and above the 1.5L limit.");
    }

    setCalculation({
      gross: totalGross,
      newRegime: { taxable: taxableNew, tax: finalTaxNew, label: 'New Regime' },
      oldRegime: { taxable: taxableOld, tax: finalTaxOld, label: 'Old Regime' },
      savings: Math.abs(finalTaxNew - finalTaxOld),
      better: betterRegime,
      winningTax: winningTax,
      monthlyTax: winningTax / 12,
      taxPercent: taxPercent,
      incomePercent: 100 - taxPercent,
      totalDeductions: totalDeclaredDeductions,
      reason: reason,
      suggestions: suggestions 
    });

    setActiveTab('result');
  };

  // --- LOGIC: PDF EXPORT (FIXED FOR EMOJIS) ---
  const downloadPDF = () => {
    if (!calculation) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // 1. HEADER
    doc.setFillColor(6, 78, 59); 
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Tax Analysis Report", 14, 25);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text("FY 2024-2025", pageWidth - 14, 25, { align: 'right' });

    let finalY = 50;

    // 2. FINANCIAL SUMMARY
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("1. Financial Summary", 14, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Category', 'Amount']],
      body: [
        ['Gross Annual Income', `Rs. ${calculation.gross.toLocaleString()}`],
        ['Declared Deductions (Old Regime)', `Rs. ${calculation.totalDeductions.toLocaleString()}`],
        [{ content: 'Taxable Income (New Regime)', styles: { fontStyle: 'bold' } }, `Rs. ${calculation.newRegime.taxable.toLocaleString()}`],
        [{ content: 'Taxable Income (Old Regime)', styles: { fontStyle: 'bold' } }, `Rs. ${calculation.oldRegime.taxable.toLocaleString()}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    });
    finalY = doc.lastAutoTable.finalY + 15;

    // 3. COMPARISON TABLE
    doc.setFontSize(14);
    doc.text("2. Detailed Regime Comparison", 14, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Feature', 'Old Regime (Existing)', 'New Regime (Default)']],
      body: [
        ['Standard Deduction', 'Rs. 50,000', 'Rs. 75,000 (Higher)'],
        ['Basic Exemption Limit', 'Rs. 2.5 Lakhs', 'Rs. 3.0 Lakhs'],
        ['Section 80C (PPF, LIC)', 'Allowed (1.5L)', 'Not Allowed'],
        ['Section 80D (Health)', 'Allowed', 'Not Allowed'],
        ['HRA & LTA Exemptions', 'Allowed', 'Not Allowed'],
        ['Rebate u/s 87A (Tax Free)', 'Income up to 5 Lakhs', 'Income up to 7 Lakhs'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    finalY = doc.lastAutoTable.finalY + 15;

    // 4. INCOME GRAPH
    doc.setFontSize(14);
    doc.text("3. Income Distribution", 14, finalY);
    finalY += 10;
    
    const barWidth = 180;
    const barHeight = 15;
    const taxWidth = (calculation.taxPercent / 100) * barWidth;
    
    doc.setFillColor(244, 63, 94); doc.rect(14, finalY, taxWidth, barHeight, 'F'); // Red
    doc.setFillColor(16, 185, 129); doc.rect(14 + taxWidth, finalY, barWidth - taxWidth, barHeight, 'F'); // Green
    
    // Legend
    finalY += 20;
    doc.setFontSize(10);
    doc.setFillColor(244, 63, 94); doc.rect(14, finalY, 4, 4, 'F');
    doc.text(`Tax (${calculation.taxPercent.toFixed(1)}%)`, 20, finalY + 3);
    doc.setFillColor(16, 185, 129); doc.rect(60, finalY, 4, 4, 'F');
    doc.text(`Take Home (${calculation.incomePercent.toFixed(1)}%)`, 66, finalY + 3);
    
    finalY += 15;

    // 5. SUGGESTIONS (FIXED FOR PDF ENCODING)
    doc.setFontSize(14);
    doc.setTextColor(234, 88, 12); // Orange
    doc.text("4. Smart Tax Saving Suggestions", 14, finalY);
    finalY += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(50);
    
    calculation.suggestions.forEach((tip) => {
        // REPLACE EMOJIS WITH TEXT TAGS FOR PDF
        let pdfTip = tip
          .replace("⚠️", "[IMPORTANT]")
          .replace("ℹ️", "[INFO]")
          .replace("💰", "[INVEST]")
          .replace("🏥", "[HEALTH]")
          .replace("👴", "[RETIREMENT]");

        const splitTip = doc.splitTextToSize(`* ${pdfTip}`, pageWidth - 28);
        doc.text(splitTip, 14, finalY);
        finalY += (splitTip.length * 5) + 2;
    });

    finalY += 10;

    // 6. VERDICT
    doc.setFillColor(220, 252, 231); doc.setDrawColor(22, 163, 74);
    doc.rect(14, finalY, pageWidth - 28, 25, 'FD');

    doc.setTextColor(22, 163, 74);
    doc.setFontSize(12); doc.setFont(undefined, 'bold');
    doc.text(`Winner: ${calculation.better}`, 20, finalY + 10);
    
    doc.setTextColor(0);
    doc.setFont(undefined, 'normal'); doc.setFontSize(10);
    doc.text(`Estimated Annual Savings: Rs. ${Math.round(calculation.savings).toLocaleString()}`, 20, finalY + 18);

    doc.save("Detailed_Tax_Report.pdf");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content theme-wealth" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div className="modal-header" style={{borderBottom:'1px solid rgba(16,185,129,0.2)', paddingBottom:'15px'}}>
          <h2>🇮🇳 Tax Planner Pro</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
          {['income', 'deductions', 'result'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                background: activeTab === tab ? 'var(--accent)' : 'var(--overlay-dark)',
                color: activeTab === tab ? 'white' : 'var(--border-strong)',
                fontWeight: 'bold', cursor: 'pointer', textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* INPUT TABS */}
        {activeTab === 'income' && (
          <div className="fade-in">
            <h4 style={{color:'var(--status-warning)', marginBottom:'15px'}}>Step 1: Annual Income</h4>
            <div className="input-group"><label>Salary (Basic + Allowances)</label><input type="number" className="money-input" value={income.salary} onChange={e => setIncome({...income, salary: e.target.value})} placeholder="e.g. 1200000" /></div>
            <div className="input-group"><label>Business / Freelance</label><input type="number" className="money-input" value={income.business} onChange={e => setIncome({...income, business: e.target.value})} placeholder="e.g. 50000" /></div>
            <div className="input-group"><label>Other Sources</label><input type="number" className="money-input" value={income.other} onChange={e => setIncome({...income, other: e.target.value})} placeholder="e.g. 20000" /></div>
            <button className="save-btn" onClick={() => setActiveTab('deductions')} style={{marginTop:'20px', width:'100%'}}>Next: Deductions 👉</button>
          </div>
        )}

        {activeTab === 'deductions' && (
          <div className="fade-in">
            <div style={{background:'var(--status-warning-bg)', padding:'10px', borderRadius:'8px', marginBottom:'15px', color:'var(--status-warning)', fontSize:'0.85rem'}}>
              ℹ️ Deductions (80C, 80D, HRA) are only valid for the <b>Old Regime</b>.
            </div>
            <div className="input-group"><label>80C (LIC, PF, ELSS) - Max 1.5L</label><input type="number" className="money-input" value={deductions.section80C} onChange={e => setDeductions({...deductions, section80C: e.target.value})} /></div>
            <div className="input-group"><label>80D (Health Insurance)</label><input type="number" className="money-input" value={deductions.section80D} onChange={e => setDeductions({...deductions, section80D: e.target.value})} /></div>
            <div className="input-group"><label>HRA / Home Loan Interest</label><input type="number" className="money-input" value={deductions.hra} onChange={e => setDeductions({...deductions, hra: e.target.value})} /></div>
            <button className="save-btn" onClick={handleCalculate} style={{marginTop:'20px', width:'100%'}}>Calculate Tax 🧮</button>
          </div>
        )}

        {/* RESULT TAB */}
        {activeTab === 'result' && calculation && (
          <div className="fade-in">
            
            {/* 1. WHY BOX */}
            <div style={{background: 'var(--primary-transparent)', padding:'15px', borderRadius:'10px', marginBottom:'20px'}}>
              <h4 style={{margin:'0 0 5px 0', color:'var(--primary)'}}>💡 Why {calculation.better}?</h4>
              <p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>{calculation.reason}</p>
            </div>

            {/* 2. SUGGESTIONS (Screen: With Emojis) */}
            <div style={{marginBottom:'20px'}}>
               <h4 style={{color:'var(--status-warning)', marginBottom:'10px', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'5px'}}>🚀 Tax Saving Suggestions</h4>
               {calculation.suggestions.map((tip, index) => (
                   <div key={index} style={{fontSize:'0.9rem', color:'var(--text-main)', marginBottom:'8px', display:'flex', gap:'8px'}}>
                       <span>➤</span> <span>{tip}</span>
                   </div>
               ))}
            </div>

            {/* 3. COMPARISON TABLE */}
            <div style={{marginBottom:'20px', overflowX:'auto'}}>
              <h4 style={{color:'var(--text-main)', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'8px'}}>Regime Comparison</h4>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.85rem', color:'var(--text-muted)'}}>
                <thead>
                  <tr style={{textAlign:'left', color:'var(--border-strong)', borderBottom:'1px solid #475569'}}>
                    <th style={{padding:'8px'}}>Feature</th>
                    <th style={{padding:'8px'}}>Old Regime</th>
                    <th style={{padding:'8px'}}>New Regime</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Standard Deduction', '₹50,000', '₹75,000'],
                    ['80C (Investments)', '✅ Allowed', '❌ Not Allowed'],
                    ['80D (Health)', '✅ Allowed', '❌ Not Allowed'],
                    ['Rebate u/s 87A', 'Limit: ₹5 Lakhs', 'Limit: ₹7 Lakhs'],
                  ].map((row, i) => (
                    <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                      <td style={{padding:'8px', fontWeight:'bold'}}>{row[0]}</td>
                      <td style={{padding:'8px'}}>{row[1]}</td>
                      <td style={{padding:'8px'}}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. VISUAL PIE CHART */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--overlay-dark)', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: `conic-gradient(#f43f5e ${calculation.taxPercent}%, var(--accent) 0)`,
                flexShrink: 0
              }}></div>
              <div>
                <div style={{fontSize:'0.9rem', color:'var(--accent)'}}>🟢 Take Home: {calculation.incomePercent.toFixed(1)}%</div>
                <div style={{fontSize:'0.9rem', color:'var(--status-danger)'}}>🔴 Tax Paid: {calculation.taxPercent.toFixed(1)}%</div>
              </div>
            </div>

            <button className="save-btn" onClick={downloadPDF} style={{width:'100%', background:'linear-gradient(135deg, #3b82f6, var(--primary))'}}>
              📄 Download Detailed PDF Report
            </button>
            <button className="add-btn-small" onClick={() => setActiveTab('income')} style={{width:'100%', marginTop:'10px', background:'transparent', border:'1px solid #64748b'}}>
              Recalculate
            </button>
          </div>
        )}
      </div>
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

export default TaxCalculatorModal;
