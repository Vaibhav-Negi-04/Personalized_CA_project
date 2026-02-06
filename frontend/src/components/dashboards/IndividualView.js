import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import for redirection
import { signOut } from 'firebase/auth';        // 2. Import signOut
import { auth } from '../../firebaseConfig';      // 3. Import auth instance
import TransactionHistory from '../TransactionHistory';

function IndividualView({ userData }) {
  const navigate = useNavigate();

  // Financial Calculations
  const income = userData?.totalIncome || 0;
  const expenses = userData?.totalExpenses || 0;
  const balance = income - expenses; 

  // 4. Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redirect to login page after sign out
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div>
      {/* 🟢 5. HEADER SECTION (Title Left, Logout Right) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#a7f3d0' }}>Wealth Dashboard</h2>
          <p style={{ margin: 0, color: '#6ee7b7', opacity: 0.7, fontSize: '0.9rem' }}>
            Welcome back, {userData?.name || 'Investor'}
          </p>
        </div>

        <button 
          onClick={handleLogout}
          style={{
            background: 'rgba(6, 78, 59, 0.4)', // Dark Green transparent
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#a7f3d0',
            padding: '10px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          // Optional: Add hover effect to turn red
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#f87171';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            e.currentTarget.style.color = '#a7f3d0';
          }}
        >
          Logout ↪
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Current Balance</h3>
          <div className="value green">₹{balance}</div>
        </div>
        <div className="stat-card">
          <h3>Total Income</h3>
          <div className="value blue">₹{income}</div>
        </div>
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <div className="value red">₹{expenses}</div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="recent-activity">
        <h3>💼 Financial Insights</h3>
        <p style={{color: '#94a3b8', marginTop: '10px'}}>
          Track your expenses to generate AI insights here.
        </p>
      </div>

      {/* HISTORY TABLE */}
      <TransactionHistory />
    </div>
  );
}

export default IndividualView;