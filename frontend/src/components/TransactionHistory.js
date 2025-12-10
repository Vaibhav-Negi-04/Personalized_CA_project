import React, { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions'; 
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './History.css';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#6366f1'];

function TransactionHistory() {
  const { transactions, loading } = useTransactions();
  
  // State for filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); 
  const [selectedDay, setSelectedDay] = useState('all'); // New: 'all' or specific day number

  // --- HELPER: Get days in selected month ---
  const getDaysInMonth = (month) => {
    const year = new Date().getFullYear();
    // Day 0 of the next month gives us the last day of the current month
    return new Date(year, month + 1, 0).getDate();
  };

  // Generate array of days [1, 2, ..., 30, 31]
  const daysArray = Array.from({ length: getDaysInMonth(selectedMonth) }, (_, i) => i + 1);

  // --- 1. FILTER LOGIC ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      
      const matchMonth = t.date.getMonth() === selectedMonth;
      
      // If 'all' is selected, show everything for that month.
      // Otherwise, check if the date matches the selected day.
      const matchDay = selectedDay === 'all' || t.date.getDate() === parseInt(selectedDay);

      return matchMonth && matchDay;
    });
  }, [transactions, selectedMonth, selectedDay]);

  // --- 2. CHART DATA LOGIC ---
  const chartData = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      const found = acc.find(item => item.name === curr.category);
      if (found) found.value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
      return acc;
    }, []);

  // Handle month change (Reset day to 'all' when month changes)
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
    setSelectedDay('all');
  };

  if (loading) return <p style={{color: '#94a3b8'}}>Loading history...</p>;

  return (
    <div className="dashboard-content">
      
      {/* --- Left Side: Transaction List --- */}
      <div className="section-card">
        <div style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '15px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          paddingBottom: '10px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h3 style={{margin:0, color: '#94a3b8', fontSize: '1.1rem'}}>Activity Log</h3>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* DAY SELECTOR */}
            <select 
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              style={{
                background: '#0f172a', 
                border: '1px solid #334155', 
                color: 'white', 
                padding: '5px 10px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Days</option>
              {daysArray.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>

            {/* MONTH SELECTOR */}
            <select 
              value={selectedMonth}
              onChange={handleMonthChange}
              style={{
                background: '#0f172a', 
                border: '1px solid #334155', 
                color: 'white', 
                padding: '5px 10px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={0}>January</option>
              <option value={1}>February</option>
              <option value={2}>March</option>
              <option value={3}>April</option>
              <option value={4}>May</option>
              <option value={5}>June</option>
              <option value={6}>July</option>
              <option value={7}>August</option>
              <option value={8}>September</option>
              <option value={9}>October</option>
              <option value={10}>November</option>
              <option value={11}>December</option>
            </select>
          </div>
        </div>

        <div className="history-list">
          {filteredTransactions.length === 0 ? (
            <p style={{color: '#64748b', textAlign: 'center', marginTop: '20px', fontStyle: 'italic'}}>
              No transactions found for this specific date.
            </p>
          ) : (
            filteredTransactions.map((t) => (
              <div key={t.id} className={`transaction-item ${t.type}`}>
                <div className="t-info">
                  <h4>{t.category}</h4>
                  <p>{t.description || 'No description'} • {t.date?.toLocaleDateString()}</p>
                </div>
                <div className={`t-amount ${t.type === 'income' ? 'inc' : 'exp'}`}>
                  {t.type === 'income' ? '+' : '-'} ₹{t.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- Right Side: Pie Chart --- */}
      <div className="section-card">
        <h3 className="section-title">
          {selectedDay === 'all' ? 'Monthly Breakdown' : 'Daily Breakdown'}
        </h3>
        <div style={{ width: '100%', height: 300 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}}
                  itemStyle={{color: 'white'}}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <p style={{color: '#64748b'}}>No expenses to show.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default TransactionHistory;