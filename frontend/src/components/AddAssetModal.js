import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './AddTransaction.css'; // We reuse the styles
import AIReceiptScanner from './AIReceiptScanner'; // Adjust path if needed (e.g., '../AIReceiptScanner')

function AddAssetModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Stock');
  
  // 🟢 State for Invested vs Current value
  const [investedValue, setInvestedValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "users", user.uid, "assets"), {
          name: name,
          type: type,
        // 🟢 Saving both values to Firestore
        invested: parseFloat(investedValue),
        value: parseFloat(currentValue),
        date: serverTimestamp()
      });
      
      setLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        // Reset form
        setName('');
        setInvestedValue('');
        setCurrentValue('');
        setType('Stock');
        setIsSuccess(false);
        onClose();
      }, 1500);
    }
  } catch (error) {
      console.error("Error adding asset:", error);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Added 'modal-theme-wealth' to force Green Theme */}
      <div className="modal-content modal-theme-wealth" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2>+ Add Asset</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* 🤖 AI INVESTMENT SCANNER */}
        <AIReceiptScanner 
            onScanSuccess={(aiData) => {
                // Auto-fill the asset form with the AI data!
                setName(aiData.merchant || "Scanned Asset");
                // For a new receipt, invested amount and current value are usually the same
                setInvestedValue(aiData.total || "");
                setCurrentValue(aiData.total || "");
            }} 
        />

        <form onSubmit={handleSubmit}>
          
          {/* Asset Name */}
          <div className="input-group">
            <label>Asset Name</label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="e.g. Reliance, Gold Bond" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Asset Type */}
          <div className="input-group">
            <label>Type</label>
            <select 
              className="text-input" 
              value={type} 
              onChange={(e) => setType(e.target.value)}
            >
              <option value="Stock">Stock / Mutual Fund</option>
              <option value="Gold">Gold / Precious Metal</option>
              <option value="Crypto">Crypto / Digital</option>
              <option value="Real Estate">Real Estate</option>
            </select>
          </div>

          {/* 🟢 Invested vs Current Value Row */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="input-group">
              <label>Invested Amount (₹)</label>
              <input 
                type="number" 
                className="money-input" 
                placeholder="5000" 
                value={investedValue}
                onChange={(e) => setInvestedValue(e.target.value)}
                required
              />
            </div>

          <div className="input-group">
            <label>Current Value (₹)</label>
            <input 
              type="number" 
              className="money-input" 
              placeholder="0.00" 
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              required
            />
          </div>
        </div>

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Asset'}
          </button>
        </form>
        
        {isSuccess && (
          <div className="success-overlay" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(6, 182, 212, 0.9)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            borderRadius: 'inherit', color: 'white', zIndex: 10, animation: 'fadeIn 0.3s forwards'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation: 'scaleIn 0.5s var(--ease-spring)'}}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h2 style={{marginTop: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>Asset Added!</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddAssetModal;