import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const checked = new Set();

const cleanLocalPath = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || /^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(trimmed)) return null;

  const clean = trimmed.split('#')[0].split('?')[0].replace(/^\.\//, '').replace(/^\//, '');
  if (!clean.startsWith('assets/') && !clean.startsWith('data/')) return null;
  return clean;
};

const check = (value, source) => {
  const localPath = cleanLocalPath(value);
  if (!localPath) return;

  const key = `${source}:${localPath}`;
  if (checked.has(key)) return;
  checked.add(key);

  const absolute = path.join(root, localPath);
  if (!fs.existsSync(absolute)) failures.push({ source, localPath });
};

const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const attrPattern = /(?:src|href|poster|data-fallback)=["']([^"']+)["']/gi;
for (const match of html.matchAll(attrPattern)) check(match[1], 'index.html');

const catalogPath = path.join(root, 'data', 'products.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

for (const product of catalog.products || []) {
  check(product.image, `products.json:${product.id}:image`);
  check(product.video, `products.json:${product.id}:video`);
}

for (const item of catalog.gallery || []) {
  check(item.src, 'products.json:gallery');
}

const cssFiles = [
  'assets/css/site-v2.css',
  'assets/css/mobile-fixes.css',
  'assets/css/sergel-premium.css'
];

for (const cssFile of cssFiles) {
  const absoluteCss = path.join(root, cssFile);
  if (!fs.existsSync(absoluteCss)) continue;
  const css = fs.readFileSync(absoluteCss, 'utf8');
  const urlPattern = /url\((?:["']?)([^)"']+)(?:["']?)\)/gi;
  for (const match of css.matchAll(urlPattern)) {
    const raw = match[1].trim();
    if (/^(https?:|data:)/i.test(raw)) continue;

    // CSS URLs are relative to the CSS file; normalize them back to repository root.
    const resolved = path.normalize(path.join(path.dirname(cssFile), raw)).replaceAll('\\', '/');
    check(resolved, cssFile);
  }
}

if (failures.length) {
  console.error('\n❌ Caminhos de mídia quebrados:\n');
  for (const failure of failures) {
    console.error(`- ${failure.localPath}  (${failure.source})`);
  }
  console.error(`\nTotal: ${failures.length} caminho(s) inválido(s).\n`);
  process.exit(1);
}

console.log(`✅ Auditoria concluída: ${checked.size} referências locais válidas.`);
