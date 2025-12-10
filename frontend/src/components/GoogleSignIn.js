import React, { useState } from 'react';
import { auth, googleProvider } from '../firebaseConfig'; 
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function GoogleSignIn() {
  const [userType, setUserType] = useState('Student');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setMessage('Starting Google Sign-In...');
    
    try {
      // 1. Popup
      console.log("Step 1: Opening Popup...");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Step 2: Firebase Auth Success for:", user.email);

      // 2. Get Token
      const token = await user.getIdToken();
      console.log("Step 3: Token retrieved.");

      // 3. Send to Backend
      console.log(`Step 4: Sending to Backend as ${userType}...`);
      
      // FORCE WAIT for the backend response
      const response = await axios.post('http://localhost:5000/api/auth/google', {
          token: token,
          userType: userType 
      });

      console.log("Step 5: Backend Response:", response.data);
      
      if (response.status === 200 || response.status === 201) {
         setMessage('Success! Redirecting...');
         navigate('/dashboard');
      }

    } catch (error) {
        console.error("CRITICAL ERROR:", error);
        // Check if it's an Axios error (Network issue)
        if (error.response) {
            console.log("Backend replied with error:", error.response.data);
            setMessage(`Server Error: ${error.response.data.message}`);
        } else if (error.request) {
            console.log("No response from backend. Is server running?");
            setMessage("Could not connect to server.");
        } else {
            setMessage(`Error: ${error.message}`);
        }
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #334155' }}>
      <h4 style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '0.9rem' }}>Or continue with</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ color: '#fff', marginRight: '8px', fontSize: '0.9rem' }}>I am a:</label>
        <select 
          value={userType} 
          onChange={(e) => setUserType(e.target.value)} 
          style={{ 
            padding: '8px', 
            borderRadius: '5px', 
            background: '#0f172a', 
            color: 'white',
            border: '1px solid #334155'
          }}
        >
          <option value="Student">Student</option>
          <option value="Individual">Individual</option>
          <option value="Business">Business</option>
        </select>
      </div>
      
      <button 
        onClick={handleGoogleSignIn}
        style={{
            backgroundColor: 'white',
            color: '#333',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: '10px',
            transition: 'transform 0.2s'
        }}
      >
        [G] Sign in with Google
      </button>
      
      {message && <p style={{color: '#f87171', fontSize: '0.9rem', marginTop: '10px'}}>{message}</p>}
    </div>
  );
}

export default GoogleSignIn;