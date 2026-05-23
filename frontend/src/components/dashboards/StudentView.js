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
  updateDoc,
  getDocs,
  where
} from 'firebase/firestore'; 

// --- COMPONENTS ---
import TransactionHistory from '../TransactionHistory';
import AIInsightBox from '../AIInsightBox';
import GamificationCard from '../GamificationCard';
import ReportCardModal from '../ReportCardModal';
import SquadTabs from '../SquadTabs';
import SubscriptionVault from '../SubscriptionVault';
import BackgroundMusic from '../BackgroundMusic';
import PredictionCard from '../PredictionCard';
import QuestCard from '../QuestCard';
import ExpenseHeatmap from '../ExpenseHeatmap';
import VibeCheckCard from '../VibeCheckCard';
import CryoChamber from '../CryoChamber'; 
import AIReceiptScanner from '../AIReceiptScanner';

function StudentView({ onUpdateFinance }) { 
  const { currentUser } = useAuth();
  
  // --- STATE ---
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]); 
  const [newGoal, setNewGoal] = useState({ name: '', target: '' });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  // 🌟 DEV TOOL STATES
  const [seedMonth, setSeedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [seedCount, setSeedCount] = useState(25); 

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

  // --- 2. CALCULATE FINANCIALS (FIXED DECIMALS) ---
  const income = Number(transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2));

  const expenses = Number(transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2));

  const totalAllocatedToGoals = goals.reduce((acc, goal) => acc + (goal.saved || 0), 0);
  const rawBalance = income - expenses;
  const availableBalance = Number(Math.max(0, rawBalance - totalAllocatedToGoals).toFixed(2));

  // ---  3. REPORT DATA TO PARENT DASHBOARD ---
  useEffect(() => {
    if (onUpdateFinance) {
      onUpdateFinance({
        balance: availableBalance,
        income: income,
        expense: expenses
      });
    }
  }, [availableBalance, income, expenses, onUpdateFinance]);

  // --- DAILY LIMIT LOGIC ---
  const today = new Date();
  const spentToday = Number(transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const tDate = t.date;
      return (
        tDate.getDate() === today.getDate() &&
        tDate.getMonth() === today.getMonth() &&
        tDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2));

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

  const handleStudentScanSuccess = async (aiData) => {
    try {
      await addDoc(collection(db, "users", currentUser.uid, "transactions"), {
        desc: aiData.merchant || "Scanned Bill",
        amount: Number(aiData.total) || 0,
        type: 'expense',
        category: 'Misc',
        date: new Date() 
      });
      alert("Expense logged successfully via AI!");
    } catch(e) {
      console.error(e);
      alert("Error saving expense to Firebase.");
    }
  };

  // =========================================
  // 🛠️ DEVELOPER TOOLS (CRUD OPERATIONS)
  // =========================================

  // 1. INJECT DYNAMIC DATA (WITH STREAK BUILDER)
  const handleSeedDatabase = async () => {
    if (!currentUser) return;
    if (!seedMonth) {
      alert("Please select a month and year first.");
      return;
    }

    const [yearStr, monthStr] = seedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; 
    const countToInject = parseInt(seedCount) || 25;

    const confirm = window.confirm(`Inject ${countToInject} realistic student transactions + build a 7-day streak?`);
    if (!confirm) return;

    const expenseMerchants = ["Zomato", "Uber", "Amazon", "Starbucks", "Jio Recharge", "Steam", "PVR Cinemas", "Blinkit", "H&M", "Gym", "College Canteen", "Stationery"];
    const expenseCategories = ["Food/Dining", "Transport", "Shopping/Retail", "Misc", "Utilities", "Entertainment"];
    const vibes = ["joy", "regret", "essential"]; 
    
    const incomeSources = ["Pocket Money", "Freelance Web Dev", "UPI Cash Gift", "Internship Stipend", "Splitwise Settle"];
    const incomeCategories = ["Allowance", "Salary", "Gifts", "Refund"];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;

    try {
      // --- PART A: The Random Scatter Data ---
      for (let i = 0; i < countToInject; i++) {
        const isExpense = Math.random() > 0.15; 
        
        const randomAmount = isExpense 
          ? Math.floor(Math.random() * 2900) + 100 
          : Math.floor(Math.random() * 5500) + 6000; 

        const randomDesc = isExpense 
          ? expenseMerchants[Math.floor(Math.random() * expenseMerchants.length)]
          : incomeSources[Math.floor(Math.random() * incomeSources.length)];

        const randomCategory = isExpense 
          ? expenseCategories[Math.floor(Math.random() * expenseCategories.length)]
          : incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
        
        const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
        const randomDate = new Date(year, month, randomDay);

        const payload = {
          desc: randomDesc,
          amount: randomAmount,
          type: isExpense ? "expense" : "income",
          category: randomCategory,
          date: randomDate
        };

        if (isExpense) {
          payload.vibe = vibes[Math.floor(Math.random() * vibes.length)];
        }

        await addDoc(collection(db, "users", currentUser.uid, "transactions"), payload);
        count++;
      }

      // --- PART B: THE STREAK BUILDER 🔥 ---
      // Forces 7 consecutive days of activity leading right up to TODAY
      const todayDate = new Date();
      for (let j = 0; j < 7; j++) {
        const streakDate = new Date(todayDate);
        streakDate.setDate(todayDate.getDate() - j); // Goes back j days

        await addDoc(collection(db, "users", currentUser.uid, "transactions"), {
          desc: "Daily Coffee (Streak Builder)",
          amount: 120,
          type: "expense",
          category: "Food/Dining",
          date: streakDate,
          vibe: "essential"
        });
      }

      alert(`✅ Successfully injected ${count} transactions AND generated a 7-Day Streak!`);
    } catch (error) {
      console.error("Error seeding database:", error);
      alert("Error seeding data.");
    }
  };

  // 2. CLEAR SPECIFIC MONTH
  const handleClearMonthData = async () => {
    if (!currentUser) return;
    if (!seedMonth) return alert("Select a month first.");

    const confirm = window.confirm(`⚠️ WARNING: Delete ALL transactions in ${seedMonth}?`);
    if (!confirm) return;

    const [yearStr, monthStr] = seedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; 
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    try {
      const q = query(
        collection(db, "users", currentUser.uid, "transactions"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return alert(`No transactions found in ${seedMonth}.`);

      const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, "users", currentUser.uid, "transactions", document.id)));
      await Promise.all(deletePromises);
      alert(`🗑️ Deleted ${querySnapshot.size} transactions from ${seedMonth}.`);
    } catch (error) {
      console.error("Error clearing month:", error);
    }
  };

  // 3. THE NUKE BUTTON (Total Reset)
  const handleNukeDatabase = async () => {
    if (!currentUser) return;
    const confirm1 = window.confirm(`☢️ DANGER: You are about to wipe EVERY transaction in your account. Proceed?`);
    if (!confirm1) return;
    const confirm2 = window.prompt('Type "NUKE" to confirm complete deletion of all history.');
    if (confirm2 !== "NUKE") return alert("Database nuke aborted.");

    try {
      const q = query(collection(db, "users", currentUser.uid, "transactions"));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, "users", currentUser.uid, "transactions", document.id)));
      await Promise.all(deletePromises);
      alert(`☢️ Clean Slate. ${querySnapshot.size} total transactions wiped.`);
    } catch (error) {
      console.error("Error nuking database:", error);
    }
  };

  // =========================================

  return (
    <div className="dashboard-layout">
      
      {/* ZONE 1: THE HUD */}
      <div className="section-hud" style={{ marginBottom: '20px' }}>
        <GamificationCard transactions={transactions} income={income} expense={expenses} goals={goals} />
      </div>

      {/* ZONE 2: VITAL SIGNS */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <h3>Available Balance</h3>
          <div className="value green privacy-blur">
  ₹{availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}
</div>
          <p className="sub-text" style={{fontSize: '0.7rem', opacity: 0.7}}>
            (After <span className="privacy-blur">₹{totalAllocatedToGoals.toLocaleString('en-IN')}</span> saved)
          </p>
        </div>

        <div className="stat-card daily-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Today's Spending</h3>
            <span style={{ fontSize: '0.8rem', color: isOverLimit ? '#f43f5e' : '#94a3b8' }}>
              {isOverLimit ? '⚠️ Over Limit' : 'On Track'}
            </span>
          </div>
          <div className="value" style={{ color: isOverLimit ? '#f43f5e' : 'white' }}>
            <span className="privacy-blur">₹{spentToday.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}</span> <span style={{fontSize: '1rem', color:'#64748b'}}>/ <span className="privacy-blur">₹{Number(dailyLimit).toLocaleString('en-IN')}</span></span>
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

      {/* Utility Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
        <button 
          onClick={() => setShowReport(true)}
          style={{
            background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
            border: 'none', padding: '10px 20px', borderRadius: '30px',
            color: 'white', fontWeight: 'bold', fontSize: '0.85rem',
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(217, 70, 239, 0.4)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          📄 View Monthly Report Card
        </button>
      </div>
      {showReport && <ReportCardModal transactions={transactions} onClose={() => setShowReport(false)} />}

      <div style={{ marginBottom: '30px' }}>
          <AIInsightBox balance={availableBalance} transactions={transactions} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
         <div style={{ flex: 1 }}><VibeCheckCard transactions={transactions} /></div>
         <div style={{ flex: 1 }}><QuestCard transactions={transactions} /></div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <PredictionCard transactions={transactions} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <div className="section-header">
          <h3>🤖 Quick Scan Expense</h3>
        </div>
        <p style={{color: '#94a3b8', fontSize: '0.85rem', marginBottom: '10px'}}>Upload a picture of a receipt and the AI will instantly log it as an expense!</p>
        <AIReceiptScanner onScanSuccess={handleStudentScanSuccess} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <ExpenseHeatmap transactions={transactions} />
        <div style={{ marginTop: '20px' }}>
          <TransactionHistory transactions={transactions} />
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <SubscriptionVault />
        <SquadTabs />
      </div>
        
      <div style={{ marginBottom: '40px' }}>
         <CryoChamber />
      </div>

      <div style={{ marginBottom: '100px' }}>
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
              const remaining = goal.target - goal.saved;
              const effectiveSavingsRate = Math.max(500, availableBalance);
              const monthsToGo = remaining > 0 ? (remaining / effectiveSavingsRate).toFixed(1) : 0;
              
              let timeString = "";
              if (remaining <= 0) timeString = "🎉 Goal Reached!";
              else if (monthsToGo > 12) timeString = `⏱️ ~${(monthsToGo/12).toFixed(1)} years`;
              else timeString = `⏱️ ~${monthsToGo} months`;

              return (
                <div key={goal.id} className="goal-card" style={{ position: 'relative', paddingBottom: '35px' }}>
                  <div className="goal-top">
                    <span className="goal-icon">{goal.icon}</span>
                    <div style={{display:'flex', gap:'10px'}}>
                      <button onClick={() => handleContribute(goal.id, goal.saved)} style={{background:'#3b82f6', border:'none', borderRadius:'5px', color:'white', cursor:'pointer', padding:'2px 8px', fontSize:'0.8rem'}}>+ Add</button>
                      <button className="delete-x" onClick={() => deleteGoal(goal.id)}>×</button>
                    </div>
                  </div>
                  
                  <h4>{goal.name}</h4>
                  
                  <div className="goal-progress-bg">
                    <div className="goal-progress-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                  
                  <div className="goal-stats">
                    <span><span className="privacy-blur">₹{goal.saved}</span> / <span className="privacy-blur">₹{goal.target}</span></span>
                    <span>{percent}%</span>
                  </div>

                  {remaining > 0 && (
                    <div style={{
                      position: 'absolute', bottom: '8px', left: '15px',
                      fontSize: '0.75rem', color: '#fbbf24', 
                      background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '4px',
                      display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                       {timeString} <span style={{color:'#64748b', fontSize:'0.7rem'}}>(at current pace)</span>
                    </div>
                  )}
                </div>
              );
          })}
        </div>
      </div>
      
      <BackgroundMusic />

      {/* =======================================================
          🛠️ DISCRETE CRUD DEV TOOLS (HIDDEN AT BOTTOM)
          ======================================================= */}
      <div 
        style={{ 
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap',
          marginTop: '50px', marginBottom: '20px', 
          opacity: 0.15, transition: 'opacity 0.3s', cursor: 'default'
        }} 
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.15}
      >
         <input 
           type="month" 
           value={seedMonth} 
           onChange={(e) => setSeedMonth(e.target.value)} 
           style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #475569', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}
         />
         
         <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
           <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Qty:</span>
           <input 
             type="number" 
             value={seedCount} 
             onChange={(e) => setSeedCount(e.target.value)} 
             style={{ width: '50px', background: 'rgba(255,255,255,0.05)', border: '1px solid #475569', color: '#94a3b8', padding: '4px', borderRadius: '4px', fontSize: '0.75rem' }}
             min="1" max="100"
           />
         </div>

         <button 
           onClick={handleSeedDatabase}
           style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
         >
           + Inject Data
         </button>
         
         <button 
           onClick={handleClearMonthData}
           style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
         >
           - Clear Month
         </button>

         <button 
           onClick={handleNukeDatabase}
           style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', marginLeft: '10px' }}
         >
           ☢️ Nuke All
         </button>
      </div>
      
    </div>
  );
}

export default StudentView;