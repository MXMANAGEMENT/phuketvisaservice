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
    
    # Translations
    translations = {
        'en': {
            'topbar_old': 'WhatsApp-first support',
            'topbar_new': '✅ Free document check on WhatsApp',
            'social_proof': '⭐️ Trusted by 500+ expats in Phuket',
            'tm30_pain': '<p class="callout loss-callout"><strong>⚠️ Risk of Fines:</strong> Failing to report your TM30 can lead to fines from 1,600 THB and block your next visa extension.</p>',
            '90d_pain': '<p class="callout loss-callout"><strong>⚠️ Avoid Fines:</strong> Missing your 90-day report deadline results in a 2,000 THB fine. Let us handle it so you never forget.</p>'
        },
        'de': {
            'topbar_old': 'WhatsApp-first support',
            'topbar_new': '✅ Kostenloser Dokumenten-Check über WhatsApp',
            'social_proof': '⭐️ Über 500+ Expats in Phuket vertrauen uns',
            'tm30_pain': '<p class="callout loss-callout"><strong>⚠️ Strafrisiko:</strong> Ein fehlender TM30-Report kann zu Strafen ab 1.600 THB führen und Ihre nächste Visumsverlängerung blockieren.</p>',
            '90d_pain': '<p class="callout loss-callout"><strong>⚠️ Strafen vermeiden:</strong> Ein verpasster 90-Tage-Report kostet 2.000 THB Strafe. Wir kümmern uns darum, damit Sie es nicht vergessen.</p>'
        },
        'ru': {
            'topbar_old': 'WhatsApp-first support',
            'topbar_new': '✅ Бесплатная проверка документов в WhatsApp',
            'social_proof': '⭐️ Нам доверяют 500+ экспатов на Пхукете',
            'tm30_pain': '<p class="callout loss-callout"><strong>⚠️ Риск штрафов:</strong> Отсутствие отчета TM30 может привести к штрафу от 1600 бат и заблокировать продление вашей визы.</p>',
            '90d_pain': '<p class="callout loss-callout"><strong>⚠️ Избегайте штрафов:</strong> Пропуск 90-дневного отчета влечет штраф в 2000 бат. Доверьте это нам, чтобы никогда не забывать.</p>'
        }
    }
    
    t = translations[lang]
    
    # 1. Topbar Update
    # <span class="topbar-dot"></span> WhatsApp-first support
    if t['topbar_old'] in html and t['topbar_new'] not in html:
        html = html.replace(f'<span class="topbar-dot"></span> {t["topbar_old"]}', t['topbar_new'])
        # Also in case it doesn't have the dot exactly:
        html = html.replace(t['topbar_old'], t['topbar_new'])
        
    # 2. Add Social Proof in the Lead Section
    # Find the <p class="wa-focus-sub">...</p> and insert social proof after it.
    if 'class="wa-focus-sub"' in html and 'social-proof-note' not in html:
        # regex to match <p class="wa-focus-sub">...</p>
        html = re.sub(
            r'(<p class="wa-focus-sub">.*?</p>)',
            r'\1\n        <p class="social-proof-note" style="margin-bottom:1.5rem;font-weight:600;color:#28a745;">' + t['social_proof'] + '</p>',
            html
        )
        
    # 3. Add Pain Points for specific pages
    if 'tm30-phuket' in filepath and 'loss-callout' not in html:
        # Insert after <p class="voice-answer">...</p>
        html = re.sub(
            r'(<p class="voice-answer">.*?</p>)',
            r'\1\n        ' + t['tm30_pain'],
            html
        )
        
    if '90-day-report-phuket' in filepath and 'loss-callout' not in html:
        # Insert after <p class="voice-answer">...</p>
        html = re.sub(
            r'(<p class="voice-answer">.*?</p>)',
            r'\1\n        ' + t['90d_pain'],
            html
        )
        
    if html != original_html:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Updated: {filepath}")

for root, dirs, files in os.walk(BASE):
    if '.claude' in root or '.git' in root: continue
    for f in files:
        process_file(os.path.join(root, f))
