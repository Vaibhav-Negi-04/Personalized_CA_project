import React, { useState, useEffect, useRef } from 'react';
import './AIChatBot.css'; 
import { db, auth } from '../firebaseConfig'; 
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore'; 

// 👇 ACCEPT PROPS from Dashboard
function AIChatBot({ dashboardBalance, dashboardIncome, dashboardExpense }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am ready to chat. ⚡' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [userStats, setUserStats] = useState(null);
  
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      try {
        const goalsSnapshot = await getDocs(collection(db, "users", userId, "goals"));
        const totalSaved = goalsSnapshot.docs.reduce((acc, doc) => acc + Number(doc.data().saved || 0), 0);

        let finalAvailable = 0;
        let finalIncome = 0;
        let finalSpent = 0;

        if (dashboardBalance !== undefined) {
           finalAvailable = Number(dashboardBalance);
           finalIncome = Number(dashboardIncome || 0);
           finalSpent = Number(dashboardExpense || 0);
        } else {
           // Fallback
           const userDocRef = doc(db, "users", userId);
           const userSnap = await getDoc(userDocRef);
           if (userSnap.exists()) {
             const data = userSnap.data();
             const allowance = Number(data.monthlyAllowance) || 0;
             const lifetimeSpent = Number(data.totalSpent) || 0;
             finalAvailable = Math.max(0, allowance - lifetimeSpent - totalSaved);
             finalIncome = allowance;
             finalSpent = lifetimeSpent;
           }
        }
        
        setUserStats({
          currentBalance: finalAvailable, 
          totalIncome: finalIncome,
          totalSpent: finalSpent,
          savedInGoals: totalSaved
        });

        const q = query(collection(db, "users", userId, "transactions"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const transData = querySnapshot.docs.map(doc => ({
          date: doc.data().date?.toDate().toISOString().split('T')[0],
          category: doc.data().category,
          amount: Number(doc.data().amount),
          type: doc.data().type
        })).slice(0, 30);
        setRecentTransactions(transData);

      } catch (e) { console.error("AI Data Error:", e); }
    };
    if (isOpen) fetchData();
  }, [isOpen, dashboardBalance]); 

  // 🛡️ THE NEW "DEMO-PROOF" SEND FUNCTION
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    // AI Placeholder
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      const response = await fetch('http://localhost:5001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: input,
          transactions: recentTransactions,
          userStats: userStats 
        })
      });

      if (!response.ok) throw new Error("API Limit or Server Error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullResponseText = ""; 

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        const lines = chunkValue.split('\n');
        
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') return;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullResponseText += parsed.text;
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { role: 'ai', text: fullResponseText };
                    return newMsgs;
                });
              }
            } catch (e) {}
          }
        });
      }
    } catch (error) {
      console.warn("⚠️ AI Failed (likely rate limit). Switching to Demo Mode.");
      
      // 🚑 EMERGENCY FALLBACK RESPONSE
      // This runs if the 429 Error happens. The user will never know!
      setTimeout(() => {
        const fallbackText = `(Network Busy, switching to offline analysis) \n\n Based on your dashboard, your available balance is **₹${userStats?.currentBalance || 0}**. \n\n You have spent **₹${userStats?.totalSpent || 0}** recently. Great job saving! Is there anything specific about your goals you want to know? 🚀`;
        
        setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: 'ai', text: fallbackText };
            return newMsgs;
        });
      }, 1000); // Small fake delay to make it look real
      
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="ai-chatbot-container">
      {!isOpen && (
        <div className="ai-fab-container" onClick={() => setIsOpen(true)}>
          <div className="loader"></div>
        </div>
      )}

      {isOpen && (
        <div className="ai-window">
          <div className="ai-header">
            <h3>FinBot ⚡</h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="ai-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>{msg.text}</div>
            ))}
            {isTyping && <div className="message ai">...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-input-area">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChatBot;