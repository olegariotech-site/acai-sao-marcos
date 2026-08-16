import { chromium } from 'playwright';

const BASE_URL = 'https://acaidodudu.com.br';
const EXPECTED_VERSION = '20260816-clickfix-2';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function waitForPublishedVersion() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const response = await fetch(`${BASE_URL}/?verify=${Date.now()}-${attempt}`, {
      headers: { 'cache-control': 'no-cache' }
    });
    const html = await response.text();
    if (response.ok && html.includes(EXPECTED_VERSION)) {
      console.log(`Versão publicada encontrada na tentativa ${attempt}.`);
      return;
    }
    console.log(`Aguardando produção... tentativa ${attempt}/30`);
    await sleep(5000);
  }
  throw new Error(`Produção não publicou ${EXPECTED_VERSION} dentro do prazo.`);
}

async function runNotebook(browser) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(`${BASE_URL}/?e2e=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.category-button[data-category="destaques"]', { timeout: 15000 });
  await page.waitForSelector('[data-product-grid] [data-product-id]', { timeout: 15000 });

  const loadedAssets = await page.evaluate(() => ({
    styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map((el) => el.href),
    scripts: [...document.scripts].map((el) => el.src).filter(Boolean)
  }));
  assert(loadedAssets.styles.some((url) => url.includes(`mobile-fixes.css?v=${EXPECTED_VERSION}`)), 'CSS crítico novo não foi carregado em produção.');
  assert(loadedAssets.scripts.some((url) => url.includes(`site-v2.js?v=${EXPECTED_VERSION}`)), 'site-v2.js novo não foi carregado em produção.');
  assert(loadedAssets.scripts.some((url) => url.includes(`mobile-fixes.js?v=${EXPECTED_VERSION}`)), 'mobile-fixes.js novo não foi carregado em produção.');

  const categories = ['destaques', 'acai', 'milkshakes', 'sorvetes', 'familia'];
  for (const categoryId of categories) {
    const button = page.locator(`.category-button[data-category="${categoryId}"]`);
    await button.scrollIntoViewIfNeeded();
    await button.click({ timeout: 10000 });
    await page.waitForTimeout(900);

    const active = await page.locator(`.category-button[data-category="${categoryId}"]`).evaluate((el) => (
      el.classList.contains('active') && el.getAttribute('aria-pressed') === 'true'
    ));
    assert(active, `Categoria ${categoryId} não ficou ativa em produção.`);

    const firstCard = page.locator('[data-product-grid] [data-product-id]').first();
    const box = await firstCard.boundingBox();
    assert(box, `Primeiro card de ${categoryId} não possui posição.`);
    assert(box.y < 768 * 0.82 && box.y + box.height > 70, `Clique em ${categoryId} não levou ao cardápio visível. y=${box.y}`);
  }

  // Abre e fecha um produto. Depois o clique seguinte precisa funcionar sem camada invisível.
  const quickProduct = page.locator('[data-quick-product="acai-natural"]');
  await quickProduct.scrollIntoViewIfNeeded();
  await quickProduct.click({ timeout: 10000 });
  await page.waitForSelector('.product-modal.open', { timeout: 10000 });
  assert((await page.locator('[data-modal-title]').textContent())?.trim() === 'Açaí Natural', 'Atalho abriu produto incorreto.');
  await page.locator('[data-modal-close]').click({ timeout: 10000 });
  await page.waitForSelector('.product-modal:not(.open)', { timeout: 10000 });

  const modalState = await page.locator('.product-modal').evaluate((el) => ({
    ariaHidden: el.getAttribute('aria-hidden'),
    pointerEvents: getComputedStyle(el).pointerEvents,
    visibility: getComputedStyle(el).visibility
  }));
  assert(modalState.ariaHidden === 'true', `Modal fechou com aria-hidden=${modalState.ariaHidden}.`);
  assert(modalState.pointerEvents === 'none', `Modal fechado ainda intercepta cliques: pointer-events=${modalState.pointerEvents}.`);

  const quickMilk = page.locator('[data-quick-category="milkshakes"]');
  await quickMilk.scrollIntoViewIfNeeded();
  await quickMilk.click({ timeout: 10000 });
  await page.waitForTimeout(900);
  assert(
    await page.locator('.category-button[data-category="milkshakes"]').evaluate((el) => el.classList.contains('active')),
    'Clique após fechar o modal foi bloqueado em produção.'
  );

  assert(errors.length === 0, `Erros de console/página em produção:\n${errors.join('\n')}`);
  console.log('✅ Produção validada em notebook 1366x768: assets novos, categorias, modal e clique pós-modal.');
  await page.close();
}

await waitForPublishedVersion();
const browser = await chromium.launch({ headless: true });
try {
  await runNotebook(browser);
} finally {
  await browser.close();
}
