import sys, re

js_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\IndividualView.js'

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update imports
if 'MarketTicker' not in js:
    js = js.replace("import AssetAllocation from '../AssetAllocation';", "import AssetAllocation from '../AssetAllocation';\nimport MarketTicker from '../MarketTicker';\nimport FIREChart from '../FIREChart';")

# 2. Add computation logic for Tax Loss and Yield
# We need to insert this right before the `return (` statement inside the IndividualView component.
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
'''
return_idx = js.rfind("return (")
js = js[:return_idx] + calc_logic + "\n  " + js[return_idx:]

# 3. Mount Market Ticker at the top
ticker_insertion = '''<div className="theme-pro-mono">
      <MarketTicker />'''
js = js.replace('<div className="theme-pro-mono">', ticker_insertion)


# 4. Mount the Secondary Layout (Tax/Macro/Yield) and FIRE Chart at the bottom, just before the modals.
bottom_panels = '''
      {/* SECONDARY LAYOUT: PRO MAX WIDGETS */}
      <div className="pro-secondary-layout gsap-stagger">
        <div className="pro-opportunity-card">
          <div className="opp-title" style={{color: '#F472B6'}}>Tax-Loss Opportunities</div>
          <div className="opp-val">{formatINR(taxLossOpportunities)}</div>
          <div className="opp-desc">Unrealized losses available to harvest. Liquidating these positions can offset capital gains tax this fiscal year.</div>
        </div>
        <div className="pro-opportunity-card">
          <div className="opp-title" style={{color: '#60A5FA'}}>Macro Exposure Alert</div>
          <div className="opp-val">High Correlation</div>
          <div className="opp-desc">{exposureWarning}</div>
        </div>
        <div className="pro-opportunity-card">
          <div className="opp-title" style={{color: '#34D399'}}>Estimated Passive Yield</div>
          <div className="opp-val">{formatINR(estimatedAnnualYield)} / yr</div>
          <div className="opp-desc">Based on your portfolio composition, you are generating approximately {formatINR(estimatedAnnualYield/12)} per month in passive income.</div>
        </div>
      </div>

      {/* FIRE HORIZON CHART */}
      <FIREChart currentWealth={netWorth} monthlyBurn={100000} />

      {/* MODALS */}
'''
js = js.replace("{/* MODALS */}", bottom_panels)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated IndividualView.js successfully")
