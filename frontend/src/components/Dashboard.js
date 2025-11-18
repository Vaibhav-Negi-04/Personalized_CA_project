import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// Import Sub-dashboards
import StudentView from './dashboards/StudentView';
import IndividualView from './dashboards/IndividualView';
import BusinessView from './dashboards/BusinessView';
// Import the new Modal
import AddTransactionModal from './AddTransactionModal'; 

import './Dashboard.css';

function Dashboard() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for Modal
  const navigate = useNavigate();

  // Wrapped fetch in a function so we can call it again after adding data
  const fetchUserData = async () => {
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
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="dashboard-container">
      
      <header className="dash-header">
        <div>
          <h1>Hello, {userData?.name || 'User'} 👋</h1>
          <p style={{color: '#94a3b8'}}>{userData?.userType} Dashboard</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      {/* Dynamic Content */}
      {userData?.userType === 'Student' && <StudentView userData={userData} />}
      {userData?.userType === 'Individual' && <IndividualView userData={userData} />}
      {userData?.userType === 'Business' && <BusinessView userData={userData} />}

      {/* Floating Action Button (FAB) to Add Data */}
      <button 
        className="fab-btn"
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          backgroundColor: '#3b82f6', color: 'white',
          border: 'none', borderRadius: '50%', width: '60px', height: '60px',
          fontSize: '30px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(59,130,246,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        +
      </button>

      {/* The Modal */}
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        userType={userData?.userType}
        refreshData={fetchUserData} // Pass the refresh function
      />

    </div>
  );
}

export default Dashboard;