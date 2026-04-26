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
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.4))',
            backdropFilter: 'blur(12px)',
            borderLeft: '4px solid #8b5cf6', /* Purple accent */
            borderTop: '1px solid rgba(255,255,255,0.05)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden'
        }}>
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
                color: '#e2e8f0',
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