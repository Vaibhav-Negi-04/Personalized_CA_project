import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import './Dashboard.css';

function SquadTabs() {
  const [tabs, setTabs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // 👇 Added 'friendUpi' to the new tab state
  const [newTab, setNewTab] = useState({ person: '', amount: '', desc: '', type: 'owe', friendUpi: '' }); 
  const [settleTab, setSettleTab] = useState(null);

  // 👇 State to hold YOUR personal UPI ID
  const [myUpi, setMyUpi] = useState("");

  // --- 1. FETCH TABS & PROFILE ---
  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch personal UPI ID from a 'profile' document
    const fetchMyUpi = async () => {
      try {
        const docRef = doc(db, "users", auth.currentUser.uid, "profile", "info");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().upiId) {
          setMyUpi(docSnap.data().upiId);
        }
      } catch (e) {
        console.error("Error fetching UPI profile:", e);
      }
    };
    fetchMyUpi();

    // Fetch Squad Tabs
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
  
  const greenPercent = totalVolume > 0 ? (youAreOwed / totalVolume) * 100 : 50;
  const redPercent = totalVolume > 0 ? (youOwe / totalVolume) * 100 : 50;

  // --- HANDLERS ---
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTab.person || !newTab.amount) return;
    await addDoc(collection(db, "users", auth.currentUser.uid, "squadTabs"), {
      ...newTab,
      amount: Number(newTab.amount),
      createdAt: new Date()
    });
    // Reset form
    setNewTab({ person: '', amount: '', desc: '', type: 'owe', friendUpi: '' });
    setShowForm(false);
  };

  // 🔥 NEW: Set/Update Your Personal UPI ID
  const handleSetMyUpi = async () => {
    const enteredUpi = window.prompt("Enter your actual UPI ID to receive payments (e.g., name@okaxis):", myUpi);
    if (enteredUpi) {
      await setDoc(doc(db, "users", auth.currentUser.uid, "profile", "info"), { upiId: enteredUpi }, { merge: true });
      setMyUpi(enteredUpi);
      alert("UPI ID saved! Friends can now pay you directly.");
    }
  };

  const handleSettleClick = (tab) => {
    // Smart Prompt: If you are trying to collect money but haven't set your UPI ID yet, ask for it!
    if (tab.type === 'owed' && !myUpi) {
      const enteredUpi = window.prompt("Wait! You need to set your UPI ID so they can pay you. Enter it here (e.g., name@upi):");
      if (enteredUpi) {
        setDoc(doc(db, "users", auth.currentUser.uid, "profile", "info"), { upiId: enteredUpi }, { merge: true });
        setMyUpi(enteredUpi);
      } else {
        alert("You can still view the tab, but the QR code won't work without a UPI ID.");
      }
    }
    setSettleTab(tab);
  };

  const confirmSettle = async (id) => {
    await deleteDoc(doc(db, "users", auth.currentUser.uid, "squadTabs", id));
    setSettleTab(null);
  };

  // --- 🏦 DYNAMIC UPI LINK GENERATOR ---
  const getUpiLink = (tab) => {
    if (!tab) return "";
    
    // If they owe YOU -> QR pays your saved UPI ID
    if (tab.type === 'owed') {
      const targetUpi = myUpi || "setup-your-upi@ybl";
      return `upi://pay?pa=${targetUpi}&pn=Me&am=${tab.amount}&cu=INR`;
    } 
    // If YOU owe them -> QR pays their saved UPI ID (or a placeholder)
    else {
      const targetUpi = tab.friendUpi || `${tab.person.toLowerCase().replace(/\s/g, '')}@upi`;
      return `upi://pay?pa=${targetUpi}&pn=${tab.person}&am=${tab.amount}&cu=INR`;
    }
  };

  return (
    <div className="squad-glass-card" style={{ position: 'relative' }}>
      
      {/* HEADER & BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🍕 Squad Tabs
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* ⚙️ Profile Gear to set your own UPI */}
          <button onClick={handleSetMyUpi} className="add-btn-small" style={{background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '6px 10px'}} title="Set My UPI ID">
            ⚙️ {myUpi ? 'Edit UPI' : 'Set UPI'}
          </button>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="add-btn-small" style={{fontSize: '0.8rem'}}>
              + New Tab
            </button>
          )}
        </div>
      </div>

      {/* --- 📊 NET POSITION HUD --- */}
      <div className="net-balance-section">
        <div className="net-label">Net Position</div>
        <div className={`net-amount ${netBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
          {netBalance >= 0 ? '+' : '-'}₹{Math.abs(netBalance)}
        </div>
        
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

      {/* --- NEW TAB FORM --- */}
      {showForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: '25px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input className="glass-input" placeholder="Who?" value={newTab.person} onChange={e => setNewTab({...newTab, person: e.target.value})} required />
            <input className="glass-input" type="number" placeholder="₹ Amount" value={newTab.amount} onChange={e => setNewTab({...newTab, amount: e.target.value})} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '15px', marginBottom: '15px' }}>
             <input className="glass-input" placeholder="For what?" value={newTab.desc} onChange={e => setNewTab({...newTab, desc: e.target.value})} />
             <select className="glass-input" value={newTab.type} onChange={e => setNewTab({...newTab, type: e.target.value})} style={{ background: '#1e293b' }}>
              <option value="owe">I Owe</option>
              <option value="owed">Owes Me</option>
            </select>
            {/* 👇 NEW: Optional Friend UPI Input */}
            <input className="glass-input" placeholder="Friend's UPI (Opt)" value={newTab.friendUpi} onChange={e => setNewTab({...newTab, friendUpi: e.target.value})} />
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
              <div className={`squad-avatar ${tab.type === 'owed' ? 'glow-green' : 'glow-red'}`}>
                {tab.person.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="squad-name">{tab.person}</div>
                <div className="squad-desc" style={{fontSize: '0.7rem'}}>
                  {tab.desc || 'General'} {tab.friendUpi && `• ${tab.friendUpi}`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`squad-amt ${tab.type === 'owed' ? 'net-positive' : 'net-negative'}`}>
                {tab.type === 'owed' ? '+' : '-'}₹{tab.amount}
              </div>
              
              <button 
                className="settle-icon-btn" 
                onClick={() => handleSettleClick(tab)}
                title="Settle Up"
              >
                ✓
              </button>
            </div>
            
          </div>
        ))}
      </div>

      {/* =========================================
          🔥 UPI SETTLEMENT MODAL 🔥
      ========================================= */}
      {settleTab && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)', borderRadius: '24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px', zIndex: 50, backdropFilter: 'blur(10px)'
        }}>
          
          <h3 style={{ margin: '0 0 10px 0', color: 'white', textAlign: 'center' }}>
            {settleTab.type === 'owed' ? `Request from ${settleTab.person}` : `Pay ${settleTab.person}`}
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: settleTab.type === 'owed' ? '#10b981' : '#f43f5e', marginBottom: '20px' }}>
            ₹{settleTab.amount}
          </div>

          <div style={{ background: 'white', padding: '15px', borderRadius: '16px', marginBottom: '20px' }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getUpiLink(settleTab))}`} 
              alt="UPI QR Code" 
              style={{ display: 'block', width: '150px', height: '150px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <a 
              href={getUpiLink(settleTab)} 
              style={{
                background: '#3b82f6', color: 'white', textDecoration: 'none', textAlign: 'center',
                padding: '12px', borderRadius: '12px', fontWeight: 'bold', display: 'block'
              }}
            >
              📱 Open UPI App (Mobile)
            </a>
            
            <button 
              onClick={() => confirmSettle(settleTab.id)}
              style={{
                background: '#10b981', border: 'none', color: 'white', padding: '12px', 
                borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              ✅ Mark as Settled
            </button>
            
            <button 
              onClick={() => setSettleTab(null)}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', 
                padding: '10px', borderRadius: '12px', cursor: 'pointer', marginTop: '5px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SquadTabs;