const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');

const replacements = [
    { pattern: /#10b981/g, replacement: 'var(--accent)' },
    { pattern: /#fbbf24/g, replacement: 'var(--status-warning)' },
    { pattern: /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.[235]\s*\)/g, replacement: 'var(--overlay-dark)' },
    { pattern: /#94a3b8/g, replacement: 'var(--border-strong)' },
    { pattern: /rgba\(\s*59\s*,\s*130\s*,\s*246\s*,\s*0\.15\s*\)/g, replacement: 'var(--primary-transparent)' },
    { pattern: /#60a5fa/g, replacement: 'var(--primary)' },
    { pattern: /#bfdbfe/g, replacement: 'var(--text-muted)' },
    { pattern: /rgba\(\s*251\s*,\s*191\s*,\s*36\s*,\s*0\.1\s*\)/g, replacement: 'var(--status-warning-bg)' },
    { pattern: /#e2e8f0/g, replacement: 'var(--text-main)' },
    { pattern: /#cbd5e1/g, replacement: 'var(--text-muted)' },
    { pattern: /#a7f3d0/g, replacement: 'var(--accent)' },
    { pattern: /#fda4af/g, replacement: 'var(--status-danger)' },
    { pattern: /#fca5a5/g, replacement: 'var(--status-danger)' },
    { pattern: /#2563eb/g, replacement: 'var(--primary)' },
    { pattern: /#1e293b/g, replacement: 'var(--surface-muted)' },
    { pattern: /#6366f1/g, replacement: 'var(--secondary)' },
    { pattern: /#0284c7/g, replacement: 'var(--primary)' },
    { pattern: /#0891b2/g, replacement: 'var(--primary)' },
    { pattern: /#444444|#444\b/g, replacement: 'var(--text-tertiary)' },
    { pattern: /rgba\(\s*10\s*,\s*10\s*,\s*10\s*,\s*0\.4\s*\)/g, replacement: 'var(--overlay-dark)' },
    { pattern: /#7c3aed/g, replacement: 'var(--secondary)' }
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(componentsDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    
    for (const {pattern, replacement} of replacements) {
        content = content.replace(pattern, replacement);
    }
    
    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
