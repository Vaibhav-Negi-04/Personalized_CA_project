// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage'; // <--- Import Here
import NotFound from './components/NotFound';
import TOS from './components/TOS';
import Privacy from './components/Privacy';
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <div className="App">
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <Routes>
          {/* The Home Route is now the Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/terms" element={<TOS />} />
          <Route path="/privacy" element={<Privacy />} />

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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;