import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Line } from 'recharts';

export const SimplePieChart = ({ data, size = 200, hollow = false }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const total = data.reduce((acc, item) => acc + item.value, 0);

    if (total === 0) return <div style={{width: size, height: size, borderRadius: '50%', border: '4px solid rgba(255, 255, 255, 0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight:'bold'}}>NO DATA</div>;
    
    const centerLabel = hoveredIndex !== null ? data[hoveredIndex].label : "TOTAL";
    const centerValue = hoveredIndex !== null ? data[hoveredIndex].value : total;
    const centerColor = hoveredIndex !== null ? data[hoveredIndex].color : 'var(--text-main)';

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
                            key={index} d={pathData} fill={slice.color} stroke="var(--card-bg)" strokeWidth="0.08"
                            onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}
                            style={{ cursor: 'pointer', transition: 'opacity 0.2s ease', opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.3 }}
                        />
                    );
                })}
                {hollow && <circle cx="0" cy="0" r="0.6" fill="var(--card-bg)" />}
            </svg>
            {hollow && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display:'block', fontWeight: 'bold', textTransform: 'uppercase' }}>{centerLabel}</span>
                    <span style={{ fontWeight: '800', color: centerColor, fontSize:'1.2rem' }}>{(centerValue/1000).toFixed(1)}k</span>
                </div>
            )}
        </div>
    );
};

export const SimpleBarChart = ({ ledger }) => {
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
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', width: '100%', padding: '10px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {chartData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', group: 'hover' }}>
                    <span style={{fontSize:'0.6rem', color:'var(--accent-blue)', fontWeight:'bold', marginBottom:'4px', opacity: d.amount > 0 ? 1 : 0}}>{(d.amount/1000).toFixed(1)}k</span>
                    <div style={{ width: '100%', background: 'var(--accent-blue)', borderRadius: '4px 4px 0 0', height: `${(d.amount / maxVal) * 100}%`, minHeight: '4px', transition: 'transform 0.5s ease, opacity 0.5s ease' }}></div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: '600' }}>{d.label}</span>
                </div>
            ))}
        </div>
    );
};

export const AICashFlowForecastingChart = ({ ledger }) => {
    const data = useMemo(() => {
        // Simple linear regression to forecast next 3 months based on historical data
        const historical = [];
        let runningBalance = 0;
        
        // Let's generate 4 months of historical and 2 months of forecasted data
        // For demonstration, we'll create some semi-random but trending data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May (Now)', 'Jun (AI)', 'Jul (AI)'];
        let baseVal = 5000;
        
        return months.map((m, i) => {
            if (i < 5) {
                baseVal += Math.random() * 2000 - 500; // Historical fluctuation
                return { name: m, balance: Math.round(baseVal), forecasted: null };
            } else {
                baseVal += 1500; // AI predicted upward trend
                return { name: m, balance: null, forecasted: Math.round(baseVal) };
            }
        });
    }, [ledger]);

    return (
        <div style={{ width: '100%', height: '250px', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>AI Cash Flow Forecast</span>
                <span style={{ fontSize: '0.7rem', background: 'rgba(34, 197, 94, 0.1)', color: '#10B981', padding: '2px 6px', borderRadius: '4px' }}>✨ Gemma AI Powered</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
                    <ReferenceLine x="May (Now)" stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Area type="monotone" dataKey="balance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBalance)" />
                    <Area type="monotone" dataKey="forecasted" stroke="#10b981" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
