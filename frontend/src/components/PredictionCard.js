import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import './Dashboard.css'; 

function PredictionCard({ transactions }) {
  // 🌟 NEW: State to track exact month and year (defaults to Current Month)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return { data: [], totalSpentThisMonth: 0, projectedTotal: 0, isCurrentMonth: true };

    const today = new Date();
    
    // 1. Parse the selected year and month
    const [yearStr, monthStr] = selectedMonth.split('-');
    const targetYear = parseInt(yearStr);
    const targetMonth = parseInt(monthStr) - 1; // JS Months are 0-indexed
    
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const isCurrentMonth = today.getFullYear() === targetYear && today.getMonth() === targetMonth;
    
    // Determine the "active day" based on time travel
    let activeDay;
    if (isCurrentMonth) {
        activeDay = today.getDate(); // Up to today
    } else if (new Date(targetYear, targetMonth, 1) < today) {
        activeDay = daysInMonth; // Past month: all days are actual
    } else {
        activeDay = 0; // Future month: no actual data yet
    }

    // 2. Group expenses by day for the TARGET month
    const dailyExpenses = {};
    let totalSpentInTargetMonth = 0;

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (
        t.type === 'expense' &&
        d.getMonth() === targetMonth &&
        d.getFullYear() === targetYear
      ) {
        const day = d.getDate();
        dailyExpenses[day] = (dailyExpenses[day] || 0) + Number(t.amount);
        totalSpentInTargetMonth += Number(t.amount);
      }
    });

    // 3. Calculate average daily burn rate (Only projects forward if it's the current month)
    const avgDailySpend = activeDay > 0 ? totalSpentInTargetMonth / activeDay : 0;

    // 4. Generate data points for the graph
    const data = [];
    let cumulativeActual = 0;
    let cumulativePredicted = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      if (i <= activeDay) {
        cumulativeActual += (dailyExpenses[i] || 0);
        cumulativePredicted = cumulativeActual; 
        
        data.push({
          day: `Day ${i}`,
          actual: cumulativeActual,
          predicted: cumulativeActual,
        });
      } else {
        // Projecting the future (Only draws out if looking at current month)
        cumulativePredicted += avgDailySpend;
        data.push({
          day: `Day ${i}`,
          actual: null, 
          predicted: Math.round(cumulativePredicted),
        });
      }
    }

    const dateObj = new Date(targetYear, targetMonth);

    return { 
      data, 
      totalSpentThisMonth: totalSpentInTargetMonth, 
      projectedTotal: Math.round(cumulativePredicted),
      monthLabel: dateObj.toLocaleString('default', { month: 'long', year: 'numeric' }),
      isCurrentMonth
    };
  }, [transactions, selectedMonth]);

  if (!chartData.data || chartData.data.length === 0) {
    return (
      <div className="squad-glass-card" style={{ textAlign: 'center', color: 'var(--border-strong)' }}>
        <h3>🔮 Spending Forecast</h3>
        <p>Not enough transaction data to generate a forecast yet.</p>
      </div>
    );
  }

  return (
    <div className="squad-glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {chartData.isCurrentMonth ? '🔮 End-of-Month Forecast' : '📊 Monthly Spend Analysis'}
          </h3>
          <p style={{ margin: '5px 0 0 0', color: 'var(--border-strong)', fontSize: '0.85rem' }}>
            {chartData.monthLabel}
          </p>
          
          {/* 🌟 NEW: Universal Month/Year Picker */}
          <div style={{ marginTop: '12px' }}>
             <input 
               type="month" 
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
               style={{
                 background: 'rgba(255,255,255,0.05)',
                 border: '1px solid #475569',
                 color: 'var(--text-main)',
                 padding: '6px 12px',
                 borderRadius: '8px',
                 fontSize: '0.85rem',
                 cursor: 'pointer',
                 outline: 'none',
                 fontFamily: 'inherit'
               }}
             />
          </div>

        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--border-strong)' }}>
            {chartData.isCurrentMonth ? 'Projected Total' : 'Final Total'}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: chartData.isCurrentMonth ? '#f43f5e' : 'var(--accent)' }}>
            <span className="privacy-blur">₹{chartData.projectedTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '250px' }}>
        <ResponsiveContainer>
          <AreaChart data={chartData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
            
            <Tooltip 
              contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: 'var(--text-main)' }}
              formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name === 'actual' ? 'Actual Spend' : 'Predicted Spend']}
            />
            
            {/* Only show the "Today" marker if we are looking at the current month */}
            {chartData.isCurrentMonth && (
               <ReferenceLine x={`Day ${new Date().getDate()}`} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#f59e0b', fontSize: 12 }} />
            )}

            <Area type="monotone" dataKey="predicted" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" />
            <Area type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" connectNulls={false} />
            
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '0.8rem', color: 'var(--border-strong)', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '50%'}}></div> Actual Spend</span>
        {chartData.isCurrentMonth && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{width: '10px', height: '10px', background: '#f43f5e', borderRadius: '50%'}}></div> Forecast</span>
        )}
      </div>
    </div>
  );
}

export default PredictionCard;