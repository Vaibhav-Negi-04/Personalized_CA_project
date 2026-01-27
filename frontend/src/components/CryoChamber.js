import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, deleteDoc, doc, updateDoc, increment, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import './Dashboard.css';

function CryoChamber() {
  const [items, setItems] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', cost: '' });

  // 1. Fetch Frozen Items
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "users", auth.currentUser.uid, "cryoItems"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        unlocksAt: d.data().unlocksAt?.toDate ? d.data().unlocksAt.toDate() : new Date(d.data().unlocksAt) 
      })));
    });
    return () => unsub();
  }, []);

  // ❄️ FREEZE: Add item to stasis
  const freezeItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.cost) return;

    const unlockDate = new Date();
    unlockDate.setHours(unlockDate.getHours() + 24); 

    await addDoc(collection(db, "users", auth.currentUser.uid, "cryoItems"), {
      name: newItem.name,
      cost: Number(newItem.cost),
      createdAt: serverTimestamp(),
      unlocksAt: unlockDate
    });
    
    setNewItem({ name: '', cost: '' });
    setIsAdding(false);
  };

  // 🔨 SHATTER: Delete item and Get XP (I changed my mind)
  const shatterItem = async (item) => {
    if(!window.confirm("Shatter this impulse? You'll gain XP for saving money!")) return;
    
    const xpReward = Math.min(500, Math.ceil(item.cost * 0.1));
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { xp: increment(xpReward) });

    await deleteDoc(doc(db, "users", auth.currentUser.uid, "cryoItems", item.id));
  };

  // 🎯 GOAL: Move to Savings Goals (I want it, but later)
  const moveToGoal = async (item) => {
    if(!window.confirm(`Move "${item.name}" to your Savings Goals?`)) return;

    // 1. Add to Goals Collection
    await addDoc(collection(db, "users", auth.currentUser.uid, "goals"), {
        name: item.name,
        target: Number(item.cost),
        saved: 0,
        icon: '🧊', // Ice icon to show it came from Cryo
        createdAt: new Date()
    });

    // 2. Remove from Cryo
    await deleteDoc(doc(db, "users", auth.currentUser.uid, "cryoItems", item.id));
  };

  // 🔥 THAW: Buy it now (Add Expense)
  const thawItem = async (item) => {
    if(!window.confirm("Thaw and buy? This will be added to your expenses.")) return;

    // 1. Add to Transactions
    await addDoc(collection(db, "users", auth.currentUser.uid, "transactions"), {
      amount: item.cost,
      description: item.name,
      type: 'expense',
      category: 'Shopping',
      vibe: 'joy', // You waited 24h, so it's a conscious choice now
      date: serverTimestamp()
    });

    // 2. Remove from Cryo
    await deleteDoc(doc(db, "users", auth.currentUser.uid, "cryoItems", item.id));
  };

  return (
    <div className="cryo-container" style={{ marginBottom: '40px' }}>
      <div className="cryo-section-header">
        <h3 style={{ color: '#67e8f9', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', display:'flex', alignItems:'center', gap:'10px', margin: 0 }}>
          ❄️ Cryo-Chamber <span style={{fontSize:'0.7rem', color:'#94a3b8'}}>(Impulse Control)</span>
        </h3>
        {!isAdding && (
          <button className="add-btn-small" onClick={() => setIsAdding(true)}>
            + Freeze Impulse
          </button>
        )}
      </div>

      {/* THEMED INPUT FORM */}
      {isAdding && (
        <div className="cryo-form-card">
          <form onSubmit={freezeItem} className="cryo-form-row">
            <input 
              className="glass-input"
              type="text" placeholder="Item Name (e.g. Jordans)" 
              value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} 
              required autoFocus
            />
            <input 
              className="glass-input"
              type="number" placeholder="Cost (₹)" 
              value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} 
              required 
            />
            <div className="cryo-btn-group">
              <button type="submit" className="btn-freeze"><span>Freeze</span> ❄️</button>
              <button type="button" className="btn-cancel" onClick={() => setIsAdding(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* The Cards Grid */}
      <div className="cryo-grid">
        {items.length === 0 && !isAdding && <p className="empty-msg">No frozen items. Impulse control is stable.</p>}
        
        {items.map(item => {
          const now = new Date();
          const isLocked = now < item.unlocksAt;
          const diffMs = item.unlocksAt - now;
          const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));

          return (
            <div key={item.id} className={`cryo-card ${isLocked ? 'locked' : 'unlocked'}`}>
              <div className="cryo-icon">{isLocked ? '🔒' : '🔓'}</div>
              <h4>{item.name}</h4>
              <div className="cryo-price">₹{item.cost}</div>

              {isLocked ? (
                <div className="cryo-timer">Thaws in {hoursLeft}h</div>
              ) : (
                <div className="cryo-actions">
                  <button className="btn-shatter" onClick={() => shatterItem(item)} title="Shatter (Delete & Gain XP)">🔨</button>
                  <button className="btn-goal" onClick={() => moveToGoal(item)} title="Move to Savings Goal">🎯</button>
                  <button className="btn-buy" onClick={() => thawItem(item)} title="Buy Now (Add Expense)">🔥</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CryoChamber;