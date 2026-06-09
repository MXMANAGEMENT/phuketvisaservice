import os
import re

BASE = '/Users/alexejboger/Downloads/phuketvisaservice.com'

def process_file(filepath):
    if not filepath.endswith('.html'): return
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    original_html = html
    
    # Detect language
    lang = 'en'
    if '/de/' in filepath: lang = 'de'
    if '/ru/' in filepath: lang = 'ru'
    
    translations = {
        'en': '<li><a href="/about/">About Us</a></li>',
        'de': '<li><a href="/de/about/">Über uns</a></li>',
        'ru': '<li><a href="/ru/about/">О нас</a></li>'
    }
    
    link = translations[lang]
    
    # Insert right after <h2>More</h2><ul>
    # or <h2>Mehr</h2><ul> if it was translated? Wait, let's check what it currently says.
    # In the grep output it was <h2>More</h2><ul>. Let's see if it's translated.
    
    if 'href="/about/"' in html or 'href="/de/about/"' in html or 'href="/ru/about/"' in html:
        # Already linked maybe? Wait, language switcher has href="/about/" ? No, language switcher is dynamically generated maybe.
        pass

    # The regex approach: find `<div class="footer-links"><h2>.*?</h2><ul>`
    # and insert the link immediately after `<ul>`.
    # Only if the link is not already there.
    if '>About Us</a>' not in html and '>Über uns</a>' not in html and '>О нас</a>' not in html:
        # We need to find the "More" block. It's the second `footer-links` div, but let's just match the exact html fragment if possible.
        # `<div class="footer-links"><h2>More</h2><ul>`
        html = re.sub(
            r'(<div class="footer-links"><h2>.*?</h2><ul>)',
            r'\1' + link,
            html
        )

    if html != original_html:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Updated Footer: {filepath}")

for root, dirs, files in os.walk(BASE):
    if '.claude' in root or '.git' in root: continue
    for f in files:
        process_file(os.path.join(root, f))
