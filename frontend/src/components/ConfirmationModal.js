import React, { useEffect, useRef } from 'react';

function ConfirmationModal({ isOpen, onClose, onConfirm, message }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-muted)',
          border: '1px solid var(--border-strong)',
          maxWidth: '400px',
          textAlign: 'center',
          animation: 'scaleIn 0.3s var(--ease-spring)'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'white' }}>Confirm Deletion</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '0.9rem' }}>
          {message || 'Are you sure you want to delete this? This action cannot be undone.'}
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            className="save-btn" 
            style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'white', padding: '10px 20px' }} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="save-btn" 
            style={{ background: 'var(--status-danger)', padding: '10px 20px' }} 
            onClick={() => { onConfirm(); onClose(); }}
            ref={confirmBtnRef}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
