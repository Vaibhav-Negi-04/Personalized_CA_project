import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './dashboards/Dashboard2.css';

// Custom formatter for INR
const formatINR = (num) => {
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + 'Cr';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + 'L';
  return '₹' + Number(num).toLocaleString('en-IN');
};

function FIREChart({ currentWealth, monthlyBurn }) {
  // FIRE Target Calculation: 25x Annual Expenses (4% Rule)
  const annualExpenses = monthlyBurn * 12;
  const fireTarget = annualExpenses > 0 ? annualExpenses * 25 : 50000000; // Default 5Cr if no expenses logged

  const chartData = useMemo(() => {
    const data = [];
    const currentYear = new Date().getFullYear();
    let projectedWealth = currentWealth || 0;
    const assumedCAGR = 0.12; // 12% Annual Growth
    const annualContribution = 500000; // Assuming 5L annual savings/investment

    for (let i = 0; i <= 20; i++) {
      data.push({
        year: currentYear + i,
        wealth: projectedWealth
      });
      projectedWealth = (projectedWealth * (1 + assumedCAGR)) + annualContribution;
    }
    return data;
  }, [currentWealth]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 16px',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Year {label}
          </p>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-main)', fontSize: '18px', fontWeight: '500', fontFamily: "'JetBrains Mono', monospace" }}>
            {formatINR(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pro-panel gsap-stagger" style={{ marginTop: '30px', padding: '0', overflow: 'hidden' }}>
      <div className="pro-panel-header" style={{ padding: '20px 25px 0' }}>
        FIRE Horizon
        <div className="metric-subtitle" style={{marginTop:'5px'}}>Projected trajectory to Financial Independence (Target: {formatINR(fireTarget)})</div>
      </div>
      <div style={{ width: '100%', height: '350px', marginTop: '10px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748B', fontSize: 12}} 
              tickFormatter={(val) => formatINR(val)}
              dx={-10}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={fireTarget} label={{ position: 'insideTopLeft', value: 'FIRE Target', fill: '#34D399', fontSize: 12, fontFamily: 'Outfit' }} stroke="#34D399" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="wealth" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorWealth)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default FIREChart;
