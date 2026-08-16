import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const siteJs = fs.readFileSync('assets/js/site-v2.js', 'utf8');
const mobileJs = fs.readFileSync('assets/js/mobile-fixes.js', 'utf8');

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

  if (href === '#') {
    if (!/data-modal-whatsapp/i.test(tag)) {
      errors.push(`Link visível com destino vazio (#): ${tag.slice(0, 140)}`);
    }
    continue;
  }

  if (href.startsWith('#')) {
    const target = decodeURIComponent(href.slice(1));
    if (!ids.has(target)) {
      errors.push(`Âncora interna sem alvo: ${href}`);
    }
  }
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
  ['categorias', "querySelectorAll('[data-category]')"],
  ['fechar modal', "modalClose?.addEventListener('click'"],
  ['backdrop do modal', "event.target.matches('[data-modal-backdrop]')"]
];

for (const [label, marker] of requiredSiteBindings) {
  if (!siteJs.includes(marker)) errors.push(`Handler obrigatório ausente em site-v2.js: ${label}`);
}

const requiredCompatibilityBindings = [
  ['cards-resumo do topo', "querySelectorAll('.quick-item')"],
  ['cards Sergel', "querySelectorAll('.sergel-card')"],
  ['WhatsApp flutuante', 'installWhatsAppActions'],
  ['auditoria de âncoras internas', 'auditInternalTargets']
];

for (const [label, marker] of requiredCompatibilityBindings) {
  if (!mobileJs.includes(marker)) errors.push(`Handler obrigatório ausente em mobile-fixes.js: ${label}`);
}

const externalLinks = anchorTags
  .map((match) => match[1])
  .filter((href) => /^https?:\/\//i.test(href));

if (!externalLinks.some((href) => href.includes('google.com/maps'))) {
  errors.push('Nenhum link de rota do Google Maps encontrado.');
}

if (!externalLinks.some((href) => href.includes('wa.me/'))) {
  warnings.push('O WhatsApp principal é criado por JavaScript; confirme o WHATSAPP_BASE em mobile-fixes.js.');
}

if (!mobileJs.includes("const WHATSAPP_BASE = 'https://wa.me/5519991288849'")) {
  errors.push('WHATSAPP_BASE esperado não encontrado em mobile-fixes.js.');
}

if (errors.length) {
  console.error('\nFalhas na auditoria de interações:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Auditoria de interações OK: ${anchorTags.length} links estáticos verificados e ${ids.size} IDs mapeados.`);
for (const warning of warnings) console.warn(`Aviso: ${warning}`);
