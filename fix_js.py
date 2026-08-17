import sys, re

js_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\IndividualView.js'

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Remove the broken block
broken_block_pattern = r'  // --- PRO MAX COMPUTATIONS ---.*?  const exposureWarning = topAsset.*?diversifying.*?;'
js = re.sub(broken_block_pattern, '', js, flags=re.DOTALL)

# Insert the correct block before the main return
calc_logic = '''
  // --- PRO MAX COMPUTATIONS ---
  // 1. Tax Loss Harvesting Engine
  const taxLossOpportunities = assets.reduce((acc, asset) => {
    const invested = parseFloat(asset.invested) || parseFloat(asset.value);
    const current = parseFloat(asset.value);
    const profit = current - invested;
    if (profit < 0) return acc + Math.abs(profit);
    return acc;
  }, 0);

  // 2. Passive Yield Tracker (Simulated 4% average yield on invested assets)
  const estimatedAnnualYield = netWorth * 0.04;
  
  // 3. Macro Exposure Warning
  // Find largest asset
  const topAsset = [...assets].sort((a,b) => parseFloat(b.value) - parseFloat(a.value))[0];
  const exposureWarning = topAsset 
    ? `Your portfolio is heavily weighted in ${topAsset.type} (${topAsset.name}). Consider diversifying into uncorrelated assets to hedge against macro volatility.`
    : `Diversify your cash holdings into productive assets to combat inflation.`;

  return ('''

js = js.replace('  return (\n    <div className="theme-pro-mono">', calc_logic + '\n    <div className="theme-pro-mono">')

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print('Fixed IndividualView.js')
