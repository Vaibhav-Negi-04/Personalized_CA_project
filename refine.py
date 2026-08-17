import sys, re

js_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\IndividualView.js'
css_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\Dashboard2.css'

with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Font imports
css = css.replace('family=Calistoga&family=Inter:', 'family=Outfit:')
css = css.replace("font-family: 'Inter'", "font-family: 'Outfit'")
css = css.replace("font-family: 'Calistoga'", "font-family: 'Outfit'")

# Hardcoded colors
css = css.replace('rgba(0, 0, 0, 0.3)', 'var(--bg-primary)')
css = css.replace('rgba(0, 0, 0, 0.1)', 'var(--border-color)')
css = css.replace('rgba(0, 0, 0, 0.4)', 'var(--bg-primary)')
css = css.replace('rgba(0, 0, 0, 0.2)', 'var(--bg-secondary)')
css = css.replace('#22C55E', 'var(--status-success, #34d399)')

# Remove dead metric-sparkline
css = re.sub(r'\.metric-sparkline\s*\{[^}]*\}', '', css)

# Add new layout classes
new_classes = '''
.pro-header-right { display: flex; align-items: center; gap: 20px; }
.pro-live-sync { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; letter-spacing: 0.5px; }
.pulse-dot { width: 6px; height: 6px; background-color: var(--status-success, #34d399); border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); } 100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); } }
.pro-empty-state { padding: 30px; text-align: center; color: var(--text-tertiary); font-size: 0.85rem; }
.pro-btn-sm { padding: 6px 12px; font-size: 0.75rem; }
.pro-title-flex { display: flex; align-items: center; gap: 15px; }
.pro-error-state { padding: 30px; text-align: center; color: #EF4444; }
'''
css += new_classes

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace inline styles and text
js = js.replace("<div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>", '<div className="pro-header-right">')
js = js.replace("<div className=\"pro-date\">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</div>", '''
           <div className="pro-live-sync">
             <div className="pulse-dot"></div> Live Sync
           </div>
           <div className="pro-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
'''.strip())

js = js.replace('EXECUTIVE DASHBOARD', 'Executive Dashboard')
js = js.replace('NET LIQUIDITY', 'Total Wealth')
js = js.replace('CASH ON HAND', 'Cash on Hand')
js = js.replace('PORTFOLIO VALUE', 'Portfolio Value')
js = js.replace('MONTHLY BURN', 'Monthly Burn')
js = js.replace('ANALYTICAL TOOLS', 'Analytical Tools')
js = js.replace('INVESTMENT HOLDINGS', 'Investment Holdings')
js = js.replace('TAX PLANNER', 'Tax Planner')
js = js.replace('DEBT MANAGER', 'Debt Manager')
js = js.replace('HEALTH AUDIT', 'Health Audit')

js = js.replace("<h3 style={{display:'flex', alignItems:'center', gap:'15px'}}>", '<h3 className="pro-title-flex">')
js = js.replace("<button className=\"pro-btn\" style={{padding: '6px 12px', fontSize: '0.75rem'}}", '<button className="pro-btn pro-btn-sm"')
js = js.replace("<div style={{padding:'30px', textAlign:'center', color:'#EF4444'}}>", '<div className="pro-error-state">')
js = js.replace("<div style={{padding:'30px'}}>", '<div className="pro-empty-state">')
js = js.replace("<div style={{padding:'30px', textAlign:'center', color:'var(--text-tertiary)', fontSize:'0.8rem'}}>", '<div className="pro-empty-state">')
js = js.replace('NO ASSETS MATCH "{searchQuery.toUpperCase()}"', 'No assets match "{searchQuery}"')
js = js.replace("CLEAR FILTER", "Clear Filter")
js = js.replace("NO POSITIONS OPEN", "No positions open")
js = js.replace("+ ADD POSITION", "+ Add Position")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print('Success')
