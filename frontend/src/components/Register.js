import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css'; // Import the new styles

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'Student' // Default
  });
  
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(''); // 'loading', 'error', 'success'
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('Creating your account...');
    
    try {
      // Send data to your backend
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      
      console.log(response.data);
      setStatus('success');
      setMessage('Registration successful! Redirecting to Login...');

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error.response ? error.response.data : error.message);
      setStatus('error');
      setMessage(error.response ? error.response.data.message : 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        
        <h2>Create Account</h2>
        <p className="register-subtitle">Join Personalized CA today</p>
        
        <form onSubmit={handleSubmit}>
          
          {/* Name Field */}
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              name="name" 
              className="form-input" 
              placeholder="John Doe"
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email" 
              className="form-input" 
              placeholder="john@example.com"
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              className="form-input" 
              placeholder="Create a strong password"
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>

          {/* User Type Dropdown */}
          <div className="form-group">
            <label>I am a:</label>
            <select 
              name="userType" 
              className="form-select"
              value={formData.userType} 
              onChange={handleChange}
            >
              <option value="Student">Student 🎓</option>
              <option value="Individual">Individual 💼</option>
              <option value="Business">Business 🏢</option>
            </select>
          </div>

          <button type="submit" className="btn-register">
            {status === 'loading' ? 'Creating Account...' : 'Get Started'}
          </button>

        </form>

        {/* Dynamic Status Message */}
        {message && (
          <div className={`status-msg ${status}`}>
            {message}
          </div>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>

      </div>
    </div>
  );
}

export default Register;