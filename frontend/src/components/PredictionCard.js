import React, { useMemo } from 'react';
import regression from 'regression';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './Dashboard.css'; 

// --- 🧠 AI ADVICE DATABASE ---
const ADVICE_DATABASE = {
  Food: [
    "🍔 You're eating out a lot! Try the '5-Day Cook Challenge' next week.",
    "💡 Meal prepping on Sundays could save you ~₹2000 this month.",
    "⚠️ Food delivery apps are draining your wallet. Try deleting them for 3 days."
  ],
  Shopping: [
    "🛍️ The '24-Hour Rule': Wait 24 hours before buying anything over ₹500.",
    "📉 Heavy shopping detected! Ask yourself: 'Do I need this, or do I just want it?'",
    "💡 Unsubscribe from brand emails to stop impulse buying."
  ],
  Travel: [
    "🚕 Cab costs are piling up. Can you take the metro/bus for one trip tomorrow?",
    "💡 Carpooling with a friend could cut your travel bill in half.",
    "🚶 If it's less than 2km, try walking. It's free and healthy!"
  ],
  Entertainment: [
    "🍿 Subscriptions add up! Check if you are paying for apps you don't use.",
    "💡 Look for free events in your city instead of paid movies/clubs this weekend.",
    "🎮 Limit in-game purchases to weekends only."
  ],
  Education: [
    "📚 Books are great, but have you checked the library or free PDFs first?",
    "💡 Split the cost of online courses with a friend."
  ],
  Other: [
    "⚠️ You have a lot of 'Other' expenses. Try categorizing them to see where the leak is.",
    "💡 Tracking every rupee is the first step to wealth.",
    "🔍 Review your last 5 transactions. Were they all necessary?"
  ]
};

function PredictionCard({ transactions }) {
  
  // --- 1. EXISTING: LINEAR REGRESSION LOGIC ---
  const predictionData = useMemo(() => {
    if (!transactions || transactions.length < 2) return null;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter for current month expenses
    const monthlyExpenses = transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    if (monthlyExpenses.length < 2) return null;

    // Group by Day
    const dailyTotals = {};
    monthlyExpenses.forEach(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      const day = d.getDate();
      dailyTotals[day] = (dailyTotals[day] || 0) + Number(t.amount);
    });

    const dataPoints = [];
    let runningTotal = 0;
    const sortedDays = Object.keys(dailyTotals).sort((a,b) => a - b);
    
    sortedDays.forEach(day => {
      const dayNum = parseInt(day);
      runningTotal += dailyTotals[day];
      dataPoints.push([dayNum, runningTotal]);
    });

    // Regression: y = mx + c
    const result = regression.linear(dataPoints);
    const gradient = result.equation[0]; 
    const yIntercept = result.equation[1];

    // Build Chart Data
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const finalChartData = [];
    const today = new Date().getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      let predictedVal = (gradient * i) + yIntercept;
      predictedVal = Math.max(0, predictedVal);

      const actualPoint = dataPoints.find(p => p[0] === i);
      
      finalChartData.push({
        day: i,
        Actual: actualPoint ? actualPoint[1] : (i <= today ? null : null),
        Forecast: Math.round(predictedVal)
      });
    }

    return { 
      chartData: finalChartData, 
      projectedTotal: Math.round((gradient * daysInMonth) + yIntercept),
      spendingSpeed: Math.round(gradient) 
    };

  }, [transactions]);


  // --- 2. EXISTING: AI ANALYST LOGIC ---
  const aiInsight = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    const currentMonth = new Date().getMonth();

    const categoryTotals = {};
    transactions.forEach(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      if (t.type === 'expense' && d.getMonth() === currentMonth) {
        const cat = t.category || 'Other'; 
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
      }
    });

    let highestCategory = null;
    let maxAmount = 0;

    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        highestCategory = cat;
      }
    });

    if (!highestCategory) return null;

    const tipsList = ADVICE_DATABASE[highestCategory] || ADVICE_DATABASE['Other'];
    const randomTip = tipsList[Math.floor(Math.random() * tipsList.length)];

    return {
      category: highestCategory,
      amount: maxAmount,
      tip: randomTip
    };
  }, [transactions]);


  if (!predictionData) return null;

  return (
    <div className="ai-glass-card">
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🔮</span>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>AI Forecast</h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Spending Speed: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>₹{predictionData.spendingSpeed}/day</span>
          </p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
           <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
             Month End Projection
           </span>
           <div className="neon-text-gold" style={{ fontSize: '1.8rem', fontWeight: '700', lineHeight: '1.2' }}>
             ₹{predictionData.projectedTotal}
           </div>
        </div>
      </div>

      {/* GRAPH SECTION */}
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={predictionData.chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            {/* Minimal Grid: Horizontal lines only */}
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            
            <XAxis 
              dataKey="day" 
              stroke="#64748b" 
              tick={{fontSize: 10, fill: '#64748b'}} 
              tickLine={false}
              axisLine={false}
              interval={4} 
            />
            <YAxis 
              stroke="#64748b" 
              tick={{fontSize: 10, fill: '#64748b'}} 
              tickLine={false}
              axisLine={false}
              width={40} 
            />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                borderColor: 'rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.4)'
              }}
              itemStyle={{ fontSize: '0.85rem' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '5px' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
            />
            
            {/* The Prediction (Dashed Gold) */}
            <Line 
              type="monotone" 
              dataKey="Forecast" 
              stroke="#fbbf24" 
              strokeWidth={2} 
              dot={false} 
              strokeDasharray="5 5" 
              animationDuration={1500}
            />
            
            {/* The Actual (Neon Red) */}
            <Line 
              type="stepAfter" 
              dataKey="Actual" 
              stroke="#f43f5e" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} 
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              connectNulls={true} 
              animationDuration={1500}
            />
            
            {/* Reference Line for Today */}
            <ReferenceLine x={new Date().getDate()} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* --- AI INSIGHT (Holographic Box) --- */}
      {aiInsight && (
        <div className="insight-glass-box">
          <div className="insight-accent"></div> {/* Vertical Orange Bar */}
          
          <div className="insight-header">
            <span className="insight-badge">INSIGHT</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Biggest Drain Detected</span>
          </div>

          <p className="insight-text">
            You've spent <strong style={{ color: '#f43f5e', fontWeight: 600 }}>₹{aiInsight.amount}</strong> on <span style={{ color: '#fff' }}>{aiInsight.category}</span>.
          </p>

          <div className="insight-tip">
            "{aiInsight.tip}"
          </div>
        </div>
      )}

    </div>
  );
}

export default PredictionCard;