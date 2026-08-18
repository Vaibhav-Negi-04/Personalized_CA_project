import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import ConfirmationModal from '../ConfirmationModal';
import './StudentView.css';

gsap.registerPlugin(ScrollTrigger);

function StudentView({ onUpdateFinance, onOpenAddTransaction }) {
  const { currentUser } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ name: '', target: '' });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [goalModal, setGoalModal] = useState({ isOpen: false, type: '', goalId: null, currentSaved: 0 });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });
  const [contributionAmount, setContributionAmount] = useState('');

  const mainRef = useRef(null);
  const cardsRef = useRef([]);

  const [seedMonth, setSeedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [seedCount, setSeedCount] = useState(25);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      let mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Only animate cards BELOW the bento grid (the ones you scroll to)
        const deepCards = gsap.utils.toArray('.sv-section .sv-bento-card');
        deepCards.forEach((card, i) => {
          gsap.from(card, {
            scrollTrigger: {
              trigger: card,
              scroller: mainRef.current,
              start: 'top bottom-=80',
              toggleActions: 'play none none reverse',
            },
            y: 60,
            opacity: 0,
            scale: 0.97,
            duration: 0.6,
            ease: 'back.out(1.4)',
            delay: i * 0.04,
          });
        });
      });

      // Hover Physics on stat tiles
      const tiles = gsap.utils.toArray('.sv-stat-tile');
      tiles.forEach((tile) => {
        tile.addEventListener('mouseenter', () => {
          gsap.to(tile, { scale: 1.02, duration: 0.35, ease: 'power2.out' });
        });
        tile.addEventListener('mouseleave', () => {
          gsap.to(tile, { scale: 1, duration: 0.35, ease: 'power2.inOut' });
        });
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const qTransactions = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      orderBy('date', 'desc')
    );
    const unsubTrans = onSnapshot(qTransactions, (snapshot) => {
      const docs = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        };
      });
      setTransactions(docs);
      setIsDataLoaded(true);
    });
    const qGoals = query(collection(db, 'users', currentUser.uid, 'goals'));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      setGoals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubTrans(); unsubGoals(); };
  }, [currentUser]);

  const income = Number(transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2));
  const expenses = Number(transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2));
  const totalAllocatedToGoals = goals.reduce((acc, goal) => acc + (goal.saved || 0), 0);
  const rawBalance = income - expenses;
  const availableBalance = Number(Math.max(0, rawBalance - totalAllocatedToGoals).toFixed(2));

  useEffect(() => {
    if (onUpdateFinance) {
      onUpdateFinance({ balance: availableBalance, income, expense: expenses });
    }
  }, [availableBalance, income, expenses, onUpdateFinance]);

  const today = new Date();
  const spentToday = Number(transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const td = t.date;
      return td.getDate() === today.getDate() && td.getMonth() === today.getMonth() && td.getFullYear() === today.getFullYear();
    })
    .reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2));

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate() + 1;
  const dailyLimit = Math.max(0, (availableBalance + spentToday) / daysLeft).toFixed(0);
  const spendPercent = dailyLimit > 0 ? Math.min(100, (spentToday / dailyLimit) * 100) : 100;
  const isOverLimit = spentToday > dailyLimit;

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target) return;
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'goals'), {
        name: newGoal.name, target: parseInt(newGoal.target), saved: 0, icon: 'target', createdAt: new Date(),
      });
      setNewGoal({ name: '', target: '' });
      setShowAddGoal(false);
    } catch (error) { console.error(error); }
  };

  const deleteGoal = (id) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this goal?',
      onConfirm: async () => {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'goals', id));
      }
    });
  };

  const handleContribute = async (goalId, currentSaved) => {
    const amountStr = window.prompt(`How much to save? (Available: Rs.${availableBalance})`);
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) { alert('Invalid amount'); return; }
    if (amount > availableBalance) { alert('Insufficient funds'); return; }
    try {
      await updateDoc(doc(db, 'users', currentUser.uid, 'goals', goalId), { saved: (currentSaved || 0) + amount });
    } catch (error) { console.error(error); }
  };

  const handleStudentScanSuccess = async (aiData) => {
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
        desc: aiData.merchant || 'Scanned Bill', amount: Number(aiData.total) || 0,
        type: 'expense', category: 'Misc', date: new Date(),
      });
      alert('Expense logged successfully via AI!');
    } catch (e) { console.error(e); }
  };

  const handleSeedDatabase = async () => {
    if (!currentUser) return;
    if (!seedMonth) { alert('Please select a month and year first.'); return; }
    const [yearStr, monthStr] = seedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;
    const countToInject = parseInt(seedCount) || 25;
    const confirm = window.confirm(`Inject ${countToInject} realistic student transactions + build a 7-day streak?`);
    if (!confirm) return;
    const expenseMerchants = ['Zomato', 'Uber', 'Amazon', 'Starbucks', 'Jio Recharge', 'Steam', 'PVR Cinemas', 'Blinkit', 'H&M', 'Gym', 'College Canteen', 'Stationery'];
    const expenseCategories = ['Food/Dining', 'Transport', 'Shopping/Retail', 'Misc', 'Utilities', 'Entertainment'];
    const vibes = ['joy', 'regret', 'essential'];
    const incomeSources = ['Pocket Money', 'Freelance Web Dev', 'UPI Cash Gift', 'Internship Stipend', 'Splitwise Settle'];
    const incomeCategories = ['Allowance', 'Salary', 'Gifts', 'Refund'];
    const daysInM = new Date(year, month + 1, 0).getDate();
    let count = 0;
    try {
      for (let i = 0; i < countToInject; i++) {
        const isExpense = Math.random() > 0.15;
        const randomAmount = isExpense ? Math.floor(Math.random() * 2900) + 100 : Math.floor(Math.random() * 5500) + 6000;
        const randomDesc = isExpense ? expenseMerchants[Math.floor(Math.random() * expenseMerchants.length)] : incomeSources[Math.floor(Math.random() * incomeSources.length)];
        const randomCategory = isExpense ? expenseCategories[Math.floor(Math.random() * expenseCategories.length)] : incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
        const randomDay = Math.floor(Math.random() * daysInM) + 1;
        const payload = { desc: randomDesc, amount: randomAmount, type: isExpense ? 'expense' : 'income', category: randomCategory, date: new Date(year, month, randomDay) };
        if (isExpense) payload.vibe = vibes[Math.floor(Math.random() * vibes.length)];
        await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), payload);
        count++;
      }
      const todayDate = new Date();
      for (let j = 0; j < 7; j++) {
        const streakDate = new Date(todayDate);
        streakDate.setDate(todayDate.getDate() - j);
        await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), { desc: 'Daily Coffee (Streak Builder)', amount: 120, type: 'expense', category: 'Food/Dining', date: streakDate, vibe: 'essential' });
      }
      alert(`Successfully injected ${count} transactions and generated a 7-Day Streak.`);
    } catch (error) { console.error(error); alert('Error seeding data.'); }
  };

  const handleClearMonthData = async () => {
    if (!currentUser) return;
    if (!seedMonth) return alert('Select a month first.');
    const confirm = window.confirm(`WARNING: Delete ALL transactions in ${seedMonth}?`);
    if (!confirm) return;
    const [yearStr, monthStr] = seedMonth.split('-');
    const year = parseInt(yearStr); const month = parseInt(monthStr) - 1;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    try {
      const q = query(collection(db, 'users', currentUser.uid, 'transactions'), where('date', '>=', startDate), where('date', '<=', endDate));
      const qs = await getDocs(q);
      if (qs.empty) return alert(`No transactions found in ${seedMonth}.`);
      await Promise.all(qs.docs.map(document => deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', document.id))));
      alert(`Deleted ${qs.size} transactions from ${seedMonth}.`);
    } catch (error) { console.error(error); }
  };

  const handleNukeDatabase = async () => {
    if (!currentUser) return;
    const confirm1 = window.confirm('DANGER: Wipe every transaction in your account?');
    if (!confirm1) return;
    const confirm2 = window.prompt('Type "NUKE" to confirm.');
    if (confirm2 !== 'NUKE') return alert('Aborted.');
    try {
      const q = query(collection(db, 'users', currentUser.uid, 'transactions'));
      const qs = await getDocs(q);
      await Promise.all(qs.docs.map(document => deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', document.id))));
      alert(`Clean Slate. ${qs.size} total transactions wiped.`);
    } catch (error) { console.error(error); }
  };

  return (
    <main ref={mainRef} className="sv-root">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen} 
        message={confirmModal.message} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
        onConfirm={confirmModal.onConfirm} 
      />
      {/* ============================================================
          XP NAVBAR / LEVEL SYSTEM (Now serves as main header)
          ============================================================ */}
      <section className="sv-section" style={{ paddingBottom: 0, marginTop: '-1rem' }}>
        <GamificationCard 
          transactions={transactions} 
          income={income} 
          expense={expenses} 
          goals={goals} 
          onOpenAddTransaction={onOpenAddTransaction}
        />
      </section>

      {/* ============================================================
          Vital Stats — everything at the top, one unified grid
          ============================================================ */}
      <section className="sv-bento-section">
        {!isDataLoaded ? (
          <div className="sv-bento-grid" style={{ gap: '20px' }}>
            <div className="sv-bento-card sv-span-col-2 sv-span-row-1" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
            <div className="sv-bento-card sv-span-col-2 sv-span-row-2" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-card" style={{ height: '100px' }}></div>
            </div>
            <div className="sv-bento-card sv-span-col-2 sv-span-row-1" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
            <div className="sv-bento-card sv-span-col-1 sv-span-row-1">
              <div className="skeleton skeleton-circle"></div>
              <div className="skeleton skeleton-text" style={{ marginTop: '10px' }}></div>
            </div>
            <div className="sv-bento-card sv-span-col-1 sv-span-row-1">
              <div className="skeleton skeleton-circle"></div>
              <div className="skeleton skeleton-text" style={{ marginTop: '10px' }}></div>
            </div>
          </div>
        ) : (
          <div className="sv-bento-grid">

            {/* TILE 1 — Available Balance (col-span-2 row-span-1) */}
            <div className="sv-bento-card sv-stat-tile sv-tile-balance sv-span-col-2 sv-span-row-1">
            <div className="sv-tile-tag">Available Balance</div>
            <div className="sv-tile-value" style={{ color: '#8b5cf6' }}>
              <span className="privacy-blur">Rs.{availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <p className="sv-tile-sub">After <span className="privacy-blur">Rs.{totalAllocatedToGoals.toLocaleString('en-IN')}</span> saved</p>
          </div>

          {/* TILE 2 — Daily Spending (col-span-2 row-span-2) */}
          <div className="sv-bento-card sv-stat-tile sv-tile-spending sv-span-col-2 sv-span-row-2">
            <div className="sv-tile-tag" aria-live="polite">{isOverLimit ? 'Over Limit' : 'On Track'}</div>
            <h2 className="sv-tile-heading">Today</h2>
            <div className="sv-tile-value" style={{ color: isOverLimit ? '#f43f5e' : '#8b5cf6' }}>
              <span className="privacy-blur">Rs.{spentToday.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <p className="sv-tile-sub">
              of <span className="privacy-blur">Rs.{Number(dailyLimit).toLocaleString('en-IN')}</span> daily limit
            </p>
            <div 
              className="sv-progress-rail" 
              role="progressbar" 
              aria-valuenow={Math.min(100, spendPercent)} 
              aria-valuemin="0" 
              aria-valuemax="100" 
              aria-label="Daily spending limit"
            >
              <div className="sv-progress-fill" style={{ width: `${spendPercent}%`, background: isOverLimit ? '#f43f5e' : 'linear-gradient(90deg, #6366f1, #10b981)' }} />
            </div>
            <p className="sv-tile-footnote">{daysLeft} days remaining this month</p>
          </div>

          {/* TILE 2 — Income (col-span-2 row-span-1) */}
          <div className="sv-bento-card sv-stat-tile sv-tile-income sv-span-col-2 sv-span-row-1">
            <div className="sv-tile-tag">Income</div>
            <h2 className="sv-tile-heading">This Month</h2>
            <div className="sv-tile-value sv-green privacy-blur">
              Rs.{income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="sv-tile-sub">Total earned this period</p>
          </div>

          {/* TILE 3 — Expenses (col-span-1 row-span-1) */}
          <div className="sv-bento-card sv-stat-tile sv-tile-expenses sv-span-col-1 sv-span-row-1">
            <div className="sv-tile-tag">Spent</div>
            <div className="sv-tile-value sv-red privacy-blur">
              Rs.{expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="sv-tile-sub">Total expenses</p>
          </div>

          {/* TILE 4 — Goals (col-span-1 row-span-1) */}
          <div className="sv-bento-card sv-stat-tile sv-tile-goals sv-span-col-1 sv-span-row-1">
            <div className="sv-tile-tag">Goals</div>
            <h2 className="sv-tile-heading">Active Targets</h2>
            <div className="sv-tile-value">{goals.length}</div>
            <p className="sv-tile-sub">Active savings targets</p>
          </div>
          </div>
        )}
      </section>



      {/* ============================================================
          DESIRE — Card Stacking scroll sequence
          ============================================================ */}
      <section className="sv-section">
        <h2 className="sv-section-title">Intelligence</h2>
        <div className="sv-stack-grid">
          <div className="sv-bento-card">
            <AIInsightBox balance={availableBalance} transactions={transactions} />
          </div>
          <div className="sv-bento-card">
            <PredictionCard transactions={transactions} />
          </div>
        </div>
      </section>

      <section className="sv-section">
        <h2 className="sv-section-title">Behaviour</h2>
        <div className="sv-stack-grid">
          <div className="sv-bento-card"><VibeCheckCard transactions={transactions} /></div>
          <div className="sv-bento-card"><QuestCard transactions={transactions} /></div>
        </div>
      </section>

      <section className="sv-section">
        <h2 className="sv-section-title">Heatmap</h2>
        <div className="sv-bento-card">
          <ExpenseHeatmap transactions={transactions} />
        </div>
      </section>

      <section className="sv-section">
        <h2 className="sv-section-title">History</h2>
        <div className="sv-bento-card">
          <TransactionHistory transactions={transactions} />
        </div>
      </section>

      <section className="sv-section">
        <h2 className="sv-section-title">Subscriptions</h2>
        <div className="sv-bento-card"><SubscriptionVault /></div>
        <div className="sv-bento-card" style={{ marginTop: '1.5rem' }}><SquadTabs /></div>
      </section>

      <section className="sv-section">
        <h2 className="sv-section-title">Cryo Chamber</h2>
        <div className="sv-bento-card"><CryoChamber /></div>
      </section>

      {/* ============================================================
          ACTION — Goals + Report CTA
          ============================================================ */}
      <section className="sv-section sv-goals-section">
        <div className="sv-goals-header">
          <h2 className="sv-section-title">Savings Goals</h2>
          <div className="sv-goals-actions">
            <button className="sv-btn-ghost" onClick={() => setShowAddGoal(!showAddGoal)}>
              {showAddGoal ? 'Cancel' : '+ New Goal'}
            </button>
            <button className="sv-btn-primary" onClick={() => setShowReport(true)}>
              Monthly Report
            </button>
          </div>
        </div>
        {showReport && <ReportCardModal transactions={transactions} onClose={() => setShowReport(false)} />}

        {showAddGoal && (
          <form onSubmit={handleAddGoal} className="sv-goal-form">
            <input className="sv-input" type="text" placeholder="Goal Name" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} />
            <input className="sv-input" type="number" placeholder="Target Amount (Rs.)" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} />
            <button type="submit" className="sv-btn-primary">Create Goal</button>
          </form>
        )}

        <div className="sv-goals-grid" role="list">
          {goals.length === 0 ? (
            <p className="sv-empty">No goals yet. Create one above.</p>
          ) : goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
            const remaining = goal.target - goal.saved;
            const effectiveSavingsRate = Math.max(500, availableBalance);
            const monthsToGo = remaining > 0 ? (remaining / effectiveSavingsRate).toFixed(1) : 0;
            let timeString = '';
            if (remaining <= 0) timeString = 'Goal Reached';
            else if (monthsToGo > 12) timeString = `~${(monthsToGo / 12).toFixed(1)} years`;
            else timeString = `~${monthsToGo} months`;
            return (
              <div key={goal.id} className="sv-bento-card sv-goal-card" role="listitem">
                <div className="sv-goal-header">
                  <h3 className="sv-goal-name">{goal.name}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="sv-btn-xs" onClick={() => handleContribute(goal.id, goal.saved)}>+ Add</button>
                    <button className="sv-btn-xs sv-danger" onClick={() => deleteGoal(goal.id)}>x</button>
                  </div>
                </div>
                <div 
                  className="sv-progress-rail" 
                  style={{ marginTop: '12px' }}
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`${goal.name} progress`}
                >
                  <div className="sv-progress-fill" style={{ width: `${percent}%` }} />
                </div>
                <div className="sv-goal-stats">
                  <span className="privacy-blur">Rs.{goal.saved} / Rs.{goal.target}</span>
                  <span className="sv-goal-time">{timeString}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sv-section">
        <h2 className="sv-section-title">Receipt Scanner</h2>
        <p className="sv-section-sub">Upload a receipt and AI will instantly log the expense.</p>
        <div className="sv-bento-card">
          <AIReceiptScanner onScanSuccess={handleStudentScanSuccess} />
        </div>
      </section>

      <BackgroundMusic />

      {/* Developer Tools */}
      <div className="sv-devtools"
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.1}
      >
        <input type="month" value={seedMonth} onChange={e => setSeedMonth(e.target.value)} className="sv-dev-input" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="sv-dev-label">Qty:</span>
          <input type="number" value={seedCount} onChange={e => setSeedCount(e.target.value)} className="sv-dev-input" style={{ width: '50px' }} min="1" max="100" />
        </div>
        <button onClick={handleSeedDatabase} className="sv-dev-btn sv-dev-green">+ Inject</button>
        <button onClick={handleClearMonthData} className="sv-dev-btn sv-dev-red">- Clear Month</button>
        <button onClick={handleNukeDatabase} className="sv-dev-btn sv-dev-nuke">Nuke All</button>
      </div>
    </main>
  );
}

export default StudentView;