import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync('index.html', 'utf8');
const fail = (message) => {
  console.error(`Falha na capa social: ${message}`);
  process.exit(1);
};

const readMeta = (property) => {
  const match = html.match(new RegExp(`<meta\\s+(?:property|name)=["']${property.replace(':', '\\:')}["']\\s+content=["']([^"']+)["']\\s*\\/?>(?:\\s*)`, 'i'));
  return match?.[1] || null;
};

const ogImage = readMeta('og:image');
const secureImage = readMeta('og:image:secure_url');
const imageType = readMeta('og:image:type');
const imageWidth = readMeta('og:image:width');
const imageHeight = readMeta('og:image:height');
const twitterImage = readMeta('twitter:image');

if (!ogImage) fail('og:image ausente.');
if (!ogImage.startsWith('https://acaidodudu.com.br/')) fail(`og:image precisa ser URL HTTPS absoluta do domínio oficial: ${ogImage}`);
if (secureImage !== ogImage) fail('og:image:secure_url precisa apontar para a mesma capa.');
if (twitterImage !== ogImage) fail('twitter:image precisa usar a mesma capa social.');
if (imageType !== 'image/jpeg') fail(`tipo esperado image/jpeg, atual ${imageType}.`);
if (imageWidth !== '1200' || imageHeight !== '630') fail(`dimensões declaradas devem ser 1200x630, atuais ${imageWidth}x${imageHeight}.`);

const pathname = new URL(ogImage).pathname.replace(/^\/+/, '');
const localPath = path.normalize(pathname);
if (!fs.existsSync(localPath)) fail(`arquivo de og:image não existe no repositório: ${localPath}`);

const bytes = fs.statSync(localPath).size;
if (bytes > 300_000) fail(`imagem pesa ${bytes} bytes; para WhatsApp manter abaixo de 300 KB.`);

console.log(`Capa social OK: ${localPath} · ${bytes} bytes · 1200x630 JPEG.`);
