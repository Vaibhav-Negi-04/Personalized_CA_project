import React from 'react';
import { useTransactions } from '../hooks/useTransactions'; // Import our hook
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './History.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

function TransactionHistory() {
  const { transactions, loading } = useTransactions();

  if (loading) return <p style={{color: 'white'}}>Loading history...</p>;

  // --- Prepare Data for Chart ---
  // Group expenses by category and sum them up
  const chartData = transactions
    .filter(t => t.type === 'expense') // Only chart expenses
    .reduce((acc, curr) => {
      const found = acc.find(item => item.name === curr.category);
      if (found) found.value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
      return acc;
    }, []);

  return (
    <div className="dashboard-content">
      
      {/* --- Left: Recent Transactions List --- */}
      <div className="section-card">
        <h3 className="section-title">Recent Activity</h3>
        <div className="history-list">
          {transactions.length === 0 ? (
            <p style={{color: '#64748b', textAlign: 'center', marginTop: '20px'}}>No transactions yet.</p>
          ) : (
            transactions.map((t) => (
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

      {/* --- Right: Expense Chart --- */}
      <div className="section-card">
        <h3 className="section-title">Expense Breakdown</h3>
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
            <p style={{color: '#64748b', textAlign: 'center', marginTop: '100px'}}>Add an expense to see the chart.</p>
          )}
        </div>
      </div>

    </div>
  );
}

export default TransactionHistory;