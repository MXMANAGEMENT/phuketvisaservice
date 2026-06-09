import os
import re

BASE = '/Users/alexejboger/Downloads/phuketvisaservice.com'

def process_file(filepath):
    if not filepath.endswith('.html'): return
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    original_html = html
    
    # 1. Update <meta name="description" content="...">
    # Regex to find description content that does NOT already start with ✅
    # And doesn't start with ⏳ or ⭐️
    def repl_desc(m):
        content = m.group(1)
        if not (content.startswith('✅') or content.startswith('⏳') or content.startswith('⭐️')):
            return f'<meta name="description" content="✅ {content}" />'
        return m.group(0)
    
    html = re.sub(r'<meta name="description" content="([^"]+)"\s*/>', repl_desc, html)
    
    # 2. Update og:description
    def repl_og(m):
        content = m.group(1)
        if not (content.startswith('✅') or content.startswith('⏳') or content.startswith('⭐️')):
            return f'<meta property="og:description" content="✅ {content}" />'
        return m.group(0)
        
    html = re.sub(r'<meta property="og:description" content="([^"]+)"\s*/>', repl_og, html)
    
    # 3. Update twitter:description
    def repl_tw(m):
        content = m.group(1)
        if not (content.startswith('✅') or content.startswith('⏳') or content.startswith('⭐️')):
            return f'<meta name="twitter:description" content="✅ {content}" />'
        return m.group(0)
        
    html = re.sub(r'<meta name="twitter:description" content="([^"]+)"\s*/>', repl_tw, html)

    if html != original_html:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Updated Meta: {filepath}")

for root, dirs, files in os.walk(BASE):
    if '.claude' in root or '.git' in root: continue
    for f in files:
        process_file(os.path.join(root, f))
