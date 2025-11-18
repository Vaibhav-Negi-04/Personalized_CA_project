import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import AddGoalModal from './AddGoalModal';
import './Goals.css';

function GoalsList() {
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

  // --- NEW FUNCTION: Add money to a goal ---
  const handleAddFunds = async (goalId) => {
    const amountStr = prompt("How much do you want to save towards this goal?");
    const amount = parseFloat(amountStr);

    if (amount && amount > 0) {
      const userId = auth.currentUser?.uid;
      const goalRef = doc(db, "users", userId, "goals", goalId);
      
      // Update Firebase
      await updateDoc(goalRef, {
        savedAmount: increment(amount)
      });
      
      // Optional: You could also deduct this from your 'Remaining Allowance' here if you wanted!
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
                {/* The Button to Add Money */}
                <button 
                  className="mini-add-btn" 
                  onClick={() => handleAddFunds(goal.id)}
                  title="Add savings"
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