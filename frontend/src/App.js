// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage'; // <--- Import Here
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* The Home Route is now the Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Routes */}
          <Route 
            path="/register" 
            element={currentUser ? <Navigate to="/dashboard" /> : <Register />} 
          />
          <Route 
            path="/login" 
            element={currentUser ? <Navigate to="/dashboard" /> : <Login />} 
          />

          {/* Protected Route */}
          <Route 
            path="/dashboard" 
            element={currentUser ? <Dashboard /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;