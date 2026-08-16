import React, { useState } from 'react';
import './AIReceiptScanner.css';

function AIReceiptScanner({ onScanSuccess }) {
    const [isScanning, setIsScanning] = useState(false);

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleScanReceipt = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const base64String = await fileToBase64(file);
            
            // Send to your AI Microservice
            const response = await fetch('http://localhost:5001/scan-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64String })
            });

            const result = await response.json();

            if (result.success) {
                // Pass the data back to whichever dashboard is using this component!
                onScanSuccess(result.data);
            } else {
                alert("AI Error: " + result.error);
            }
        } catch (error) {
            console.error("Scanning Error:", error);
            alert("Make sure your server.js is running on port 5001!");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="ai-receipt-scanner-container">
            <div className="ai-receipt-scanner-bg"></div>
            <label className="ai-receipt-scanner-content">
                <span className="ai-receipt-scanner-icon">{isScanning ? '⏳' : '📸'}</span>
                <span className="ai-receipt-scanner-text">
                    {isScanning ? 'AI is reading receipt...' : 'Auto-Fill with AI (Upload Bill)'}
                </span>
                <span className="ai-receipt-scanner-subtext">Supports PNG, JPG, PDF</span>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleScanReceipt} 
                    style={{ display: 'none' }} 
                    disabled={isScanning}
                />
            </label>
        </div>
    );
}

export default AIReceiptScanner;