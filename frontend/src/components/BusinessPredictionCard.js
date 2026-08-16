import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function BusinessPredictionCard({ ledger }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const chartData = useMemo(() => {
    if (!ledger) return { data: [], total: 0, projected: 0, isCurrentMonth: true };

    const [yearStr, monthStr] = selectedMonth.split('-');
    const targetYear = parseInt(yearStr);
    const targetMonth = parseInt(monthStr) - 1;

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === targetYear && today.getMonth() === targetMonth;
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    let activeDay;
    if (isCurrentMonth) {
        activeDay = today.getDate();
    } else if (new Date(targetYear, targetMonth, 1) < today) {
        activeDay = daysInMonth; 
    } else {
        activeDay = 0; 
    }

    const validDateStrings = {};
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = new Date(targetYear, targetMonth, i).toLocaleDateString();
        validDateStrings[dateStr] = i; 
    }

    const dailyRevenue = {};

    ledger.forEach(entry => {
      if (entry.type === 'Credit') {
        const day = validDateStrings[entry.date];
        if (day !== undefined) {
          dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(entry.amount);
        }
      }
    });

    // 🌟 THE FIX 1: Only sum the revenue for days that have ACTUALLY happened
    // This stops future dummy data from corrupting the daily average!
    let totalRevenueUpToActiveDay = 0;
    for (let i = 1; i <= activeDay; i++) {
        totalRevenueUpToActiveDay += (dailyRevenue[i] || 0);
    }

    // Calculate realistic average
    const avgDailyRev = activeDay > 0 ? totalRevenueUpToActiveDay / activeDay : 0;

    const data = [];
    let cumulativeActual = 0;
    let cumulativePredicted = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      if (i <= activeDay) {
        cumulativeActual += (dailyRevenue[i] || 0);
        cumulativePredicted = cumulativeActual;
        data.push({ day: `Day ${i}`, actual: cumulativeActual, predicted: cumulativeActual });
      } else {
        cumulativePredicted += avgDailyRev;
        data.push({ day: `Day ${i}`, actual: null, predicted: Math.round(cumulativePredicted) });
      }
    }

    const dateObj = new Date(targetYear, targetMonth);
    return { 
      data, 
      total: totalRevenueUpToActiveDay, 
      projected: Math.round(cumulativePredicted),
      monthLabel: dateObj.toLocaleString('default', { month: 'long', year: 'numeric' }),
      isCurrentMonth
    };
  }, [ledger, selectedMonth]);

  if (!chartData.data || chartData.data.length === 0) {
    return (
      <div className="b-card" style={{ textAlign: 'center', color: '#6b7280' }}>
        <h3 className="b-title" style={{ fontSize: '1.2rem', marginBottom: '10px' }}>📈 Revenue Forecast</h3>
        <p>Not enough data to generate a forecast.</p>
      </div>
    );
  }

  // 🌟 THE FIX 2: A formatter function to make large numbers look clean on the Y-Axis (e.g., ₹20k)
  const formatYAxis = (value) => {
      if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`; // Lakhs
      if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`; // Thousands
      return `₹${value}`;
  };

  return (
    <div className="b-card" style={{ paddingBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 className="b-title" style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {chartData.isCurrentMonth ? '📈 Revenue Forecast' : '📊 Final Monthly Revenue'}
          </h3>
          <p style={{ margin: '5px 0 10px 0', color: '#6b7280', fontSize: '0.85rem' }}>
            {chartData.monthLabel}
          </p>
          
          <input 
             type="month" 
             value={selectedMonth} 
             onChange={(e) => setSelectedMonth(e.target.value)} 
             style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
          />
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>
            {chartData.isCurrentMonth ? 'Projected Revenue' : 'Total Revenue'}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent)' }}>
            ₹{chartData.projected.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '260px', marginTop: '20px' }}>
        <ResponsiveContainer>
          {/* 🌟 THE FIX 3: Changed left margin from -20 to 15 so text doesn't cut off */}
          <AreaChart data={chartData.data} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRevPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            
            {/* 🌟 APPLIED THE Y-AXIS FORMATTER HERE */}
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
            
            <Tooltip 
              contentStyle={{ background: '#111827', border: 'none', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
              formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name === 'actual' ? 'Actual Revenue' : 'Projected Revenue']}
            />
            
            {chartData.isCurrentMonth && (
               <ReferenceLine x={`Day ${new Date().getDate()}`} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#f59e0b', fontSize: 12, fontWeight: 'bold' }} />
            )}

            <Area type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorRevPredicted)" />
            <Area type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevActual)" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#6b7280', display: 'flex', gap: '20px', justifyContent: 'center', fontWeight: '600' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '3px'}}></div> Actual Revenue</span>
        {chartData.isCurrentMonth && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width: '12px', height: '12px', background: '#3b82f6', borderRadius: '3px'}}></div> Forecasted</span>
        )}
      </div>
    </div>
  );
}

export default BusinessPredictionCard;