import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicOrigin = 'https://acaidodudu.com.br';
const failures = [];
const references = new Map();

const toPosix = (value) => value.replaceAll('\\', '/');

const cleanLocalPath = (value, baseDir = '') => {
  if (!value || typeof value !== 'string') return null;

  let trimmed = value.trim().replace(/^[\"']|[\"']$/g, '');
  if (!trimmed || /^(mailto:|tel:|#|data:|javascript:|blob:)/i.test(trimmed)) return null;

  if (trimmed.startsWith('//')) trimmed = `https:${trimmed}`;

  if (/^https?:/i.test(trimmed)) {
    let url;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }

    if (url.origin !== publicOrigin) return null;
    trimmed = url.pathname;
  }

  const withoutQuery = trimmed.split('#')[0].split('?')[0];
  if (!withoutQuery || withoutQuery === '/') return null;

  const fromRoot = withoutQuery.startsWith('/');
  const normalized = path.posix.normalize(
    fromRoot
      ? withoutQuery.slice(1)
      : path.posix.join(baseDir, withoutQuery.replace(/^\.\//, ''))
  );

  if (!normalized || normalized === '.' || normalized.startsWith('../')) return null;
  return normalized;
};

const check = (value, source, baseDir = '') => {
  const localPath = cleanLocalPath(value, baseDir);
  if (!localPath) return;

  if (!references.has(localPath)) references.set(localPath, new Set());
  references.get(localPath).add(source);

  const absolute = path.resolve(root, localPath);
  const relativeToRoot = path.relative(root, absolute);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    failures.push({ source, localPath, reason: 'caminho fora do repositório' });
    return;
  }

  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    failures.push({ source, localPath, reason: 'arquivo inexistente' });
  }
};

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(directory, entry.name);
  if (entry.name === '.git') return [];
  if (entry.isDirectory()) return walk(absolute);
  return [absolute];
});

const sourceFiles = walk(root)
  .map((absolute) => toPosix(path.relative(root, absolute)))
  .filter((file) => /\.(?:html|css|js|mjs|json)$/i.test(file));

for (const sourceFile of sourceFiles) {
  const content = fs.readFileSync(path.join(root, sourceFile), 'utf8');

  if (sourceFile.endsWith('.html')) {
    const attrPattern = /(?:src|href|poster|data-fallback)=[\"']([^\"']+)[\"']/gi;
    for (const match of content.matchAll(attrPattern)) check(match[1], sourceFile);

    const srcsetPattern = /srcset=[\"']([^\"']+)[\"']/gi;
    for (const match of content.matchAll(srcsetPattern)) {
      for (const candidate of match[1].split(',')) check(candidate.trim().split(/\s+/)[0], sourceFile);
    }
  }

  if (sourceFile.endsWith('.css')) {
    const urlPattern = /url\((?:[\"']?)([^)\"']+)(?:[\"']?)\)/gi;
    for (const match of content.matchAll(urlPattern)) {
      check(match[1].trim(), sourceFile, path.posix.dirname(sourceFile));
    }
  }

  if (/\.(?:js|mjs)$/i.test(sourceFile)) {
    const stringPathPattern = /[\"'`]((?:https:\/\/acaidodudu\.com\.br\/)?(?:assets|data)\/[^\"'`\s)]+)/gi;
    for (const match of content.matchAll(stringPathPattern)) check(match[1], sourceFile);
  }

  if (sourceFile.endsWith('.json')) {
    const visitJson = (value, jsonPath = '$') => {
      if (typeof value === 'string' && (/^(?:assets|data)\//.test(value) || value.startsWith(`${publicOrigin}/`))) {
        check(value, `${sourceFile}:${jsonPath}`);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item, index) => visitJson(item, `${jsonPath}[${index}]`));
        return;
      }
      if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, item]) => visitJson(item, `${jsonPath}.${key}`));
      }
    };

    visitJson(JSON.parse(content));
  }

  const sameOriginPattern = /https:\/\/acaidodudu\.com\.br\/[^\s\"'<>)}\]]+/gi;
  for (const match of content.matchAll(sameOriginPattern)) check(match[0], sourceFile);
}

const catalogPath = path.join(root, 'data', 'products.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const categoryIds = new Set();
const productIds = new Set();

for (const category of catalog.categories || []) {
  if (!category?.id || !category?.label) failures.push({ source: 'products.json:categories', localPath: '(dados)', reason: 'categoria sem id ou label' });
  if (categoryIds.has(category.id)) failures.push({ source: 'products.json:categories', localPath: category.id, reason: 'id de categoria duplicado' });
  categoryIds.add(category.id);
}

for (const product of catalog.products || []) {
  const source = `products.json:${product?.id || '(sem id)'}`;
  if (!product?.id || !product?.name || !product?.category || !product?.image) {
    failures.push({ source, localPath: '(dados)', reason: 'produto sem id, nome, categoria ou imagem' });
  }
  if (productIds.has(product.id)) failures.push({ source, localPath: product.id, reason: 'id de produto duplicado' });
  if (!categoryIds.has(product.category)) failures.push({ source, localPath: product.category, reason: 'categoria inexistente' });
  if (!Array.isArray(product.sizes) || product.sizes.some((size) => !size?.label || !Number.isFinite(size.price) || size.price < 0)) {
    failures.push({ source, localPath: '(dados)', reason: 'tamanho ou preço inválido' });
  }
  productIds.add(product.id);
  check(product.image, `${source}:image`);
  check(product.video, `${source}:video`);
}

for (const item of catalog.gallery || []) {
  if (!item?.src || !item?.alt) failures.push({ source: 'products.json:gallery', localPath: '(dados)', reason: 'item sem src ou alt' });
  check(item?.src, 'products.json:gallery');
}

const mediaExtensions = new Set(['.avif', '.gif', '.ico', '.jpeg', '.jpg', '.mp4', '.png', '.svg', '.webm', '.webp']);
const mediaFiles = walk(path.join(root, 'assets'))
  .map((absolute) => toPosix(path.relative(root, absolute)))
  .filter((file) => mediaExtensions.has(path.extname(file).toLowerCase()));
const unreferencedMedia = mediaFiles.filter((file) => !references.has(file));

if (failures.length) {
  console.error('\n❌ Falhas na auditoria de mídia e catálogo:\n');
  for (const failure of failures) {
    console.error(`- ${failure.localPath} — ${failure.reason} (${failure.source})`);
  }
  console.error(`\nTotal: ${failures.length} falha(s).\n`);
  process.exit(1);
}

console.log(`✅ Auditoria concluída: ${references.size} arquivos locais referenciados e ${mediaFiles.length} mídias inventariadas.`);
if (unreferencedMedia.length) {
  console.log(`ℹ️  Mídias sem referência ativa (${unreferencedMedia.length}):`);
  for (const mediaFile of unreferencedMedia) console.log(`- ${mediaFile}`);
}
