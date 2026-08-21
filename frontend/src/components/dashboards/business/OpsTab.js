import React from 'react';
import { UserPlus, Wallet, Crown } from '@phosphor-icons/react';

const OpsTab = ({ 
    UI, empInput, setEmpInput, handleHire, employees, formatCurrency, handleFire, 
    totalAssetValue, investInput, setInvestInput, handleCustomInvest, assets, 
    handleRemoveAsset, businessType, topSellers 
}) => {
    return (
        <div className="b-main-layout ops-grid">
            <div className="ops-left">
                <div className="b-card">
                    <h3 className="b-title" style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><UserPlus color="var(--accent-blue)" weight="duotone"/> {UI.staffTitle}</h3>
                    <div className="ops-input-group">
                        <label className="b-label">Add Person</label>
                        <div className="ops-input-row">
                            <input className="b-input flex-1" placeholder="Name" value={empInput.name} onChange={e => setEmpInput({...empInput, name: e.target.value})} />
                            <input className="b-input flex-1" placeholder="Role" value={empInput.designation} onChange={e => setEmpInput({...empInput, designation: e.target.value})} />
                            <input className="b-input flex-1" placeholder="Salary" value={empInput.salary} onChange={e => setEmpInput({...empInput, salary: e.target.value})} />
                            <button onClick={handleHire} className="b-btn b-btn-primary">{UI.staffBtn}</button>
                        </div>
                    </div>
                    <div className="ops-list">
                        {employees.map(emp => (
                            <div key={emp.id} className="ops-item">
                                <div className="ops-item-left">
                                    <div className="ops-avatar">{emp.name.charAt(0)}</div>
                                    <div>
                                        <div className="ops-name">{emp.name}</div>
                                        <div className="ops-role">{emp.designation}</div>
                                    </div>
                                </div>
                                <div className="ops-item-right">
                                    <span className="ops-salary">{formatCurrency(emp.salary)}</span>
                                    <button onClick={() => handleFire(emp.id)} className="ops-remove-btn">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="b-card">
                    <div className="crm-header">
                        <h3 className="b-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet color="#10b981" weight="duotone"/> {UI.assetTitle}</h3>
                        <span className="crm-badge-orange">TOTAL VALUE: {formatCurrency(totalAssetValue)}</span>
                    </div>
                    <div className="ops-input-row align-end">
                        <div className="flex-2">
                            <label className="b-label">{UI.assetLabel}</label>
                            <input className="b-input w-full" placeholder="Item Name" value={investInput.name} onChange={(e) => setInvestInput({...investInput, name: e.target.value})}/>
                        </div>
                        <div className="flex-1">
                            <label className="b-label">Cost</label>
                            <input className="b-input w-full" placeholder="₹10" value={investInput.cost} onChange={(e) => setInvestInput({...investInput, cost: e.target.value})}/>
                        </div>
                        <button onClick={handleCustomInvest} className="b-btn b-btn-primary h-42">+</button>
                    </div>
                    <div className="ops-list">
                        {assets.map(a => (
                            <div key={a.id} className="ops-item">
                                <span className="ops-name">{a.name}</span>
                                <div className="ops-item-right">
                                    <span className="ops-meta">{formatCurrency(a.cost)}</span>
                                    <button onClick={() => handleRemoveAsset(a.id)} className="ops-remove-btn">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="ops-right">
                {businessType === 'shop' && topSellers.length > 0 && (
                    <div className="b-card">
                        <h3 className="b-title" style={{ fontSize: '1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Crown color="#f59e0b" weight="duotone" /> Top Selling Items</h3>
                        <div className="ops-list no-scroll">
                            {topSellers.map((item, i) => (
                                <div key={i} className={`seller-item ${i === 0 ? 'top-rank' : ''}`}>
                                    <span className="seller-name">#{i+1} {item[0]}</span>
                                    <span className="seller-sold">{item[1]} sold</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpsTab;
