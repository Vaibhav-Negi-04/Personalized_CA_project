import os
import re

components_dir = r"C:\Users\visha\Desktop\Documents\PCA\frontend\src\components"

replacements = {
    r"'#10b981'": "'var(--accent)'",
    r"'#fbbf24'": "'var(--status-warning)'",
    r"'rgba\(0,0,0,0\.3\)'": "'var(--overlay-dark)'",
    r"'#94a3b8'": "'var(--border-strong)'",
    r"'rgba\(59,\s*130,\s*246,\s*0\.15\)'": "'var(--primary-transparent)'",
    r"'#60a5fa'": "'var(--primary)'",
    r"'#bfdbfe'": "'var(--text-muted)'",
    r"'rgba\(251,\s*191,\s*36,\s*0\.1\)'": "'var(--status-warning-bg)'",
    r"'#e2e8f0'": "'var(--text-main)'",
    r"'#cbd5e1'": "'var(--text-muted)'",
    r"'rgba\(0,0,0,0\.2\)'": "'var(--overlay-dark)'",
    r"'rgba\(0,0,0,0\.5\)'": "'var(--overlay-dark)'",
    r"'#a7f3d0'": "'var(--accent)'",
    r"'#fda4af'": "'var(--status-danger)'",
    r"'#fca5a5'": "'var(--status-danger)'",
    r"'#2563eb'": "'var(--primary)'",
    r"'#1e293b'": "'var(--surface-muted)'",
    r"'#6366f1'": "'var(--secondary)'",
    r"'#0284c7'": "'var(--primary)'"
}

for root, _, files in os.walk(components_dir):
    for file in files:
        if file.endswith('.js') or file.endswith('.css'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original = content
            for pattern, replacement in replacements.items():
                content = re.sub(pattern, replacement, content)
                
            if original != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {file}")
