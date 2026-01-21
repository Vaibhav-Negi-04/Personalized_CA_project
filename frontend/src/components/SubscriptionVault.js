import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { 
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import './Dashboard.css';

// ... (COMMON_SUBS array remains the same) ...
const COMMON_SUBS = [
  { name: 'Netflix', defaultPrice: 649, logo: 'https://cdn-icons-png.flaticon.com/512/5977/5977590.png' },
  { name: 'Spotify', defaultPrice: 119, logo: 'https://cdn-icons-png.flaticon.com/512/408/408748.png' },
  { name: 'YouTube Prem', defaultPrice: 129, logo: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
  { name: 'Amazon Prime', defaultPrice: 299, logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968269.png' },
  { name: 'Hotstar', defaultPrice: 299, logo: 'https://cdn-icons-png.flaticon.com/512/15569/15569420.png' },
  { name: 'ChatGPT Plus', defaultPrice: 1999, logo: 'https://cdn-icons-png.flaticon.com/512/12222/12222588.png' },
  { name: 'Zomato Gold', defaultPrice: 149, logo: 'https://cdn-icons-png.flaticon.com/512/732/732250.png' },
  { name: 'Gym', defaultPrice: 1500, logo: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png' }
];

function SubscriptionVault() {
  const { currentUser } = useAuth();
  const [subs, setSubs] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', amount: '', date: '' });

  // 1. Fetch
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "users", currentUser.uid, "subscriptions"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  // 2. Add Logic
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSub.name || !newSub.amount || !newSub.date) return;
    await addDoc(collection(db, "users", currentUser.uid, "subscriptions"), {
      ...newSub,
      amount: Number(newSub.amount),
      createdAt: new Date()
    });
    setNewSub({ name: '', amount: '', date: '' });
    setIsAdding(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this subscription?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "subscriptions", id));
    }
  };

  // 3. Pay Logic
  const handlePay = async (sub) => {
    const confirmMsg = `Mark ${sub.name} as paid for ₹${sub.amount}? This will add an expense.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await addDoc(collection(db, "users", currentUser.uid, "transactions"), {
        text: `Subscription: ${sub.name}`,
        amount: sub.amount,
        type: 'expense',
        date: new Date(),
        category: 'Subscription'
      });
      alert(`Paid! ₹${sub.amount} deducted from balance.`);
    } catch (error) {
      console.error("Error paying subscription:", error);
    }
  };

  const fillPreset = (sub) => {
    setNewSub({ ...newSub, name: sub.name, amount: sub.defaultPrice });
  };

  const totalBurn = subs.reduce((acc, s) => acc + s.amount, 0);

  // --- NEW: URGENCY LOGIC ---
  const today = new Date().getDate(); // Returns 1-31
  
  // Count how many are due soon (within 3 days)
  const dueSoonCount = subs.filter(s => {
    const day = parseInt(s.date);
    const diff = day - today;
    return diff >= 0 && diff <= 3;
  }).length;

  return (
    <div className="vault-section">
      <div className="section-header">
        <h3>📺 Subscription Vault</h3>
        <button className="add-btn-small" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Close' : '+ Add Sub'}
        </button>
      </div>

      {/* NEW: ALERT BANNER */}
      {dueSoonCount > 0 && (
        <div className="vault-alert">
          <span>🔔 <b>{dueSoonCount} Bills</b> due this week! Check your balance.</span>
        </div>
      )}

      <div className="burn-rate-card">
        <span className="burn-label">Monthly Fixed Burn</span>
        <div className="burn-value">
          <span className="fire-anim">🔥</span> ₹{totalBurn}
          <span className="per-mo">/mo</span>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="sub-form">
          <p className="quick-label">Quick Select:</p>
          <div className="quick-sub-grid">
            {COMMON_SUBS.map((s) => (
              <div key={s.name} className="quick-sub-item" onClick={() => fillPreset(s)}>
                <img src={s.logo} alt={s.name} />
                <span>{s.name}</span>
              </div>
            ))}
          </div>

          <input type="text" placeholder="Service Name" className="debt-input" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
          <input type="number" placeholder="Cost (₹)" className="debt-input" value={newSub.amount} onChange={e => setNewSub({...newSub, amount: e.target.value})} />
          <div className="date-input-group">
            <label>Renewal Date (Day of Month):</label>
            <input type="number" min="1" max="31" placeholder="e.g. 15" className="debt-input" value={newSub.date} onChange={e => setNewSub({...newSub, date: e.target.value})} />
          </div>
          <button type="submit" className="save-debt-btn">Lock In Subscription</button>
        </form>
      )}

      <div className="sub-grid">
        {subs.length === 0 ? <p className="empty-msg">No active subscriptions.</p> : subs.map(sub => {
          // CHECK IF DUE SOON
          const day = parseInt(sub.date);
          const diff = day - today;
          const isDueSoon = diff >= 0 && diff <= 3;
          const isToday = diff === 0;

          return (
            <div key={sub.id} className={`sub-card ${isDueSoon ? 'due-warning' : ''}`}>
              
              {/* WARNING BADGE */}
              {isDueSoon && (
                <div className="due-badge">
                  {isToday ? 'DUE TODAY' : `Due in ${diff} days`}
                </div>
              )}

              <div className="sub-icon">{sub.name.charAt(0).toUpperCase()}</div>
              <div className="sub-info">
                <h4>{sub.name}</h4>
                <span className="sub-date" style={{color: isDueSoon ? '#fcd34d' : '#94a3b8'}}>
                  Renews on {sub.date}th
                </span>
              </div>
              <div className="sub-cost">₹{sub.amount}</div>
              
              <button className="pay-sub-btn" onClick={() => handlePay(sub)} title="Pay & Add to Expenses">
                Pay
              </button>

              <button className="sub-del-btn" onClick={() => handleDelete(sub.id)}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SubscriptionVault;