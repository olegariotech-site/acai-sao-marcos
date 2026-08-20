from io import BytesIO
import time
import urllib.request
from PIL import Image

BASE = 'https://acaidodudu.com.br/'
IMAGE = 'https://acaidodudu.com.br/assets/img/acai-do-dudu-link-preview-1200x630-v2.jpg'
UA = 'WhatsApp/2.24 LinkPreview'


def fetch(url):
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': UA,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        },
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.status, response.headers, response.read()


html = None
for attempt in range(1, 31):
    try:
        status, headers, body = fetch(f'{BASE}?preview-check={int(time.time())}-{attempt}')
        text = body.decode('utf-8', errors='replace')
        if status == 200 and IMAGE in text:
            html = text
            print(f'HTML novo encontrado na tentativa {attempt}.')
            break
    except Exception as exc:
        print(f'Tentativa {attempt}: {exc}')
    time.sleep(5)

if html is None:
    raise SystemExit('Produção ainda não está servindo o novo og:image.')

status, headers, body = fetch(f'{IMAGE}?preview-check={int(time.time())}')
content_type = headers.get_content_type()
print(f'Imagem HTTP {status} · {content_type} · {len(body)} bytes')

if status != 200:
    raise SystemExit(f'Imagem retornou HTTP {status}.')
if content_type != 'image/jpeg':
    raise SystemExit(f'Content-Type inesperado: {content_type}.')
if len(body) > 300_000:
    raise SystemExit(f'Imagem ao vivo passou de 300 KB: {len(body)} bytes.')

with Image.open(BytesIO(body)) as image:
    print(f'Dimensões ao vivo: {image.size[0]}x{image.size[1]}')
    if image.size != (1200, 630):
        raise SystemExit(f'Dimensões inesperadas: {image.size}.')

print('✅ Capa social publicada e acessível com user-agent de preview do WhatsApp.')
