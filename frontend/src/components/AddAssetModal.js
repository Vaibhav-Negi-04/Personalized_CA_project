import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig'; // Go up one level to src/ to find firebaseConfig
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import './AddTransaction.css'; // Sits in the same folder

function AddAssetModal({ isOpen, onClose, refreshData }) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState('Stock');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = auth.currentUser.uid;
      
      // Save to a specific sub-collection "assets"
      await addDoc(collection(db, "users", userId, "assets"), {
        name: name,
        value: parseFloat(value),
        type: type,
        date: serverTimestamp()
      });

      refreshData(); // Refresh the dashboard
      onClose(); // Close modal
      setName('');
      setValue('');

    } catch (error) {
      console.error("Error adding asset:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        
        <div className="modal-header">
          <h2>Add Asset 🏛️</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Asset Name */}
          <div className="input-group">
            <label>Asset Name</label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="e.g. Tesla Stock, Gold Ring" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              autoFocus 
            />
          </div>

          {/* Value */}
          <div className="input-group">
            <label>Current Value (₹)</label>
            <input 
              type="number" 
              className="money-input" 
              placeholder="0" 
              value={value} 
              onChange={e => setValue(e.target.value)} 
              required 
            />
          </div>

          {/* Type Selector (Chips) */}
          <div className="category-section">
            <span className="category-label">Type</span>
            <div className="chips-container">
              {['Stock', 'Mutual Fund', 'Gold', 'Real Estate', 'Crypto'].map(t => (
                <div 
                  key={t} 
                  className={`chip ${type === t ? 'active' : ''}`} 
                  onClick={() => setType(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add to Portfolio'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default AddAssetModal;