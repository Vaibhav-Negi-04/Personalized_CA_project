import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import StudentView from './dashboards/StudentView';
import IndividualView from './dashboards/IndividualView';
import BusinessView from './dashboards/BusinessView';
import AddTransactionModal from './AddTransactionModal'; 
import OmniCommand from './OmniCommand'; 
import AIChatBot from './AIChatBot'; // 👈 1. IMPORT THE BOT

import './Dashboard.css';

function Dashboard() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- STATES ---
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isOmniOpen, setIsOmniOpen] = useState(false); 

  // --- 💰 2. SHARED FINANCIAL STATE (The Bridge) ---
  const [financialStats, setFinancialStats] = useState({
    balance: 0,
    income: 0,
    expense: 0
  });

  const navigate = useNavigate();

  // --- 📡 3. THE LISTENER FUNCTION ---
  // This allows child views (Student/Individual) to send their calculated math up here.
  const updateFinancials = useCallback((newStats) => {
    setFinancialStats(prev => {
      // Only update if numbers actually changed (prevents infinite re-renders)
      if (
        prev.balance !== newStats.balance || 
        prev.income !== newStats.income || 
        prev.expense !== newStats.expense
      ) {
        return newStats;
      }
      return prev;
    });
  }, []);

  const fetchUserData = useCallback(async () => {
    if (currentUser) {
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]); 

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // --- 👻 GHOST PROTOCOL LOGIC ---
  const toggleGhostMode = () => {
    const newMode = !isGhostMode;
    setIsGhostMode(newMode);
    
    if (newMode) {
      document.body.classList.add('ghost-mode');
    } else {
      document.body.classList.remove('ghost-mode');
    }
  };

  // --- 🎹 KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 👻 Shift + P -> Ghost Mode
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        toggleGhostMode();
      }

      // ⚡ Ctrl + K (or Cmd + K) -> Omni Command
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault(); 
        setIsOmniOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGhostMode]); 


  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading System...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* OmniCommand (Always accessible) */}
      <OmniCommand 
        isOpen={isOmniOpen} 
        onClose={() => setIsOmniOpen(false)} 
        onToggleGhost={toggleGhostMode}
      />

      {/* --- 👻 GHOST TOGGLE BUTTON --- */}
      <button 
        className={`ghost-toggle-btn ${isGhostMode ? 'active' : ''}`}
        onClick={toggleGhostMode}
        title="Toggle Ghost Mode (Shift + P)"
      >
        {isGhostMode ? '👻' : '👁️'}
      </button>

      {/* View Switcher based on User Type */}
      {/* 👇 4. PASS THE 'updateFinancials' PROP TO ALL VIEWS */}
      
      {userData?.userType === 'Student' && (
        <StudentView 
          userData={userData} 
          onUpdateFinance={updateFinancials} 
        />
      )}
      
      {userData?.userType === 'Individual' && (
        <IndividualView 
          userData={userData} 
          onUpdateFinance={updateFinancials} 
        />
      )}
      
      {userData?.userType === 'Business' && (
  <BusinessView 
    userData={userData} 
    onUpdateFinance={updateFinancials} 
    onLogout={handleLogout}  /* 👈 THIS MUST BE HERE */
  />
)}

      {/* Floating Action Button (Global) */}
      <button 
        className="fab-btn"
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          backgroundColor: '#3b82f6', color: 'white',
          border: 'none', borderRadius: '50%', width: '60px', height: '60px',
          fontSize: '30px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(59,130,246,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999 
        }}
      >
        +
      </button>

      {/* 🤖 5. THE AI BOT (Connected to the Live Data) */}
      <AIChatBot 
         dashboardBalance={financialStats.balance}
         dashboardIncome={financialStats.income}
         dashboardExpense={financialStats.expense}
      />

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        userType={userData?.userType}
        refreshData={fetchUserData} 
      />

    </div>
  );
}

export default Dashboard;