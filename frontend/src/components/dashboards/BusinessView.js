import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig'; 
import { useAuth } from '../../context/AuthContext'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../components/Dashboard3.css'; 
import AIReceiptScanner from '../AIReceiptScanner'; 
import AIInsightBox from '../AIInsightBox';
import { SimplePieChart, SimpleBarChart, AICashFlowForecastingChart } from './business/BusinessCharts';
import { FinancialModal } from './business/BusinessModals';
import BusinessPredictionCard from '../BusinessPredictionCard';
import CRMTab from './business/CRMTab';
import OpsTab from './business/OpsTab';
 

// --- HELPER FUNCTIONS ---
const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
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

    const [isCashierMode, setIsCashierMode] = useState(false);

    const [openingBalance, setOpeningBalance] = useState(0);
    const [expenses, setExpenses] = useState(0); 
    const [employees, setEmployees] = useState([]);
    
    // 🌟 Asset Portfolio State
    const [assets, setAssets] = useState([]); 
    
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
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [pinPrompt, setPinPrompt] = useState(false);
    const [pinInput, setPinInput] = useState('');
    
    const [searchTerm, setSearchTerm] = useState("");
    const customerLTV = useMemo(() => {
        const ltvMap = {};
        
        ledger.forEach(entry => {
            if (entry.desc && entry.desc.startsWith('Bill: ') && entry.type === 'Credit') {
                let name = entry.desc.replace('Bill: ', '').replace(' (Auto)', '').trim();
                if (name.toLowerCase() !== 'walk-in' && name !== '') {
                    if (!ltvMap[name]) ltvMap[name] = { name, totalPaid: 0, totalDebt: 0 };
                    ltvMap[name].totalPaid += Number(entry.amount);
                }
            }
        });

        khata.forEach(entry => {
            let name = entry.name.trim();
            if (name.toLowerCase() !== 'unknown' && name !== '') {
                if (!ltvMap[name]) ltvMap[name] = { name, totalPaid: 0, totalDebt: 0 };
                ltvMap[name].totalDebt += Number(entry.amount);
            }
        });

        return Object.values(ltvMap).sort((a, b) => b.totalPaid - a.totalPaid);
    }, [ledger, khata]);

    const [globalBranch, setGlobalBranch] = useState('all');
    const [activeTab, setActiveTab] = useState('dashboard');

    const [toast, setToast] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const toastMessage = (msg, type = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const [ledgerDate, setLedgerDate] = useState(""); 

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

    // 🌟 DEV TOOL STATES
    const [seedMonth, setSeedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [seedCount, setSeedCount] = useState(25);

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
            assetTitle: "Business Assets / Equipment", assetLabel: "Item Name (e.g. Fridge)", metricRev: "Total Sales",
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
                if(data.assets) setAssets(data.assets); 
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

    const totalRevenue = useMemo(() => revenue.direct + revenue.services + revenue.investments, [revenue]);
    const payrollExpenses = employees.reduce((s, e) => s + Number(e.salary), 0);
    const operationalExpenses = Number(expenses);
    const ledgerExpenses = ledger.filter(l => l.type === 'Debit').reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = useMemo(() => operationalExpenses + payrollExpenses + ledgerExpenses, [operationalExpenses, payrollExpenses, ledgerExpenses]);
    const takeHome = (Number(openingBalance) + totalRevenue) - totalExpenses;
    
    const totalAssetValue = assets.reduce((sum, a) => sum + Number(a.cost), 0);

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

    const filteredLedger = ledger.filter(entry => {
        const matchesSearch = entry.desc.toLowerCase().includes(searchTerm.toLowerCase()) || entry.amount.toString().includes(searchTerm);
        let matchesDate = true;
        if (ledgerDate) {
            const d = new Date(entry.date);
            const entryDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            matchesDate = entryDateStr === ledgerDate;
        }
        return matchesSearch && matchesDate;
    });

    const handleNameChange = () => { if(companyName.trim() === "") setCompanyName("My Shop Name"); setIsEditingName(false); saveData({ companyName }); };
    
    const addToLedger = (desc, amount, type, category, source) => { const newEntry = { id: Date.now(), date: new Date().toLocaleDateString(), desc, amount, category, type, source }; const newLedger = [newEntry, ...ledger]; setLedger(newLedger); return newLedger; };
    const confirmDeleteTransaction = () => { if (!deleteId) return; const newLedger = ledger.filter(l => l.id !== deleteId); setLedger(newLedger); saveData({ ledger: newLedger }); setDeleteId(null); };
    const handleManualTransaction = () => { if (!transForm.desc || !transForm.amount) return; const amount = Number(transForm.amount); const updatedLedger = addToLedger(transForm.desc, amount, transForm.type, transForm.category, transForm.source); saveData({ ledger: updatedLedger }); setTransForm({ desc: '', amount: '', type: 'Debit', category: 'Misc', source: 'direct' }); setShowTransModal(false); };
        const handleHire = () => { if(!empInput.name || !empInput.salary) return; const salary = Number(empInput.salary); const newEmps = [...employees, { ...empInput, id: Date.now(), salary }]; const updatedLedger = addToLedger(`Hired: ${empInput.name}`, salary, 'Debit', 'Payroll', null); setEmployees(newEmps); setEmpInput({ name: '', salary: '', designation: '' }); saveData({ employees: newEmps, ledger: updatedLedger }); };
    const handleFire = (id) => { const newEmps = employees.filter(e => e.id !== id); setEmployees(newEmps); saveData({ employees: newEmps }); };
    const handleQuickTag = (tag) => { setTransForm({ ...transForm, desc: tag }); };

    const handleCustomInvest = () => { 
        if(!investInput.name || !investInput.cost) return; 
        const cost = Number(investInput.cost); 
        
        const newAsset = { id: Date.now(), name: investInput.name, cost };
        const updatedAssets = [...assets, newAsset];
        setAssets(updatedAssets);

        const updatedLedger = addToLedger(`Asset Purchased: ${investInput.name}`, cost, 'Debit', 'Asset', null); 
        
        saveData({ assets: updatedAssets, ledger: updatedLedger }); 
        setInvestInput({ name: '', cost: '' }); 
    };

    const handleRemoveAsset = (id) => {
        setConfirmAction({
            message: "Are you sure you want to remove this asset from your portfolio?",
            onConfirm: () => {
                const updatedAssets = assets.filter(a => a.id !== id);
                setAssets(updatedAssets);
                saveData({ assets: updatedAssets });
                setConfirmAction(null);
            }
        });
    };

    const handleSettleKhata = (k) => {
        const newKhata = khata.filter(x => x.id !== k.id);
        setKhata(newKhata);
        const updatedLedger = addToLedger(`Khata Settled: ${k.name}`, k.amount, 'Credit', 'Sale', k.source);
        saveData({ khata: newKhata, ledger: updatedLedger });
    };

    const fetchProductData = async (code) => {
        if (!code || code.length < 8) return; 
        setIsFetchingName(true);
        try {
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
            const data = await res.json();
            
            if (data.status === 1 && data.product && data.product.product_name) {
                setInvForm(prev => ({ ...prev, name: data.product.product_name }));
            } else {
                const fallbackRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`);
                const fallbackData = await fallbackRes.json();
                
                if (fallbackData.items && fallbackData.items.length > 0) {
                    let cleanName = fallbackData.items[0].title.split(',')[0]; 
                    setInvForm(prev => ({ ...prev, name: cleanName }));
                } else {
                    toastMessage("Product not found in global databases. You can type the name manually!", "error");
                }
            }
        } catch (error) {
            console.error("API Fetch Error:", error);
        }
        setIsFetchingName(false);
    };

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

    const addBillItem = () => { setBillItems(prev => [...prev, { id: Date.now(), item: '', qty: 1, price: '' }]); };
    
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
                toastMessage("Barcode not found in inventory!", "error");
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
    }, [billItems, billItems.length, showBilling]);

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
            if (!billCustomer.phone) toastMessage("Saved successfully, but cannot send WhatsApp without a phone number!", "error");
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

    // =========================================
    // 🛠️ BUSINESS DEVELOPER TOOLS (CRUD)
    // =========================================

    const handleSeedBusinessDatabase = async () => {
        if (!currentUser) return;
        if (!seedMonth) return toastMessage("Please select a month and year first.", "error");

        const [yearStr, monthStr] = seedMonth.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1; 
        const countToInject = parseInt(seedCount) || 25;

        setConfirmAction({
            message: `Inject ${countToInject} dummy business transactions into ${seedMonth}?`,
            onConfirm: () => {
                setConfirmAction(null);
                const baseLedger = ledger.filter(l => !l.date.startsWith(seedMonth));
                const newEntries = [];
                for(let i = 0; i < countToInject; i++) {
                    const desc = ['Sale', 'Bulk Order', 'Wholesale', 'Service', 'Repair'][Math.floor(Math.random() * 5)];
                    const amt = Math.floor(Math.random() * 5000) + 100;
                    newEntries.push({ id: Date.now() + i, date: `${seedMonth}/${Math.floor(Math.random()*28)+1}/2023`, desc, amount: amt, type: 'Credit', category: 'Sales', source: 'direct' });
                }
                const updated = [...newEntries, ...baseLedger];
                setLedger(updated);
                saveData({ ledger: updated });
                toastMessage(`Injected ${countToInject} entries!`);
            }
        });
        return;

        const creditDescs = ["Walk-in Sale", "Bulk Order Payment", "Consulting Fee", "Online Marketplace Sale", "Udhaar Recovery"];
        const debitDescs = ["Wholesale Restock", "Electricity Bill", "Staff Lunch", "Packaging Material", "Shop Rent", "Marketing Ads"];

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let newEntries = [];

        for (let i = 0; i < countToInject; i++) {
            const isCredit = Math.random() > 0.4; 
            
            const randomAmount = isCredit 
                ? Math.floor(Math.random() * 8000) + 150 
                : Math.floor(Math.random() * 3000) + 50;

            const randomDesc = isCredit 
                ? creditDescs[Math.floor(Math.random() * creditDescs.length)]
                : debitDescs[Math.floor(Math.random() * debitDescs.length)];

            const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
            const randomDate = new Date(year, month, randomDay).toLocaleDateString();

            const type = isCredit ? 'Credit' : 'Debit';
            const category = isCredit ? 'Sale' : 'Misc';
            
            let source = null;
            if (isCredit) {
                const rand = Math.random();
                if (rand > 0.7) source = 'direct';
                else if (rand > 0.4) source = 'services';
                else source = 'investments';
            }

            newEntries.push({
                id: Date.now() + i + Math.floor(Math.random() * 10000), 
                date: randomDate, 
                desc: randomDesc, 
                amount: randomAmount, 
                category: category, 
                type: type, 
                source: source 
            });
        }
        
        const updatedLedger = [...newEntries, ...ledger];
        setLedger(updatedLedger);
        await saveData({ ledger: updatedLedger });
        toastMessage(`✅ Successfully injected ${countToInject} business transactions into ${seedMonth}!`, "error");
    };

    const handleClearBusinessMonth = async () => {
        if (!currentUser) return;
        if (!seedMonth) return toastMessage("Select a month first.", "error");

        const confirm = window.confirm(`⚠️ WARNING: Delete ALL business ledger entries in ${seedMonth}?`);
        if (!confirm) return;

        const [yearStr, monthStr] = seedMonth.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1; 

        const updatedLedger = ledger.filter(entry => {
            const d = new Date(entry.date);
            if (!isNaN(d.getTime())) {
                return !(d.getFullYear() === year && d.getMonth() === month);
            }
            return true;
        });

        const deletedCount = ledger.length - updatedLedger.length;
        if (deletedCount === 0) return toastMessage(`No transactions found in ${seedMonth}.`, "error");

        setLedger(updatedLedger);
        await saveData({ ledger: updatedLedger });
        toastMessage(`🗑️ Deleted ${deletedCount} business transactions from ${seedMonth}.`, "error");
    };

    const handleNukeBusinessDatabase = async () => {
        if (!currentUser) return;
        const confirm1 = window.confirm(`☢️ DANGER: You are about to wipe EVERY entry in your business ledger. Proceed?`);
        if (!confirm1) return;
        const confirm2 = window.prompt('Type "NUKE" to confirm complete deletion of the ledger.');
        if (confirm2 !== "NUKE") return toastMessage("Database nuke aborted.", "error");

        setLedger([]);
        await saveData({ ledger: [] });
        toastMessage(`☢️ Clean Slate. Entire business ledger wiped.`, "error");
    };

    // =========================================

    const profitData = [{ label: 'Ops', value: totalExpenses, color: 'var(--danger)' }, { label: 'Revenue', value: totalRevenue, color: 'var(--accent)' }];

    if (loading) return <div className="b-view" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>;

    return (
        <div className="b-view theme-business-sapphire">
            {/* GLOBAL CONTEXT SWITCHER */}
            {!isCashierMode && (
                <div style={{ background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.2)' }}>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🌐 Global Context Filter
                    </div>
                    <select value={globalBranch} onChange={(e) => setGlobalBranch(e.target.value)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '5px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                        <option value="all" style={{color: 'var(--text-main)'}}>All Branches (Consolidated)</option>
                        <option value="store_a" style={{color: 'var(--text-main)'}}>Store A (HQ)</option>
                        <option value="ecommerce" style={{color: 'var(--text-main)'}}>E-Commerce Channel</option>
                    </select>
                </div>
            )}

            {/* HEADER AREA */}
            <div className="b-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                    <div style={{background:'var(--accent-blue)', color:'#fff', width:'50px', height:'50px', borderRadius:'15px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', textTransform:'uppercase', fontWeight: 'bold'}}>{companyName.charAt(0)}</div>
                    <div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            {isEditingName && !isCashierMode ? (
                                <input autoFocus className="b-title" style={{background:'transparent', border:'none', borderBottom:'2px solid var(--accent-blue)', outline:'none', color:'var(--text-main)', width:'250px'}} value={companyName} onChange={(e) => setCompanyName(e.target.value)} onBlur={handleNameChange} onKeyDown={(e) => e.key === 'Enter' && handleNameChange()} />
                            ) : (
                                <h1 className="b-title" onClick={() => !isCashierMode && setIsEditingName(true)} style={{cursor: isCashierMode ? 'default' : 'pointer', borderBottom:'1px dashed transparent', wordBreak: 'break-word'}}>{companyName} {!isCashierMode && <span style={{fontSize:'0.8rem', color:'var(--text-muted)', verticalAlign:'middle'}}>✎</span>}</h1>
                            )}
                            {!isCashierMode && <button onClick={() => setIsSettingsOpen(true)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.2rem', padding:'5px'}}>⚙️</button>}
                        </div>
                        <div className="b-subtitle" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <span>{isCashierMode ? "Cashier Shift" : `${UI.role.toUpperCase()} • ${currentRank.toUpperCase()}`}</span>
                            {!isCashierMode && <div className="xp-container"><div className="xp-bar" style={{width: `${progressPercent}%`}}></div></div>}
                        </div>
                    </div>
                </div>
                <div className="b-header-actions" style={{display:'flex', gap:'10px', alignItems: 'center'}}>
                    {businessType === 'shop' && <button onClick={() => setShowInventoryModal(true)} className="b-btn" style={{background:'var(--card-bg)', color:'var(--text-main)', border:'1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '10px 20px', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'}}>📦 Inventory</button>}
                    {businessType === 'shop' && <button onClick={() => setShowBilling(true)} aria-label="Open POS" className="b-btn" style={{background:'var(--accent-blue)', color:'#fff', border:'none', borderRadius: '12px', padding: '10px 24px', fontWeight: '700', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'}}>🧾 New Bill</button>}
                    
                    {!isCashierMode ? (
                        <>
                            <div style={{width: '1px', height: '30px', background: 'rgba(0,0,0,0.1)', margin: '0 5px'}}></div>
                            <button onClick={() => setShowFinancials(true)} className="b-btn" style={{background:'var(--primary)', color:'#fff', border:'none', borderRadius: '12px', padding: '10px 20px', fontWeight: '700'}}>VIEW REPORT</button>
                            <button onClick={onLogout} className="b-btn" style={{background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', borderRadius:'12px', padding: '10px 20px', fontWeight: '700'}}>LOGOUT</button>
                        </>
                    ) : (
                        <button onClick={() => {
                            setPinPrompt(true);
                        }} className="b-btn" style={{background:'var(--danger)', color:'#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'}}>🔒 EXIT CASHIER MODE</button>
                    )}
                </div>
            </div>

            {/* 🔒 CASHIER MODE CONTENT (HIDES FINANCIALS) */}
            {isCashierMode ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏪</div>
                    <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '10px' }}>Register is Open</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Cashier Mode active. Financial data and reports are hidden.</p>
                    <button onClick={() => setShowBilling(true)} className="b-btn b-btn-primary" style={{ padding: '20px 40px', fontSize: '1.2rem', borderRadius: '15px' }}>🧾 START NEW BILL</button>
                </div>
            ) : (
                <>

                    {/* PREMIUM TAB MENU */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                        <div role="tablist" style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '20px', gap: '4px' }}>
                            <button role="tab" aria-selected={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} style={{ background: activeTab === 'dashboard' ? '#fff' : 'transparent', color: activeTab === 'dashboard' ? 'var(--text-main)' : 'var(--text-muted)', border: 'none', borderRadius: '14px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: activeTab === 'dashboard' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>Dashboard</button>
                            <button role="tab" aria-selected={activeTab === 'ops'} onClick={() => setActiveTab('ops')} style={{ background: activeTab === 'ops' ? '#fff' : 'transparent', color: activeTab === 'ops' ? 'var(--text-main)' : 'var(--text-muted)', border: 'none', borderRadius: '14px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: activeTab === 'ops' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>Operations</button>
                            <button role="tab" aria-selected={activeTab === 'crm'} onClick={() => setActiveTab('crm')} style={{ background: activeTab === 'crm' ? '#fff' : 'transparent', color: activeTab === 'crm' ? 'var(--text-main)' : 'var(--text-muted)', border: 'none', borderRadius: '14px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: activeTab === 'crm' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>Customers (CRM)</button>
                        </div>
                    </div>

                    <div key={globalBranch + activeTab} className="anim-context-shift">
                    {activeTab === 'dashboard' && (<>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        
                        {/* TOP ROW: Quick Stats */}
                        <div className="b-grid-3">
                            <div className="b-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px -10px rgba(59,130,246,0.15)', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span className="b-label" style={{ color: 'var(--accent-blue)', margin: 0, letterSpacing: '1px' }}>{UI.metricRev}</span>
                                    <span style={{ padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', color: 'var(--accent-blue)' }}>📈</span>
                                </div>
                                <div style={{ fontSize: '2.8rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1.5px' }}>{formatCurrency(totalRevenue)}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                                    <div><div style={{fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'700', marginBottom:'4px'}}>{UI.rev1}</div><div style={{fontWeight:'700', color:'var(--text-main)'}}>{formatCurrency(revenue.direct)}</div></div>
                                    <div><div style={{fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'700', marginBottom:'4px'}}>{UI.rev2}</div><div style={{fontWeight:'700', color:'var(--text-main)'}}>{formatCurrency(revenue.services)}</div></div>
                                    <div><div style={{fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', fontWeight:'700', marginBottom:'4px'}}>{UI.rev3}</div><div style={{fontWeight:'700', color:'var(--text-main)'}}>{formatCurrency(revenue.investments)}</div></div>
                                </div>
                            </div>
                            <div className="b-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span className="b-label" style={{ color: 'var(--text-muted)', margin: 0, letterSpacing: '1px' }}>Opening Balance</span>
                                    <span style={{ padding: '8px', background: 'rgba(0,0,0,0.04)', borderRadius: '12px', color: 'var(--text-muted)' }}>🏦</span>
                                </div>
                                <div style={{ fontSize: '2.8rem', fontWeight: '800', color: 'var(--text-main)', opacity: 0.9, letterSpacing: '-1.5px' }}>{formatCurrency(openingBalance)}</div>
                                <div style={{marginTop: '20px'}}>
                                    <AIInsightBox balance={takeHome} transactions={ledger.map(l => ({...l, type: l.type === 'Debit' ? 'expense' : 'income'}))} />
                                </div>
                            </div>
                            <div className="b-card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e293b 100%)', border: 'none', boxShadow: '0 15px 35px -10px rgba(15,23,42,0.4)', position: 'relative', overflow: 'hidden', borderRadius: '24px' }}>
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', position: 'relative' }}>
                                    <span className="b-label" style={{ color: 'rgba(255,255,255,0.7)', margin: 0, letterSpacing: '1px' }}>{UI.metricNet}</span>
                                    <span style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}>✨</span>
                                </div>
                                <div style={{ fontSize: '3rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-1.5px', position: 'relative' }}>{formatCurrency(takeHome)}</div>
                                <div style={{ position: 'relative', marginTop: '20px' }}>
                                    <h4 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Money Flow</h4>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>Revenue</span>
                                            <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{formatCurrency(totalRevenue)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: '0.9rem' }}>Expenses</span>
                                            <span style={{ color: 'var(--danger)', fontWeight: '700' }}>{formatCurrency(totalExpenses)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* MIDDLE ROW: Charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div className="b-card" style={{ padding: '25px', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ padding: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '8px' }}>📊</span> 7-Day Income Trend</h4>
                                </div>
                                <div style={{ height: '300px' }}>
                                    <SimpleBarChart ledger={ledger} />
                                </div>
                            </div>
                            <div className="b-card" style={{ padding: '25px', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>🔮</span> AI Cash Flow Forecast</h4>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>PREDICTIVE</span>
                                </div>
                                <div style={{ height: '300px' }}>
                                    <AICashFlowForecastingChart ledger={ledger} />
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM ROW: Ledger & Insights */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                            <div className="b-card" style={{ borderRadius: '24px', padding: '25px' }}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ padding: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '8px' }}>📖</span> Daily Ledger</h3>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input type="date" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '10px', padding: '8px 12px', color: 'var(--text-main)', fontWeight: '600', outline: 'none' }} value={ledgerDate} onChange={(e) => setLedgerDate(e.target.value)} />
                                        {ledgerDate && <button onClick={() => setLedgerDate('')} style={{ padding: '8px 12px', background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-muted)', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Clear</button>}
                                        <span style={{fontSize:'0.75rem', fontWeight: '700', background:'rgba(59, 130, 246, 0.1)', padding:'6px 12px', borderRadius:'10px', color:'var(--accent-blue)'}}>{filteredLedger.length} entries</span>
                                    </div>
                                </div>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                                    {filteredLedger.length === 0 && <div style={{padding:'40px', textAlign:'center', color:'var(--text-muted)', background: '#f8fafc', borderRadius: '16px', fontWeight: '600'}}>No transactions for this date.</div>}
                                    {filteredLedger.map((entry, i) => (
                                        <div key={i} style={{ padding:'16px', background: '#f8fafc', borderRadius: '16px', marginBottom: '10px', border: '1px solid rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: entry.type === 'Credit' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: entry.type === 'Credit' ? 'var(--accent)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                    {entry.type === 'Credit' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <div style={{fontWeight:'700', fontSize:'1rem', color: 'var(--text-main)', marginBottom: '4px'}}>{entry.desc}</div>
                                                    <div style={{fontSize:'0.75rem', color:'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase'}}>{entry.date} • {entry.source ? entry.source : entry.category}</div>
                                                </div>
                                            </div>
                                            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                                                <span style={{fontWeight:'800', fontSize: '1.1rem', color: entry.type === 'Credit' ? 'var(--text-main)' : 'var(--text-main)'}}>{entry.type === 'Credit' ? '+' : '-'}{formatCurrency(entry.amount)}</span>
                                                <button onClick={() => setDeleteId(entry.id)} style={{background:'rgba(239, 68, 68, 0.1)', border:'none', color:'var(--danger)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor:'pointer', fontWeight: 'bold'}}>×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                <div className="b-card" style={{ borderRadius: '24px', padding: '25px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a' }}>
                                    <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: '700', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>💡</span> {UI.role} Analysis</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {smartInsights.map((alert, i) => <div key={i} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#92400e', fontWeight: '600', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.05)' }}>{alert.text}</div>)}
                                    </div>
                                </div>
                                
                                <div className="b-card" style={{ borderRadius: '24px', padding: '25px' }}>
                                    <BusinessPredictionCard ledger={ledger} />
                                </div>
                            </div>
                        </div>
                    </div>
                    </>)}

                    {activeTab === 'ops' && (<>
                    <div className="b-main-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                        <div>
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
                                        <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '12px', background:'var(--card-bg)', borderRadius:'12px', marginBottom:'8px' }}>
                                            <div style={{display:'flex', gap:'10px', alignItems:'center'}}><div style={{width:'30px', height:'30px', background:'var(--accent-blue-light)', borderRadius:'50%', color:'var(--accent-blue)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>{emp.name.charAt(0)}</div><div><div style={{fontSize:'0.9rem', fontWeight:'700'}}>{emp.name}</div><div style={{fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase'}}>{emp.designation}</div></div></div>
                                            <div style={{display:'flex', gap:'15px', alignItems:'center'}}><span style={{fontSize:'0.9rem', fontWeight:'600'}}>{formatCurrency(emp.salary)}</span><button onClick={() => handleFire(emp.id)} style={{background:'transparent', border:'none', color:'var(--danger)', fontWeight:'bold', cursor:'pointer'}}>Remove</button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="b-card">
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                                    <h3 className="b-title" style={{ fontSize: '1.2rem' }}>🚀 {UI.assetTitle}</h3>
                                    <span style={{fontSize:'0.7rem', background:'rgba(245, 158, 11, 0.1)', color:'#f59e0b', padding:'4px 8px', borderRadius:'6px', fontWeight:'bold'}}>TOTAL VALUE: {formatCurrency(totalAssetValue)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
                                    <div style={{flex: 2}}><label className="b-label">{UI.assetLabel}</label><input className="b-input" placeholder="Item Name" value={investInput.name} onChange={(e) => setInvestInput({...investInput, name: e.target.value})}/></div>
                                    <div style={{flex: 1}}><label className="b-label">Cost</label><input className="b-input" placeholder="₹0" value={investInput.cost} onChange={(e) => setInvestInput({...investInput, cost: e.target.value})}/></div>
                                    <button onClick={handleCustomInvest} className="b-btn b-btn-primary" style={{height: '42px', padding: '0 20px'}}>+</button>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {assets.map(a => (
                                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '12px', background:'var(--card-bg)', borderRadius:'12px', marginBottom:'8px' }}>
                                            <span style={{fontWeight:'600', fontSize:'0.9rem'}}>{a.name}</span>
                                            <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                                <span style={{color:'var(--text-muted)'}}>{formatCurrency(a.cost)}</span>
                                                <button onClick={() => handleRemoveAsset(a.id)} style={{color:'var(--danger)', background:'none', border:'none', cursor:'pointer', fontSize: '0.8rem', fontWeight: 'bold'}}>Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            {businessType === 'shop' && topSellers.length > 0 && (
                                <div className="b-card">
                                    <h3 className="b-title" style={{ fontSize: '1rem', marginBottom: '15px' }}>🏆 Top Selling Items</h3>
                                    {topSellers.map((item, i) => (
                                        <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px', background: i === 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--card-bg)', borderRadius:'8px', marginBottom:'6px'}}>
                                            <span style={{fontWeight:'bold', color: i===0 ? '#f59e0b' : 'rgba(0, 0, 0, 0.08)'}}>#{i+1} {item[0]}</span>
                                            <span style={{color:'var(--text-muted)', fontWeight:'600'}}>{item[1]} sold</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    </>)}

                    {activeTab === 'crm' && (<>
                    <div className="b-main-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div className="b-card">
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                                <h3 className="b-title" style={{ fontSize: '1.2rem' }}>👑 Lifetime Value (LTV) Leaderboard</h3>
                                <span style={{fontSize:'0.7rem', background:'var(--accent-blue-light)', padding:'3px 6px', borderRadius:'4px', color:'var(--primary)'}}>Top Customers</span>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                {customerLTV.length === 0 ? <p style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>No tracked customers yet. Add names during billing.</p> : customerLTV.map((c, i) => (
                                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'15px', background: i === 0 ? 'linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent)' : 'var(--card-bg)', borderRadius:'12px', marginBottom:'10px', border: i === 0 ? '1px solid rgba(59, 130, 246, 0.1)' : '1px solid transparent'}}>
                                        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                                            <div style={{width:'35px', height:'35px', background: i === 0 ? 'var(--primary)' : 'rgba(0, 0, 0, 0.08)', color: i === 0 ? '#fff' : 'var(--text-main)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
                                                {i === 0 ? '🏆' : i + 1}
                                            </div>
                                            <div>
                                                <div style={{fontWeight:'700', fontSize:'1rem', color:'var(--text-main)'}}>{c.name}</div>
                                                {c.totalDebt > 0 && <div style={{fontSize:'0.75rem', color:'#f59e0b'}}>Owes {formatCurrency(c.totalDebt)}</div>}
                                            </div>
                                        </div>
                                        <div style={{textAlign:'right'}}>
                                            <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>Lifetime Paid</div>
                                            <div style={{color:'var(--accent-blue)', fontWeight:'bold', fontSize:'1.1rem'}}>{formatCurrency(c.totalPaid)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {businessType === 'shop' && (
                            <div className="b-card">
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                                    <h3 className="b-title" style={{ fontSize: '1.2rem' }}>📒 Pending Udhaar (Khata)</h3>
                                    <span style={{fontSize:'0.7rem', background:'rgba(245, 158, 11, 0.1)', color:'#f59e0b', padding:'4px 8px', borderRadius:'6px', fontWeight:'bold'}}>{khata.length} Unpaid</span>
                                </div>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                    {khata.length === 0 ? <p style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>No pending payments.</p> : khata.map(k => (
                                        <div key={k.id} style={{display:'flex', justifyContent:'space-between', padding:'15px', background:'var(--card-bg)', borderRadius:'12px', marginBottom:'10px', borderLeft:'4px solid #f59e0b'}}>
                                            <div>
                                                <strong style={{color:'var(--text-main)', fontSize:'1rem'}}>{k.name}</strong><br/>
                                                <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{k.date} • {k.phone || 'No phone'}</span>
                                            </div>
                                            <div style={{textAlign:'right'}}>
                                                <span style={{color:'var(--danger)', fontWeight:'bold', fontSize:'1.1rem', display:'block', marginBottom:'8px'}}>{formatCurrency(k.amount)}</span>
                                                <button onClick={() => handleSettleKhata(k)} style={{background:'#f59e0b', color:'var(--text-main)', border:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'0.8rem', cursor:'pointer', fontWeight:'bold', boxShadow:'0 2px 4px rgba(245,158,11,0.2)'}}>SETTLE</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    </>)}

                    {/* Placeholder marker: */}
                    {activeTab === 'ops' && (<>
                    {/* =======================================================
                        🛠️ DISCRETE BUSINESS DEV TOOLS (HIDDEN AT BOTTOM)
                        ======================================================= */}
                    <div 
                        style={{ 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap',
                        marginTop: '50px', marginBottom: '20px', 
                        opacity: 0.15, transition: 'opacity 0.3s', cursor: 'default'
                        }} 
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.15}
                    >
                        <input 
                        type="month" 
                        value={seedMonth} 
                        onChange={(e) => setSeedMonth(e.target.value)} 
                        style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0, 0, 0, 0.08)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}
                        />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Qty:</span>
                        <input 
                            type="number" 
                            value={seedCount} 
                            onChange={(e) => setSeedCount(e.target.value)} 
                            style={{ width: '50px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0, 0, 0, 0.08)', color: 'var(--text-muted)', padding: '4px', borderRadius: '4px', fontSize: '0.75rem' }}
                            min="1" max="100"
                        />
                        </div>

                        <button 
                        onClick={handleSeedBusinessDatabase}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                        + Inject Ledger Data
                        </button>
                        
                        <button 
                        onClick={handleClearBusinessMonth}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                        - Clear Month
                        </button>

                        <button 
                        onClick={handleNukeBusinessDatabase}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', marginLeft: '10px' }}
                        >
                        ☢️ Nuke Ledger
                        </button>
                    </div>
                </>)}
                </div>
                </>
            )}

            {/* 📦 INVENTORY MODAL (WITH DUAL-API FETCH) */}
            {showInventoryModal && (
                <div className="report-overlay">
                    <div className="report-card" style={{maxWidth:'700px', width: '90%', maxHeight:'90vh', overflowY:'auto'}}>
                        <div className="report-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--text-main)', zIndex:10}}>
                            <h2 className="b-title">📦 Manage Inventory</h2>
                            <button onClick={() => setShowInventoryModal(false)} style={{background:'none', border:'none', fontSize:'2rem', cursor:'pointer', color: 'var(--danger)', fontWeight: 'bold'}}>×</button>
                        </div>
                        
                        <div className="report-body">
                            <div style={{display:'flex', gap:'8px', alignItems:'flex-end', marginBottom:'20px', borderBottom:'1px solid rgba(0, 0, 0, 0.08)', paddingBottom:'20px'}}>
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
                                        style={{background:'var(--accent-blue-light)', borderColor:'var(--accent-blue)'}}
                                    />
                                </div>

                                <div style={{flex:2}}><label className="b-label">Item Name</label><input className="b-input" placeholder="e.g. Lay's" value={invForm.name} onChange={e => setInvForm({...invForm, name: e.target.value})} /></div>
                                <div style={{flex:1}}><label className="b-label">Variant</label><input className="b-input" placeholder="Opt" value={invForm.variant} onChange={e => setInvForm({...invForm, variant: e.target.value})} /></div>
                                <div style={{flex:1.2}}><label className="b-label">Price</label><input className="b-input" type="number" placeholder="₹0" value={invForm.price} onChange={e => setInvForm({...invForm, price: e.target.value})} /></div>
                                <div style={{flex:1.2}}><label className="b-label">Stock</label><input className="b-input" type="number" placeholder="Qty" value={invForm.stockQty} onChange={e => setInvForm({...invForm, stockQty: e.target.value})} /></div>
                                <button onClick={handleAddInventory} className="b-btn b-btn-primary" style={{height:'46px'}}>ADD</button>
                            </div>
                            <div style={{marginBottom:'10px'}}>
                                {inventory.length === 0 && <div style={{textAlign:'center', color:'var(--text-muted)', padding:'20px'}}>No items added. Add your first item above!</div>}
                                {inventory.map(item => (
                                    <div key={item.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #f3f4f6'}}>
                                        <div>
                                            <span style={{fontWeight:'bold'}}>{item.name}</span>
                                            <span style={{marginLeft:'10px', fontSize:'0.75rem', background: item.stockQty !== '' && item.stockQty < 5 ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-blue-light)', color: item.stockQty !== '' && item.stockQty < 5 ? 'var(--danger)' : 'var(--accent-blue)', padding:'2px 6px', borderRadius:'10px'}}>Stock: {item.stockQty !== '' ? item.stockQty : '∞'}</span>
                                            {item.barcode && <span style={{display:'block', fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'2px'}}>📟 {item.barcode}</span>}
                                        </div>
                                        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                            <span style={{fontWeight:'bold'}}>{formatCurrency(item.price)}</span>
                                            <button onClick={() => handleDeleteInventory(item.id)} style={{color:'var(--danger)', background:'none', border:'none', cursor:'pointer'}}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{marginTop:'20px', borderTop:'1px solid #eee', paddingTop:'20px'}}>
                             <button onClick={() => setShowInventoryModal(false)} className="b-btn" style={{width:'100%', background:'rgba(0, 0, 0, 0.08)', color:'rgba(0, 0, 0, 0.08)', padding:'12px'}}>← GO BACK</button>
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
                            <button onClick={() => setShowBilling(false)} style={{background:'none', border:'none', fontSize:'2rem', cursor:'pointer', color: 'var(--danger)', fontWeight: 'bold'}}>×</button>
                        </div>
                        <div className="report-body">
                            
                            <div style={{marginBottom:'15px', display:'flex', alignItems:'center', gap:'15px', background:'var(--card-bg)', padding:'10px', borderRadius:'8px', border:'1px solid rgba(0, 0, 0, 0.08)', overflowX: 'auto'}}>
                                <span className="b-label" style={{margin:0, whiteSpace:'nowrap'}}>Bill Theme:</span>
                                <div style={{display:'flex', gap:'10px'}}>
                                    {Object.entries(INVOICE_THEMES).map(([key, themeData]) => (
                                        <div key={key} onClick={() => setInvoiceTheme(key)} title={themeData.name} style={{ width: '24px', height: '24px', borderRadius: '50%', background: `rgb(${themeData.primary.join(',')})`, cursor: 'pointer', border: invoiceTheme === key ? '3px solid #111827' : '2px solid transparent', outline: invoiceTheme === key ? '2px solid white' : 'none', outlineOffset: '-2px', flexShrink: 0 }} />
                                    ))}
                                </div>
                            </div>

                            <div style={{marginBottom:'15px', background:'rgba(245, 158, 11, 0.05)', padding:'10px', borderRadius:'8px', border:'2px dashed #f59e0b'}}>
                                <label className="b-label" style={{color:'#f59e0b'}}>📷 Fast Barcode Scan (Click here and scan item)</label>
                                <input 
                                    className="b-input" autoFocus placeholder="Listening for scanner beep..." value={scannedCode}
                                    onChange={(e) => setScannedCode(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{background:'var(--text-main)', borderColor:'rgba(245, 158, 11, 0.2)'}}
                                />
                            </div>

                            <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                                <div style={{flex:2}}><label className="b-label">Customer Name</label><input className="b-input" placeholder="Name" value={billCustomer.name} onChange={e => setBillCustomer({...billCustomer, name: e.target.value})} /></div>
                                <div style={{flex:2}}><label className="b-label">Phone</label><input className="b-input" placeholder="Optional" value={billCustomer.phone} onChange={e => setBillCustomer({...billCustomer, phone: e.target.value})} /></div>
                            </div>

                            <div style={{display:'flex', gap:'10px', marginBottom:'20px', background:'var(--accent-blue-light)', padding:'10px', borderRadius:'8px', border:'1px solid var(--accent-blue)'}}>
                                <div style={{flex:1}}>
                                    <label className="b-label" style={{color:'var(--accent-blue)'}}>Payment Status</label>
                                    <select className="b-input" style={{borderColor:'var(--accent-blue)'}} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                                        <option value="Paid">✅ Paid Instantly</option>
                                        <option value="Udhaar">📒 Udhaar (Unpaid Khata)</option>
                                    </select>
                                </div>
                                <div style={{flex:1}}>
                                    <label className="b-label" style={{color:'var(--accent-blue)'}}>Tax Options</label>
                                    <label style={{display:'flex', alignItems:'center', gap:'8px', height:'42px', background:'var(--text-main)', padding:'0 10px', borderRadius:'8px', border:'1px solid var(--accent-blue)', cursor:'pointer'}}>
                                        <input type="checkbox" checked={applyGST} onChange={(e) => setApplyGST(e.target.checked)} style={{width:'18px', height:'18px'}} />
                                        <span style={{fontWeight:'bold', fontSize:'0.9rem', color:'var(--accent-blue)'}}>Apply 18% GST</span>
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
                                            <div style={{position:'absolute', top:'100%', left:0, width:'70%', background:'var(--text-main)', border:'1px solid rgba(0, 0, 0, 0.08)', borderRadius:'8px', zIndex:10, boxShadow:'0 10px 15px -3px rgba(0, 0, 0, 0.08)', maxHeight:'150px', overflowY:'auto'}}>
                                                {suggestions.items.map(s => (
                                                    <div 
                                                        key={s.id} onClick={() => selectSuggestion(s, row.id)}
                                                        style={{padding:'10px 12px', borderBottom:'1px solid #f3f4f6', cursor:'pointer', fontSize:'0.9rem', display:'flex', justifyContent:'space-between'}}
                                                        onMouseOver={e => e.target.style.background = 'rgba(0, 0, 0, 0.08)'} onMouseOut={e => e.target.style.background = 'var(--text-main)'}
                                                    >
                                                        <span><strong>{s.name}</strong> <span style={{fontSize:'0.75rem', color: s.stockQty !== '' && s.stockQty < 5 ? 'var(--danger)' : 'var(--text-muted)'}}>(Stock: {s.stockQty !== '' ? s.stockQty : '∞'})</span></span>
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
                                        <button onClick={() => removeBillItem(row.id)} style={{background:'transparent', border:'none', color:'var(--danger)', fontSize:'1.2rem'}}>×</button>
                                    </div>
                                ))}
                                <button onClick={addBillItem} style={{fontSize:'0.8rem', color:'var(--accent-blue)', background:'transparent', border:'none', cursor:'pointer', fontWeight:'bold'}}>+ Add Another Item</button>
                            </div>
                            
                            <div style={{borderTop:'1px solid rgba(0, 0, 0, 0.08)', paddingTop:'15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                    <div style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>Subtotal: {formatCurrency(getBillTotal())}</div>
                                    <div style={{fontSize:'1.3rem', fontWeight:'800', color:'var(--text-main)'}}>Total: {formatCurrency(applyGST ? getBillTotal() * 1.18 : getBillTotal())}</div>
                                </div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button onClick={() => handleGenerateBill(false)} className="b-btn b-btn-primary" style={{padding:'10px 15px', background:'rgba(0, 0, 0, 0.08)'}}>
                                        🖨️ SAVE PDF
                                    </button>
                                    <button onClick={() => handleGenerateBill(true)} className="b-btn b-btn-primary" style={{padding:'10px 15px', background:'var(--primary)', color:'var(--text-main)', boxShadow:'0 4px 6px -1px rgba(34, 197, 94, 0.1)'}}>
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
                            
                            <div style={{marginBottom:'20px', background:'rgba(245, 158, 11, 0.05)', padding:'10px', borderRadius:'8px', border:'1px solid #f59e0b'}}>
                                <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
                                    <input type="checkbox" checked={isCashierMode} onChange={(e) => {
                                        if(e.target.checked) setIsCashierMode(true);
                                    }} style={{width:'18px', height:'18px'}} />
                                    <span style={{fontWeight:'bold', color:'#f59e0b'}}>Lock in Cashier Mode</span>
                                </label>
                                <p style={{fontSize:'0.75rem', color:'#f59e0b', marginTop:'5px'}}>Hides financial data. Pin `1234` required to exit.</p>
                            </div>

                            <div style={{marginBottom:'25px'}}><label className="b-label">Identity</label><div style={{display:'flex', gap:'10px'}}><button onClick={() => setBusinessType('shop')} className="b-btn" style={{flex:1, background: businessType === 'shop' ? 'var(--text-main)' : 'rgba(0, 0, 0, 0.08)', color: businessType === 'shop' ? 'var(--text-main)' : 'var(--text-muted)'}}>🏪 Shop</button><button onClick={() => setBusinessType('startup')} className="b-btn" style={{flex:1, background: businessType === 'startup' ? 'var(--text-main)' : 'rgba(0, 0, 0, 0.08)', color: businessType === 'startup' ? 'var(--text-main)' : 'var(--text-muted)'}}>🚀 Startup</button></div></div>
                            <button onClick={handleSaveSettings} className="b-btn b-btn-primary" style={{width:'100%'}}>SAVE CHANGES</button>
                        </div>
                    </div>
                </div>
            )}

            {showTransModal && (
                <div className="trans-modal">
                    <h3 className="b-title" style={{fontSize:'1.2rem', marginBottom:'20px', color: 'var(--text-main)'}}>New Entry</h3>
                    <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'5px'}}>{UI.quickTags[transForm.type === 'Credit' ? 'income' : 'expense'].map((tag, i) => (<button key={i} onClick={() => handleQuickTag(tag)} style={{background: 'rgba(0, 0, 0, 0.08)', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius:'20px', padding:'6px 12px', fontSize:'0.75rem', cursor:'pointer', color:'#4b5563', transition: 'all 0.2s ease'}} onMouseOver={(e) => {e.target.style.background = 'rgba(0, 0, 0, 0.08)'; e.target.style.color = 'var(--text-main)'}} onMouseOut={(e) => {e.target.style.background = 'rgba(0, 0, 0, 0.08)'; e.target.style.color = '#4b5563'}}>+ {tag}</button>))}</div>
                        
                        <AIReceiptScanner 
                            onScanSuccess={(aiData) => {
                                setTransForm(prev => ({
                                    ...prev,
                                    desc: aiData.merchant || "Scanned Bill",
                                    amount: aiData.total || "",
                                    type: 'Debit'
                                }));
                                toastMessage("Receipt scanned successfully!", "error");
                            }} 
                        />

                        <div><label className="b-label">Description</label><input className="b-input" placeholder="e.g. Sale #101" value={transForm.desc} onChange={e => setTransForm({...transForm, desc: e.target.value})} /></div>
                        <div><label className="b-label">Amount</label><input className="b-input" type="number" placeholder="₹0" value={transForm.amount} onChange={e => setTransForm({...transForm, amount: e.target.value})} /></div>
                        <div>
                            <label className="b-label">Transaction Type</label>
                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}><button onClick={() => setTransForm({...transForm, type: 'Credit'})} className="b-btn" style={{flex:1, background: transForm.type === 'Credit' ? 'var(--accent)' : 'rgba(0, 0, 0, 0.08)', color: transForm.type === 'Credit' ? 'var(--text-main)' : 'var(--app-bg)'}}>INCOME (+)</button><button onClick={() => setTransForm({...transForm, type: 'Debit'})} className="b-btn" style={{flex:1, background: transForm.type === 'Debit' ? 'var(--danger)' : 'rgba(0, 0, 0, 0.08)', color: transForm.type === 'Debit' ? 'var(--text-main)' : 'var(--app-bg)'}}>EXPENSE (-)</button></div>
                            {transForm.type === 'Credit' && (<div><label className="b-label">Select Source</label><select className="b-input" value={transForm.source} onChange={(e) => setTransForm({...transForm, source: e.target.value})}><option value="direct">{UI.rev1}</option><option value="services">{UI.rev2}</option><option value="investments">{UI.rev3}</option></select></div>)}
                        </div>
                        <button onClick={handleManualTransaction} className="b-btn b-btn-primary" style={{marginTop:'10px'}}>SAVE</button>
                    </div>
                </div>
            )}

            {deleteId && <div className="report-overlay" onClick={() => setDeleteId(null)}><div className="report-card" style={{maxWidth:'400px'}} onClick={e => e.stopPropagation()}><div className="report-header"><h3 className="b-title">Confirm Delete</h3></div><div style={{padding:'20px'}}><p style={{marginBottom:'20px', color:'var(--text-muted)'}}>Delete this entry?</p><div style={{display:'flex', gap:'10px'}}><button onClick={() => setDeleteId(null)} className="b-btn">CANCEL</button><button onClick={confirmDeleteTransaction} className="b-btn b-btn-danger">DELETE</button></div></div></div></div>}
            
            <FinancialModal showFinancials={showFinancials} setShowFinancials={setShowFinancials} openingBalance={openingBalance} totalRevenue={totalRevenue} totalExpenses={totalExpenses} takeHome={takeHome} handleExportCSV={handleExportCSV} />


            {/* 🔒 CUSTOM PIN PROMPT MODAL */}
            {pinPrompt && (
                <div className="b-overlay" onClick={() => setPinPrompt(false)}>
                    <div className="b-modal" onClick={e => e.stopPropagation()} style={{textAlign: 'center'}}>
                        <h3 className="b-title" style={{marginBottom: '10px'}}>Exit Cashier Mode</h3>
                        <p style={{color: 'var(--text-muted)', marginBottom: '20px'}}>Enter the owner PIN to unlock financial data.</p>
                        <input 
                            type="password" 
                            autoFocus
                            className="b-input" 
                            style={{textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em', marginBottom: '20px'}}
                            value={pinInput} 
                            onChange={(e) => setPinInput(e.target.value)} 
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    if(pinInput === "1234") { setIsCashierMode(false); setPinPrompt(false); setPinInput(''); }
                                    else { toastMessage("Incorrect PIN!", "error"); setPinInput(''); }
                                }
                            }}
                        />
                        <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                            <button onClick={() => setPinPrompt(false)} className="b-btn">CANCEL</button>
                            <button onClick={() => {
                                if(pinInput === "1234") { setIsCashierMode(false); setPinPrompt(false); setPinInput(''); }
                                else { toastMessage("Incorrect PIN!", "error"); setPinInput(''); }
                            }} className="b-btn b-btn-primary">UNLOCK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🗑️ CUSTOM CONFIRMATION MODAL */}
            {confirmDelete && (
                <div className="b-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="b-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="b-title" style={{marginBottom: '10px', color: 'var(--danger)'}}>Confirm Deletion</h3>
                        <p style={{color: 'var(--text-muted)', marginBottom: '25px'}}>Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.</p>
                        <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                            <button onClick={() => setConfirmDelete(null)} className="b-btn">CANCEL</button>
                            <button onClick={() => {
                                if(confirmDelete.type === 'employee') {
                                    const updated = employees.filter(e => e.id !== confirmDelete.id);
                                    setEmployees(updated);
                                    saveData({employees: updated});
                                } else if(confirmDelete.type === 'inventory') {
                                    const updated = inventory.filter(i => i.id !== confirmDelete.id);
                                    setInventory(updated);
                                    saveData({inventory: updated});
                                }
                                setConfirmDelete(null);
                            }} className="b-btn b-btn-danger">DELETE</button>
                        </div>
                    </div>
                </div>
            )}

        
{toast && (
    <div style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        background: toast.type === 'error' ? 'var(--danger)' : 'var(--primary)',
        color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px'
    }}>
        {toast.msg}
    </div>
)}

{confirmAction && (
    <div className="modal-overlay">
        <div className="modal-content" style={{textAlign:'center'}}>
            <h3 style={{color:'var(--text-main)', marginBottom:'15px'}}>Confirm Action</h3>
            <p style={{color:'var(--text-muted)', marginBottom:'25px'}}>{confirmAction.message}</p>
            <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                <button className="b-btn" onClick={() => setConfirmAction(null)} style={{background:'rgba(0, 0, 0, 0.08)', color:'var(--text-main)'}}>Cancel</button>
                <button className="b-btn b-btn-danger" onClick={confirmAction.onConfirm}>Confirm</button>
            </div>
        </div>
    </div>
)}

</div>
    );
}

export default BusinessView;