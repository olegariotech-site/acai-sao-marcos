import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`${BASE_URL}/`, (res) => {
          res.resume();
          res.statusCode && res.statusCode < 500 ? resolve() : reject(new Error(`HTTP ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(500, () => req.destroy(new Error('timeout')));
      });
      return;
    } catch (_) {
      await sleep(200);
    }
  }
  throw new Error('Servidor local não respondeu a tempo.');
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const categories = [
  ['destaques', null],
  ['acai', 'acai'],
  ['milkshakes', 'milkshakes'],
  ['sorvetes', 'sorvetes'],
  ['familia', 'familia'],
];

const runViewport = async (browser, name, viewport) => {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.category-button[data-category="destaques"]');
  await page.waitForSelector('[data-product-grid] [data-product-id]');

  for (const [categoryId, expectedCategory] of categories) {
    const button = page.locator(`.category-button[data-category="${categoryId}"]`);
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await page.waitForTimeout(850);

    const active = await page.locator(`.category-button[data-category="${categoryId}"]`).evaluate((el) => (
      el.classList.contains('active') && el.getAttribute('aria-pressed') === 'true'
    ));
    assert(active, `[${name}] Categoria ${categoryId} não ficou ativa.`);

    const productIds = await page.locator('[data-product-grid] [data-product-id]').evaluateAll((cards) => (
      cards.map((card) => card.getAttribute('data-product-id')).filter(Boolean)
    ));
    assert(productIds.length > 0, `[${name}] Categoria ${categoryId} ficou sem cards.`);

    if (expectedCategory) {
      const catalogCategories = await page.evaluate(async ({ ids }) => {
        const catalog = await fetch('data/products.json', { cache: 'no-store' }).then((response) => response.json());
        return ids.map((id) => catalog.products.find((product) => product.id === id)?.category || null);
      }, { ids: productIds });
      assert(
        catalogCategories.every((item) => item === expectedCategory),
        `[${name}] Categoria ${categoryId} renderizou produto de outra categoria: ${catalogCategories.join(', ')}`
      );
    }

    const firstCardBox = await page.locator('[data-product-grid] [data-product-id]').first().boundingBox();
    assert(firstCardBox, `[${name}] Primeiro card de ${categoryId} não tem posição calculável.`);
    assert(
      firstCardBox.y < viewport.height * 0.8 && firstCardBox.y + firstCardBox.height > 70,
      `[${name}] Clique em ${categoryId} não levou o usuário ao grid. y=${firstCardBox.y}, viewport=${viewport.height}`
    );
  }

  // Atalhos rápidos precisam usar a mesma rota de categoria.
  await page.locator('[data-quick-category="milkshakes"]').click();
  await page.waitForTimeout(850);
  assert(
    await page.locator('.category-button[data-category="milkshakes"]').evaluate((el) => el.classList.contains('active')),
    `[${name}] Atalho rápido de milk-shakes não ativou a categoria.`
  );

  // Atalho de produto deve abrir o produto certo.
  await page.locator('[data-quick-product="acai-natural"]').click();
  await page.waitForSelector('.product-modal.open', { timeout: 4000 });
  const modalTitle = (await page.locator('[data-modal-title]').textContent())?.trim();
  assert(modalTitle === 'Açaí Natural', `[${name}] Atalho Açaí Natural abriu modal incorreto: ${modalTitle}`);
  await page.locator('[data-modal-close]').click();

  assert(consoleErrors.length === 0, `[${name}] Erros no console:\n${consoleErrors.join('\n')}`);
  await page.close();
};

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  stdio: ['ignore', 'ignore', 'inherit'],
});

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  await runViewport(browser, 'notebook', { width: 1366, height: 768 });
  await runViewport(browser, 'mobile', { width: 390, height: 844 });
  console.log('✅ Navegação real validada em notebook e mobile.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
