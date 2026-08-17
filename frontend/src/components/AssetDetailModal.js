import React, { useEffect, useRef } from 'react';
import './AddTransaction.css'; 
import gsap from 'gsap';

function AssetDetailModal({ isOpen, onClose, asset }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      gsap.fromTo(contentRef.current, 
        { scale: 0.95, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }
      );
    }
  }, [isOpen]);

  if (!isOpen || !asset) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={contentRef} className="modal-content modal-theme-wealth" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{asset.name} Details</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div style={{ padding: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-primary, sans-serif)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Type</span>
            <strong>{asset.type}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Invested Amount</span>
            <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary)' }}>₹{asset.invested?.toLocaleString('en-IN') || 0}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current Value</span>
            <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary)' }}>₹{asset.value?.toLocaleString('en-IN') || 0}</strong>
          </div>
          
          <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />
          
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--status-warning)' }}>Performance</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            This asset has grown by <strong>{(((asset.value - asset.invested) / asset.invested) * 100).toFixed(2)}%</strong> since inception. 
            Consider tax-loss harvesting if this drops into the negative.
          </p>

          <button onClick={onClose} className="save-btn" style={{ marginTop: '30px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssetDetailModal;
