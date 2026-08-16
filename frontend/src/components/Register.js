import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import GalaxyBackground from './GalaxyBackground'; // Import component
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'Student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // New State for Camera Interaction
  const [activeField, setActiveField] = useState('default');

  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper to calculate password strength
  const getStrength = (pass) => {
    if (!pass) return { class: '', label: '' };
    if (pass.length < 6) return { class: 'weak', label: 'Weak' };
    if (pass.length < 10) return { class: 'medium', label: 'Medium' };
    return { class: 'strong', label: 'Strong 💪' };
  };
  const strength = getStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('Creating your account...');
    setFieldErrors({});
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      setStatus('success');
      setMessage('Registration successful! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setStatus('error');
      setMessage(''); // Use inline errors instead

      let newErrors = {};
      if (!error.response) {
        setMessage('Network error. Please check your connection.');
      } else if (error.response.status === 409 || (error.response.data && error.response.data.message && error.response.data.message.toLowerCase().includes('exist'))) {
        newErrors.email = 'An account with this email already exists.';
      } else if (error.response.status === 400) {
        setMessage('Please provide valid registration details.');
      } else {
        setMessage('Registration failed. Please try again later.');
      }
      setFieldErrors(newErrors);
    }
  };

  return (
    <div className="register-page">
      {/* Pass the active field to the background to trigger camera moves */}
      <GalaxyBackground activeField={activeField} />

      <div className="register-card">
        <Link to="/" className="back-home-link">← Back</Link>
        
        <h2>Initialize Profile</h2>
        <p className="register-subtitle">Configure your financial intelligence.</p>
        
        <form onSubmit={handleSubmit}>
          
          <div className="form-group icon-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input 
                type="text" name="name" className={`form-input with-icon ${fieldErrors.name ? 'error' : ''}`} 
                placeholder="Alex Rivera" value={formData.name} 
                onChange={handleChange} required 
                onFocus={() => setActiveField('name')}
                onBlur={() => setActiveField('default')}
              />
            </div>
            {fieldErrors.name && <div className="inline-error">{fieldErrors.name}</div>}
          </div>

          <div className="form-group icon-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </span>
              <input 
                type="email" name="email" className={`form-input with-icon ${fieldErrors.email ? 'error' : ''}`} 
                placeholder="arivera@workspace.io" value={formData.email} 
                onChange={handleChange} required 
                onFocus={() => setActiveField('email')}
                onBlur={() => setActiveField('default')}
              />
            </div>
            {fieldErrors.email && <div className="inline-error">{fieldErrors.email}</div>}
          </div>

          <div className="form-group icon-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input 
                type={showPassword ? "text" : "password"} name="password" className={`form-input with-icon ${fieldErrors.password ? 'error' : ''}`} 
                placeholder="Create a strong password" value={formData.password} 
                onChange={handleChange} required
                onFocus={() => setActiveField('password')}
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
            {/* Strength Meter */}
            {formData.password && (
              <div className="password-strength-group">
                <div className="strength-bar-container">
                  <div className={`strength-bar ${strength.class}`}></div>
                </div>
                <div className={`strength-text ${strength.class}`}>{strength.label}</div>
              </div>
            )}
          </div>

          <div className="form-group icon-group">
            <label>I am a:</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </span>
              <select 
                name="userType" className="form-select with-icon"
                value={formData.userType} onChange={handleChange}
                onFocus={() => setActiveField('userType')}
                onBlur={() => setActiveField('default')}
              >
                <option value="Student">Student</option>
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-register" disabled={status === 'loading'}>
            {status === 'loading' ? 'Creating...' : 'Get Started'}
          </button>

        </form>

        {message && <div className={`status-msg ${status}`}>{message}</div>}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>

      </div>
    </div>
  );
}

export default Register;