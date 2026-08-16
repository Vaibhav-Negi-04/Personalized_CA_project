import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import './Dashboard.css';

// ⚡ PRESET DATA
const PRESETS = [
  { id: 'netflix', name: 'Netflix', cost: 199, bgClass: 'brand-netflix', label: 'N' },
  { id: 'spotify', name: 'Spotify', cost: 119, bgClass: 'brand-spotify', label: 'S' },
  { id: 'prime',   name: 'Prime',   cost: 299, bgClass: 'brand-prime',   label: 'P' },
  { id: 'yt',      name: 'YouTube', cost: 129, bgClass: 'brand-yt',      label: 'Y' },
  { id: 'apple',   name: 'iCloud',  cost: 75,  bgClass: 'brand-apple',   label: '' },
  { id: 'gpt',     name: 'ChatGPT', cost: 1999, bgClass: 'brand-gpt',    label: 'AI' },
];

function SubscriptionVault() {
  const [subs, setSubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', cost: '', date: '' });

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(collection(db, "users", auth.currentUser.uid, "subscriptions"), (snap) => {
      setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const totalBurn = subs.reduce((acc, s) => acc + Number(s.cost), 0);

  // --- 🧠 SMART DATE LOGIC ---
  const getUrgencyClass = (dateStr) => {
    if (!dateStr) return '';
    
    // Extract the number from "15th", "2nd", etc.
    const dueDay = parseInt(dateStr); 
    if (isNaN(dueDay)) return '';

    const today = new Date();
    const currentDay = today.getDate();
    
    // Basic Check: Is it today?
    if (dueDay === currentDay) return 'critical';

    // Advanced Check: Is it within 3 days? (Handles month wrap-around)
    // Example: Today is 30th, Due is 2nd. 
    // Distance = (2 + 30) - 30 = 2 days away.
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    let diff = dueDay - currentDay;
    if (diff < 0) {
        // If due date is "behind" us, checking if it's actually "ahead" in next month
        diff += daysInMonth; 
    }

    if (diff > 0 && diff <= 3) return 'warning';

    return '';
  };

  const handlePresetClick = (preset) => {
    setNewSub({ name: preset.name, cost: preset.cost, date: '1st' });
    setShowForm(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSub.name || !newSub.cost) return;
    await addDoc(collection(db, "users", auth.currentUser.uid, "subscriptions"), {
      name: newSub.name,
      cost: Number(newSub.cost),
      date: newSub.date,
      createdAt: new Date()
    });
    setNewSub({ name: '', cost: '', date: '' });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Stop tracking this subscription?")) {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "subscriptions", id));
    }
  };

  return (
    <div className="vault-glass-card">
      
      {/* HEADER */}
      <div className="vault-header-row">
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            📺 Subscription Vault
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--border-strong)' }}>
            Manage recurring expenses
          </p>
        </div>
        <div className="burn-stat">
          <span className="burn-icon">🔥</span>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--status-danger)', textTransform: 'uppercase' }}>Monthly Burn</div>
            <div className="burn-amount">₹{totalBurn}</div>
          </div>
        </div>
      </div>

      {/* QUICK ADD ICONS */}
      {!showForm && (
        <div className="quick-add-row">
          {PRESETS.map(preset => (
            <button 
              key={preset.id} 
              className="brand-btn" 
              onClick={() => handlePresetClick(preset)}
              title={`Quick add ${preset.name}`}
            >
              <div className={`brand-logo ${preset.bgClass}`}>{preset.label}</div>
              <span className="brand-label">{preset.name}</span>
            </button>
          ))}
          <button className="brand-btn" onClick={() => setShowForm(true)}>
             <div className="brand-logo" style={{background: 'rgba(255,255,255,0.1)', border:'1px dashed rgba(255,255,255,0.3)'}}>+</div>
             <span className="brand-label">Custom</span>
          </button>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: '20px', background: 'var(--overlay-dark)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input className="glass-input" placeholder="Name" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
            <input className="glass-input" type="number" placeholder="Cost" value={newSub.cost} onChange={e => setNewSub({...newSub, cost: e.target.value})} />
            <input className="glass-input" placeholder="Day (e.g. 15th)" value={newSub.date} onChange={e => setNewSub({...newSub, date: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, var(--primary))', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>Save</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--border-strong)', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      {/* GRID LIST (With Smart Glow) */}
      <div className="subs-grid">
        {subs.length === 0 ? <p style={{color:'#64748b', fontSize:'0.9rem', textAlign:'center', marginTop:'20px'}}>No active subscriptions.</p> : subs.map(sub => {
          // Calculate Urgency
          const urgencyClass = getUrgencyClass(sub.date);
          
          return (
            <div key={sub.id} className={`sub-chip ${urgencyClass}`}>
              <div className="sub-header">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="sub-icon-box">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="sub-name">{sub.name}</div>
                    <div className="sub-date">
                       {urgencyClass === 'critical' ? '⚠️ DUE TODAY' : (urgencyClass === 'warning' ? 'Due Soon' : `Renews: ${sub.date}`)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="sub-actions">
                <div className="sub-cost">₹{sub.cost}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button className="pay-btn-mini">Paid</button>
                  <button className="delete-sub-btn" onClick={() => handleDelete(sub.id)}>×</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default SubscriptionVault;