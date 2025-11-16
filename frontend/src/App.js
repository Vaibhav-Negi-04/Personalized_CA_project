// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Personalized CA</h1>
          <nav>
            <Link to="/register" style={{ margin: '10px', color: 'white' }}>
              Register
            </Link>
            <Link to="/login" style={{ margin: '10px', color: 'white' }}>
              Login
            </Link>
          </nav>
        </header>

        {/* Define the routes */}
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* Optional: A default home page */}
          <Route path="/" element={<h2>Welcome! Please register or log in.</h2>} />
        </Routes>

      </div>
    </Router>
  );
}

export default App;