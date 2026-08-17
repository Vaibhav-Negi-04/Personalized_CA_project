import sys, re

js_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\IndividualView.js'
css_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\Dashboard2.css'

with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

new_css = '''
/* Tooltips & Actions */
.tooltip-container { position: relative; display: inline-flex; align-items: center; cursor: help; margin-left: 6px; vertical-align: middle; }
.tooltip-container .icon-node { color: var(--text-secondary); opacity: 0.5; transition: opacity 0.2s; }
.tooltip-container:hover .icon-node { opacity: 1; color: var(--status-success, #34d399); }
.tooltip-text { visibility: hidden; opacity: 0; width: 220px; background-color: var(--bg-primary); color: var(--text-primary); text-align: left; border-radius: var(--radius-md); padding: 10px 14px; position: absolute; z-index: 10; bottom: 125%; left: 50%; transform: translateX(-50%) translateY(10px); transition: all 0.2s ease; font-size: 0.75rem; font-family: 'Outfit', sans-serif; font-weight: 400; border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.5); text-transform: none; pointer-events: none; line-height: 1.4; }
.tooltip-container:hover .tooltip-text { visibility: visible; opacity: 1; transform: translateX(-50%) translateY(0); }
.pro-table-row { position: relative; transition: background 0.2s; cursor: default; }
.pro-table-row:hover { background: var(--bg-secondary); }
.row-actions { opacity: 0; transition: opacity 0.2s; display: flex; gap: 8px; justify-content: flex-end; }
.pro-table-row:hover .row-actions { opacity: 1; }
.row-action-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.row-action-btn:hover { color: #F59E0B; background: rgba(245, 158, 11, 0.1); }
'''

if 'tooltip-container' not in css:
    css += new_css

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update imports
js = js.replace("import { Receipt, Calculator, Heartbeat } from 'phosphor-react';", "import { Receipt, Calculator, Heartbeat, Info, DotsThree } from 'phosphor-react';")

# 2. Add tooltips to metrics
js = js.replace('<span className="metric-label">Total Wealth</span>', '''<span className="metric-label">Total Wealth
  <span className="tooltip-container"><Info size={14} className="icon-node" /><span className="tooltip-text">The complete sum of your liquid cash balance plus the current market value of all open positions.</span></span>
</span>''')

js = js.replace('<span className="metric-label">Cash on Hand</span>', '''<span className="metric-label">Cash on Hand
  <span className="tooltip-container"><Info size={14} className="icon-node" /><span className="tooltip-text">Your fully liquid, uninvested cash pool derived directly from your income minus expenses.</span></span>
</span>''')

js = js.replace('<span className="metric-label">Portfolio Value</span>', '''<span className="metric-label">Portfolio Value
  <span className="tooltip-container"><Info size={14} className="icon-node" /><span className="tooltip-text">The live, mark-to-market total value of all your active investment holdings across asset classes.</span></span>
</span>''')

js = js.replace('<span className="metric-label">Monthly Burn</span>', '''<span className="metric-label">Monthly Burn
  <span className="tooltip-container"><Info size={14} className="icon-node" /><span className="tooltip-text">Your total recurring monthly expenditure, including both fixed obligations and variable lifestyle costs.</span></span>
</span>''')

# 3. Add table row actions
js = js.replace('<tr key={asset.id} className="gsap-stagger">', '<tr key={asset.id} className="gsap-stagger pro-table-row">')

# Replace the table header line for percent using regex to avoid quote mismatches
header_pattern = r"(<th tabIndex=\{0\}.*?onClick=\{\(\) => requestSort\('percent'\)\}.*?P&L.*?<\/th>)"
match = re.search(header_pattern, js)
if match:
    original_header = match.group(1)
    new_header = original_header + '<th style={{width:"40px"}}></th>'
    js = js.replace(original_header, new_header)

# Replace the table data line for percent
td_pattern = r"(<td className=\{`mono-num \$\{profit >= 0 \? 'text-green' : 'text-red'\}`\} style=\{\{textAlign:'right'\}\}>\{profit >= 0 \? '\+' : ''\}\{percent\}%<\/td>\s*<\/tr>)"
match2 = re.search(td_pattern, js)
if match2:
    original_td = match2.group(1)
    new_td = '''<td className={`mono-num ${profit >= 0 ? 'text-green' : 'text-red'}`} style={{textAlign:'right'}}>{profit >= 0 ? '+' : ''}{percent}%</td>
                        <td>
                          <div className="row-actions">
                            <button className="row-action-btn" title="View Details" onClick={() => alert('Detailed view for ' + asset.name + ' coming soon.')}><DotsThree size={18} weight="bold" /></button>
                          </div>
                        </td>
                      </tr>'''
    js = js.replace(original_td, new_td)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print('Done')
