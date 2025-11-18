import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate & Link
import GoogleSignIn from './GoogleSignIn';
import './Login.css'; // Import the new CSS

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(''); // 'success' or 'error' for styling
  
  const navigate = useNavigate(); // Hook for redirection

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');
    setStatus('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      console.log('User logged in:', userCredential.user);
      setStatus('success');
      setMessage('Login successful! Redirecting...');
      
      // Wait 1.5 seconds so user sees success message, then go to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Login error:', error.message);
      setStatus('error');
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setMessage('Invalid email or password. Please try again.');
      } else {
        setMessage(error.message);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        
        <h2>Welcome Back</h2>
        <p className="subtitle">Access your Personalized CA Dashboard</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email" 
              className="form-input"
              placeholder="name@example.com"
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              className="form-input"
              placeholder="••••••••"
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>

          <button type="submit" className="btn-primary">Sign In</button>
        </form>

        {/* Message Display */}
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