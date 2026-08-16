from pathlib import Path

index = Path('index.html')
text = index.read_text(encoding='utf-8')

replacements = {
    'assets/css/mobile-fixes.css?v=20260816-premium-1': 'assets/css/mobile-fixes.css?v=20260816-clickfix-2',
    'assets/js/site-v2.js?v=20260816-navfix-1': 'assets/js/site-v2.js?v=20260816-clickfix-2',
    'assets/js/mobile-fixes.js?v=20260816-navfix-1': 'assets/js/mobile-fixes.js?v=20260816-clickfix-2',
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Referência esperada não encontrada: {old}')
    text = text.replace(old, new)

index.write_text(text, encoding='utf-8')
print('Cache-bust aplicado ao CSS crítico e aos JS de navegação.')
