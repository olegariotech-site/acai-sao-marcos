import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const privacyHtml = fs.readFileSync('privacidade.html', 'utf8');
const siteJs = fs.readFileSync('assets/js/site-v2.js', 'utf8');
const mobileJs = fs.readFileSync('assets/js/mobile-fixes.js', 'utf8');
const analyticsJs = fs.readFileSync('assets/js/analytics-consent.js', 'utf8');
const mobileCss = fs.readFileSync('assets/css/mobile-fixes.css', 'utf8');
const catalog = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

const errors = [];
const warnings = [];

const ids = new Set(
  [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1])
);

const anchorTags = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi)];

for (const match of anchorTags) {
  const tag = match[0];
  const href = match[1].trim();

  if (!href) {
    errors.push(`Link sem href válido: ${tag.slice(0, 140)}`);
    continue;
  }

  if (/^javascript:/i.test(href)) {
    errors.push(`Link javascript: não permitido: ${tag.slice(0, 140)}`);
    continue;
  }

  if (href === '#') {
    if (!/data-modal-whatsapp/i.test(tag)) {
      errors.push(`Link visível com destino vazio (#): ${tag.slice(0, 140)}`);
    }
    continue;
  }

  if (href.startsWith('#')) {
    const target = decodeURIComponent(href.slice(1));
    if (!ids.has(target)) errors.push(`Âncora interna sem alvo: ${href}`);
  }
}

const allPublicHtml = `${html}\n${privacyHtml}`;
for (const match of allPublicHtml.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)) {
  const tag = match[0];
  const rel = tag.match(/\brel=["']([^"']*)["']/i)?.[1]?.toLowerCase() || '';
  if (!rel.split(/\s+/).includes('noopener')) {
    errors.push(`Link target=_blank sem rel=noopener: ${tag.slice(0, 160)}`);
  }
}

if (/\son(?:click|load|error|mouseover|focus)\s*=/i.test(allPublicHtml)) {
  errors.push('Handler JavaScript inline encontrado no HTML público; manter eventos nos arquivos JS.');
}

const requiredIds = ['inicio', 'cardapio', 'sergel', 'monte', 'loja', 'localizacao'];
for (const id of requiredIds) {
  if (!ids.has(id)) errors.push(`Seção obrigatória ausente: #${id}`);
}

const requiredHtmlMarkers = [
  ['menu móvel', 'data-menu-open'],
  ['fechar menu móvel', 'data-menu-close'],
  ['grade de ofertas', 'data-offer-grid'],
  ['grade de produtos', 'data-product-grid'],
  ['categorias do cardápio', 'data-category-rail'],
  ['fechar modal', 'data-modal-close'],
  ['WhatsApp do modal', 'data-modal-whatsapp']
];

for (const [label, marker] of requiredHtmlMarkers) {
  if (!html.includes(marker)) errors.push(`Controle obrigatório ausente no HTML: ${label} (${marker})`);
}

const requiredSiteBindings = [
  ['cards de produto', "querySelectorAll('[data-product-id]')"],
  ['cards de oferta', "querySelectorAll('[data-offer-id]')"],
  ['delegação do rail de categorias', "elements.categoryRail?.addEventListener('click'"],
  ['seleção centralizada de categoria', 'selectCategory(button.dataset.category)'],
  ['rolagem centralizada até produtos', 'scrollToActiveProducts'],
  ['fechar modal', "modalClose?.addEventListener('click'"],
  ['backdrop do modal', "event.target.matches('[data-modal-backdrop]')"]
];

for (const [label, marker] of requiredSiteBindings) {
  if (!siteJs.includes(marker)) errors.push(`Handler obrigatório ausente em site-v2.js: ${label}`);
}

const requiredCompatibilityBindings = [
  ['roteamento dos atalhos', 'installQuickRouting'],
  ['cards Sergel', 'installSergelRouting'],
  ['WhatsApp flutuante', 'installWhatsAppActions'],
  ['auditoria de âncoras internas', 'auditInternalTargets'],
  ['bloqueio de fundo do modal', 'installModalScrollLock']
];

for (const [label, marker] of requiredCompatibilityBindings) {
  if (!mobileJs.includes(marker)) errors.push(`Handler obrigatório ausente em mobile-fixes.js: ${label}`);
}

if (mobileJs.includes('installCategoryRouting')) {
  errors.push('Roteamento duplicado de categorias voltou a mobile-fixes.js; site-v2.js deve ser o único dono do clique.');
}

if (!mobileCss.includes(".product-modal[aria-hidden='true']") || !mobileCss.includes('pointer-events: none !important')) {
  errors.push('Proteção contra modal invisível interceptando cliques está ausente em mobile-fixes.css.');
}
if (!mobileCss.includes('.product-modal.open .modal-media [data-modal-media]:not([hidden])')) {
  errors.push('Visibilidade forçada da mídia do modal não está restrita ao estado .open.');
}
if (!mobileCss.includes('env(safe-area-inset-bottom)') || !mobileCss.includes('(pointer: coarse)')) {
  errors.push('Hardening esperado para iOS/Android (safe-area e pointer coarse) está ausente.');
}

const sourceJs = `${siteJs}\n${mobileJs}\n${analyticsJs}`;
const forbiddenJsPatterns = [
  [/\beval\s*\(/, 'eval()'],
  [/\bnew\s+Function\s*\(/, 'new Function()'],
  [/\bdocument\.write\s*\(/, 'document.write()']
];
for (const [pattern, label] of forbiddenJsPatterns) {
  if (pattern.test(sourceJs)) errors.push(`Construção JavaScript insegura encontrada: ${label}.`);
}

if (!analyticsJs.includes("const GA_MEASUREMENT_ID = 'G-EET73MQB7L'")) {
  errors.push('ID do Google Analytics esperado não encontrado.');
}
if (!analyticsJs.includes("readConsent() !== 'granted'")) {
  errors.push('Google Analytics não está claramente condicionado ao consentimento concedido.');
}
if (!analyticsJs.includes('allow_google_signals: false') || !analyticsJs.includes('allow_ad_personalization_signals: false')) {
  errors.push('Hardening de privacidade do GA4 está incompleto.');
}
if (!privacyHtml.includes('Google Analytics') || !privacyHtml.includes('Cookies opcionais')) {
  errors.push('Política de Privacidade não documenta Analytics e cookies opcionais.');
}

const categoryIds = catalog.categories.map((category) => category.id);
const categoryIdSet = new Set(categoryIds);
if (categoryIdSet.size !== categoryIds.length) errors.push('Há IDs de categoria duplicados em products.json.');
if (!categoryIdSet.has('destaques')) errors.push('Categoria obrigatória "destaques" ausente.');

const productIds = catalog.products.map((product) => product.id);
const productIdSet = new Set(productIds);
if (productIdSet.size !== productIds.length) errors.push('Há IDs de produto duplicados em products.json.');
if (productIdSet.has('sorvetes-e-picoles')) errors.push('Card genérico antigo "sorvetes-e-picoles" voltou ao catálogo.');

for (const product of catalog.products) {
  if (!product.id || !product.name) errors.push(`Produto sem id/nome válido: ${JSON.stringify(product).slice(0, 180)}`);
  if (!categoryIdSet.has(product.category)) errors.push(`Produto ${product.id} usa categoria inexistente: ${product.category}`);
  if (!product.image || typeof product.image !== 'string') errors.push(`Produto ${product.id} não possui imagem válida.`);
  if (!Array.isArray(product.sizes) || !product.sizes.length) errors.push(`Produto ${product.id} não possui tamanhos/preços.`);

  for (const size of product.sizes || []) {
    if (!size.label) errors.push(`Produto ${product.id} possui tamanho sem rótulo.`);
    if (typeof size.price !== 'number' || !Number.isFinite(size.price) || size.price <= 0) {
      errors.push(`Produto ${product.id} possui preço inválido em ${size.label || 'tamanho sem nome'}.`);
    }
  }
}

for (const category of catalog.categories) {
  if (category.id === 'destaques') continue;
  const count = catalog.products.filter((product) => product.category === category.id).length;
  if (!count) errors.push(`Categoria ${category.id} não possui nenhum produto.`);
}

const quickProductIds = [...html.matchAll(/\bdata-quick-product=["']([^"']+)["']/g)].map((match) => match[1]);
for (const productId of quickProductIds) {
  if (!productIdSet.has(productId)) errors.push(`Atalho rápido aponta para produto inexistente: ${productId}`);
}

const quickCategoryIds = [...html.matchAll(/\bdata-quick-category=["']([^"']+)["']/g)].map((match) => match[1]);
for (const categoryId of quickCategoryIds) {
  if (!categoryIdSet.has(categoryId)) errors.push(`Atalho rápido aponta para categoria inexistente: ${categoryId}`);
}

const requiredCommercialProducts = {
  'trio-do-dudu': [14],
  'agua-de-coco-gelada': [10, 10, 20],
  'pote-tradicional-dudu-2l': [38],
  'milkshake-trufado': [18, 24, 30, 34],
  'batidao-acai-15l': [10, 16, 22],
  'picoles-do-dudu': [1.99],
  'picoles-sergel': [4.8]
};

for (const [productId, expectedPrices] of Object.entries(requiredCommercialProducts)) {
  const product = catalog.products.find((item) => item.id === productId);
  if (!product) {
    errors.push(`Produto comercial obrigatório ausente: ${productId}`);
    continue;
  }
  const actualPrices = product.sizes.map((size) => size.price);
  if (actualPrices.length !== expectedPrices.length || actualPrices.some((price, index) => price !== expectedPrices[index])) {
    errors.push(`Preços divergentes em ${productId}: esperado ${expectedPrices.join('/')}, atual ${actualPrices.join('/')}.`);
  }
}

const duduPopsicle = catalog.products.find((item) => item.id === 'picoles-do-dudu');
const sergelPopsicle = catalog.products.find((item) => item.id === 'picoles-sergel');
if (duduPopsicle?.image !== 'assets/img/produtos/picoles-do-dudu-card.png') {
  errors.push('Picolés do Dudu não aponta para a arte final aprovada.');
}
if (sergelPopsicle?.image !== 'assets/img/produtos/picoles-sergel-card.png') {
  errors.push('Picolés Sergel não aponta para a arte final aprovada.');
}

const externalLinks = anchorTags
  .map((match) => match[1])
  .filter((href) => /^https?:\/\//i.test(href));

if (!externalLinks.some((href) => href.includes('google.com/maps'))) {
  errors.push('Nenhum link de rota do Google Maps encontrado.');
}

if (!externalLinks.some((href) => href.includes('wa.me/5519991288849'))) {
  errors.push('WhatsApp público esperado não encontrado nos links estáticos.');
}

if (!mobileJs.includes("const WHATSAPP_BASE = 'https://wa.me/5519991288849'")) {
  errors.push('WHATSAPP_BASE esperado não encontrado em mobile-fixes.js.');
}

const backstageText = `${html}\n${JSON.stringify(catalog)}`.toLowerCase();
const forbiddenBackstagePhrases = [
  'pendente de confirmação',
  'proposta conceitual desenvolvida',
  'texto provisório',
  'todo:'
];
for (const phrase of forbiddenBackstagePhrases) {
  if (backstageText.includes(phrase)) errors.push(`Texto de bastidor encontrado no conteúdo público: "${phrase}".`);
}

if (errors.length) {
  console.error('\nFalhas na auditoria final de segurança, interações e catálogo:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Auditoria final OK: ${anchorTags.length} links, ${ids.size} IDs, ${catalog.categories.length} categorias e ${catalog.products.length} produtos verificados.`
);
for (const warning of warnings) console.warn(`Aviso: ${warning}`);
