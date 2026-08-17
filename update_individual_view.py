import sys, re

js_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\IndividualView.js'

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update imports
if 'AssetAllocation' not in js:
    js = js.replace("import AddAssetModal from '../AddAssetModal';", "import AddAssetModal from '../AddAssetModal';\nimport AddTransactionModal from '../AddTransactionModal';\nimport AssetAllocation from '../AssetAllocation';")

# 2. Add isTransactionModalOpen state
if 'isTransactionModalOpen' not in js:
    js = js.replace("const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);", "const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);\n  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);")

# 3. Add AssetAllocation below the table
table_end_pattern = r"(<\/table>\s*<\/div>\s*)(<\/div>\s*\{\/\* RIGHT: TRANSACTION LOG \*\/})"
match_table_end = re.search(table_end_pattern, js)
if match_table_end:
    replacement = r"\1\n          {/* NEW: ASSET ALLOCATION */}\n          <div className=\"gsap-stagger\" style={{ marginTop: '20px' }}>\n            <AssetAllocation assets={assets} cashOnHand={netWorth} />\n          </div>\n        \2"
    js = re.sub(table_end_pattern, replacement, js)

# 4. Inject Command Center in the right panel
right_panel_pattern = r"(\{\/\* RIGHT: TRANSACTION LOG \*\/}\s*<div className=\"pro-panel gsap-stagger\" style=\{\{ background: 'transparent', border: 'none', boxShadow: 'none' \}\}>\s*)<div className=\"transaction-wrapper-mono\">"
match_right_panel = re.search(right_panel_pattern, js)
if match_right_panel:
    new_right_panel = match_right_panel.group(1) + '''{/* COMMAND CENTER */}
          <div className="command-center-grid">
            <button className="pro-action-card" onClick={() => setIsTransactionModalOpen(true)}>
              <Receipt size={24} weight="light" />
              <span>Log Transaction</span>
            </button>
            <button className="pro-action-card" onClick={() => setIsTaxModalOpen(true)}>
              <Calculator size={24} weight="light" />
              <span>Tax Harvesting</span>
            </button>
          </div>
          
          <div className="transaction-wrapper-mono">'''
    js = js.replace(match_right_panel.group(0), new_right_panel)

# 5. Add Transaction Modal mapping
modal_end_pattern = r"(<AddAssetModal isOpen=\{isAssetModalOpen\} onClose=\{\(\) => setIsAssetModalOpen\(false\)\} \/>)"
match_modal_end = re.search(modal_end_pattern, js)
if match_modal_end:
    js = js.replace(match_modal_end.group(1), match_modal_end.group(1) + "\n      <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} userType=\"executive\" />")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated IndividualView.js successfully")
