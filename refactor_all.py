import re
import os

file_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\BusinessView.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add States
if 'const [activeTab, setActiveTab]' not in content:
    content = content.replace("const [searchQuery, setSearchQuery] = useState('');", 
                              "const [searchQuery, setSearchQuery] = useState('');\n    const [activeTab, setActiveTab] = useState('pos');")

if 'const [confirmDelete, setConfirmDelete] = useState(null);' not in content:
    content = content.replace('const [deleteId, setDeleteId] = useState(null);',
                              "const [deleteId, setDeleteId] = useState(null);\n    const [confirmDelete, setConfirmDelete] = useState(null);\n    const [pinPrompt, setPinPrompt] = useState(false);\n    const [pinInput, setPinInput] = useState('');")

# 2. Add Theme Class
content = content.replace('<div className="business-view"', '<div className="business-view theme-business-onyx"')

# 3. Colors Replacement
replacements = {
    '#6b7280': 'var(--text-secondary)',
    '#0369a1': 'var(--accent-blue)',
    '#e0f2fe': 'rgba(14, 165, 233, 0.1)',
    '#f3f4f6': 'var(--border-color)',
    '#d97706': 'var(--status-warning)',
    '#e5e7eb': 'var(--border-color)',
    '#d1d5db': 'var(--text-secondary)',
    '#fef3c7': 'rgba(245, 158, 11, 0.1)',
    '#7dd3fc': 'var(--accent-blue)',
    '#fde68a': 'rgba(245, 158, 11, 0.2)',
    '#fffbeb': 'rgba(245, 158, 11, 0.05)',
    '#fef2f2': 'rgba(239, 68, 68, 0.05)',
    '#fee2e2': 'rgba(239, 68, 68, 0.1)',
    '#fcd34d': 'var(--status-warning)',
    '#bae6fd': 'rgba(14, 165, 233, 0.2)',
    '#22c55e': 'var(--primary)',
    'rgba(34, 197, 94, 0.4)': 'rgba(16, 185, 129, 0.4)',
    '#666': 'var(--text-secondary)',
    '#374151': 'var(--border-color)',
    '#111827': 'var(--text-primary)',
    '#f9fafb': 'var(--neutral-card)',
    "'white'": "'var(--text-primary)'",
    "'black'": "'var(--app-bg)'",
    '"white"': '"var(--text-primary)"',
    '"black"': '"var(--app-bg)"'
}
for old, new in replacements.items():
    if old.startswith("'") or old.startswith('"'):
        content = content.replace(old, new)
    else:
        content = content.replace(f"'{old}'", f"'{new}'")
        content = content.replace(f'"{old}"', f'"{new}"')
        content = content.replace(f'{old};', f'{new};')

# 4. Transition Fix (Target specific height transition)
content = content.replace("transition: 'height 0.5s ease'", "transition: 'transform 0.5s ease, opacity 0.5s ease'")
content = content.replace("transition: 'height 0.3s ease'", "transition: 'transform 0.3s ease, opacity 0.3s ease'")

# 5. Fix Native Modals logic
content = content.replace('const pin = window.prompt("Enter Owner PIN to exit Cashier Mode:");\n                            if(pin === "1234") setIsCashierMode(false);\n                            else if (pin) alert("Incorrect PIN!");',
                          'setPinPrompt(true);')

content = content.replace('const confirmDelete = window.confirm("Delete this employee?");\n        if(confirmDelete) {\n            const updated = employees.filter(e => e.id !== id);\n            setEmployees(updated);\n            saveData({employees: updated});\n        }',
                          "setConfirmDelete({ type: 'employee', id });")

content = content.replace('const confirmDelete = window.confirm("Delete this item from catalog?");\n        if(confirmDelete) {\n            const updated = inventory.filter(i => i.id !== id);\n            setInventory(updated);\n            saveData({inventory: updated});\n        }',
                          "setConfirmDelete({ type: 'inventory', id });")

# 6. Inject Tabs Layout
tab_menu = """
                    {/* TAB MENU */}
                    <div className="pos-tabs">
                        <button className={`pos-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                        <button className={`pos-tab-btn ${activeTab === 'ops' ? 'active' : ''}`} onClick={() => setActiveTab('ops')}>Operations</button>
                    </div>
"""

if "className=\"pos-tabs\"" not in content:
    content = content.replace("                    {/* Quick Stats Grid */}", tab_menu + "\n                    {activeTab === 'overview' && (<>\n                    {/* Quick Stats Grid */}")
    
    # Close overview, open ops
    content = content.replace("                    {/* =======================================================", 
                              "                    </>)}\n                    {activeTab === 'ops' && (<>\n                    {/* =======================================================")
    
    # The tricky part: Closing Ops. 
    # Let's find the exact end of the `isCashierMode` else block.
    # It looks like:
    #                 </>
    #             )}
    #
    #             {/* 📦 INVENTORY MODAL (WITH DUAL-API FETCH) */}
    content = content.replace("                </>\n            )}\n\n            {/* 📦 INVENTORY MODAL",
                              "                </>)}\n                </>\n            )}\n\n            {/* 📦 INVENTORY MODAL")

# 7. Inject Modals Safely
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

# We only inject it at the very end of the file where `export default BusinessView;` is
# Let's find the last </div> before the `);` return statement.
match = re.search(r'        </div>\n    \);\n};\n\nexport default BusinessView;', content)
if match and "CUSTOM PIN PROMPT MODAL" not in content:
    content = content.replace("        </div>\n    );\n};\n\nexport default BusinessView;",
                              modals_jsx + "\n        </div>\n    );\n};\n\nexport default BusinessView;")
else:
    # In case the format is slightly different
    if "CUSTOM PIN PROMPT MODAL" not in content:
        content = content.replace("        </div>\n    );\n}", modals_jsx + "\n        </div>\n    );\n}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactor Complete")
