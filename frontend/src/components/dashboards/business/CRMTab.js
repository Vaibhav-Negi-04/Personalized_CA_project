import React from 'react';
import { Trophy, WarningCircle, UserCircle, CurrencyInr } from '@phosphor-icons/react';

const CRMTab = ({ customerLTV, businessType, khata, formatCurrency, handleSettleKhata }) => {
    return (
        <div className="b-main-layout crm-grid">
            <div className="b-card">
                <div className="crm-header">
                    <h3 className="b-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy color="var(--accent-blue)" weight="duotone" /> Lifetime Value (LTV)</h3>
                    <span className="crm-badge-blue">Top Customers</span>
                </div>
                <div className="crm-list">
                    {customerLTV.length === 0 ? <p className="crm-empty">No tracked customers yet. Add names during billing.</p> : customerLTV.map((c, i) => (
                        <div key={i} className={`crm-item ${i === 0 ? 'top-rank' : ''}`}>
                            <div className="crm-item-left">
                                <div className={`crm-avatar ${i === 0 ? 'top-rank' : ''}`}>
                                    {i === 0 ? '🏆' : i + 1}
                                </div>
                                <div>
                                    <div className="crm-name">{c.name}</div>
                                    {c.totalDebt > 0 && <div className="crm-debt">Owes {formatCurrency(c.totalDebt)}</div>}
                                </div>
                            </div>
                            <div className="crm-item-right">
                                <div className="crm-label">Lifetime Paid</div>
                                <div className="crm-val">{formatCurrency(c.totalPaid)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {businessType === 'shop' && (
                <div className="b-card">
                    <div className="crm-header">
                        <h3 className="b-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><WarningCircle color="#d97706" weight="duotone" /> Pending Udhaar (Khata)</h3>
                        <span className="crm-badge-orange">{khata.length} Unpaid</span>
                    </div>
                    <div className="crm-list">
                        {khata.length === 0 ? <p className="crm-empty">No pending payments.</p> : khata.map(k => (
                            <div key={k.id} className="khata-item">
                                <div>
                                    <strong className="khata-name">{k.name}</strong>
                                    <span className="khata-meta">{k.date} • {k.phone || 'No phone'}</span>
                                </div>
                                <div className="khata-right">
                                    <span className="khata-amount">{formatCurrency(k.amount)}</span>
                                    <button onClick={() => handleSettleKhata(k)} className="khata-btn">SETTLE</button>
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
