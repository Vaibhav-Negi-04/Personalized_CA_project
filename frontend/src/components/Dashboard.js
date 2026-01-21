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

import './Dashboard.css';

function Dashboard() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Note: StudentView now handles its own Logout via the HUD.
  // This function is kept for the Modal or other views if needed.
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="dashboard-container">
      
      {/* -------------------------------------------------------
         HEADER REMOVED:
         The <header> block was deleted here to prevent the 
         "Double Header" issue. StudentView now has its own
         Status Bar / HUD at the top.
         -------------------------------------------------------
      */}

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
          zIndex: 999 /* Ensure it floats above everything */
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