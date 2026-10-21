// Isolated visual-study evidence; no deployment or production code changes.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseSha = 'f20a92377663050c949078e5b7f3891d83ff86fb';
const output = path.resolve(process.env.AURORA_OUTPUT || '/tmp/purple-aurora-study');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'purple-aurora-'));
fs.mkdirSync(output, { recursive: true });
const before = path.join(temp, 'before');
fs.mkdirSync(before);
execFileSync('git', ['archive', '--format=tar', `--output=${temp}/base.tar`, baseSha]);
execFileSync('tar', ['-xf', `${temp}/base.tar`, '-C', before]);
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const old = url.pathname.startsWith('/before/');
  const root = old ? before : process.cwd();
  const pathname = old ? url.pathname.slice('/before'.length) : url.pathname.replace(/^\/candidate/, '');
  let file = path.resolve(root, `.${decodeURIComponent(pathname)}`);
  if (file !== root && !file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file += '/index.html';
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const profiles = [
  ['desktop', 1920, 1080, chromium],
  ['notebook', 1366, 768, chromium],
  ['tablet', 768, 1024, chromium],
  ['android', 393, 873, chromium],
  ['iphone-webkit', 390, 844, webkit],
];
const report = { baseSha, candidateSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), results: [], failures: [], limitations: [] };
const externalCache = new Map();
// Actual text rectangles against clipping ancestors, restricted to the study surfaces.
const clippedText = root => {
  const errors = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim() || node.parentElement.closest('[hidden],script,style')) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (!rect.width || !rect.height) continue;
      for (let parent = node.parentElement; parent && parent !== root.parentElement; parent = parent.parentElement) {
        const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
        if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.left < box.left - 2 || rect.right > box.right + 2) || /(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.top < box.top - 2 || rect.bottom > box.bottom + 2)) {
          errors.push(node.textContent.trim()); break;
        }
      }
    }
  }
  return [...new Set(errors)];
};
try {
  for (const [name, width, height, engine] of profiles) {
    if (engine === webkit && process.env.AURORA_SKIP_WEBKIT === '1') { report.limitations.push('Local WebKit unavailable; required in GitHub Actions.'); continue; }
    const options = { headless: true };
    if (engine === chromium && process.env.CHROMIUM_EXECUTABLE) { options.executablePath = process.env.CHROMIUM_EXECUTABLE; options.args = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote']; }
    const browser = await engine.launch(options);
    const pair = [];
    try {
      for (const version of ['before', 'candidate']) {
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
        const page = await context.newPage();
        const errors = [], failedLocal = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) failedLocal.push(response.url()); });
        await page.route('**/*', async route => {
          const url = route.request().url();
          if (url.startsWith(origin) || /^(data|blob):/.test(url)) return route.continue();
          if (/^https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//.test(url)) {
            if (!externalCache.has(url)) {
              try {
                const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
                externalCache.set(url, { status: response.status, body: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') || 'text/plain' });
              } catch { externalCache.set(url, { status: 200, body: '' }); }
            }
            return route.fulfill(externalCache.get(url));
          }
          // Existing absolute preload uses the same immutable local asset.
          if (url.startsWith('https://acaidodudu.com.br/')) {
            const file = path.resolve(version === 'before' ? before : process.cwd(), '.' + new URL(url).pathname);
            if (fs.existsSync(file)) return route.fulfill({ status: 200, path: file });
          }
          return route.fulfill({ status: 200, body: '' });
        });
        await page.goto(`${origin}/${version}/`, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        if (await page.locator('[data-cookie-reject]').isVisible()) await page.locator('[data-cookie-reject]').click();
        await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
        for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += height * .8) {
          await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(90);
        }
        await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1000);
        const result = { version, profile: name, width, height, engine: browser.version(), errors, failedLocal, sections: {} };
        assert.match(await page.title(), /Açaí do Dudu/);
        result.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        assert.equal(result.overflow, false, `${version}/${name}: overflow`);
        result.fonts = await page.evaluate(() => ({ fredoka: document.fonts.check('700 40px Fredoka'), poppins: document.fonts.check('400 16px Poppins') }));
        for (const [section, selector] of [['hero', '.hero'], ['sergel', '.sergel-showcase']]) {
          const element = page.locator(selector); await element.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
          await element.evaluate(async el => { await Promise.all([...el.querySelectorAll('img')].map(img => img.decode().catch(() => {}))); });
          const clipped = await element.evaluate(clippedText);
          assert.deepEqual(clipped, [], `${version}/${name}/${section}: clipped text`);
          result.sections[section] = await element.evaluate(el => ({ text: el.innerText, width: el.offsetWidth, height: el.offsetHeight,
            images: [...el.querySelectorAll('img')].map(img => ({ src: new URL(img.currentSrc).pathname.replace(/^\/(before|candidate)/, ''), loaded: img.complete && img.naturalWidth > 0 })),
            geometry: [...el.querySelectorAll('h1,h2,p,a,img,.sergel-card')].map(node => ({ tag: node.tagName, x: node.offsetLeft, y: node.offsetTop, width: node.offsetWidth, height: node.offsetHeight })) }));
          assert(result.sections[section].images.every(image => image.loaded), `${version}/${name}: unloaded image`);
          await element.screenshot({ path: `${output}/${version}-${name}-${section}.png`, animations: 'disabled', scale: 'css' });
        }
        await page.evaluate(() => scrollTo(0, 0));
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        result.axe = axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, failure: n.failureSummary })) }));
        assert.equal(result.axe.filter(v => ['serious','critical'].includes(v.impact)).length, 0, `${version}/${name}: serious accessibility violation`);
        await page.locator('[data-quick-product="acai-natural"]').click();
        await page.waitForSelector('.product-modal.open');
        assert.equal((await page.locator('[data-modal-title]').textContent()).trim(), 'Açaí Natural');
        await page.locator('[data-modal-close]').click();
        if (width < 1060) { await page.locator('[data-menu-open]').click(); await page.waitForSelector('.mobile-menu[aria-hidden="false"]'); await page.locator('[data-menu-close]').click(); }
        result.interactions = 'Açaí Natural modal and responsive menu passed';
        assert.deepEqual(errors, [], `${version}/${name}: console`); assert.deepEqual(failedLocal, [], `${version}/${name}: local HTTP failures`);
        report.results.push(result); pair.push(result);
        await context.close();
      }
      for (const section of ['hero', 'sergel']) assert.deepEqual(pair[1].sections[section], pair[0].sections[section], `${name}/${section}: content, images or layout changed`);
      console.log(`PASS ${name} ${width}x${height}: base/candidate content, geometry, images, axe, overflow, clipping, modal/menu`);
    } catch (error) { report.failures.push(`${name}: ${error.message}`); console.error(error.message); }
    finally { await browser.close(); }
  }
} finally { server.close(); fs.writeFileSync(`${output}/visual-study.json`, JSON.stringify(report, null, 2)); fs.rmSync(temp, { recursive: true, force: true }); }
assert.deepEqual(report.failures, [], 'Visual study failures');
