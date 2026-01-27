import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import './Dashboard.css';

function SquadTabs() {
  const [tabs, setTabs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTab, setNewTab] = useState({ person: '', amount: '', desc: '', type: 'owe' }); 

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(collection(db, "users", auth.currentUser.uid, "squadTabs"), (snap) => {
      setTabs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // --- 🧠 CALCULATE NET POSITION ---
  const youOwe = tabs
    .filter(t => t.type === 'owe')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const youAreOwed = tabs
    .filter(t => t.type === 'owed')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const netBalance = youAreOwed - youOwe;
  const totalVolume = youAreOwed + youOwe;
  
  // Calculate width for the visualization bars (prevent divide by zero)
  const greenPercent = totalVolume > 0 ? (youAreOwed / totalVolume) * 100 : 50;
  const redPercent = totalVolume > 0 ? (youOwe / totalVolume) * 100 : 50;

  // Handlers
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTab.person || !newTab.amount) return;
    await addDoc(collection(db, "users", auth.currentUser.uid, "squadTabs"), {
      ...newTab,
      amount: Number(newTab.amount),
      createdAt: new Date()
    });
    setNewTab({ person: '', amount: '', desc: '', type: 'owe' });
    setShowForm(false);
  };

  const handleSettle = async (id) => {
    if (window.confirm("Mark as settled?")) {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "squadTabs", id));
    }
  };

  return (
    <div className="squad-glass-card">
      
      {/* HEADER & ADD BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🍕 Squad Tabs
        </h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="add-btn-small" style={{fontSize: '0.8rem'}}>
            + New Tab
          </button>
        )}
      </div>

      {/* --- 📊 NET POSITION HUD --- */}
      <div className="net-balance-section">
        <div className="net-label">Net Position</div>
        <div className={`net-amount ${netBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
          {netBalance >= 0 ? '+' : '-'}₹{Math.abs(netBalance)}
        </div>
        
        {/* Visual Bar: Green vs Red struggle */}
        {totalVolume > 0 && (
          <div className="balance-bars">
            <div className="bar-green" style={{ width: `${greenPercent}%` }}></div>
            <div className="bar-red" style={{ width: `${redPercent}%` }}></div>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
          <span>To Collect: ₹{youAreOwed}</span>
          <span>To Pay: ₹{youOwe}</span>
        </div>
      </div>

      {/* --- FORM --- */}
      {showForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: '25px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input className="glass-input" placeholder="Who?" value={newTab.person} onChange={e => setNewTab({...newTab, person: e.target.value})} />
            <input className="glass-input" type="number" placeholder="₹ Amount" value={newTab.amount} onChange={e => setNewTab({...newTab, amount: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
             <input className="glass-input" placeholder="For what?" value={newTab.desc} onChange={e => setNewTab({...newTab, desc: e.target.value})} />
             <select className="glass-input" value={newTab.type} onChange={e => setNewTab({...newTab, type: e.target.value})} style={{ background: '#1e293b' }}>
              <option value="owe">I Owe</option>
              <option value="owed">Owes Me</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}>Create</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      {/* --- LIST --- */}
      <div className="squad-list">
        {tabs.length === 0 ? <p style={{textAlign:'center', color:'#64748b', fontSize:'0.9rem'}}>No active tabs.</p> : tabs.map(tab => (
          <div key={tab.id} className={`squad-chip ${tab.type === 'owed' ? 'chip-owed' : 'chip-owe'}`}>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Neon Avatar */}
              <div className={`squad-avatar ${tab.type === 'owed' ? 'glow-green' : 'glow-red'}`}>
                {tab.person.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="squad-name">{tab.person}</div>
                <div className="squad-desc">{tab.desc || 'General'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`squad-amt ${tab.type === 'owed' ? 'net-positive' : 'net-negative'}`}>
                {tab.type === 'owed' ? '+' : '-'}₹{tab.amount}
              </div>
              
              <button 
                className="settle-icon-btn" 
                onClick={() => handleSettle(tab.id)}
                title="Settle Up"
              >
                ✓
              </button>
            </div>
            
          </div>
        ))}
      </div>

    </div>
  );
}

export default SquadTabs;