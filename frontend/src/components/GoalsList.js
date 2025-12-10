import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import AddGoalModal from './AddGoalModal';
import './Goals.css';

// Accept the new prop 'smartSavings'
function GoalsList({ smartSavings = 0 }) {
  const [goals, setGoals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, "users", userId, "goals"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoals(goalsData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddFunds = async (goalId) => {
    let amountToAdd = 0;

    // --- SMART SAVINGS LOGIC ---
    // If they have "Smart Savings" (money unspent today), offer it!
    if (smartSavings > 0) {
      const useSmart = window.confirm(
        `🎉 You are ₹${smartSavings} under your daily limit!\n\nClick OK to add this savings to your goal.\nClick Cancel to enter a custom amount.`
      );
      
      if (useSmart) {
        amountToAdd = smartSavings;
      } else {
        const input = prompt("Enter custom amount to save:");
        amountToAdd = parseFloat(input);
      }
    } else {
      // Standard logic if no smart savings
      const input = prompt("How much do you want to save towards this goal?");
      amountToAdd = parseFloat(input);
    }

    // Proceed if valid amount
    if (amountToAdd && amountToAdd > 0) {
      const userId = auth.currentUser?.uid;
      const goalRef = doc(db, "users", userId, "goals", goalId);
      
      await updateDoc(goalRef, {
        savedAmount: increment(amountToAdd)
      });
    }
  };

  return (
    <div className="goals-container">
      <div className="goals-header">
        <h3>🎯 Savings Goals</h3>
        <button className="add-goal-btn" onClick={() => setIsModalOpen(true)}>+ New</button>
      </div>

      {goals.length === 0 ? (
        <p className="no-goals">No active goals.</p>
      ) : (
        goals.map(goal => {
          const percent = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
          
          return (
            <div key={goal.id} className="goal-item">
              <div className="goal-info">
                <span className="goal-title">{goal.title}</span>
                <span className="goal-amount">₹{goal.savedAmount} / ₹{goal.targetAmount}</span>
              </div>
              
              <div className="progress-row" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div className="progress-bg" style={{flex: 1}}>
                  <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                </div>
                
                {/* Smart Button: Glows if savings available */}
                <button 
                  className={`mini-add-btn ${smartSavings > 0 ? 'glow' : ''}`}
                  onClick={() => handleAddFunds(goal.id)}
                  title={smartSavings > 0 ? `Quick add ₹${smartSavings}` : "Add savings"}
                  style={smartSavings > 0 ? { boxShadow: '0 0 10px #10b981', border: '1px solid #10b981' } : {}}
                >
                  +
                </button>
              </div>
            </div>
          );
        })
      )}

      <AddGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default GoalsList;