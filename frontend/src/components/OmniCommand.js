import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './Dashboard.css';

function OmniCommand({ isOpen, onClose, onToggleGhost }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // --- PARSER ---
  const parseCommand = (text) => {
    const clean = text.trim();
    if (!clean) return { type: 'empty' }; // Return 'empty' to trigger cheatsheet

    // 1. System
    if (clean.toLowerCase() === 'ghost') return { type: 'system', action: 'ghost', msg: '👻 Toggle Ghost Mode' };
    
    // 2. Income ("+5000 salary")
    if (clean.startsWith('+')) {
      const parts = clean.substring(1).split(' ');
      const amount = parseFloat(parts[0]);
      const desc = parts.slice(1).join(' ') || 'Income';
      return { type: 'income', amount, desc, vibe: 'income', msg: `💰 Add Income: ₹${amount} (${desc})` };
    }

    // 3. Expense ("150 Burger #joy")
    let vibe = 'essential';
    let processingText = clean.startsWith('-') ? clean.substring(1) : clean;
    
    if (processingText.includes('#joy') || processingText.includes('#fun')) {
        vibe = 'joy';
        processingText = processingText.replace('#joy', '').replace('#fun', '');
    } else if (processingText.includes('#regret') || processingText.includes('#bad')) {
        vibe = 'regret';
        processingText = processingText.replace('#regret', '').replace('#bad', '');
    }

    const parts = processingText.split(' ').filter(p => p !== '');
    const amount = parseFloat(parts[0]);
    
    if (!isNaN(amount)) {
      const desc = parts.slice(1).join(' ') || 'Expense';
      const vibeIcon = vibe === 'joy' ? '😎' : vibe === 'regret' ? '💀' : '🔥';
      return { type: 'expense', amount, desc, vibe, msg: `💸 Expense: ₹${amount} (${desc}) ${vibeIcon}` };
    }

    return { type: 'unknown', msg: 'Unknown command' };
  };

  const preview = parseCommand(input);

  const executeCommand = async (e) => {
    e.preventDefault();
    if (preview.type === 'unknown' || preview.type === 'empty' || !auth.currentUser) return;

    if (preview.type === 'system') {
      if (preview.action === 'ghost') onToggleGhost();
      onClose();
      setInput('');
      return;
    }

    try {
      await addDoc(collection(db, "users", auth.currentUser.uid, "transactions"), {
        amount: preview.amount,
        description: preview.desc,
        type: preview.type,
        category: 'Quick Add', 
        vibe: preview.vibe,
        date: serverTimestamp()
      });
      onClose();
      setInput('');
    } catch (error) {
      console.error("Omni Error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="omni-overlay" onClick={onClose}>
      <div className="omni-box" onClick={e => e.stopPropagation()}>
        
        {/* INPUT ROW */}
        <form onSubmit={executeCommand} className="omni-input-row">
          <span className="omni-icon">⚡</span>
          <input 
            ref={inputRef}
            className="omni-input" 
            placeholder="Type a command..." 
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        </form>

        {/* CHEATSHEET (Shows only when typing area is empty) */}
        {input.trim() === '' ? (
          <div className="omni-cheatsheet">
            <div className="cheat-group">
              <h4>Transactions</h4>
              <div className="cheat-item"><span className="key-badge">150 Lunch</span> <span>Add Expense</span></div>
              <div className="cheat-item"><span className="key-badge">+5000 Salary</span> <span>Add Income</span></div>
            </div>
            <div className="cheat-group">
              <h4>Power Ups</h4>
              <div className="cheat-item"><span className="key-badge">#joy</span> <span>Tag as "Joy"</span></div>
              <div className="cheat-item"><span className="key-badge">#regret</span> <span>Tag as "Regret"</span></div>
              <div className="cheat-item"><span className="key-badge">ghost</span> <span>Toggle Privacy</span></div>
            </div>
          </div>
        ) : (
          /* PREVIEW (Shows when typing) */
          <div className="omni-hint">
            <span className={
              preview.type === 'income' ? 'cmd-preview' : 
              preview.type === 'expense' ? 'cmd-expense' : 
              preview.type === 'system' ? 'cmd-system' : ''
            }>
              {preview.msg}
            </span>
            <span>Press ↵ Enter</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default OmniCommand;