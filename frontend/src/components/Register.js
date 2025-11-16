// frontend/src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios'; // Import axios

function Register() {
  // State to hold the form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'Student' // Default user type
  });

  const [message, setMessage] = useState(''); // To show success/error messages

  // Function to update state when user types
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form refresh
    setMessage('Sending...');

    try {
      // Send a POST request to your backend's register endpoint
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);

      console.log(response.data);
      setMessage('Registration successful! You can now log in.');

    } catch (error) {
      console.error('Registration error:', error.response ? error.response.data : error.message);
      // Show the specific error message from the backend, or a generic one
      setMessage(error.response ? error.response.data.message : 'Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Register for Personalized CA</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <div>
          <label>I am a:</label>
          <select name="userType" value={formData.userType} onChange={handleChange}>
            <option value="Student">Student</option>
            <option value="Individual">Individual</option>
            <option value="Business">Business</option>
          </select>
        </div>
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;