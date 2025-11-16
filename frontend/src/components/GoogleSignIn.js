// frontend/src/components/GoogleSignIn.js
import React, { useState } from 'react';
import { auth, googleProvider } from '../firebaseConfig'; // Import auth and provider
import { signInWithPopup } from 'firebase/auth';
import axios from 'axios'; // We need axios to talk to our backend

function GoogleSignIn() {
  const [userType, setUserType] = useState('Student'); // Default user type
  const [message, setMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setMessage('Signing in...');
    try {
      // 1. Trigger the Firebase Google Sign-In popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 2. Get the user's ID token
      const token = await user.getIdToken();

      // 3. Send this token AND the selected userType to your backend
      // This is the "sign-up or sign-in" logic
      const response = await axios.post('http://localhost:5000/api/auth/google', {
        token: token,
        userType: userType // Send the selected userType
      });

      console.log('Backend response:', response.data);
      setMessage('Google Sign-In successful! Welcome.');
      // You would redirect to a dashboard here

    } catch (error) {
      console.error('Google Sign-In error:', error.message);
      setMessage('Google Sign-In failed. Please try again.');
    }
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
      <h4>Or Sign In With Google</h4>

      <label>I am a: </label>
      <select value={userType} onChange={(e) => setUserType(e.target.value)} style={{ marginBottom: '10px' }}>
        <option value="Student">Student</option>
        <option value="Individual">Individual</option>
        <option value="Business">Business</option>
      </select>

      <button onClick={handleGoogleSignIn}>
        Sign in with Google
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default GoogleSignIn;