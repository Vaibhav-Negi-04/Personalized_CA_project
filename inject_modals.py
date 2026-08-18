import re

file_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\BusinessView.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hardcoded window.prompt with custom modal
content = content.replace('const pin = window.prompt("Enter Owner PIN to exit Cashier Mode:");\n                            if(pin === "1234") setIsCashierMode(false);\n                            else if (pin) alert("Incorrect PIN!");',
                          'setPinPrompt(true);')

# Replace native confirm() for deleting employee
content = content.replace('const confirmDelete = window.confirm("Delete this employee?");\n        if(confirmDelete) {\n            const updated = employees.filter(e => e.id !== id);\n            setEmployees(updated);\n            saveData({employees: updated});\n        }',
                          "setConfirmDelete({ type: 'employee', id });")

# Replace native confirm() for deleting inventory
content = content.replace('const confirmDelete = window.confirm("Delete this item from catalog?");\n        if(confirmDelete) {\n            const updated = inventory.filter(i => i.id !== id);\n            setInventory(updated);\n            saveData({inventory: updated});\n        }',
                          "setConfirmDelete({ type: 'inventory', id });")

# Inject Modals at the end of the file, right before the closing return div
modals_jsx = """
            {/* 🔒 CUSTOM PIN PROMPT MODAL */}
            {pinPrompt && (
                <div className="b-overlay" onClick={() => setPinPrompt(false)}>
                    <div className="b-modal" onClick={e => e.stopPropagation()} style={{textAlign: 'center'}}>
                        <h3 className="b-title" style={{marginBottom: '10px'}}>Exit Cashier Mode</h3>
                        <p style={{color: 'var(--text-secondary)', marginBottom: '20px'}}>Enter the owner PIN to unlock financial data.</p>
                        <input 
                            type="password" 
                            autoFocus
                            className="b-input" 
                            style={{textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em', marginBottom: '20px'}}
                            value={pinInput} 
                            onChange={(e) => setPinInput(e.target.value)} 
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    if(pinInput === "1234") { setIsCashierMode(false); setPinPrompt(false); setPinInput(''); }
                                    else { alert("Incorrect PIN!"); setPinInput(''); }
                                }
                            }}
                        />
                        <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                            <button onClick={() => setPinPrompt(false)} className="b-btn">CANCEL</button>
                            <button onClick={() => {
                                if(pinInput === "1234") { setIsCashierMode(false); setPinPrompt(false); setPinInput(''); }
                                else { alert("Incorrect PIN!"); setPinInput(''); }
                            }} className="b-btn b-btn-primary">UNLOCK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🗑️ CUSTOM CONFIRMATION MODAL */}
            {confirmDelete && (
                <div className="b-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="b-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="b-title" style={{marginBottom: '10px', color: 'var(--status-danger)'}}>Confirm Deletion</h3>
                        <p style={{color: 'var(--text-secondary)', marginBottom: '25px'}}>Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.</p>
                        <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                            <button onClick={() => setConfirmDelete(null)} className="b-btn">CANCEL</button>
                            <button onClick={() => {
                                if(confirmDelete.type === 'employee') {
                                    const updated = employees.filter(e => e.id !== confirmDelete.id);
                                    setEmployees(updated);
                                    saveData({employees: updated});
                                } else if(confirmDelete.type === 'inventory') {
                                    const updated = inventory.filter(i => i.id !== confirmDelete.id);
                                    setInventory(updated);
                                    saveData({inventory: updated});
                                }
                                setConfirmDelete(null);
                            }} className="b-btn b-btn-danger">DELETE</button>
                        </div>
                    </div>
                </div>
            )}
"""

# Find the last closing div of the business-view
if "CUSTOM PIN PROMPT MODAL" not in content:
    # `BusinessView.js` ends with `        </div>\n    );\n}`
    content = content.replace("        </div>\n    );\n}", modals_jsx + "\n        </div>\n    );\n}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Modals injected!")
