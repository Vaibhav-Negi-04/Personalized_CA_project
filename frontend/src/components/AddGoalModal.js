import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './AddTransaction.css'; // We can reuse the modal styles!

function AddGoalModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = auth.currentUser.uid;
      
      // Create a new 'goals' sub-collection
      await addDoc(collection(db, "users", userId, "goals"), {
        title: title,
        targetAmount: parseFloat(target),
        savedAmount: 0, // Start at 0
        createdAt: serverTimestamp()
      });

      setLoading(false);
      setTitle('');
      setTarget('');
      onClose();
    } catch (error) {
      console.error("Error creating goal:", error);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎯 Set a New Goal</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Goal Name</label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="e.g. New Phone, Vacation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label>Target Amount (₹)</label>
            <input 
              type="number" 
              className="money-input" 
              placeholder="0" 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Start Saving'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddGoalModal;