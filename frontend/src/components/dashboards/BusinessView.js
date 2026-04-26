import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig'; 
import { useAuth } from '../../context/AuthContext'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../components/Dashboard3.css'; 
import AIReceiptScanner from '../AIReceiptScanner'; // Make sure this path is correct for your folder structure!
import AIInsightBox from '../AIInsightBox';

// --- HELPER FUNCTIONS ---
const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
};

// --- CHART COMPONENTS ---
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
                            key={index} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.08"
                            onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}
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

// 🆕 NEW 7-DAY BAR CHART
const SimpleBarChart = ({ ledger }) => {
    const chartData = useMemo(() => {
        const days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return { dateStr: d.toLocaleDateString(), label: d.toLocaleDateString('en-US', {weekday: 'short'}), amount: 0 };
        });

        ledger.forEach(entry => {
            if(entry.type === 'Credit') {
                const dayMatch = days.find(d => d.dateStr === entry.date);
                if(dayMatch) dayMatch.amount += Number(entry.amount);
            }
        });
        return days;
    }, [ledger]);

    const maxVal = Math.max(...chartData.map(d => d.amount), 1);

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', width: '100%', padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}>
            {chartData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', group: 'hover' }}>
                    <span style={{fontSize:'0.6rem', color:'#3b82f6', fontWeight:'bold', marginBottom:'4px', opacity: d.amount > 0 ? 1 : 0}}>{(d.amount/1000).toFixed(1)}k</span>
                    <div style={{ width: '100%', background: '#3b82f6', borderRadius: '4px 4px 0 0', height: `${(d.amount / maxVal) * 100}%`, minHeight: '4px', transition: 'height 0.5s ease' }}></div>
                    <span style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '6px', fontWeight: '600' }}>{d.label}</span>
                </div>
            ))}
        </div>
    );
};

const INVOICE_THEMES = {
    blue: { primary: [37, 99, 235], secondary: [219, 234, 254], name: 'Ocean Blue' },
    green: { primary: [5, 150, 105], secondary: [209, 250, 229], name: 'Emerald' },
    purple: { primary: [124, 58, 237], secondary: [237, 233, 254], name: 'Royal Purple' },
    rose: { primary: [225, 29, 72], secondary: [255, 228, 230], name: 'Crimson Rose' },
    dark: { primary: [17, 24, 39], secondary: [243, 244, 246], name: 'Monochrome' },
    orange: { primary: [234, 88, 12], secondary: [255, 237, 213], name: 'Sunset Orange' },
    teal: { primary: [13, 148, 136], secondary: [204, 251, 241], name: 'Tropical Teal' },
    indigo: { primary: [79, 70, 229], secondary: [224, 231, 255], name: 'Deep Indigo' },
    gold: { primary: [202, 138, 4], secondary: [254, 249, 195], name: 'Luxury Gold' },
    slate: { primary: [71, 85, 105], secondary: [241, 245, 249], name: 'Corporate Slate' }
};

function BusinessView({ onLogout, onUpdateFinance }) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    const [companyName, setCompanyName] = useState("My Business");
    const [businessType, setBusinessType] = useState("shop"); 
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false); 
    const [showHelp, setShowHelp] = useState(false); 

    // 🆕 CASHIER MODE STATE
    const [isCashierMode, setIsCashierMode] = useState(false);

    const [openingBalance, setOpeningBalance] = useState(0);
    const [expenses, setExpenses] = useState(0); 
    const [employees, setEmployees] = useState([]);
    const [empInput, setEmpInput] = useState({ name: '', salary: '', designation: '' });
    const [investInput, setInvestInput] = useState({ name: '', cost: '' });
    const [ledger, setLedger] = useState([]); 
    const [inventory, setInventory] = useState([]); 
    
    const [khata, setKhata] = useState([]); 
    const [itemSales, setItemSales] = useState({}); 

    const [showTransModal, setShowTransModal] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false); 
    const [transForm, setTransForm] = useState({ desc: '', amount: '', type: 'Debit', category: 'Misc', source: 'direct' });
    const [showFinancials, setShowFinancials] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [invForm, setInvForm] = useState({ name: '', variant: '', price: '', stockQty: '', barcode: '' }); 
    const [isFetchingName, setIsFetchingName] = useState(false);

    const [showBilling, setShowBilling] = useState(false);
    const [billCustomer, setBillCustomer] = useState({ name: '', phone: '' });
    const [billSource, setBillSource] = useState('direct'); 
    const [paymentStatus, setPaymentStatus] = useState('Paid'); 
    const [applyGST, setApplyGST] = useState(false); 
    const [invoiceTheme, setInvoiceTheme] = useState('blue'); 
    const [billItems, setBillItems] = useState([{ id: 1, item: '', qty: 1, price: '' }]);
    const [suggestions, setSuggestions] = useState({ visible: false, items: [], rowIndex: null });
    
    const [scannedCode, setScannedCode] = useState('');
    const billItemsRef = useRef([]);

    const UI = useMemo(() => {
        return businessType === 'startup' ? {
            role: "Founder", revTitle: "Revenue (Live Ledger)", rev1: "SaaS / Sales", rev2: "Services", rev3: "Investments",
            costTitle: "Operational Burn (Monthly)", staffTitle: "Team & Payroll", staffBtn: "HIRE TALENT",
            assetTitle: "CapEx / Acquisitions", assetLabel: "Asset Name", metricRev: "Total Revenue",
            metricExp: "Burn Rate", metricNet: "Free Cash Flow", ranks: ["Pre-Seed", "Seed Stage", "Series A", "Unicorn"],
            quickTags: { income: ["Consulting Fee", "Project Milestone", "SaaS Sub", "Investment"], expense: ["AWS Server", "Software Lic", "Office Rent", "Marketing Ads", "Travel"] }
        } : { 
            role: "Shopkeeper", revTitle: "Sales (Live Ledger)", rev1: "Counter Sales", rev2: "Online Orders", rev3: "Other Income",
            costTitle: "Fixed Bills (Rent/Elec)", staffTitle: "Staff & Helpers", staffBtn: "ADD STAFF",
            assetTitle: "Store Equipment / Stock", assetLabel: "Item Name (e.g. Fridge)", metricRev: "Total Sales",
            metricExp: "Total Costs", metricNet: "Net Cash", ranks: ["New Shop", "Local Favorite", "Market Leader", "Chain Owner"],
            quickTags: { income: ["Counter Sale", "Home Delivery", "UPI Payment", "Credit Recovery"], expense: ["New Stock", "Rent Payment", "Electricity Bill", "Tea/Snacks", "Transport"] }
        };
    }, [businessType]);

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
                if(data.inventory) setInventory(data.inventory);
                if(data.khata) setKhata(data.khata); 
                if(data.itemSales) setItemSales(data.itemSales); 
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
    const ledgerExpenses = ledger.filter(l => l.type === 'Debit').reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = operationalExpenses + payrollExpenses + ledgerExpenses;
    const takeHome = (Number(openingBalance) + totalRevenue) - totalExpenses;
    
    const businessXP = totalRevenue; 
    let currentRank = UI.ranks[0];
    let nextLevel = 50000;
    if (businessXP > 1000000) { currentRank = UI.ranks[3]; nextLevel = 5000000; }
    else if (businessXP > 200000) { currentRank = UI.ranks[2]; nextLevel = 1000000; }
    else if (businessXP > 50000) { currentRank = UI.ranks[1]; nextLevel = 200000; }
    const progressPercent = Math.min((businessXP / nextLevel) * 100, 100);

    const smartInsights = useMemo(() => {
        const insights = [];
        if (openingBalance === 0 && totalRevenue === 0) insights.push({ type: 'info', text: "Set your Opening Balance in Settings to start." });
        else {
            if (takeHome < 0) insights.push({ type: 'danger', text: "Critical: Cash deficit. Add funds or cut costs." });
            if (takeHome > totalRevenue * 0.2) insights.push({ type: 'success', text: "Strong Cash Position." });
        }
        inventory.forEach(item => {
            if (item.stockQty !== undefined && item.stockQty !== '' && item.stockQty < 5) {
                insights.push({ type: 'danger', text: `🚨 Low Stock: ${item.name} (${item.stockQty} left)` });
            }
        });
        return insights;
    }, [totalRevenue, takeHome, openingBalance, inventory]);

    const topSellers = useMemo(() => {
        return Object.entries(itemSales).sort((a, b) => b[1] - a[1]).slice(0, 3); 
    }, [itemSales]);

    useEffect(() => {
        if(onUpdateFinance) onUpdateFinance({ balance: takeHome, income: totalRevenue, expense: totalExpenses });
    }, [takeHome, totalRevenue, totalExpenses, onUpdateFinance]);

    // --- HANDLERS ---
    const handleSaveSettings = () => { saveData({ companyName, businessType, openingBalance: Number(openingBalance) }); setIsSettingsOpen(false); };
    const handleExportCSV = () => {
        const headers = ["Date", "Description", "Category", "Source/Type", "Amount"];
        const rows = ledger.map(item => [item.date, `"${item.desc.replace(/"/g, '""')}"`, item.category, item.type === 'Credit' ? item.source : 'Expense', item.amount]);
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
    const handleNameChange = () => { if(companyName.trim() === "") setCompanyName("My Shop Name"); setIsEditingName(false); saveData({ companyName }); };
    
    const addToLedger = (desc, amount, type, category, source) => { const newEntry = { id: Date.now(), date: new Date().toLocaleDateString(), desc, amount, category, type, source }; const newLedger = [newEntry, ...ledger]; setLedger(newLedger); return newLedger; };
    const confirmDeleteTransaction = () => { if (!deleteId) return; const newLedger = ledger.filter(l => l.id !== deleteId); setLedger(newLedger); saveData({ ledger: newLedger }); setDeleteId(null); };
    const handleManualTransaction = () => { if (!transForm.desc || !transForm.amount) return; const amount = Number(transForm.amount); const updatedLedger = addToLedger(transForm.desc, amount, transForm.type, transForm.category, transForm.source); saveData({ ledger: updatedLedger }); setTransForm({ desc: '', amount: '', type: 'Debit', category: 'Misc', source: 'direct' }); setShowTransModal(false); };
    const handleExpenseChange = (value) => { const val = Number(value.replace(/[^0-9]/g, '')); setExpenses(val); saveData({ expenses: val }); };
    const handleHire = () => { if(!empInput.name || !empInput.salary) return; const salary = Number(empInput.salary); const newEmps = [...employees, { ...empInput, id: Date.now(), salary }]; const updatedLedger = addToLedger(`Hired: ${empInput.name}`, salary, 'Debit', 'Payroll', null); setEmployees(newEmps); setEmpInput({ name: '', salary: '', designation: '' }); saveData({ employees: newEmps, ledger: updatedLedger }); };
    const handleFire = (id) => { const newEmps = employees.filter(e => e.id !== id); setEmployees(newEmps); saveData({ employees: newEmps }); };
    const handleCustomInvest = () => { if(!investInput.name || !investInput.cost) return; const cost = Number(investInput.cost); const updatedLedger = addToLedger(`Asset: ${investInput.name}`, cost, 'Debit', 'Asset', null); setLedger(updatedLedger); saveData({ ledger: updatedLedger }); setInvestInput({ name: '', cost: '' }); };
    const handleQuickTag = (tag) => { setTransForm({ ...transForm, desc: tag }); };

    const handleSettleKhata = (k) => {
        const newKhata = khata.filter(x => x.id !== k.id);
        setKhata(newKhata);
        const updatedLedger = addToLedger(`Khata Settled: ${k.name}`, k.amount, 'Credit', 'Sale', k.source);
        saveData({ khata: newKhata, ledger: updatedLedger });
    };

    // ==========================================
    // 🌍 DUAL-API AUTO-FETCH (SMARTER BARCODES)
    // ==========================================
    const fetchProductData = async (code) => {
        if (!code || code.length < 8) return; 
        setIsFetchingName(true);
        try {
            // ATTEMPT 1: Open Food Facts
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
            const data = await res.json();
            
            if (data.status === 1 && data.product && data.product.product_name) {
                setInvForm(prev => ({ ...prev, name: data.product.product_name }));
            } else {
                // ATTEMPT 2: Fallback to UPCItemDB
                const fallbackRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`);
                const fallbackData = await fallbackRes.json();
                
                if (fallbackData.items && fallbackData.items.length > 0) {
                    let cleanName = fallbackData.items[0].title.split(',')[0]; 
                    setInvForm(prev => ({ ...prev, name: cleanName }));
                } else {
                    alert("Product not found in global databases. You can type the name manually!");
                }
            }
        } catch (error) {
            console.error("API Fetch Error:", error);
        }
        setIsFetchingName(false);
    };

    // --- INVENTORY MANAGEMENT ---
    const handleAddInventory = () => {
        if (!invForm.name || !invForm.price) return;
        const fullName = invForm.variant ? `${invForm.name} - ${invForm.variant}` : invForm.name;
        const newItem = { id: Date.now(), name: fullName, price: Number(invForm.price), stockQty: invForm.stockQty === '' ? '' : Number(invForm.stockQty), barcode: invForm.barcode };
        const newInventory = [...inventory, newItem];
        setInventory(newInventory);
        saveData({ inventory: newInventory });
        setInvForm({ name: '', variant: '', price: '', stockQty: '', barcode: '' });
    };

    const handleDeleteInventory = (id) => {
        const newInventory = inventory.filter(item => item.id !== id);
        setInventory(newInventory);
        saveData({ inventory: newInventory });
    };

    // --- BILLING ENGINE ---
    const addBillItem = () => { 
        setBillItems(prev => [...prev, { id: Date.now(), item: '', qty: 1, price: '' }]); 
    };
    
    const handleBarcodeSubmit = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const foundItem = inventory.find(i => i.barcode && i.barcode === scannedCode.trim());
            if (foundItem) {
                let updatedItems = [...billItems];
                const lastIdx = updatedItems.length - 1;
                
                if (updatedItems[lastIdx].item === '') {
                    updatedItems[lastIdx] = { ...updatedItems[lastIdx], item: foundItem.name, price: foundItem.price, qty: 1 };
                } else {
                    updatedItems.push({ id: Date.now(), item: foundItem.name, qty: 1, price: foundItem.price });
                }
                setBillItems(updatedItems);
                setScannedCode(''); 
            } else {
                alert("Barcode not found in inventory!");
                setScannedCode('');
            }
        }
    };

    useEffect(() => {
        if (showBilling && billItems.length > 0 && billItemsRef.current[billItems.length - 1]) {
            const lastItem = billItems[billItems.length - 1];
            if(lastItem.item === '' && lastItem.price === '') {
                 billItemsRef.current[billItems.length - 1].focus();
            }
        }
    }, [billItems.length, showBilling]);

    const handleItemInput = (id, value, index) => {
        const newItems = billItems.map(item => item.id === id ? { ...item, item: value } : item); 
        setBillItems(newItems);
        if (value.length > 0) {
            const matches = inventory.filter(inv => inv.name.toLowerCase().includes(value.toLowerCase()));
            if (matches.length > 0) setSuggestions({ visible: true, items: matches, rowIndex: index });
            else setSuggestions({ visible: false, items: [], rowIndex: null });
        } else {
            setSuggestions({ visible: false, items: [], rowIndex: null });
        }
    };

    const selectSuggestion = (invItem, rowId) => {
        const newItems = billItems.map(item => item.id === rowId ? { ...item, item: invItem.name, price: invItem.price } : item);
        setBillItems(newItems);
        setSuggestions({ visible: false, items: [], rowIndex: null });
    };

    const updateBillItem = (id, field, value) => { const newItems = billItems.map(item => item.id === id ? { ...item, [field]: value } : item); setBillItems(newItems); };
    const removeBillItem = (id) => { if(billItems.length > 1) setBillItems(billItems.filter(item => item.id !== id)); };
    const getBillTotal = () => billItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);

    const handleBillKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (index === billItems.length - 1) addBillItem();
        }
    };

    // --- PDF GENERATOR ---
    const handleGenerateBill = (shareWhatsapp = false) => {
        const subTotal = getBillTotal();
        if(subTotal === 0) return;

        const gstAmount = applyGST ? Math.round(subTotal * 0.18) : 0;
        const finalTotal = subTotal + gstAmount;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        const activeTheme = INVOICE_THEMES[invoiceTheme];
        const colorPrimary = activeTheme.primary;
        const colorSecondary = activeTheme.secondary;
        const colorBlack = [17, 24, 39]; 
        const colorWhite = [255, 255, 255]; 

        doc.setFillColor(...colorWhite);
        doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
        
        doc.setFillColor(...colorPrimary);
        doc.roundedRect(15, 15, 110, 30, 3, 3, 'F');
        doc.setDrawColor(...colorBlack);
        doc.setLineWidth(1.5);
        doc.roundedRect(17, 17, 110, 30, 3, 3, 'S');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(companyName.toUpperCase(), 22, 36);

        doc.setFillColor(...colorSecondary);
        doc.roundedRect(pageWidth - 65, 18, 50, 16, 2, 2, 'FD'); 
        
        doc.setTextColor(...colorPrimary);
        doc.setFontSize(14);
        doc.text("INVOICE", pageWidth - 40, 29, { align: 'center' });

        doc.setTextColor(...colorBlack);
        doc.setFontSize(10);
        doc.text(`#INV-${Date.now().toString().slice(-6)}`, pageWidth - 40, 42, { align: 'center' });
        
        doc.setFillColor(...colorPrimary);
        doc.rect(15, 60, 6, 20, 'F');
        
        doc.setTextColor(...colorBlack);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("BILLED TO:", 26, 66);
        
        doc.setFontSize(14);
        doc.text(billCustomer.name ? billCustomer.name.toUpperCase() : "CASH CUSTOMER", 26, 74);
        if(billCustomer.phone) { doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(`PH: ${billCustomer.phone}`, 26, 80); }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("DATE:", pageWidth - 15, 66, { align: 'right' });
        doc.setFont("helvetica", "normal");
        doc.text(new Date().toLocaleDateString('en-GB'), pageWidth - 15, 74, { align: 'right' });

        const tableData = billItems.map(item => [item.item || "Item Description", item.qty, `Rs. ${item.price}`, `Rs. ${item.qty * item.price}`]);

        autoTable(doc, {
            head: [['ITEM DESCRIPTION', 'QTY', 'PRICE', 'AMOUNT']], body: tableData, startY: 95, theme: 'grid', 
            styles: { font: 'helvetica', fontSize: 10, textColor: colorBlack, lineColor: colorBlack, lineWidth: 0.5, cellPadding: 6 },
            headStyles: { fillColor: colorPrimary, textColor: colorWhite, fontStyle: 'bold', lineWidth: 1 },
            alternateRowStyles: { fillColor: colorSecondary },
            columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold' }, 3: { halign: 'right', fontStyle: 'bold' } }
        });

        let currentY = doc.lastAutoTable.finalY + 15;

        if (applyGST) {
            doc.setTextColor(...colorBlack);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Subtotal: Rs. ${subTotal.toLocaleString('en-IN')}`, pageWidth - 15, currentY, { align: 'right' });
            doc.text(`GST (18%): Rs. ${gstAmount.toLocaleString('en-IN')}`, pageWidth - 15, currentY + 6, { align: 'right' });
            currentY += 14; 
        }

        doc.setFillColor(...colorBlack);
        doc.rect(pageWidth - 85, currentY + 3, 70, 16, 'F');
        doc.setFillColor(...colorPrimary);
        doc.setDrawColor(...colorBlack);
        doc.setLineWidth(1);
        doc.rect(pageWidth - 88, currentY, 70, 16, 'FD'); 
        
        doc.setTextColor(...colorWhite);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL: Rs. ${finalTotal.toLocaleString('en-IN')}`, pageWidth - 53, currentY + 11, { align: 'center' });

        doc.setDrawColor(...colorBlack);
        doc.setLineWidth(1.5);
        doc.line(15, currentY + 35, pageWidth - 15, currentY + 35);

        doc.setTextColor(100);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text(`Thank you for your business. ${paymentStatus === 'Udhaar' ? 'PAYMENT PENDING.' : 'Computer generated invoice.'}`, 15, currentY + 45);

        doc.save(`${companyName.replace(/ /g, "_")}_Invoice_${Date.now()}.pdf`);

        if (shareWhatsapp) {
            if (!billCustomer.phone) alert("Saved successfully, but cannot send WhatsApp without a phone number!");
            else {
                let msg = `*${companyName.toUpperCase()}*\nHello ${billCustomer.name || "Customer"},\n\nHere is the summary of your bill:\n`;
                billItems.forEach(item => { if(item.item) msg += `▪ ${item.qty}x ${item.item} - Rs.${item.qty * item.price}\n`; });
                if(applyGST) msg += `\nSubtotal: Rs.${subTotal}\nGST (18%): Rs.${gstAmount}`;
                msg += `\n*Total Amount: Rs. ${finalTotal}*\n`;
                if (paymentStatus === 'Udhaar') msg += `\n_Status: PAYMENT PENDING (Khata)_\n`;
                msg += `\nThank you for your business!`;
                window.open(`https://wa.me/91${billCustomer.phone}?text=${encodeURIComponent(msg)}`, '_blank');
            }
        }

        let updatedInventory = [...inventory];
        let salesTally = { ...itemSales };

        billItems.forEach(bItem => {
            if(!bItem.item) return;
            let invItem = updatedInventory.find(i => i.name === bItem.item);
            if (invItem && invItem.stockQty !== '') invItem.stockQty = Math.max(0, Number(invItem.stockQty) - Number(bItem.qty));
            salesTally[bItem.item] = (salesTally[bItem.item] || 0) + Number(bItem.qty);
        });

        if (paymentStatus === 'Udhaar') {
            const newKhataItem = { id: Date.now(), name: billCustomer.name || 'Unknown', phone: billCustomer.phone || '', amount: finalTotal, date: new Date().toLocaleDateString(), source: billSource };
            const newKhataList = [newKhataItem, ...khata];
            setKhata(newKhataList);
            saveData({ inventory: updatedInventory, itemSales: salesTally, khata: newKhataList });
        } else {
            const desc = `Bill: ${billCustomer.name || 'Walk-in'} (Auto)`;
            const updatedLedger = addToLedger(desc, finalTotal, 'Credit', 'Sale', billSource);
            saveData({ ledger: updatedLedger, inventory: updatedInventory, itemSales: salesTally });
        }

        setShowBilling(false);
        setBillItems([{ id: Date.now(), item: '', qty: 1, price: '' }]);
        setBillCustomer({ name: '', phone: '' });
        setBillSource('direct'); 
        setPaymentStatus('Paid');
        setApplyGST(false);
    };

    const profitData = [{ label: 'Ops', value: totalExpenses, color: '#ef4444' }, { label: 'Revenue', value: totalRevenue, color: '#10b981' }];

    if (loading) return <div className="b-view" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>;

    return (
        <div className="b-view">
            {/* HEADER AREA */}
            <div className="b-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                    <div style={{background:'black', color:'white', width:'50px', height:'50px', borderRadius:'15px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', textTransform:'uppercase'}}>{companyName.charAt(0)}</div>
                    <div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            {isEditingName && !isCashierMode ? (
                                <input autoFocus className="b-title" style={{background:'transparent', border:'none', borderBottom:'2px solid #3b82f6', outline:'none', color:'#111827', width:'250px'}} value={companyName} onChange={(e) => setCompanyName(e.target.value)} onBlur={handleNameChange} onKeyDown={(e) => e.key === 'Enter' && handleNameChange()} />
                            ) : (
                                <h1 className="b-title" onClick={() => !isCashierMode && setIsEditingName(true)} style={{cursor: isCashierMode ? 'default' : 'pointer', borderBottom:'1px dashed transparent', wordBreak: 'break-word'}}>{companyName} {!isCashierMode && <span style={{fontSize:'0.8rem', color:'#9ca3af', verticalAlign:'middle'}}>✎</span>}</h1>
                            )}
                            {!isCashierMode && <button onClick={() => setIsSettingsOpen(true)} style={{background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:'1.2rem', padding:'5px'}}>⚙️</button>}
                        </div>
                        <div className="b-subtitle" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <span>{isCashierMode ? "Cashier Shift" : `${UI.role.toUpperCase()} • ${currentRank.toUpperCase()}`}</span>
                            {!isCashierMode && <div className="xp-container"><div className="xp-bar" style={{width: `${progressPercent}%`}}></div></div>}
                        </div>
                    </div>
                </div>
                <div className="b-header-actions" style={{display:'flex', gap:'10px'}}>
                    {businessType === 'shop' && <button onClick={() => setShowInventoryModal(true)} className="b-btn" style={{background:'#f3f4f6', color:'#111827', border:'1px solid #d1d5db'}}>📦 Inventory</button>}
                    {businessType === 'shop' && <button onClick={() => setShowBilling(true)} className="b-btn" style={{background:'#111827', color:'white', border:'1px solid #374151'}}>🧾 New Bill</button>}
                    
                    {!isCashierMode ? (
                        <>
                            <button onClick={() => setShowFinancials(true)} className="b-btn" style={{background:'#e0f2fe', color:'#0369a1'}}>VIEW REPORT</button>
                            <button onClick={onLogout} className="b-btn b-btn-danger" style={{borderRadius:'12px'}}>LOGOUT</button>
                        </>
                    ) : (
                        <button onClick={() => {
                            const pin = window.prompt("Enter Owner PIN to exit Cashier Mode:");
                            if(pin === "1234") setIsCashierMode(false);
                            else if (pin) alert("Incorrect PIN!");
                        }} className="b-btn" style={{background:'#ef4444', color:'white'}}>🔒 EXIT CASHIER MODE</button>
                    )}
                </div>
            </div>

            {/* 🔒 CASHIER MODE CONTENT (HIDES FINANCIALS) */}
            {isCashierMode ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏪</div>
                    <h2 style={{ fontSize: '2rem', color: '#111827', marginBottom: '10px' }}>Register is Open</h2>
                    <p style={{ color: '#6b7280', marginBottom: '30px' }}>Cashier Mode active. Financial data and reports are hidden.</p>
                    <button onClick={() => setShowBilling(true)} className="b-btn b-btn-primary" style={{ padding: '20px 40px', fontSize: '1.2rem', borderRadius: '15px' }}>🧾 START NEW BILL</button>
                </div>
            ) : (
                <>
                    {/* Quick Stats Grid */}
                    <div className="b-grid-3" style={{ marginBottom: '30px' }}>
                        <div className="b-card"><span className="b-label" style={{color:'#3b82f6'}}>{UI.metricRev}</span><div style={{ fontSize: '2.2rem', fontWeight: '800' }}>{formatCurrency(totalRevenue)}</div></div>
                        <div className="b-card"><span className="b-label" style={{color:'#6b7280'}}>Opening Balance</span><div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#6b7280' }}>{formatCurrency(openingBalance)}</div></div>
                        <div className="b-card" style={{background:'#111827', border:'none'}}><span className="b-label" style={{color:'#10b981'}}>{UI.metricNet}</span><div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#ffffff' }}>{formatCurrency(takeHome)}</div></div>
                    </div>

                    {/* Main Layout Area */}
                    <div className="b-main-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                        <div>
                            <div className="b-card">
                                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom: '20px'}}>
                                    <h3 className="b-title" style={{ fontSize: '1.2rem' }}>⚡ {UI.revTitle}</h3>
                                    <span className={`info-icon ${showHelp ? 'active' : ''}`} onClick={() => setShowHelp(!showHelp)} onMouseEnter={() => setShowHelp(true)} onMouseLeave={() => setShowHelp(false)}>?<span className="info-tooltip">These numbers update automatically when you add transactions via the + button.</span></span>
                                </div>
                                <div className="b-grid-3" style={{marginBottom:'20px'}}>
                                    <div><label className="b-label">{UI.rev1}</label><div className="b-input" style={{background:'#f3f4f6', color:'#6b7280', border:'1px solid #e5e7eb'}}>{formatCurrency(revenue.direct)}</div></div>
                                    <div><label className="b-label">{UI.rev2}</label><div className="b-input" style={{background:'#f3f4f6', color:'#6b7280', border:'1px solid #e5e7eb'}}>{formatCurrency(revenue.services)}</div></div>
                                    <div><label className="b-label">{UI.rev3}</label><div className="b-input" style={{background:'#f3f4f6', color:'#6b7280', border:'1px solid #e5e7eb'}}>{formatCurrency(revenue.investments)}</div></div>
                                </div>
                                
                                {/* 🆕 7-DAY REVENUE CHART */}
                                <div style={{marginTop: '20px'}}>
                                    <h4 className="b-label" style={{marginBottom: '10px', color: '#111827'}}>7-Day Income Trend</h4>
                                    <SimpleBarChart ledger={ledger} />
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

                            {businessType === 'shop' && (
                                <div className="b-card">
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                                        <h3 className="b-title" style={{ fontSize: '1.2rem' }}>📒 Pending Udhaar (Khata)</h3>
                                        <span style={{fontSize:'0.7rem', background:'#fef3c7', color:'#d97706', padding:'4px 8px', borderRadius:'6px', fontWeight:'bold'}}>{khata.length} Unpaid</span>
                                    </div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {khata.length === 0 ? <p style={{color:'#9ca3af', fontSize:'0.9rem'}}>No pending payments.</p> : khata.map(k => (
                                            <div key={k.id} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px dashed #e5e7eb'}}>
                                                <div>
                                                    <strong style={{color:'#111827'}}>{k.name}</strong><br/>
                                                    <span style={{fontSize:'0.75rem', color:'#6b7280'}}>{k.date} • {k.phone || 'No phone'}</span>
                                                </div>
                                                <div style={{textAlign:'right'}}>
                                                    <span style={{color:'#ef4444', fontWeight:'bold', display:'block', marginBottom:'4px'}}>{formatCurrency(k.amount)}</span>
                                                    <button onClick={() => handleSettleKhata(k)} style={{background:'#10b981', color:'white', border:'none', borderRadius:'4px', padding:'4px 8px', fontSize:'0.75rem', cursor:'pointer', fontWeight:'bold'}}>SETTLE</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                {smartInsights.map((alert, i) => <div key={i} className={`alert-card alert-${alert.type}`}>{alert.text}</div>)}
                            </div>
                            
                            <div className="b-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <h3 className="b-title" style={{ fontSize: '1rem', marginBottom: '20px' }}>Money Flow</h3>
                                <SimplePieChart data={profitData} size={160} hollow={true} />
                            </div>

                            {businessType === 'shop' && topSellers.length > 0 && (
                                <div className="b-card">
                                    <h3 className="b-title" style={{ fontSize: '1rem', marginBottom: '15px' }}>🏆 Top Selling Items</h3>
                                    {topSellers.map((item, i) => (
                                        <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px', background: i === 0 ? '#fef3c7' : '#f9fafb', borderRadius:'8px', marginBottom:'6px'}}>
                                            <span style={{fontWeight:'bold', color: i===0 ? '#d97706' : '#374151'}}>#{i+1} {item[0]}</span>
                                            <span style={{color:'#6b7280', fontWeight:'600'}}>{item[1]} sold</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="b-card"><label className="b-label">{UI.costTitle}</label><input className="b-input" placeholder="₹0" value={expenses} onChange={(e) => handleExpenseChange(e.target.value)} /></div>
                            
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
                                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}><span style={{fontWeight:'700', color: entry.type === 'Credit' ? '#10b981' : '#ef4444'}}>{entry.type === 'Credit' ? '+' : '-'} {formatCurrency(entry.amount)}</span><button onClick={() => setDeleteId(entry.id)} style={{background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:'1.2rem', lineHeight:1}}>×</button></div>
                                            </div>
                                            <div style={{fontSize:'0.75rem', color:'#9ca3af'}}>{entry.date} • {entry.source ? entry.source.toUpperCase() : entry.category}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="fab-container"><div className={`toggle ${showTransModal ? 'active' : ''}`} onClick={() => setShowTransModal(!showTransModal)}><span className="label">+</span></div></div>
                </>
            )}

            {/* 📦 INVENTORY MODAL (WITH DUAL-API FETCH) */}
            {showInventoryModal && (
                <div className="report-overlay">
                    <div className="report-card" style={{maxWidth:'700px', width: '90%', maxHeight:'90vh', overflowY:'auto'}}>
                        <div className="report-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'white', zIndex:10}}>
                            <h2 className="b-title">📦 Manage Inventory</h2>
                            <button onClick={() => setShowInventoryModal(false)} style={{background:'none', border:'none', fontSize:'2rem', cursor:'pointer', color: '#ef4444', fontWeight: 'bold'}}>×</button>
                        </div>
                        
                        <div className="report-body">
                            <div style={{display:'flex', gap:'8px', alignItems:'flex-end', marginBottom:'20px', borderBottom:'1px solid #e5e7eb', paddingBottom:'20px'}}>
                                <div style={{flex:2}}>
                                    <label className="b-label" style={{display:'flex', justifyContent:'space-between'}}>
                                        <span>Barcode Scanner</span>
                                        {isFetchingName && <span style={{color: '#f59e0b', fontSize:'0.7rem'}}>Fetching...</span>}
                                    </label>
                                    <input 
                                        className="b-input" placeholder="Scan & Press Enter..." value={invForm.barcode} 
                                        onChange={e => setInvForm({...invForm, barcode: e.target.value})} 
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchProductData(invForm.barcode); } }}
                                        onBlur={() => fetchProductData(invForm.barcode)}
                                        style={{background:'#e0f2fe', borderColor:'#7dd3fc'}}
                                    />
                                </div>

                                <div style={{flex:2}}><label className="b-label">Item Name</label><input className="b-input" placeholder="e.g. Lay's" value={invForm.name} onChange={e => setInvForm({...invForm, name: e.target.value})} /></div>
                                <div style={{flex:1}}><label className="b-label">Variant</label><input className="b-input" placeholder="Opt" value={invForm.variant} onChange={e => setInvForm({...invForm, variant: e.target.value})} /></div>
                                <div style={{flex:1.2}}><label className="b-label">Price</label><input className="b-input" type="number" placeholder="₹0" value={invForm.price} onChange={e => setInvForm({...invForm, price: e.target.value})} /></div>
                                <div style={{flex:1.2}}><label className="b-label">Stock</label><input className="b-input" type="number" placeholder="Qty" value={invForm.stockQty} onChange={e => setInvForm({...invForm, stockQty: e.target.value})} /></div>
                                <button onClick={handleAddInventory} className="b-btn b-btn-primary" style={{height:'46px'}}>ADD</button>
                            </div>
                            <div style={{marginBottom:'10px'}}>
                                {inventory.length === 0 && <div style={{textAlign:'center', color:'#9ca3af', padding:'20px'}}>No items added. Add your first item above!</div>}
                                {inventory.map(item => (
                                    <div key={item.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #f3f4f6'}}>
                                        <div>
                                            <span style={{fontWeight:'bold'}}>{item.name}</span>
                                            <span style={{marginLeft:'10px', fontSize:'0.75rem', background: item.stockQty !== '' && item.stockQty < 5 ? '#fee2e2' : '#e0f2fe', color: item.stockQty !== '' && item.stockQty < 5 ? '#ef4444' : '#0369a1', padding:'2px 6px', borderRadius:'10px'}}>Stock: {item.stockQty !== '' ? item.stockQty : '∞'}</span>
                                            {item.barcode && <span style={{display:'block', fontSize:'0.75rem', color:'#9ca3af', marginTop:'2px'}}>📟 {item.barcode}</span>}
                                        </div>
                                        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                            <span style={{fontWeight:'bold'}}>{formatCurrency(item.price)}</span>
                                            <button onClick={() => handleDeleteInventory(item.id)} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer'}}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{marginTop:'20px', borderTop:'1px solid #eee', paddingTop:'20px'}}>
                             <button onClick={() => setShowInventoryModal(false)} className="b-btn" style={{width:'100%', background:'#e5e7eb', color:'#374151', padding:'12px'}}>← GO BACK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🧾 BILLING MODAL */}
            {showBilling && (
                <div className="report-overlay">
                    <div className="report-card" style={{maxWidth:'650px', height:'auto'}}>
                        <div className="report-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <h2 className="b-title" style={{fontSize:'1.3rem'}}>Generate Bill</h2>
                            <button onClick={() => setShowBilling(false)} style={{background:'none', border:'none', fontSize:'2rem', cursor:'pointer', color: '#ef4444', fontWeight: 'bold'}}>×</button>
                        </div>
                        <div className="report-body">
                            
                            <div style={{marginBottom:'15px', display:'flex', alignItems:'center', gap:'15px', background:'#f9fafb', padding:'10px', borderRadius:'8px', border:'1px solid #e5e7eb', overflowX: 'auto'}}>
                                <span className="b-label" style={{margin:0, whiteSpace:'nowrap'}}>Bill Theme:</span>
                                <div style={{display:'flex', gap:'10px'}}>
                                    {Object.entries(INVOICE_THEMES).map(([key, themeData]) => (
                                        <div key={key} onClick={() => setInvoiceTheme(key)} title={themeData.name} style={{ width: '24px', height: '24px', borderRadius: '50%', background: `rgb(${themeData.primary.join(',')})`, cursor: 'pointer', border: invoiceTheme === key ? '3px solid #111827' : '2px solid transparent', outline: invoiceTheme === key ? '2px solid white' : 'none', outlineOffset: '-2px', flexShrink: 0 }} />
                                    ))}
                                </div>
                            </div>

                            <div style={{marginBottom:'15px', background:'#fffbeb', padding:'10px', borderRadius:'8px', border:'2px dashed #fcd34d'}}>
                                <label className="b-label" style={{color:'#d97706'}}>📷 Fast Barcode Scan (Click here and scan item)</label>
                                <input 
                                    className="b-input" autoFocus placeholder="Listening for scanner beep..." value={scannedCode}
                                    onChange={(e) => setScannedCode(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{background:'white', borderColor:'#fde68a'}}
                                />
                            </div>

                            <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                                <div style={{flex:2}}><label className="b-label">Customer Name</label><input className="b-input" placeholder="Name" value={billCustomer.name} onChange={e => setBillCustomer({...billCustomer, name: e.target.value})} /></div>
                                <div style={{flex:2}}><label className="b-label">Phone</label><input className="b-input" placeholder="Optional" value={billCustomer.phone} onChange={e => setBillCustomer({...billCustomer, phone: e.target.value})} /></div>
                            </div>

                            <div style={{display:'flex', gap:'10px', marginBottom:'20px', background:'#e0f2fe', padding:'10px', borderRadius:'8px', border:'1px solid #bae6fd'}}>
                                <div style={{flex:1}}>
                                    <label className="b-label" style={{color:'#0369a1'}}>Payment Status</label>
                                    <select className="b-input" style={{borderColor:'#7dd3fc'}} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                                        <option value="Paid">✅ Paid Instantly</option>
                                        <option value="Udhaar">📒 Udhaar (Unpaid Khata)</option>
                                    </select>
                                </div>
                                <div style={{flex:1}}>
                                    <label className="b-label" style={{color:'#0369a1'}}>Tax Options</label>
                                    <label style={{display:'flex', alignItems:'center', gap:'8px', height:'42px', background:'white', padding:'0 10px', borderRadius:'8px', border:'1px solid #7dd3fc', cursor:'pointer'}}>
                                        <input type="checkbox" checked={applyGST} onChange={(e) => setApplyGST(e.target.checked)} style={{width:'18px', height:'18px'}} />
                                        <span style={{fontWeight:'bold', fontSize:'0.9rem', color:'#0369a1'}}>Apply 18% GST</span>
                                    </label>
                                </div>
                            </div>

                            <div style={{marginBottom:'20px', maxHeight:'250px', overflowY:'auto'}}>
                                {billItems.map((row, i) => (
                                    <div key={row.id} style={{display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center', position:'relative'}}>
                                        <input 
                                            ref={el => billItemsRef.current[i] = el} className="b-input" placeholder="Item Name (Type to search...)" 
                                            value={row.item} onChange={e => handleItemInput(row.id, e.target.value, i)} style={{flex:2}} 
                                        />
                                        
                                        {suggestions.visible && suggestions.rowIndex === i && (
                                            <div style={{position:'absolute', top:'100%', left:0, width:'70%', background:'white', border:'1px solid #e5e7eb', borderRadius:'8px', zIndex:10, boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight:'150px', overflowY:'auto'}}>
                                                {suggestions.items.map(s => (
                                                    <div 
                                                        key={s.id} onClick={() => selectSuggestion(s, row.id)}
                                                        style={{padding:'10px 12px', borderBottom:'1px solid #f3f4f6', cursor:'pointer', fontSize:'0.9rem', display:'flex', justifyContent:'space-between'}}
                                                        onMouseOver={e => e.target.style.background = '#f3f4f6'} onMouseOut={e => e.target.style.background = 'white'}
                                                    >
                                                        <span><strong>{s.name}</strong> <span style={{fontSize:'0.75rem', color: s.stockQty !== '' && s.stockQty < 5 ? '#ef4444' : '#6b7280'}}>(Stock: {s.stockQty !== '' ? s.stockQty : '∞'})</span></span>
                                                        <span>{formatCurrency(s.price)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <input className="b-input" type="number" placeholder="Qty" value={row.qty} onChange={e => updateBillItem(row.id, 'qty', e.target.value)} style={{width:'60px'}} />
                                        <input 
                                            className="b-input" type="number" placeholder="Price" value={row.price} 
                                            onChange={e => updateBillItem(row.id, 'price', e.target.value)} onKeyDown={(e) => handleBillKeyDown(e, i)} style={{width:'80px'}} 
                                        />
                                        <button onClick={() => removeBillItem(row.id)} style={{background:'transparent', border:'none', color:'#ef4444', fontSize:'1.2rem'}}>×</button>
                                    </div>
                                ))}
                                <button onClick={addBillItem} style={{fontSize:'0.8rem', color:'#0369a1', background:'transparent', border:'none', cursor:'pointer', fontWeight:'bold'}}>+ Add Another Item</button>
                            </div>
                            
                            <div style={{borderTop:'1px solid #e5e7eb', paddingTop:'15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                    <div style={{fontSize:'0.9rem', color:'#6b7280'}}>Subtotal: {formatCurrency(getBillTotal())}</div>
                                    <div style={{fontSize:'1.3rem', fontWeight:'800', color:'#111827'}}>Total: {formatCurrency(applyGST ? getBillTotal() * 1.18 : getBillTotal())}</div>
                                </div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button onClick={() => handleGenerateBill(false)} className="b-btn b-btn-primary" style={{padding:'10px 15px', background:'#374151'}}>
                                        🖨️ SAVE PDF
                                    </button>
                                    <button onClick={() => handleGenerateBill(true)} className="b-btn b-btn-primary" style={{padding:'10px 15px', background:'#22c55e', color:'white', boxShadow:'0 4px 6px -1px rgba(34, 197, 94, 0.4)'}}>
                                        💬 SAVE & WHATSAPP
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Modals (Settings, Trans, Delete, Report) */}
            {isSettingsOpen && (
                <div className="report-overlay" onClick={() => setIsSettingsOpen(false)}>
                    <div className="report-card" style={{maxWidth:'450px', height:'auto'}} onClick={e => e.stopPropagation()}>
                        <div className="report-header"><h2 className="b-title" style={{fontSize:'1.3rem'}}>Settings</h2><button onClick={() => setIsSettingsOpen(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button></div>
                        <div className="report-body">
                            <div style={{marginBottom:'20px'}}><label className="b-label">Business Name</label><input className="b-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter Name..." /></div>
                            <div style={{marginBottom:'20px'}}><label className="b-label">Opening Cash Balance (Galla)</label><input className="b-input" type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="₹0" /></div>
                            
                            {/* 🆕 CASHIER MODE TOGGLE */}
                            <div style={{marginBottom:'20px', background:'#fffbeb', padding:'10px', borderRadius:'8px', border:'1px solid #fde68a'}}>
                                <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
                                    <input type="checkbox" checked={isCashierMode} onChange={(e) => {
                                        if(e.target.checked) setIsCashierMode(true);
                                    }} style={{width:'18px', height:'18px'}} />
                                    <span style={{fontWeight:'bold', color:'#d97706'}}>Lock in Cashier Mode</span>
                                </label>
                                <p style={{fontSize:'0.75rem', color:'#d97706', marginTop:'5px'}}>Hides financial data. Pin `1234` required to exit.</p>
                            </div>

                            <div style={{marginBottom:'25px'}}><label className="b-label">Identity</label><div style={{display:'flex', gap:'10px'}}><button onClick={() => setBusinessType('shop')} className="b-btn" style={{flex:1, background: businessType === 'shop' ? '#111827' : '#f3f4f6', color: businessType === 'shop' ? 'white' : '#6b7280'}}>🏪 Shop</button><button onClick={() => setBusinessType('startup')} className="b-btn" style={{flex:1, background: businessType === 'startup' ? '#111827' : '#f3f4f6', color: businessType === 'startup' ? 'white' : '#6b7280'}}>🚀 Startup</button></div></div>
                            <button onClick={handleSaveSettings} className="b-btn b-btn-primary" style={{width:'100%'}}>SAVE CHANGES</button>
                        </div>
                    </div>
                </div>
            )}

            {showTransModal && (
                <div className="trans-modal">
                    <h3 className="b-title" style={{fontSize:'1.2rem', marginBottom:'20px', color: '#111827'}}>New Entry</h3>
                    <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'5px'}}>{UI.quickTags[transForm.type === 'Credit' ? 'income' : 'expense'].map((tag, i) => (<button key={i} onClick={() => handleQuickTag(tag)} style={{background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius:'20px', padding:'6px 12px', fontSize:'0.75rem', cursor:'pointer', color:'#4b5563', transition: 'all 0.2s ease'}} onMouseOver={(e) => {e.target.style.background = '#e5e7eb'; e.target.style.color = '#111827'}} onMouseOut={(e) => {e.target.style.background = '#f3f4f6'; e.target.style.color = '#4b5563'}}>+ {tag}</button>))}</div>
                        
                        {/* 👇 AI SCANNER COMPONENT HERE 👇 */}
                        <AIReceiptScanner 
                            onScanSuccess={(aiData) => {
                                setTransForm(prev => ({
                                    ...prev,
                                    desc: aiData.merchant || "Scanned Bill",
                                    amount: aiData.total || "",
                                    type: 'Debit' // Receipts are usually expenses
                                }));
                                alert("Receipt scanned successfully!");
                            }} 
                        />
                        {/* 👆 AI SCANNER COMPONENT HERE 👆 */}

                        <div><label className="b-label">Description</label><input className="b-input" placeholder="e.g. Sale #101" value={transForm.desc} onChange={e => setTransForm({...transForm, desc: e.target.value})} /></div>
                        <div><label className="b-label">Amount</label><input className="b-input" type="number" placeholder="₹0" value={transForm.amount} onChange={e => setTransForm({...transForm, amount: e.target.value})} /></div>
                        <div>
                            <label className="b-label">Transaction Type</label>
                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}><button onClick={() => setTransForm({...transForm, type: 'Credit'})} className="b-btn" style={{flex:1, background: transForm.type === 'Credit' ? '#10b981' : '#f3f4f6', color: transForm.type === 'Credit' ? 'white' : 'black'}}>INCOME (+)</button><button onClick={() => setTransForm({...transForm, type: 'Debit'})} className="b-btn" style={{flex:1, background: transForm.type === 'Debit' ? '#ef4444' : '#f3f4f6', color: transForm.type === 'Debit' ? 'white' : 'black'}}>EXPENSE (-)</button></div>
                            {transForm.type === 'Credit' && (<div><label className="b-label">Select Source</label><select className="b-input" value={transForm.source} onChange={(e) => setTransForm({...transForm, source: e.target.value})}><option value="direct">{UI.rev1}</option><option value="services">{UI.rev2}</option><option value="investments">{UI.rev3}</option></select></div>)}
                        </div>
                        <button onClick={handleManualTransaction} className="b-btn b-btn-primary" style={{marginTop:'10px'}}>SAVE</button>
                    </div>
                </div>
            )}

            {deleteId && <div className="report-overlay" onClick={() => setDeleteId(null)}><div className="report-card" style={{maxWidth:'400px'}} onClick={e => e.stopPropagation()}><div className="report-header"><h3 className="b-title">Confirm Delete</h3></div><div style={{padding:'20px'}}><p style={{marginBottom:'20px', color:'#666'}}>Delete this entry?</p><div style={{display:'flex', gap:'10px'}}><button onClick={() => setDeleteId(null)} className="b-btn">CANCEL</button><button onClick={confirmDeleteTransaction} className="b-btn b-btn-danger">DELETE</button></div></div></div></div>}
            
            {showFinancials && <div className="report-overlay" onClick={() => setShowFinancials(false)}><div className="report-card" onClick={e => e.stopPropagation()}><div className="report-header"><h2 className="b-title">Report</h2><button onClick={() => setShowFinancials(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button></div><div className="report-body"><div className="report-section"><div className="report-row"><span>Opening Balance</span><span>{formatCurrency(openingBalance)}</span></div><div className="report-row"><span>+ Total Revenue</span><span>{formatCurrency(totalRevenue)}</span></div><div className="report-row"><span>- Total Expenses</span><span>{formatCurrency(totalExpenses)}</span></div><div className="report-row total"><span>= Net Cash</span><span>{formatCurrency(takeHome)}</span></div></div><div style={{marginTop:'20px', display:'flex', justifyContent:'flex-end'}}><button onClick={handleExportCSV} className="b-btn b-btn-primary">Download CSV</button></div></div></div></div>}

        </div>
    );
}

export default BusinessView;