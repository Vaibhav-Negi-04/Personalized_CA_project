import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom'; 
import GoogleSignIn from './GoogleSignIn';
import GalaxyBackground from './GalaxyBackground'; // Re-use the galaxy!
import './Login.css'; 

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // --- Camera Control State ---
  const [activeField, setActiveField] = useState('default');

  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(''); 
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');
    setStatus('');

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setStatus('success');
      setMessage('Login successful! Redirecting...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      setStatus('error');
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setMessage('Invalid email or password.');
      } else {
        setMessage(error.message);
      }
    }
  };

  return (
    <div className="login-page">
      
      {/* 1. Add Galaxy Background with Interaction */}
      <GalaxyBackground activeField={activeField} />

      <Link to="/" className="back-home-link">← Back to Home</Link>
      
      <div className="login-card">
        
        <h2>Welcome Back</h2>
        <p className="subtitle">Access your Personalized CA Dashboard</p>

        <form onSubmit={handleSubmit}>
          
          {/* Email Field with Icon */}
          <div className="form-group icon-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span> {/* Or use SVG */}
              <input 
                type="email" name="email" className="form-input with-icon"
                placeholder="name@example.com"
                value={formData.email} onChange={handleChange} required 
                onFocus={() => setActiveField('email')} // Camera moves to Side
                onBlur={() => setActiveField('default')}
              />
            </div>
          </div>

          {/* Password Field with Icon */}
          <div className="form-group icon-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input 
                type="password" name="password" className="form-input with-icon"
                placeholder="••••••••"
                value={formData.password} onChange={handleChange} required 
                onFocus={() => setActiveField('password')} // Camera moves to "Dark Side"
                onBlur={() => setActiveField('default')}
              />
            </div>
            {/* Forgot Password Link */}
            <div className="forgot-password">
               <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          </div>

          <button type="submit" className="btn-primary">Sign In</button>
        </form>

        {message && (
          <div className={status === 'error' ? 'error-msg' : 'success-msg'}>
            {message}
          </div>
        )}

        <div className="google-btn-wrapper">
          <GoogleSignIn />
        </div>

        <div className="auth-link">
          <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
        </div>

      </div>
    </div>
  );
}

export default Login;