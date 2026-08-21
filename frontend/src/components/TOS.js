import React from 'react';
import { Link } from 'react-router-dom';

const TOS = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', color: '#e5e7eb', fontFamily: 'Outfit, sans-serif' }}>
            <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '40px', display: 'inline-block' }}>Back to Home</Link>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#ffffff' }}>Terms of Service</h1>
            <p style={{ color: '#9ca3af', marginBottom: '30px' }}>Last updated: August 21, 2026</p>
            
            <h2 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>1. Acceptance of Terms</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            <h2 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>2. Description of Service</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>We provide a financial dashboard and analytics platform for personal and business use. The service is provided "as is" without warranty.</p>
            
            <h2 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>3. User Conduct</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>You agree to use the service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website.</p>
        </div>
    );
};

export default TOS;
