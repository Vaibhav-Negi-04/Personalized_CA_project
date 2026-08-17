const fs = require('fs');

const cssPath = 'C:\\Users\\visha\\Desktop\\Documents\\PCA\\frontend\\src\\components\\dashboards\\Dashboard2.css';
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replace(/0 4px 20px rgba\(0,0,0,0\.3\)/g, 'var(--shadow-md)');
css = css.replace(/0 2px 10px rgba\(0,0,0,0\.1\)/g, 'var(--shadow-sm)');
css = css.replace(/0 10px 40px rgba\(0,0,0,0\.4\)/g, 'var(--shadow-lg)');
css = css.replace(/0 8px 16px rgba\(0,0,0,0\.2\)/g, 'var(--shadow-md)');
css = css.replace(/0 10px 30px rgba\(0,0,0,0\.5\)/g, 'var(--shadow-toast)');
css = css.replace(/0 4px 12px rgba\(0,0,0,0\.5\)/g, 'var(--shadow-md)');
css = css.replace(/background: rgba\(0,0,0,0\.2\)/g, 'background: var(--bg-dim)');
css = css.replace(/rgba\(52, 211, 153, 0\.4\)/g, 'rgba(52, 211, 153, 0.4) /* var(--status-success-dim) */');
css = css.replace(/rgba\(52, 211, 153, 0\.3\)/g, 'rgba(52, 211, 153, 0.3) /* var(--status-success-dim) */');
css = css.replace(/#34d399/g, 'var(--status-success)');
fs.writeFileSync(cssPath, css, 'utf8');

const jsPath = 'C:\\Users\\visha\\Desktop\\Documents\\PCA\\frontend\\src\\components\\dashboards\\IndividualView.js';
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/color="#F59E0B"/g, 'color="var(--status-warning)"');
js = js.replace(/style={{color: '#F472B6'}}/g, "style={{color: 'var(--accent-pink)'}}");
js = js.replace(/style={{color: '#60A5FA'}}/g, "style={{color: 'var(--accent-blue)'}}");
js = js.replace(/style={{color: '#34D399'}}/g, "style={{color: 'var(--status-success)'}}");
fs.writeFileSync(jsPath, js, 'utf8');

const designPath = 'C:\\Users\\visha\\Desktop\\Documents\\PCA\\DESIGN.md';
let designContent = '';
if (fs.existsSync(designPath)) {
  designContent = fs.readFileSync(designPath, 'utf8');
} else {
  designContent = '# Design System\n';
}
if (!designContent.includes('Official Typography Additions')) {
  designContent += '\n## Official Typography Additions\n- `Outfit` (Primary Interface)\n- `JetBrains Mono` (Tabular Data & Metrics)\n';
  designContent += '## Official Colors\n- `#F472B6` (Pink)\n- `#60A5FA` (Blue)\n- `#34D399` (Green)\n';
  fs.writeFileSync(designPath, designContent, 'utf8');
}
console.log('Fixed P2 drift correctly.');
