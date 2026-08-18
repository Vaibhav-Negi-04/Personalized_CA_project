import re
import os

file_path = r'C:\Users\visha\Desktop\Documents\PCA\frontend\src\components\dashboards\BusinessView.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add activeTab state
if 'const [activeTab, setActiveTab]' not in content:
    content = content.replace("const [searchQuery, setSearchQuery] = useState('');", 
                              "const [searchQuery, setSearchQuery] = useState('');\n    const [activeTab, setActiveTab] = useState('pos');")

# 2. Add confirmation modal states
if 'const [confirmDelete, setConfirmDelete] = useState(null);' not in content:
    content = content.replace('const [deleteId, setDeleteId] = useState(null);',
                              "const [deleteId, setDeleteId] = useState(null);\n    const [confirmDelete, setConfirmDelete] = useState(null);\n    const [pinPrompt, setPinPrompt] = useState(false);\n    const [pinInput, setPinInput] = useState('');")

# 3. Apply theme class
content = content.replace('<div className="business-view"', '<div className="business-view theme-business-onyx"')

# 4. Color Replacements
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
        # Also replace without quotes for inline styles that don't have quotes (e.g. template literals)
        content = content.replace(f':{old}', f':var(--text-secondary)') # Just a safe fallback, will be more specific below

# Fix exact string replacements
for old, new in replacements.items():
    if not old.startswith("'") and not old.startswith('"'):
        content = content.replace(old, new)

# 5. Transition fix
content = content.replace("transition: 'height 0.3s ease'", "transition: 'transform 0.3s ease, opacity 0.3s ease'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Colors refactored and saved')
