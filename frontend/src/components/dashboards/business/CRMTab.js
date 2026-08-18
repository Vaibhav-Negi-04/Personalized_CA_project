import React from 'react';

const CRMTab = ({ customerLTV, businessType, khata, formatCurrency, handleSettleKhata }) => {
    return (
        <div className="b-main-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div className="b-card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                    <h3 className="b-title" style={{ fontSize: '1.2rem' }}>👑 Lifetime Value (LTV) Leaderboard</h3>
                    <span style={{fontSize:'0.7rem', background:'rgba(59, 130, 246, 0.1)', padding:'6px 12px', borderRadius:'8px', color:'var(--accent-blue)', fontWeight: '700'}}>Top Customers</span>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                    {customerLTV.length === 0 ? <p style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>No tracked customers yet. Add names during billing.</p> : customerLTV.map((c, i) => (
                        <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'15px', background: i === 0 ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)' : 'var(--card-bg)', borderRadius:'12px', marginBottom:'10px', border: i === 0 ? '1px solid rgba(59, 130, 246, 0.1)' : '1px solid transparent'}}>
                            <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                                <div style={{width:'35px', height:'35px', background: i === 0 ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(0, 0, 0, 0.05)', color: i === 0 ? '#fff' : 'var(--text-main)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
                                    {i === 0 ? '🏆' : i + 1}
                                </div>
                                <div>
                                    <div style={{fontWeight:'700', fontSize:'1rem', color:'var(--text-main)'}}>{c.name}</div>
                                    {c.totalDebt > 0 && <div style={{fontSize:'0.75rem', color:'#f59e0b'}}>Owes {formatCurrency(c.totalDebt)}</div>}
                                </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>Lifetime Paid</div>
                                <div style={{color:'var(--accent-blue)', fontWeight:'bold', fontSize:'1.1rem'}}>{formatCurrency(c.totalPaid)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {businessType === 'shop' && (
                <div className="b-card">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                        <h3 className="b-title" style={{ fontSize: '1.2rem' }}>📒 Pending Udhaar (Khata)</h3>
                        <span style={{fontSize:'0.7rem', background:'rgba(245, 158, 11, 0.1)', color:'#d97706', padding:'6px 12px', borderRadius:'8px', fontWeight:'bold'}}>{khata.length} Unpaid</span>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                        {khata.length === 0 ? <p style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>No pending payments.</p> : khata.map(k => (
                            <div key={k.id} style={{display:'flex', justifyContent:'space-between', padding:'20px', background:'rgba(243,244,246,0.4)', border: '1px solid rgba(0,0,0,0.03)', borderRadius:'12px', marginBottom:'10px', borderLeft:'4px solid #f59e0b', boxShadow: '0 4px 15px rgba(0,0,0,0.02)'}}>
                                <div>
                                    <strong style={{color:'var(--text-main)', fontSize:'1rem'}}>{k.name}</strong><br/>
                                    <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{k.date} • {k.phone || 'No phone'}</span>
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <span style={{color:'var(--danger)', fontWeight:'bold', fontSize:'1.1rem', display:'block', marginBottom:'8px'}}>{formatCurrency(k.amount)}</span>
                                    <button onClick={() => handleSettleKhata(k)} style={{background:'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', fontSize:'0.8rem', cursor:'pointer', fontWeight:'bold'}}>SETTLE</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMTab;
