import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', color: '#e5e7eb', fontFamily: 'Outfit, sans-serif' }}>
            <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '40px', display: 'inline-block' }}>Back to Home</Link>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#ffffff' }}>Privacy Policy</h1>
            <p style={{ color: '#9ca3af', marginBottom: '30px' }}>Last updated: August 21, 2026</p>
            
            <h2 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>1. Information Collection</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
            
            <h2 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>2. Use of Information</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>We may use the information we collect about you to provide, maintain, and improve our services, including, for example, to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, and provide customer support.</p>
            
            <h2 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px', color: '#ffffff' }}>3. Data Security</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
        </div>
    );
};

export default Privacy;
