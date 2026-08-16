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
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
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
    setStatus('loading');
    setMessage('Logging in...');
    setFieldErrors({});

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setStatus('success');
      setMessage('Login successful! Redirecting...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      setStatus('error');
      setMessage(''); // Clear global message in favor of inline validation if possible
      
      let newErrors = {};
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        newErrors.email = 'Invalid email or password.';
        newErrors.password = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        setMessage('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/invalid-email') {
        newErrors.email = 'Please enter a valid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        setMessage('Network error. Please check your connection.');
      } else {
        setMessage('An error occurred during login. Please try again.');
      }
      setFieldErrors(newErrors);
    }
  };

  return (
    <div className="login-page">
      
      {/* 1. Add Galaxy Background with Interaction */}
      <GalaxyBackground activeField={activeField} />

      <Link to="/" className="back-home-link">← Back to Home</Link>
      
      <div className="login-card">
        
        <h2>Initiate Session</h2>
        <p className="subtitle">Access your intelligence hub.</p>

        <form onSubmit={handleSubmit}>
          
          {/* Email Field with Icon */}
          <div className="form-group icon-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </span>
              <input 
                type="email" name="email" className={`form-input with-icon ${fieldErrors.email ? 'error' : ''}`}
                placeholder="name@example.com"
                value={formData.email} onChange={handleChange} required 
                onFocus={() => setActiveField('email')} // Camera moves to Side
                onBlur={() => setActiveField('default')}
              />
            </div>
            {fieldErrors.email && <div className="inline-error">{fieldErrors.email}</div>}
          </div>

          {/* Password Field with Icon */}
          <div className="form-group icon-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input 
                type={showPassword ? "text" : "password"} name="password" className={`form-input with-icon ${fieldErrors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={formData.password} onChange={handleChange} required 
                onFocus={() => setActiveField('password')} // Camera moves to "Dark Side"
                onBlur={() => setActiveField('default')}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {fieldErrors.password && <div className="inline-error">{fieldErrors.password}</div>}
            {/* Forgot Password Link */}
            <div className="forgot-password">
               <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Logging in...' : 'Sign In'}
          </button>
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