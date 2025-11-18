import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './AddTransaction.css';

function AddTransactionModal({ isOpen, onClose, userType, refreshData }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(''); // NEW: Category State
  const [type, setType] = useState('expense');
  const [loading, setLoading] = useState(false);

  // --- Pre-defined Categories ---
  const expenseCategories = [
    'Food 🍔', 'Travel 🚕', 'Rent 🏠', 'Shopping 🛍️', 
    'Bills 💡', 'Fun 🎉', 'Education 📚', 'Health 🏥', 'Other 🤷‍♂️'
  ];

  const incomeCategories = [
    'Salary 💰', 'Allowance 💵', 'Freelance 💻', 
    'Gift 🎁', 'Investment 📈', 'Other 🤷‍♂️'
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, "users", userId);
      const numAmount = parseFloat(amount);

      // 1. Update Totals
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
      await updateDoc(userRef, updates);

      // 2. Add Transaction to History (Now with Category!)
      await addDoc(collection(db, "users", userId, "transactions"), {
        amount: numAmount,
        description: description,
        category: category || 'Uncategorized', // Save the category
        type: type,
        date: serverTimestamp(),
      });

      setLoading(false);
      setAmount('');
      setDescription('');
      setCategory(''); // Reset category
      refreshData();
      onClose();

    } catch (error) {
      console.error("Error adding transaction:", error);
      setLoading(false);
    }
  };

  // Helper to handle chip click
  const handleChipClick = (catName) => {
    setCategory(catName);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{type === 'income' ? 'Add Money 💰' : 'Add Expense 💸'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type Toggle */}
          <div className="type-toggle">
            <button 
              type="button"
              className={`toggle-btn ${type === 'income' ? 'active income' : ''}`}
              onClick={() => { setType('income'); setCategory(''); }} // Reset category on switch
            >
              Income
            </button>
            <button 
              type="button"
              className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => { setType('expense'); setCategory(''); }}
            >
              Expense
            </button>
          </div>

          {/* Amount */}
          <div className="input-group">
            <label>Amount (₹)</label>
            <input 
              type="number" 
              className="money-input" 
              placeholder="0" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* NEW: Category Chips */}
          <div className="category-section">
            <span className="category-label">Category</span>
            <div className="chips-container">
              {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                <div 
                  key={cat} 
                  className={`chip ${category === cat ? 'active' : ''}`}
                  onClick={() => handleChipClick(cat)}
                >
                  {cat}
                </div>
              ))}
            </div>
            {/* Manual Category Input */}
            <input 
              type="text" 
              className="text-input" 
              placeholder="Or type custom category..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="input-group">
            <label>Description (Optional)</label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="Add a note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;