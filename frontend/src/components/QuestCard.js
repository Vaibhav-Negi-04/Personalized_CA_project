import React, { useState, useEffect } from 'react';
import './Dashboard.css'; // Ensure CSS is imported

function QuestCard({ transactions }) {
  const [quests, setQuests] = useState([]);

  // 1. Generate Quests based on Today's Date
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const savedQuests = JSON.parse(localStorage.getItem('dailyQuests'));
    
    if (savedQuests && savedQuests.date === todayStr) {
      setQuests(savedQuests.items);
    } else {
      const newQuests = [
        { id: 1, title: "The Zero Day", desc: "Spend ₹0 today", target: 0, type: 'spend_limit', reward: 500, completed: false },
        { id: 2, title: "Coffee Break", desc: "Spend < ₹50 on Food", target: 50, type: 'category_limit', category: 'Food', reward: 200, completed: false },
        { id: 3, title: "Saver's Sprint", desc: "Add 1 transaction", target: 1, type: 'action_count', reward: 100, completed: false }
      ];
      setQuests(newQuests);
      localStorage.setItem('dailyQuests', JSON.stringify({ date: todayStr, items: newQuests }));
    }
  }, []);

  // 2. Check Progress Logic
  const checkProgress = (quest) => {
    if (quest.completed) return true;

    const today = new Date();
    const todaysTxns = transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return d.toDateString() === today.toDateString();
    });

    if (quest.type === 'spend_limit') {
      const spent = todaysTxns.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
      return spent === 0 && todaysTxns.length > 0; // Logic tweak: assumes day end or manual check? For now we check if valid
    }
    if (quest.type === 'category_limit') {
      const foodSpent = todaysTxns.filter(t => t.category === quest.category && t.type === 'expense').reduce((acc,t)=>acc+Number(t.amount),0);
      return foodSpent < quest.target && foodSpent > 0;
    }
    if (quest.type === 'action_count') {
      return todaysTxns.length >= quest.target;
    }
    return false;
  };

  return (
    <div className="quest-glass-card">
      <div className="quest-header">
        <span>⚔️ Daily Side Quests</span>
      </div>
      
      <div>
        {quests.map(quest => {
          const isDone = checkProgress(quest); 
          
          return (
            <div key={quest.id} className={`quest-item ${isDone ? 'completed' : ''}`}>
              <div>
                <div className="quest-title">
                  {quest.title} 
                  {isDone && <span className="check-icon">✓</span>}
                </div>
                <div className="quest-desc">{quest.desc}</div>
              </div>
              
              <div>
                 <span className="quest-reward">+{quest.reward} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuestCard;