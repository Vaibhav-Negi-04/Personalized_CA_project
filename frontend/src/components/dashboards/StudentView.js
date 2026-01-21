import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig'; 
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore'; 
import TransactionHistory from '../TransactionHistory';
import GamificationCard from '../GamificationCard';
import ReportCardModal from '../ReportCardModal';
import SquadTabs from '../SquadTabs';
import SubscriptionVault from '../SubscriptionVault';
// 1. IMPORT BACKGROUND MUSIC
import BackgroundMusic from '../BackgroundMusic';

function StudentView() { 
  const { currentUser } = useAuth();
  
  // --- STATE ---
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]); 
  const [newGoal, setNewGoal] = useState({ name: '', target: '' });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (!currentUser) return;

    const qTransactions = query(
      collection(db, "users", currentUser.uid, "transactions"),
      orderBy("date", "desc")
    );
    const unsubTrans = onSnapshot(qTransactions, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date) 
        };
      });
      setTransactions(docs);
    });

    const qGoals = query(collection(db, "users", currentUser.uid, "goals"));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTrans();
      unsubGoals();
    };
  }, [currentUser]);

  // --- 2. CALCULATE FINANCIALS ---
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalAllocatedToGoals = goals.reduce((acc, goal) => acc + (goal.saved || 0), 0);
  const rawBalance = income - expenses;
  const availableBalance = Math.max(0, rawBalance - totalAllocatedToGoals);

  // --- DAILY LIMIT LOGIC ---
  const today = new Date();
  const spentToday = transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const tDate = t.date;
      return (
        tDate.getDate() === today.getDate() &&
        tDate.getMonth() === today.getMonth() &&
        tDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate() + 1;
  const dailyLimit = Math.max(0, (availableBalance + spentToday) / daysLeft).toFixed(0);
  const spendPercent = dailyLimit > 0 ? Math.min(100, (spentToday / dailyLimit) * 100) : 100;
  const isOverLimit = spentToday > dailyLimit;

  // --- HANDLERS ---
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target) return;
    try {
      await addDoc(collection(db, "users", currentUser.uid, "goals"), {
        name: newGoal.name,
        target: parseInt(newGoal.target),
        saved: 0,
        icon: '🎯',
        createdAt: new Date()
      });
      setNewGoal({ name: '', target: '' });
      setShowAddGoal(false);
    } catch (error) { console.error("Error adding goal:", error); }
  };

  const deleteGoal = async (id) => {
    if (window.confirm("Delete this goal?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "goals", id));
    }
  };

  const handleContribute = async (goalId, currentSaved) => {
    const amountStr = window.prompt(`How much to save? (Available: ₹${availableBalance})`);
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) { alert("Invalid amount"); return; }
    if (amount > availableBalance) { alert("Insufficient funds"); return; }
    try {
      const goalRef = doc(db, "users", currentUser.uid, "goals", goalId);
      await updateDoc(goalRef, { saved: (currentSaved || 0) + amount });
    } catch (error) { console.error("Error updating goal:", error); }
  };

  return (
    <div className="dashboard-layout">
      
      {/* 1. Gamification HUD */}
      <GamificationCard transactions={transactions} income={income} expense={expenses} goals={goals} />

      {/* 2. Top Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Available Balance</h3>
          <div className="value green">₹{availableBalance}</div>
          <p className="sub-text" style={{fontSize: '0.7rem', opacity: 0.7}}>
            (After ₹{totalAllocatedToGoals} saved)
          </p>
        </div>

        {/* Daily Tracker */}
        <div className="stat-card daily-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Today's Spending</h3>
            <span style={{ fontSize: '0.8rem', color: isOverLimit ? '#f43f5e' : '#94a3b8' }}>
              {isOverLimit ? '⚠️ Over Limit' : 'On Track'}
            </span>
          </div>
          <div className="value" style={{ color: isOverLimit ? '#f43f5e' : 'white' }}>
            ₹{spentToday} <span style={{fontSize: '1rem', color:'#64748b'}}>/ ₹{dailyLimit}</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '4px', marginTop: '10px' }}>
            <div style={{ 
              width: `${spendPercent}%`, 
              height: '100%', 
              background: isOverLimit ? '#f43f5e' : '#f59e0b',
              borderRadius: '4px',
              transition: 'width 0.5s ease'
            }}></div>
          </div>
          <p className="sub-text" style={{ marginTop: '8px' }}>
             To last {daysLeft} more days
          </p>
        </div>
      </div>

      {/* Report Card Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => setShowReport(true)}
          style={{
            background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
            border: 'none', padding: '12px 24px', borderRadius: '30px',
            color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(217, 70, 239, 0.4)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          📄 View Monthly Report Card
        </button>
      </div>
      {showReport && <ReportCardModal transactions={transactions} onClose={() => setShowReport(false)} />}

      {/* --- SECTIONS START HERE --- */}

      {/* 1. TRANSACTION HISTORY (Top) */}
      <div style={{ marginBottom: '40px' }}>
        <TransactionHistory />
      </div>

      {/* 2. SQUAD TABS */}
      <SquadTabs />

      {/* 3. SUBSCRIPTION VAULT */}
      <div style={{ marginTop: '30px' }}>
        <SubscriptionVault />
      </div>

      {/* 4. SAVINGS GOALS (Bottom) */}
      <div style={{ marginTop: '40px' }}>
        <div className="section-header">
          <h3>🎯 Savings Goals</h3>
          <button className="add-btn-small" onClick={() => setShowAddGoal(!showAddGoal)}>
            {showAddGoal ? 'Cancel' : '+ New Goal'}
          </button>
        </div>

        {showAddGoal && (
          <form onSubmit={handleAddGoal} className="add-goal-form">
            <input type="text" placeholder="Goal Name" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} />
            <input type="number" placeholder="Target Amount" value={newGoal.target} onChange={e => setNewGoal({...newGoal, target: e.target.value})} />
            <button type="submit">Create Goal</button>
          </form>
        )}

        <div className="goals-grid">
          {goals.length === 0 ? <p className="empty-msg">No goals yet.</p> : goals.map(goal => {
              const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
              return (
                <div key={goal.id} className="goal-card">
                  <div className="goal-top">
                    <span className="goal-icon">{goal.icon}</span>
                    <div style={{display:'flex', gap:'10px'}}>
                      <button onClick={() => handleContribute(goal.id, goal.saved)} style={{background:'#3b82f6', border:'none', borderRadius:'5px', color:'white', cursor:'pointer', padding:'2px 8px', fontSize:'0.8rem'}}>+ Add Funds</button>
                      <button className="delete-x" onClick={() => deleteGoal(goal.id)}>×</button>
                    </div>
                  </div>
                  <h4>{goal.name}</h4>
                  <div className="goal-progress-bg"><div className="goal-progress-fill" style={{ width: `${percent}%` }}></div></div>
                  <div className="goal-stats"><span>₹{goal.saved} saved</span><span>Target: ₹{goal.target}</span></div>
                </div>
              );
          })}
        </div>
      </div>
      
      {/* 5. FLOATING MUSIC PLAYER (Bottom Right) */}
      <BackgroundMusic />
      
    </div>
  );
}

export default StudentView;