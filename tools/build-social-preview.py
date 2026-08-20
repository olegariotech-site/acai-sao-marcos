from pathlib import Path
from PIL import Image, ImageOps

SOURCE = Path('assets/img/acai-do-dudu-link-preview-1200x630.png')
OUTPUT = Path('assets/img/acai-do-dudu-link-preview-1200x630-v2.jpg')
INDEX = Path('index.html')
TARGET_SIZE = (1200, 630)
MAX_BYTES = 550_000

if not SOURCE.exists():
    raise SystemExit(f'Imagem de origem não encontrada: {SOURCE}')

with Image.open(SOURCE) as image:
    print(f'Origem: {image.size[0]}x{image.size[1]} · {SOURCE.stat().st_size} bytes')
    rgb = image.convert('RGB')
    social = ImageOps.fit(rgb, TARGET_SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))

quality = 88
while quality >= 68:
    social.save(
        OUTPUT,
        format='JPEG',
        quality=quality,
        optimize=True,
        progressive=True,
        subsampling=2,
    )
    size = OUTPUT.stat().st_size
    if size <= MAX_BYTES:
        break
    quality -= 4

if OUTPUT.stat().st_size > MAX_BYTES:
    raise SystemExit(f'Preview ainda ficou pesado: {OUTPUT.stat().st_size} bytes')

print(f'Preview: 1200x630 · {OUTPUT.stat().st_size} bytes · qualidade {quality}')

html = INDEX.read_text(encoding='utf-8')
old_image = 'https://acaidodudu.com.br/assets/img/acai-do-dudu-link-preview-1200x630.png'
new_image = 'https://acaidodudu.com.br/assets/img/acai-do-dudu-link-preview-1200x630-v2.jpg'
html = html.replace(old_image, new_image)
html = html.replace('<meta property="og:image:type" content="image/png" />', '<meta property="og:image:type" content="image/jpeg" />')
html = html.replace('<meta property="og:image:width" content="1731" />', '<meta property="og:image:width" content="1200" />')
html = html.replace('<meta property="og:image:height" content="909" />', '<meta property="og:image:height" content="630" />')

if new_image not in html:
    raise SystemExit('Falha ao atualizar og:image para a nova capa.')
if 'content="1200"' not in html or 'content="630"' not in html:
    raise SystemExit('Falha ao atualizar dimensões Open Graph.')

INDEX.write_text(html, encoding='utf-8')
print('Open Graph, Twitter Card e JSON-LD atualizados para a nova capa.')
