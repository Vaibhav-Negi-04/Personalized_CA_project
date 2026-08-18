import re
import os

file_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\BusinessView.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Instead of complex regex, let's use simple string replacements to inject the tab conditional logic.

tab_menu = """
                    {/* TAB MENU */}
                    <div className="pos-tabs">
                        <button className={`pos-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                        <button className={`pos-tab-btn ${activeTab === 'ops' ? 'active' : ''}`} onClick={() => setActiveTab('ops')}>Operations</button>
                    </div>
"""

# We'll put Quick Stats and charts in overview, and Ledger/Employees in ops.
if "className=\"pos-tabs\"" not in content:
    # 1. Inject Tab menu and open Overview
    content = content.replace("                    {/* Quick Stats Grid */}", tab_menu + "\n                    {activeTab === 'overview' && (<>\n                    {/* Quick Stats Grid */}")
    
    # 2. Close Overview and Open Ops before Ledger
    content = content.replace("                    {/* =======================================================", 
                              "                    </>)}\n                    {activeTab === 'ops' && (<>\n                    {/* =======================================================")
    
    # 3. Close Ops before the end of the isCashierMode else block
    content = content.replace("                </>\n            )}\n\n            {/* ???? INVENTORY MODAL",
                              "                </>)}\n                </>\n            )}\n\n            {/* ???? INVENTORY MODAL")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Tabs injected!")
