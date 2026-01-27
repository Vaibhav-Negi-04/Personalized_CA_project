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
import OmniCommand from './OmniCommand'; // 1. Import OmniCommand

import './Dashboard.css';

function Dashboard() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- STATES ---
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isOmniOpen, setIsOmniOpen] = useState(false); // 2. Omni State

  const navigate = useNavigate();

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
        e.preventDefault(); // Prevent browser search focus
        setIsOmniOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGhostMode]); // Dependency ensures toggleGhostMode has latest state


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
      
      {/* 3. Render OmniCommand (Always accessible) */}
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
      {userData?.userType === 'Student' && <StudentView userData={userData} />}
      {userData?.userType === 'Individual' && <IndividualView userData={userData} />}
      {userData?.userType === 'Business' && <BusinessView userData={userData} />}

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