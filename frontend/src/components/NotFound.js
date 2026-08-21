import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 'bold', margin: '0' }}>404</h1>
            <p style={{ fontSize: '1.2rem', color: '#9ca3af', marginBottom: '30px' }}>Page not found.</p>
            <Link to="/" style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: '#ffffff', textDecoration: 'none', fontWeight: 'bold' }}>Return Home</Link>
        </div>
    );
};

export default NotFound;
