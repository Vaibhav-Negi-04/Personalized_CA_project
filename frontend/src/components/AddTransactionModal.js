import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './AddTransaction.css';

function AddTransactionModal({ isOpen, onClose, userType, refreshData }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(''); 
  const [type, setType] = useState('expense');
  const [vibe, setVibe] = useState('essential'); 
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Categories
  const expenseCategories = ['Food 🍔', 'Travel 🚕', 'Rent 🏠', 'Shopping 🛍️', 'Bills 💡', 'Fun 🎉', 'Education 📚', 'Health 🏥', 'Other 🤷‍♂️'];
  const incomeCategories = ['Salary 💰', 'Allowance 💵', 'Freelance 💻', 'Gift 🎁', 'Investment 📈', 'Other 🤷‍♂️'];

  if (!isOpen) return null;

  // Theme Logic
  const getThemeClass = () => {
    if (userType === 'Individual') return 'modal-theme-wealth';
    if (userType === 'Business') return 'modal-theme-business';
    return 'modal-theme-student';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🕵️ DEBUG 1: Check Auth
    if (!auth.currentUser) {
        alert("❌ Error: You are not logged in!");
        setLoading(false);
        return;
    }

    const userId = auth.currentUser.uid;
    console.log("🔍 [Debug] Saving transaction for User ID:", userId);

    try {
      const userRef = doc(db, "users", userId);
      const numAmount = parseFloat(amount);

      // 1. Prepare Totals Update
      let updates = {};
      if (type === 'income') {
        if (userType === 'Student') updates = { monthlyAllowance: increment(numAmount) };
        else if (userType === 'Business') updates = { totalRevenue: increment(numAmount), netProfit: increment(numAmount) };
        else updates = { totalIncome: increment(numAmount) };
      } else {
        if (userType === 'Student') updates = { totalSpent: increment(numAmount) };
        else if (userType === 'Business') updates = { totalExpenses: increment(numAmount), netProfit: increment(-numAmount) };
        else updates = { totalExpenses: increment(numAmount) };
      }
      
      console.log("1️⃣ [Debug] Updating Totals with:", updates);
      await updateDoc(userRef, updates);

      // 2. Prepare Transaction Doc
      const transData = {
        amount: numAmount,
        description: description || "No Description",
        category: category || 'Uncategorized',
        type: type,
        // Only save vibe for Student Expenses, else null
        vibe: (type === 'expense' && userType === 'Student') ? vibe : null, 
        date: serverTimestamp(),
      };

      console.log("2️⃣ [Debug] Adding Transaction Doc:", transData);
      await addDoc(collection(db, "users", userId, "transactions"), transData);

      console.log("✅ [Debug] SUCCESS! Transaction Saved to Firebase.");
      
      setLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        setAmount('');
        setDescription('');
        setCategory('');
        setVibe('essential'); 
        setIsSuccess(false);
        if (refreshData) refreshData();
        onClose();
      }, 1500);

    } catch (error) {
      console.error("🔥 [Debug] FATAL ERROR:", error);
      alert("Error saving: " + error.message);
      setLoading(false);
    }
  };

  const handleChipClick = (catName) => {
    setCategory(catName);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${getThemeClass()}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{type === 'income' ? 'Add Money 💰' : 'Add Expense 💸'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Toggle */}
          <div className="type-toggle">
            <button type="button" className={`toggle-btn ${type === 'income' ? 'active income' : ''}`} onClick={() => setType('income')}>Income</button>
            <button type="button" className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`} onClick={() => setType('expense')}>Expense</button>
          </div>

          {/* Amount */}
          <div className="input-group">
            <label>Amount (₹)</label>
            <input type="number" className="money-input" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
          </div>

          {/* Categories */}
          <div className="category-section">
            <span className="category-label">Category</span>
            <div className="chips-container">
              {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                <div key={cat} className={`chip ${category === cat ? 'active' : ''}`} onClick={() => handleChipClick(cat)}>{cat}</div>
              ))}
            </div>
            <input type="text" className="text-input" placeholder="Custom category..." value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>

          {/* Description */}
          <div className="input-group">
            <label>Description</label>
            <input type="text" className="text-input" placeholder="Add a note..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Vibe Check (Student Only) */}
          {type === 'expense' && userType === 'Student' && (
            <div className="input-group">
              <label>How did this spending feel?</label>
              <div className="vibe-group">
                <div className={`vibe-btn vibe-essential ${vibe === 'essential' ? 'selected' : ''}`} onClick={() => setVibe('essential')}>
                  <span>🔥</span><p>Essential</p>
                </div>
                <div className={`vibe-btn vibe-joy ${vibe === 'joy' ? 'selected' : ''}`} onClick={() => setVibe('joy')}>
                  <span>😎</span><p>Joy</p>
                </div>
                <div className={`vibe-btn vibe-regret ${vibe === 'regret' ? 'selected' : ''}`} onClick={() => setVibe('regret')}>
                  <span>💀</span><p>Regret</p>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="save-btn" disabled={loading || !amount}>
            {loading ? 'Processing...' : 'Save Transaction'}
          </button>
        </form>
        
        {isSuccess && (
          <div className="success-overlay" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(6, 182, 212, 0.9)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            borderRadius: 'inherit', color: 'white', zIndex: 10, animation: 'fadeIn 0.3s forwards'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation: 'scaleIn 0.5s var(--ease-spring)'}}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h2 style={{marginTop: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>Saved!</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddTransactionModal;