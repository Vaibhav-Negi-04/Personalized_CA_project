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
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      setStatus('success');
      setMessage('Registration successful! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response ? error.response.data.message : 'Registration failed.');
    }
  };

  return (
    <div className="register-page">
      {/* Pass the active field to the background to trigger camera moves */}
      <GalaxyBackground activeField={activeField} />

      <div className="register-card">
        <Link to="/" className="back-home-link">← Back</Link>
        
        <h2>Create Account</h2>
        <p className="register-subtitle">Join Personalized CA today</p>
        
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" name="name" className="form-input" 
              placeholder="John Doe" value={formData.name} 
              onChange={handleChange} required 
              onFocus={() => setActiveField('name')} // Trigger Camera Move
              onBlur={() => setActiveField('default')} // Reset on leave
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" name="email" className="form-input" 
              placeholder="john@example.com" value={formData.email} 
              onChange={handleChange} required 
              onFocus={() => setActiveField('email')}
              onBlur={() => setActiveField('default')}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" name="password" className="form-input" 
              placeholder="Create a strong password" value={formData.password} 
              onChange={handleChange} required
              onFocus={() => setActiveField('password')}
              onBlur={() => setActiveField('default')}
            />
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

          <div className="form-group">
            <label>I am a:</label>
            <select 
              name="userType" className="form-select"
              value={formData.userType} onChange={handleChange}
              onFocus={() => setActiveField('userType')}
              onBlur={() => setActiveField('default')}
            >
              <option value="Student">Student 🎓</option>
              <option value="Individual">Individual 💼</option>
              <option value="Business">Business 🏢</option>
            </select>
          </div>

          <button type="submit" className="btn-register">
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