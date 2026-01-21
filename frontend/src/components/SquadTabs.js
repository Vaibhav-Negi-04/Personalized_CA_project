import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { 
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import './Dashboard.css';

function SquadTabs() {
  const { currentUser } = useAuth();
  const [debts, setDebts] = useState([]);
  const [type, setType] = useState('lent');
  const [newDebt, setNewDebt] = useState({ name: '', amount: '', desc: '' });
  const [isAdding, setIsAdding] = useState(false);

  // 1. Fetch Debts
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "users", currentUser.uid, "squadDebts"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setDebts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  // 2. Add Debt
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDebt.name || !newDebt.amount) return;
    
    await addDoc(collection(db, "users", currentUser.uid, "squadDebts"), {
      ...newDebt,
      amount: Number(newDebt.amount),
      type,
      createdAt: new Date()
    });
    setNewDebt({ name: '', amount: '', desc: '' });
    setIsAdding(false);
  };

  // 3. Settle Debt
  const handleSettle = async (id) => {
    if (window.confirm("Mark this as settled?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "squadDebts", id));
    }
  };

  const totalLent = debts.filter(d => d.type === 'lent').reduce((acc, d) => acc + d.amount, 0);
  const totalBorrowed = debts.filter(d => d.type === 'borrowed').reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="squad-section">
      <div className="section-header">
        <h3>🍕 Squad Tabs</h3>
        <button className="add-btn-small" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : '+ Add Tab'}
        </button>
      </div>

      {/* Summary Chips */}
      <div className="debt-summary">
        <div className="d-chip green">
          <span>You are owed</span>
          <strong>₹{totalLent}</strong>
        </div>
        <div className="d-chip red">
          <span>You owe</span>
          <strong>₹{totalBorrowed}</strong>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="debt-form">
          <div className="type-toggle">
            <span 
              className={type === 'lent' ? 'active lent' : ''} 
              onClick={() => setType('lent')}
            >Lent (Get)</span>
            <span 
              className={type === 'borrowed' ? 'active borrowed' : ''} 
              onClick={() => setType('borrowed')}
            >Borrowed (Pay)</span>
          </div>
          
          {/* --- UPDATED INPUTS WITH NEW CLASS --- */}
          <input 
            type="text" 
            placeholder="Friend's Name" 
            className="debt-input"
            value={newDebt.name} 
            onChange={e => setNewDebt({...newDebt, name: e.target.value})} 
          />
          <input 
            type="number" 
            placeholder="Amount (₹)" 
            className="debt-input"
            value={newDebt.amount} 
            onChange={e => setNewDebt({...newDebt, amount: e.target.value})} 
          />
          <input 
            type="text" 
            placeholder="For what? (Pizza, Cab...)" 
            className="debt-input"
            value={newDebt.desc} 
            onChange={e => setNewDebt({...newDebt, desc: e.target.value})} 
          />
          
          <button type="submit" className="save-debt-btn">Save Tab</button>
        </form>
      )}

      {/* Debt List */}
      <div className="debt-list">
        {debts.length === 0 ? <p className="empty-msg">No active tabs.</p> : debts.map(debt => (
          <div key={debt.id} className={`debt-card ${debt.type}`}>
            <div className="debt-left">
              <div className="avatar-circle">
                {debt.name.charAt(0).toUpperCase()}
              </div>
              <div className="debt-info">
                <h4>{debt.name}</h4>
                <span>{debt.desc}</span>
              </div>
            </div>
            <div className="debt-right">
              <span className="debt-amt">₹{debt.amount}</span>
              <button className="settle-btn" onClick={() => handleSettle(debt.id)}>✓</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SquadTabs;