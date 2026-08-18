import React from 'react';

const OpsTab = ({ 
    UI, 
    empInput, 
    setEmpInput, 
    handleHire, 
    employees, 
    formatCurrency, 
    handleFire, 
    totalAssetValue, 
    investInput, 
    setInvestInput, 
    handleCustomInvest, 
    assets, 
    handleRemoveAsset, 
    businessType, 
    topSellers 
}) => {
    return (
        <div className="b-main-layout" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
            <div>
                <div className="b-card">
                    <h3 className="b-title" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>👥 {UI.staffTitle}</h3>
                    <div style={{ borderBottom: '2px dashed rgba(0, 0, 0, 0.08)', paddingBottom: '20px', marginBottom: '20px' }}>
                        <label className="b-label">Add Person</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input className="b-input" placeholder="Name" value={empInput.name} onChange={e => setEmpInput({...empInput, name: e.target.value})} style={{flex:1}} />
                            <input className="b-input" placeholder="Role" value={empInput.designation} onChange={e => setEmpInput({...empInput, designation: e.target.value})} style={{flex:1}} />
                            <input className="b-input" placeholder="Salary" value={empInput.salary} onChange={e => setEmpInput({...empInput, salary: e.target.value})} style={{flex:1}} />
                            <button onClick={handleHire} className="b-btn b-btn-primary">{UI.staffBtn}</button>
                        </div>
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {employees.map(emp => (
                            <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '16px', background:'rgba(243, 244, 246, 0.5)', border: '1px solid rgba(0,0,0,0.03)', borderRadius:'12px', marginBottom:'8px' }}>
                                <div style={{display:'flex', gap:'10px', alignItems:'center'}}><div style={{width:'30px', height:'30px', background:'rgba(59, 130, 246, 0.1)', borderRadius:'50%', color:'var(--accent-blue)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>{emp.name.charAt(0)}</div><div><div style={{fontSize:'0.9rem', fontWeight:'700'}}>{emp.name}</div><div style={{fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase'}}>{emp.designation}</div></div></div>
                                <div style={{display:'flex', gap:'15px', alignItems:'center'}}><span style={{fontSize:'0.9rem', fontWeight:'600'}}>{formatCurrency(emp.salary)}</span><button onClick={() => handleFire(emp.id)} style={{background:'transparent', border:'none', color:'var(--danger)', fontWeight:'bold', cursor:'pointer'}}>Remove</button></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="b-card">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                        <h3 className="b-title" style={{ fontSize: '1.2rem' }}>🚀 {UI.assetTitle}</h3>
                        <span style={{fontSize:'0.7rem', background:'rgba(245, 158, 11, 0.1)', color:'#d97706', padding:'6px 12px', borderRadius:'8px', fontWeight:'bold'}}>TOTAL VALUE: {formatCurrency(totalAssetValue)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
                        <div style={{flex: 2}}><label className="b-label">{UI.assetLabel}</label><input className="b-input" placeholder="Item Name" value={investInput.name} onChange={(e) => setInvestInput({...investInput, name: e.target.value})}/></div>
                        <div style={{flex: 1}}><label className="b-label">Cost</label><input className="b-input" placeholder="₹0" value={investInput.cost} onChange={(e) => setInvestInput({...investInput, cost: e.target.value})}/></div>
                        <button onClick={handleCustomInvest} className="b-btn b-btn-primary" style={{height: '42px', padding: '0 20px'}}>+</button>
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {assets.map(a => (
                            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', padding: '16px', background:'rgba(243, 244, 246, 0.5)', border: '1px solid rgba(0,0,0,0.03)', borderRadius:'12px', marginBottom:'8px' }}>
                                <span style={{fontWeight:'600', fontSize:'0.9rem'}}>{a.name}</span>
                                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                    <span style={{color:'var(--text-muted)'}}>{formatCurrency(a.cost)}</span>
                                    <button onClick={() => handleRemoveAsset(a.id)} style={{color:'var(--danger)', background:'none', border:'none', cursor:'pointer', fontSize: '0.8rem', fontWeight: 'bold'}}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                {businessType === 'shop' && topSellers.length > 0 && (
                    <div className="b-card">
                        <h3 className="b-title" style={{ fontSize: '1rem', marginBottom: '15px' }}>🏆 Top Selling Items</h3>
                        {topSellers.map((item, i) => (
                            <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px', background: i === 0 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'rgba(243,244,246,0.4)', border: i === 0 ? '1px solid #fcd34d' : '1px solid rgba(0,0,0,0.02)', borderRadius:'8px', marginBottom:'6px'}}>
                                <span style={{fontWeight:'bold', color: i===0 ? 'var(--text-main)' : 'var(--text-muted)'}}>#{i+1} {item[0]}</span>
                                <span style={{color: i===0 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight:'600'}}>{item[1]} sold</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpsTab;
