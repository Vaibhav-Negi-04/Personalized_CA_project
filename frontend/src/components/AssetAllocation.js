import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './dashboards/Dashboard2.css';

// Custom formatter for INR
const formatINR = (num) => {
  if (!num) return '₹0';
  return '₹' + Number(num).toLocaleString('en-IN');
};

const COLORS = ['#F59E0B', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#94A3B8'];

function AssetAllocation({ assets, cashOnHand }) {
  // Aggregate assets by type
  const chartData = useMemo(() => {
    const typeMap = {};
    
    // Add Cash (Liquid)
    if (cashOnHand > 0) {
      typeMap['Cash'] = cashOnHand;
    }

    // Add invested assets
    assets.forEach(asset => {
      const val = parseFloat(asset.value) || 0;
      if (val > 0) {
        const type = asset.type || 'Other';
        if (!typeMap[type]) typeMap[type] = 0;
        typeMap[type] += val;
      }
    });

    // Convert to array
    const dataArray = Object.keys(typeMap).map(type => ({
      name: type,
      value: typeMap[type]
    }));

    // Sort by value descending
    dataArray.sort((a, b) => b.value - a.value);

    return dataArray;
  }, [assets, cashOnHand]);

  if (chartData.length === 0) {
    return (
      <div className="pro-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div className="pro-empty-state">No allocation data available</div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
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
            {payload[0].name}
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
    <div className="pro-panel" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
      <div className="pro-panel-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>Asset Allocation</div>
      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: 'var(--text-secondary)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AssetAllocation;
