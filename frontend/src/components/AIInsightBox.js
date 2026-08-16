import React, { useState, useEffect } from 'react';

function AIInsightBox({ balance, transactions }) {
    const [insight, setInsight] = useState("Synthesizing financial telemetry...");

    useEffect(() => {
        // Only run if we actually have data
        if (balance === undefined || !transactions) return;

        const fetchInsight = async () => {
            try {
                // Send the balance and ONLY the 10 most recent transactions so we don't overload the AI
                const response = await fetch('http://localhost:5001/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        balance: balance, 
                        transactions: transactions.slice(0, 10) 
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    setInsight(data.text);
                } else {
                    setInsight("AI analysis currently unavailable.");
                }
            } catch (error) {
                console.error("AI Fetch Error:", error);
                setInsight("Unable to connect to AI core.");
            }
        };

        // Add a slight delay so it doesn't spam the server on every keystroke
        const timerId = setTimeout(() => {
            fetchInsight();
        }, 1500);

        return () => clearTimeout(timerId);
    }, [balance, transactions]);

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)', /* Frosty glass */
            backdropFilter: 'blur(20px)',
            borderLeft: '4px solid #06b6d4', /* Electric Cyan accent */
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px var(--overlay-dark)', /* Card Glow */
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }} className="ai-insight-box">
            {/* The Title */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '12px',
                fontFamily: "'Inter', sans-serif"
            }}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <span style={{ 
                    fontWeight: '800', 
                    color: '#a5b4fc', 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1.5px' 
                }}>
                    AI Executive Summary
                </span>
            </div>

            {/* The Italicized Prediction */}
            <p style={{
                margin: 0,
                color: 'var(--text-main)',
                fontStyle: 'italic',
                fontFamily: "'Georgia', serif", /* Classic serif font for that elegant look */
                fontSize: '1.1rem',
                lineHeight: '1.6',
                opacity: 0.9
            }}>
                "{insight}"
            </p>
        </div>
    );
}

export default AIInsightBox;