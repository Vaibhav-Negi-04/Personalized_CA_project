import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig'; 
import { useAuth } from '../../context/AuthContext'; 
import '../../components/Dashboard3.css'; 

// --- HELPER FUNCTIONS ---
const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
};

// --- CHART COMPONENT ---
const SimplePieChart = ({ data, size = 200, hollow = false }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const total = data.reduce((acc, item) => acc + item.value, 0);

    if (total === 0) return <div style={{width: size, height: size, borderRadius: '50%', border: '4px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize: '0.7rem', color: '#9ca3af', fontWeight:'bold'}}>NO DATA</div>;
    
    const centerLabel = hoveredIndex !== null ? data[hoveredIndex].label : "TOTAL";
    const centerValue = hoveredIndex !== null ? data[hoveredIndex].value : total;
    const centerColor = hoveredIndex !== null ? data[hoveredIndex].color : '#111827';

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {data.map((slice, index) => {
                    if (slice.value === 0) return null;
                    const previousTotal = data.slice(0, index).reduce((acc, item) => acc + item.value, 0);
                    const startPercent = previousTotal / total;
                    const slicePercent = slice.value / total;
                    const startRad = startPercent * 2 * Math.PI;
                    const endRad = (startPercent + slicePercent) * 2 * Math.PI;
                    const x1 = Math.cos(startRad);
                    const y1 = Math.sin(startRad);
                    const x2 = Math.cos(endRad);
                    const y2 = Math.sin(endRad);
                    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
                    const pathData = slice.value === total ? `M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0` : `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    return (
                        <path 
                            key={index} 
                            d={pathData} 
                            fill={slice.color} 
                            stroke="white" 
                            strokeWidth="0.08"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{ cursor: 'pointer', transition: 'opacity 0.2s ease', opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.3 }}
                        />
                    );
                })}
                {hollow && <circle cx="0" cy="0" r="0.6" fill="white" />}
            </svg>
            {hollow && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', display:'block', fontWeight: 'bold', textTransform: 'uppercase' }}>{centerLabel}</span>
                    <span style={{ fontWeight: '800', color: centerColor, fontSize:'1.2rem' }}>{(centerValue/1000).toFixed(1)}k</span>
                </div>
            )}
        </div>
    );
};

function BusinessView({ onLogout, onUpdateFinance }) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    // --- STATE ---
    const [companyName, setCompanyName] = useState("My Business");
    const [businessType, setBusinessType] = useState("shop"); 
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [isEditingName, setIsEditingName] = useState(false); 
    const [showHelp, setShowHelp] = useState(false); 

    // 🆕 Opening Balance State
    const [openingBalance, setOpeningBalance] = useState(0);

    const [expenses, setExpenses] = useState(0); 
    const [employees, setEmployees] = useState([]);
    const [empInput, setEmpInput] = useState({ name: '', salary: '', designation: '' });
    const [investInput, setInvestInput] = useState({ name: '', cost: '' });
    const [ledger, setLedger] = useState([]); 
    
    // 🆕 Updated Transaction Form: includes 'source' for income
    const [showTransModal, setShowTransModal] = useState(false);
    const [transForm, setTransForm] = useState({ desc: '', amount: '', type: 'Debit', category: 'Misc', source: 'direct' });
    const [showFinancials, setShowFinancials] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // --- VOCABULARY ENGINE ---
    const UI = useMemo(() => {
        return businessType === 'startup' ? {
            role: "Founder",
            revTitle: "Revenue (Live Ledger)",
            rev1: "SaaS / Sales", rev2: "Services", rev3: "Investments",
            costTitle: "Operational Burn (Monthly)",
            staffTitle: "Team & Payroll",
            staffBtn: "HIRE TALENT",
            assetTitle: "CapEx / Acquisitions",
            assetLabel: "Asset Name",
            metricRev: "Total Revenue",
            metricExp: "Burn Rate",
            metricNet: "Free Cash Flow",
            ranks: ["Pre-Seed", "Seed Stage", "Series A", "Unicorn"]
        } : { 
            role: "Shopkeeper",
            revTitle: "Sales (Live Ledger)",
            rev1: "Counter Sales", rev2: "Online Orders", rev3: "Other Income",
            costTitle: "Fixed Bills (Rent/Elec)",
            staffTitle: "Staff & Helpers",
            staffBtn: "ADD STAFF",
            assetTitle: "Store Equipment / Stock",
            assetLabel: "Item Name (e.g. Fridge)",
            metricRev: "Total Sales",
            metricExp: "Total Costs",
            metricNet: "Net Cash",
            ranks: ["New Shop", "Local Favorite", "Market Leader", "Chain Owner"]
        };
    }, [businessType]);

    // --- SYNC ---
    useEffect(() => {
        if (!currentUser) return;
        const docRef = doc(db, "users", currentUser.uid, "business", "data_v3");
        const unsub = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if(data.companyName) setCompanyName(data.companyName);
                if(data.businessType) setBusinessType(data.businessType);
                if(data.openingBalance) setOpeningBalance(data.openingBalance);
                if(data.expenses) setExpenses(data.expenses);
                if(data.employees) setEmployees(data.employees);
                if(data.ledger) setLedger(data.ledger);
            }
            setLoading(false);
        });
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => { unsub(); clearTimeout(timer); };
    }, [currentUser]);

    const saveData = async (newData) => {
        if (!currentUser) return;
        await setDoc(doc(db, "users", currentUser.uid, "business", "data_v3"), newData, { merge: true });
    };

    // --- LOGIC: CALCULATE REVENUE FROM LEDGER ---
    // 🆕 We no longer use manual revenue inputs. We sum the ledger based on 'source'.
    const revenue = useMemo(() => {
        return {
            direct: ledger.filter(l => l.type === 'Credit' && l.source === 'direct').reduce((sum, item) => sum + Number(item.amount), 0),
            services: ledger.filter(l => l.type === 'Credit' && l.source === 'services').reduce((sum, item) => sum + Number(item.amount), 0),
            investments: ledger.filter(l => l.type === 'Credit' && l.source === 'investments').reduce((sum, item) => sum + Number(item.amount), 0),
        };
    }, [ledger]);

    const totalRevenue = revenue.direct + revenue.services + revenue.investments;
    
    const payrollExpenses = employees.reduce((s, e) => s + Number(e.salary), 0);
    const operationalExpenses = Number(expenses);
    
    // Sum of expenses from ledger (Misc expenses + Assets)
    const ledgerExpenses = ledger
        .filter(l => l.type === 'Debit')
        .reduce((sum, item) => sum + Number(item.amount), 0);

    // Total Money Out = Fixed Monthly Ops + Fixed Payroll + Variable Ledger Expenses
    // Note: To avoid double counting, we assume 'expenses' and 'payroll' are monthly recurring, 
    // while ledger expenses are one-time.
    const totalExpenses = operationalExpenses + payrollExpenses + ledgerExpenses;

    const netProfit = Math.max(0, totalRevenue - totalExpenses); // Simplified profit
    
    // 🆕 Cash Flow Logic: Opening Balance + Revenue - All Expenses
    const takeHome = (Number(openingBalance) + totalRevenue) - totalExpenses;
    
    // Dynamic Ranking
    const businessXP = totalRevenue; 
    let currentRank = UI.ranks[0];
    let nextLevel = 50000;
    if (businessXP > 1000000) { currentRank = UI.ranks[3]; nextLevel = 5000000; }
    else if (businessXP > 200000) { currentRank = UI.ranks[2]; nextLevel = 1000000; }
    else if (businessXP > 50000) { currentRank = UI.ranks[1]; nextLevel = 200000; }
    const progressPercent = Math.min((businessXP / nextLevel) * 100, 100);

    const smartInsights = useMemo(() => {
        const insights = [];
        if (openingBalance === 0 && totalRevenue === 0) {
            insights.push({ type: 'info', text: "Set your Opening Balance in Settings to start." });
        } else {
            if (takeHome < 0) insights.push({ type: 'danger', text: "Critical: Cash deficit. Add funds or cut costs." });
            if (takeHome > totalRevenue * 0.2) insights.push({ type: 'success', text: "Strong Cash Position." });
        }
        return insights;
    }, [totalRevenue, takeHome, openingBalance]);

    useEffect(() => {
        if(onUpdateFinance) onUpdateFinance({ balance: takeHome, income: totalRevenue, expense: totalExpenses });
    }, [takeHome, totalRevenue, totalExpenses, onUpdateFinance]);

    // --- HANDLERS ---
    const handleSaveSettings = () => {
        saveData({ companyName, businessType, openingBalance: Number(openingBalance) });
        setIsSettingsOpen(false);
    };

    const handleExportCSV = () => {
        const headers = ["Date", "Description", "Category", "Source/Type", "Amount"];
        const rows = ledger.map(item => [
            item.date, 
            `"${item.desc.replace(/"/g, '""')}"`, 
            item.category, 
            item.type === 'Credit' ? item.source : 'Expense', 
            item.amount
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${companyName.replace(/ /g, "_")}_Ledger.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredLedger = ledger.filter(entry => entry.desc.toLowerCase().includes(searchTerm.toLowerCase()) || entry.amount.toString().includes(searchTerm));

    const handleNameChange = () => { 
        if(companyName.trim() === "") setCompanyName("My Shop Name");
        setIsEditingName(false); 
        saveData({ companyName }); 
    };

    // 🆕 Add Transaction with Source Mapping
    const addToLedger = (desc, amount, type, category, source) => { 
        const newEntry = { id: Date.now(), date: new Date().toLocaleDateString(), desc, amount, category, type, source }; 
        const newLedger = [newEntry, ...ledger]; 
        setLedger(newLedger); 
        return newLedger; 
    };

    const confirmDeleteTransaction = () => { 
        if (!deleteId) return; 
        const newLedger = ledger.filter(l => l.id !== deleteId); 
        setLedger(newLedger); 
        saveData({ ledger: newLedger }); 
        setDeleteId(null); 
    };

    const handleManualTransaction = () => { 
        if (!transForm.desc || !transForm.amount) return; 
        const amount = Number(transForm.amount); 
        
        // Add to ledger (Revenue sums will update automatically via useMemo)
        const updatedLedger = addToLedger(transForm.desc, amount, transForm.type, transForm.category, transForm.source);
        
        // If it's an expense that affects the fixed 'expenses' state, we might need logic here,
        // but for now, we treat manual expenses as 'One-time' ledger items.
        // Fixed monthly expenses are handled separately in the 'expenses' state.
        
        saveData({ ledger: updatedLedger }); 
        setTransForm({ desc: '', amount: '', type: 'Debit', category: 'Misc', source: 'direct' }); 
        setShowTransModal(false); 
    };

    const handleExpenseChange = (value) => { const val = Number(value.replace(/[^0-9]/g, '')); setExpenses(val); saveData({ expenses: val }); };
    const handleHire = () => { if(!empInput.name || !empInput.salary) return; const salary = Number(empInput.salary); const newEmps = [...employees, { ...empInput, id: Date.now(), salary }]; const updatedLedger = addToLedger(`Hired: ${empInput.name}`, salary, 'Debit', 'Payroll', null); setEmployees(newEmps); setEmpInput({ name: '', salary: '', designation: '' }); saveData({ employees: newEmps, ledger: updatedLedger }); };
    const handleFire = (id) => { const newEmps = employees.filter(e => e.id !== id); setEmployees(newEmps); saveData({ employees: newEmps }); };
    const handleCustomInvest = () => { if(!investInput.name || !investInput.cost) return; const cost = Number(investInput.cost); const updatedLedger = addToLedger(`Asset: ${investInput.name}`, cost, 'Debit', 'Asset', null); setLedger(updatedLedger); saveData({ ledger: updatedLedger }); setInvestInput({ name: '', cost: '' }); };

    const profitData = [{ label: 'Ops', value: totalExpenses, color: '#ef4444' }, { label: 'Revenue', value: totalRevenue, color: '#10b981' }];

    if (loading) return <div className="b-view" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>;

    return (
        <div className="b-view">
            
            {/* HEADER */}
            <div className="b-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                    <div style={{background:'black', color:'white', width:'50px', height:'50px', borderRadius:'15px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', textTransform:'uppercase'}}>
                        {companyName.charAt(0)}
                    </div>
                    <div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            {isEditingName ? (
                                <input autoFocus className="b-title" style={{background:'transparent', border:'none', borderBottom:'2px solid #3b82f6', outline:'none', color:'#111827', width:'250px'}} value={companyName} onChange={(e) => setCompanyName(e.target.value)} onBlur={handleNameChange} onKeyDown={(e) => e.key === 'Enter' && handleNameChange()} />
                            ) : (
                                <h1 className="b-title" onClick={() => setIsEditingName(true)} style={{cursor:'pointer', borderBottom:'1px dashed transparent', wordBreak: 'break-word'}} title="Click to rename">
                                    {companyName} <span style={{fontSize:'0.8rem', color:'#9ca3af', verticalAlign:'middle'}}>✎</span>
                                </h1>
                            )}
                            <button onClick={() => setIsSettingsOpen(true)} style={{background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:'1.2rem', padding:'5px'}} title="Edit Settings">⚙️</button>
                        </div>
                        <div className="b-subtitle" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <span>{UI.role.toUpperCase()} • {currentRank.toUpperCase()}</span>
                            <div className="xp-container"><div className="xp-bar" style={{width: `${progressPercent}%`}}></div></div>
                        </div>
                    </div>
                </div>
                <div className="b-header-actions" style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => setShowFinancials(true)} className="b-btn" style={{background:'#e0f2fe', color:'#0369a1'}}>VIEW REPORT</button>
                    <button onClick={onLogout} className="b-btn b-btn-danger" style={{borderRadius:'12px'}}>LOGOUT</button>
                </div>
            </div>

            {/* METRICS */}
            <div className="b-grid-3" style={{ marginBottom: '30px' }}>
                <div className="b-card"><span className="b-label" style={{color:'#3b82f6'}}>{UI.metricRev}</span><div style={{ fontSize: '2.2rem', fontWeight: '800' }}>{formatCurrency(totalRevenue)}</div></div>
                <div className="b-card"><span className="b-label" style={{color:'#6b7280'}}>Opening Balance</span><div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#6b7280' }}>{formatCurrency(openingBalance)}</div></div>
                <div className="b-card" style={{background:'#111827', border:'none'}}><span className="b-label" style={{color:'#10b981'}}>{UI.metricNet}</span><div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#ffffff' }}>{formatCurrency(takeHome)}</div></div>
            </div>

            <div className="b-main-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                <div>
                    {/* REVENUE CARD - NOW READ ONLY & CALCULATED */}
                    <div className="b-card">
                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom: '20px'}}>
                            <h3 className="b-title" style={{ fontSize: '1.2rem' }}>⚡ {UI.revTitle}</h3>
                            <span className={`info-icon ${showHelp ? 'active' : ''}`} onClick={() => setShowHelp(!showHelp)} onMouseEnter={() => setShowHelp(true)} onMouseLeave={() => setShowHelp(false)}>?<span className="info-tooltip">These numbers update automatically when you add transactions via the + button.</span></span>
                        </div>
                        <div className="b-grid-3" style={{marginBottom:'10px'}}>
                            <div><label className="b-label">{UI.rev1}</label><div className="b-input" style={{background:'#f3f4f6', color:'#6b7280', border:'1px solid #e5e7eb'}}>{formatCurrency(revenue.direct)}</div></div>
                            <div><label className="b-label">{UI.rev2}</label><div className="b-input" style={{background:'#f3f4f6', color:'#6b7280', border:'1px solid #e5e7eb'}}>{formatCurrency(revenue.services)}</div></div>
                            <div><label className="b-label">{UI.rev3}</label><div className="b-input" style={{background:'#f3f4f6', color:'#6b7280', border:'1px solid #e5e7eb'}}>{formatCurrency(revenue.investments)}</div></div>
                        </div>
                    </div>

                    <div className="b-card">
                        <h3 className="b-title" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>👥 {UI.staffTitle}</h3>
                        <div style={{ borderBottom: '2px dashed #f3f4f6', paddingBottom: '20px', marginBottom: '20px' }}>
                            <label className="b-label">Add Person</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input className="b-input" placeholder="Name" value={empInput.name} onChange={e => setEmpInput({...empInput, name: e.target.value})} style={{flex:1}} />
                                <input className="b-input" placeholder="Role" value={empInput.designation} onChange={e => setEmpInput({...empInput, designation: e.target.value})} style={{flex:1}} />
                                <input className="b-input" placeholder="Salary" value={empInput.salary} onChange={e => setEmpInput({...empInput, salary: e.target.value})} style={{flex:1}} />
                                <button onClick={handleHire} className="b-btn b-btn-primary">{UI.staffBtn}</button>
                            </div>
                        </div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {employees.map(emp => (
                                <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '12px', background:'#f9fafb', borderRadius:'12px', marginBottom:'8px' }}>
                                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}><div style={{width:'30px', height:'30px', background:'#e0f2fe', borderRadius:'50%', color:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>{emp.name.charAt(0)}</div><div><div style={{fontSize:'0.9rem', fontWeight:'700'}}>{emp.name}</div><div style={{fontSize:'0.7rem', color:'#9ca3af', textTransform:'uppercase'}}>{emp.designation}</div></div></div>
                                    <div style={{display:'flex', gap:'15px', alignItems:'center'}}><span style={{fontSize:'0.9rem', fontWeight:'600'}}>{formatCurrency(emp.salary)}</span><button onClick={() => handleFire(emp.id)} style={{background:'transparent', border:'none', color:'#ef4444', fontWeight:'bold', cursor:'pointer'}}>Remove</button></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="b-card">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                            <h3 className="b-title" style={{ fontSize: '1.2rem' }}>🚀 {UI.assetTitle}</h3>
                            <span style={{fontSize:'0.7rem', background:'#fef3c7', color:'#d97706', padding:'4px 8px', borderRadius:'6px', fontWeight:'bold'}}>ONE-TIME</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
                            <div style={{flex: 2}}><label className="b-label">{UI.assetLabel}</label><input className="b-input" placeholder="Item Name" value={investInput.name} onChange={(e) => setInvestInput({...investInput, name: e.target.value})}/></div>
                            <div style={{flex: 1}}><label className="b-label">Cost</label><input className="b-input" placeholder="₹0" value={investInput.cost} onChange={(e) => setInvestInput({...investInput, cost: e.target.value})}/></div>
                            <button onClick={handleCustomInvest} className="b-btn b-btn-primary" style={{height:'50px'}}>ADD</button>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="b-card">
                        <h3 className="b-title" style={{ fontSize: '1rem', marginBottom: '15px' }}>💡 {UI.role} Analysis</h3>
                        {smartInsights.map((alert, i) => (
                            <div key={i} className={`alert-card alert-${alert.type}`}>{alert.text}</div>
                        ))}
                    </div>

                    <div className="b-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 className="b-title" style={{ fontSize: '1rem', marginBottom: '20px' }}>Money Flow</h3>
                        <SimplePieChart data={profitData} size={160} hollow={true} />
                    </div>
                    
                    <div className="b-card">
                        <label className="b-label">{UI.costTitle}</label>
                        <input className="b-input" placeholder="₹0" value={expenses} onChange={(e) => handleExpenseChange(e.target.value)} />
                    </div>

                    <div className="b-card" style={{ flex: 1 }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                            <h3 className="b-title" style={{ fontSize: '1rem' }}>📖 Daily Ledger</h3>
                            <span style={{fontSize:'0.7rem', background:'#e0f2fe', padding:'3px 6px', borderRadius:'4px', color:'#0284c7'}}>{ledger.length} entries</span>
                        </div>
                        <input className="b-input" placeholder="🔍 Search..." style={{fontSize:'0.9rem', padding:'8px 12px', marginBottom:'15px', background:'#f9fafb'}} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {filteredLedger.map((entry, i) => (
                                <div key={i} style={{ padding:'12px', borderBottom:'1px solid #f3f4f6' }}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                        <span style={{fontWeight:'600', fontSize:'0.9rem'}}>{entry.desc}</span>
                                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                            <span style={{fontWeight:'700', color: entry.type === 'Credit' ? '#10b981' : '#ef4444'}}>{entry.type === 'Credit' ? '+' : '-'} {formatCurrency(entry.amount)}</span>
                                            <button onClick={() => setDeleteId(entry.id)} style={{background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:'1.2rem', lineHeight:1}}>×</button>
                                        </div>
                                    </div>
                                    <div style={{fontSize:'0.75rem', color:'#9ca3af'}}>{entry.date} • {entry.source ? entry.source.toUpperCase() : entry.category}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SETTINGS MODAL - ADDED OPENING BALANCE */}
            {isSettingsOpen && (
                <div className="report-overlay" onClick={() => setIsSettingsOpen(false)}>
                    <div className="report-card" style={{maxWidth:'450px', height:'auto'}} onClick={e => e.stopPropagation()}>
                        <div className="report-header"><h2 className="b-title" style={{fontSize:'1.3rem'}}>Settings</h2><button onClick={() => setIsSettingsOpen(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button></div>
                        <div className="report-body">
                            <div style={{marginBottom:'20px'}}>
                                <label className="b-label">Business Name</label>
                                <input className="b-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter Name..." />
                            </div>
                            
                            {/* 🆕 OPENING BALANCE INPUT */}
                            <div style={{marginBottom:'20px'}}>
                                <label className="b-label">Opening Cash Balance (Galla)</label>
                                <input className="b-input" type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="₹0" />
                                <small style={{color:'#6b7280'}}>The cash you already have before any sales today.</small>
                            </div>

                            <div style={{marginBottom:'25px'}}>
                                <label className="b-label">Identity</label>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button onClick={() => setBusinessType('shop')} className="b-btn" style={{flex:1, background: businessType === 'shop' ? '#111827' : '#f3f4f6', color: businessType === 'shop' ? 'white' : '#6b7280'}}>🏪 Shop</button>
                                    <button onClick={() => setBusinessType('startup')} className="b-btn" style={{flex:1, background: businessType === 'startup' ? '#111827' : '#f3f4f6', color: businessType === 'startup' ? 'white' : '#6b7280'}}>🚀 Startup</button>
                                </div>
                            </div>
                            <button onClick={handleSaveSettings} className="b-btn b-btn-primary" style={{width:'100%'}}>SAVE CHANGES</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TRANSACTION MODAL - UPDATED WITH SOURCE SELECTOR */}
            {showTransModal && (
                <div className="trans-modal">
                    <h3 className="b-title" style={{fontSize:'1.2rem', marginBottom:'20px', color: '#111827'}}>New Entry</h3>
                    <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <div><label className="b-label">Description</label><input className="b-input" placeholder="e.g. Sale #101, Bill Payment" value={transForm.desc} onChange={e => setTransForm({...transForm, desc: e.target.value})} /></div>
                        <div><label className="b-label">Amount</label><input className="b-input" type="number" placeholder="₹0" value={transForm.amount} onChange={e => setTransForm({...transForm, amount: e.target.value})} /></div>
                        
                        <div>
                            <label className="b-label">Transaction Type</label>
                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                                <button onClick={() => setTransForm({...transForm, type: 'Credit'})} className="b-btn" style={{flex:1, background: transForm.type === 'Credit' ? '#10b981' : '#f3f4f6', color: transForm.type === 'Credit' ? 'white' : 'black'}}>INCOME (+)</button>
                                <button onClick={() => setTransForm({...transForm, type: 'Debit'})} className="b-btn" style={{flex:1, background: transForm.type === 'Debit' ? '#ef4444' : '#f3f4f6', color: transForm.type === 'Debit' ? 'white' : 'black'}}>EXPENSE (-)</button>
                            </div>
                            
                            {/* 🆕 DYNAMIC SOURCE SELECTOR FOR INCOME */}
                            {transForm.type === 'Credit' && (
                                <div>
                                    <label className="b-label">Select Source</label>
                                    <select className="b-input" value={transForm.source} onChange={(e) => setTransForm({...transForm, source: e.target.value})}>
                                        <option value="direct">{UI.rev1}</option>
                                        <option value="services">{UI.rev2}</option>
                                        <option value="investments">{UI.rev3}</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <button onClick={handleManualTransaction} className="b-btn b-btn-primary" style={{marginTop:'10px'}}>SAVE</button>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteId && (
                <div className="report-overlay" onClick={() => setDeleteId(null)}>
                    <div className="report-card" style={{maxWidth:'400px', height:'auto'}} onClick={e => e.stopPropagation()}>
                        <div className="report-header"><h3 className="b-title" style={{fontSize:'1.2rem'}}>Confirm Delete</h3></div>
                        <div style={{padding:'20px'}}>
                            <p style={{color:'#6b7280', fontSize:'0.9rem', marginBottom:'20px'}}>Delete this entry? It will be removed from your sales totals.</p>
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={() => setDeleteId(null)} className="b-btn" style={{flex:1, background:'#f3f4f6', color:'#111827'}}>CANCEL</button>
                                <button onClick={confirmDeleteTransaction} className="b-btn b-btn-danger" style={{flex:1, background:'#fee2e2', color:'#ef4444'}}>DELETE</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORT MODAL */}
            {showFinancials && (
                <div className="report-overlay" onClick={() => setShowFinancials(false)}>
                    <div className="report-card" onClick={e => e.stopPropagation()}>
                        <div className="report-header"><h2 className="b-title" style={{fontSize:'1.5rem'}}>Report</h2><button onClick={() => setShowFinancials(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button></div>
                        <div className="report-body">
                            <div className="report-section">
                                <h4 className="b-label" style={{color:'#3b82f6'}}>SUMMARY</h4>
                                <div className="report-row"><span>Opening Balance</span><span>{formatCurrency(openingBalance)}</span></div>
                                <div className="report-row"><span>+ Total Revenue</span><span>{formatCurrency(totalRevenue)}</span></div>
                                <div className="report-row"><span>- Total Expenses</span><span>{formatCurrency(totalExpenses)}</span></div>
                                <div className="report-row total" style={{color:'#10b981'}}><span>= Net Cash</span><span>{formatCurrency(takeHome)}</span></div>
                            </div>
                            <div style={{marginTop:'30px', borderTop:'1px solid #e5e7eb', paddingTop:'20px', display:'flex', justifyContent:'flex-end'}}><button onClick={handleExportCSV} className="b-btn b-btn-primary" style={{display:'flex', alignItems:'center', gap:'8px'}}><span>⬇</span> Download CSV</button></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="fab-container"><div className={`toggle ${showTransModal ? 'active' : ''}`} onClick={() => setShowTransModal(!showTransModal)}><span className="label">+</span></div></div>
        </div>
    );
}

export default BusinessView;