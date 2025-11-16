// frontend/src/components/Login.js
import React, { useState } from 'react';
import { auth } from '../firebaseConfig'; // Import auth from your config
import { signInWithEmailAndPassword } from 'firebase/auth';
import GoogleSignIn from './GoogleSignIn';
function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');

    try {
      // Use Firebase client-side SDK to sign in
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      console.log('User logged in:', userCredential.user);
      setMessage('Login successful! Welcome back.');
      // You would redirect to a dashboard here

    } catch (error) {
      console.error('Login error:', error.message);
      // Handle specific errors like wrong password
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setMessage('Invalid email or password. Please try again.');
      } else {
        setMessage(error.message);
      }
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
      <GoogleSignIn />
    </div>
  );
}

export default Login;