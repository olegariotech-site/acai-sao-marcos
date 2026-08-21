import { chromium, webkit } from 'playwright';
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

const profiles = [
  {
    name: 'notebook Chromium',
    browserType: chromium,
    touch: false,
    context: { viewport: { width: 1366, height: 768 } }
  },
  {
    name: 'Android Chrome',
    browserType: chromium,
    touch: true,
    context: {
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      deviceScaleFactor: 2.75,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
    }
  },
  {
    name: 'iOS Safari WebKit',
    browserType: webkit,
    touch: true,
    context: {
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    }
  }
];

const runProfile = async ({ name, browserType, context: contextOptions, touch }) => {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const consoleErrors = [];
  const localNetworkErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('requestfailed', (request) => {
    if (!request.url().startsWith(BASE_URL)) return;

    const failureText = request.failure()?.errorText || 'falhou';
    const isExpectedMediaCancellation = request.resourceType() === 'media' && /cancel/i.test(failureText);
    if (isExpectedMediaCancellation) return;

    localNetworkErrors.push(`${request.method()} ${request.url()} — ${failureText}`);
  });
  page.on('response', (response) => {
    if (response.url().startsWith(BASE_URL) && response.status() >= 400) {
      localNetworkErrors.push(`HTTP ${response.status()} ${response.url()}`);
    }
  });

  // O objetivo do smoke test é validar integralmente os recursos locais. Recursos externos
  // (Google Fonts, Maps etc.) não devem tornar o CI flakey nem mascarar erros do site.
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(BASE_URL) || url.startsWith('data:') || url.startsWith('blob:')) {
      await route.continue();
      return;
    }

    const resourceType = route.request().resourceType();
    const contentType = resourceType === 'stylesheet' ? 'text/css; charset=utf-8' : 'text/plain; charset=utf-8';
    await route.fulfill({ status: 200, contentType, body: resourceType === 'stylesheet' ? '/* external resource stubbed by CI */' : '' });
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.category-button[data-category="destaques"]');
    await page.waitForSelector('[data-product-grid] [data-product-id]');

    const cookieBanner = page.locator('#ot-cookie-consent');
    if (await cookieBanner.count()) {
      await cookieBanner.locator('[data-cookie-reject]').click();
      await page.waitForTimeout(100);
    }

    for (const [categoryId, expectedCategory] of categories) {
      const button = page.locator(`.category-button[data-category="${categoryId}"]`);
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await page.waitForTimeout(450);

      const active = await button.evaluate((el) => (
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
        firstCardBox.y < contextOptions.viewport.height * 0.88 && firstCardBox.y + firstCardBox.height > 60,
        `[${name}] Clique em ${categoryId} não levou o usuário ao grid. y=${firstCardBox.y}, viewport=${contextOptions.viewport.height}`
      );
    }

    await page.locator('[data-quick-category="milkshakes"]').click();
    await page.waitForTimeout(450);
    assert(
      await page.locator('.category-button[data-category="milkshakes"]').evaluate((el) => el.classList.contains('active')),
      `[${name}] Atalho rápido de milk-shakes não ativou a categoria.`
    );

    await page.locator('[data-quick-product="acai-natural"]').click();
    await page.waitForSelector('.product-modal.open', { timeout: 4000 });
    const modalTitle = (await page.locator('[data-modal-title]').textContent())?.trim();
    assert(modalTitle === 'Açaí Natural', `[${name}] Atalho Açaí Natural abriu modal incorreto: ${modalTitle}`);

    const modalBox = await page.locator('.modal-dialog').boundingBox();
    assert(modalBox, `[${name}] Modal não possui dimensões calculáveis.`);
    assert(modalBox.width <= contextOptions.viewport.width + 1, `[${name}] Modal excede a largura da viewport: ${modalBox.width}px.`);
    await page.locator('[data-modal-close]').click();

    await page.locator('#sergel').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const sergelCards = page.locator('#sergel .sergel-card');
    assert(await sergelCards.count() === 4, `[${name}] Vitrine de Picolés/Sergel deve ter 4 cards.`);

    for (const selector of [
      'img[src="assets/img/produtos/picoles-do-dudu-card.png"]',
      'img[src="assets/img/produtos/picoles-sergel-card.png"]'
    ]) {
      const image = page.locator(selector);
      await image.scrollIntoViewIfNeeded();
      await image.waitFor({ state: 'visible' });
      await page.waitForFunction((css) => {
        const img = document.querySelector(css);
        return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
      }, selector);
    }

    if (touch) {
      await page.waitForSelector('.whatsapp-contact-float');
      const mapsFloat = await page.locator('.whatsapp-float').boundingBox();
      const whatsappFloat = await page.locator('.whatsapp-contact-float').boundingBox();
      assert(mapsFloat && mapsFloat.width <= 56, `[${name}] CTA flutuante do Maps está largo demais: ${mapsFloat?.width}px.`);
      assert(whatsappFloat && whatsappFloat.width <= 56, `[${name}] CTA flutuante do WhatsApp está largo demais: ${whatsappFloat?.width}px.`);
    }

    const hasHorizontalOverflow = await page.evaluate(() => (
      document.documentElement.scrollWidth > window.innerWidth + 1
    ));
    assert(!hasHorizontalOverflow, `[${name}] Há overflow horizontal na página.`);

    assert(localNetworkErrors.length === 0, `[${name}] Falhas em recursos locais:\n${localNetworkErrors.join('\n')}`);
    assert(consoleErrors.length === 0, `[${name}] Erros no console:\n${consoleErrors.join('\n')}`);
  } finally {
    await context.close();
    await browser.close();
  }
};

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  stdio: ['ignore', 'ignore', 'inherit'],
});

try {
  await waitForServer();
  for (const profile of profiles) await runProfile(profile);
  console.log('✅ Navegação real validada em notebook Chromium, Android Chrome e iOS Safari/WebKit.');
} finally {
  server.kill('SIGTERM');
}
