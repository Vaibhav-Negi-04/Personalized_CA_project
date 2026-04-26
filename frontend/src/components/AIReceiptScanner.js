import React, { useState } from 'react';

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
        <div style={{ marginBottom: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '2px dashed #cbd5e1', textAlign: 'center', transition: 'all 0.3s' }}>
            <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '2rem' }}>{isScanning ? '⏳' : '📸'}</span>
                <span style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '0.95rem' }}>
                    {isScanning ? 'AI is reading receipt...' : 'Auto-Fill with AI (Upload Bill)'}
                </span>
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