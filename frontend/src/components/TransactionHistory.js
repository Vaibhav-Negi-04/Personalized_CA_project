import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTransactions } from '../hooks/useTransactions'; 
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './History.css'; 
import useSoundFX from '../hooks/useSoundFX'; 

// --- CSV EXPORT FUNCTION ---
const downloadCSV = (data) => {
  if (!data || data.length === 0) {
    alert("No transactions to export!");
    return;
  }
  const headers = ["Date", "Category", "Description", "Type", "Amount"];
  const rows = data.map(t => {
    const dateStr = t.date?.toDate ? t.date.toDate().toLocaleDateString() : new Date(t.date).toLocaleDateString();
    const cleanDesc = (t.text || t.description || "").replace(/,/g, " "); 
    return [dateStr, t.category || "General", cleanDesc, t.type, t.amount].join(",");
  });
  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `finance_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#6366f1'];

function TransactionHistory({ compactMode = false, theme = 'student' }) {
  const { transactions, loading } = useTransactions();
  const playSound = useSoundFX();
  
  // Refs
  const prevCountRef = useRef(0);
  const isFirstLoad = useRef(true);

  // --- SOUND LISTENER ---
  useEffect(() => {
    if (loading) return;
    if (isFirstLoad.current) {
      prevCountRef.current = transactions.length;
      isFirstLoad.current = false;
      return;
    }
    if (transactions.length > prevCountRef.current) {
      const sorted = [...transactions].sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA; 
      });
      const latest = sorted[0];
      if (latest) {
        if (latest.type === 'income') playSound('coins');
        else playSound('expense');
      }
    }
    prevCountRef.current = transactions.length;
  }, [transactions, loading, playSound]);

  // --- STATE ---
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); 
  const [selectedDay, setSelectedDay] = useState('all'); 

  // --- HELPERS ---
  const yearsRange = Array.from({ length: 5 }, (_, i) => 2024 + i);
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1);

  // --- FILTER LOGIC ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const matchYear = t.date.getFullYear() === selectedYear;
      const matchMonth = t.date.getMonth() === selectedMonth;
      const matchDay = selectedDay === 'all' || t.date.getDate() === parseInt(selectedDay);
      return matchYear && matchMonth && matchDay;
    });
  }, [transactions, selectedYear, selectedMonth, selectedDay]);

  // --- TOTALS ---
  const periodTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      else expense += Number(t.amount); 
    });
    return { income, expense: Math.abs(expense) };
  }, [filteredTransactions]);

  // --- CHART DATA ---
  const chartData = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      const found = acc.find(item => item.name === curr.category);
      if (found) found.value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
      return acc;
    }, []);

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
    setSelectedDay('all');
  };

  if (loading) return <p style={{color: '#94a3b8'}}>Loading history...</p>;

  // 🆕 DYNAMIC CLASS ASSIGNMENT based on theme prop
  const containerClass = compactMode ? "history-compact-container" : "history-grid-container";
  const themeClass = theme === 'executive' ? 'theme-executive-override' : '';

  return (
    <div className={`${containerClass} ${themeClass}`}>
      
      {/* --- LEFT SIDE: ACTIVITY LOG --- */}
      <div className="glass-panel main-ledger-panel"> 
        
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title" style={{ color: theme === 'executive' ? '#fff' : '' }}>
            Activity Log
            <button className="download-btn-glass" onClick={() => downloadCSV(filteredTransactions)} title="Download CSV">
              📥
            </button>
          </div>

          <div className="filter-row">
            <select className="modern-select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {yearsRange.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select className="modern-select" value={selectedMonth} onChange={handleMonthChange}>
              <option value={0}>Jan</option><option value={1}>Feb</option><option value={2}>Mar</option>
              <option value={3}>Apr</option><option value={4}>May</option><option value={5}>Jun</option>
              <option value={6}>Jul</option><option value={7}>Aug</option><option value={8}>Sep</option>
              <option value={9}>Oct</option><option value={10}>Nov</option><option value={11}>Dec</option>
            </select>
            <select className="modern-select" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              <option value="all">All</option>
              {daysArray.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>
        </div>

        {/* List Content */}
        <div className="history-list-scroll">
          {filteredTransactions.length === 0 ? (
            <div className="empty-glass">
              <p>No activity yet.</p>
            </div>
          ) : (
            filteredTransactions.map((t) => (
              <div key={t.id} className="glass-item">
                <div className="item-left">
                  <h4>{t.category}</h4>
                  <p>{t.description || t.text || 'No description'} • {t.date?.toLocaleDateString()}</p>
                </div>
                <div className={`item-amount ${t.type === 'income' ? 'inc' : 'exp'}`}>
                  {t.type === 'income' ? '+' : '-'} ₹{t.amount}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="panel-footer">
          <div className="total-block">
            <span className="total-label">INCOME</span>
            <span className="total-val inc">+₹{periodTotals.income}</span>
          </div>
          <div className="total-block">
            <span className="total-label">EXPENSE</span>
            <span className="total-val exp">-₹{periodTotals.expense}</span>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: PIE CHART (HIDDEN IN COMPACT MODE) --- */}
      {!compactMode && (
        <div className="glass-panel breakdown-panel">
          <div className="panel-header">
             <span className="panel-title">Breakdown ({selectedYear})</span>
          </div>
          
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none"
                  >
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} 
                    itemStyle={{color: 'white'}} 
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-glass">
                 <p>No expense data.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;