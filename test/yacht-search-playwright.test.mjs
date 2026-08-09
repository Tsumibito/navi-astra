import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const dist = decodeURIComponent(new URL('../dist/', import.meta.url).pathname.replace(/\/$/, ''));
const distReady = existsSync(dist);
const browser = await chromium.launch().catch(() => null);

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let url = req.url ?? '/';
      if (url.includes('?')) url = url.split('?')[0];
      let file = join(dist, decodeURIComponent(url));
      try {
        let stat = await import('node:fs/promises').then((m) => m.stat(file).catch(() => null));
        if (stat?.isDirectory()) {
          file = join(file, 'index.html');
          stat = await import('node:fs/promises').then((m) => m.stat(file).catch(() => null));
        }
        if (!stat?.isFile()) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const content = await readFile(file);
        const type = mimeTypes[extname(file)] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type });
        res.end(content);
      } catch {
        res.writeHead(500);
        res.end('Error');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('YachtSearch Playwright regression', () => {
  let server;
  let base;

  before(async () => {
    if (!distReady) throw new Error('Playwright E2E requires a built dist. Run: npm run build');
    if (!browser) throw new Error('Playwright E2E requires a Chromium install. Run: npx playwright install chromium');
    server = await startServer();
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    base = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    server?.close();
    if (browser) await browser.close();
  });

  it('valid submit navigates to canonical results URL', async () => {
    const page = await browser.newPage();
    await page.goto(`${base}/draft/en/athens/`);
    const min = await page.locator('input[name="s"]').getAttribute('min');
    assert.ok(min, 'input[name="s"] missing min attribute');
    const start = min;
    const end = addDays(min, 7);
    await page.fill('input[name="s"]', start);
    await page.selectOption('select[name="duration"]', '1');
    await page.selectOption('select[name="t"]', 'Catamaran');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/en\/yacht-search\//);
    const url = page.url();
    assert.match(url, /\/en\/yacht-search\/\?/);
    assert.match(url, /loc=locality%3Aathens/);
    assert.match(url, /t=Catamaran/);
    assert.match(url, new RegExp(`s=${start}`));
    assert.match(url, new RegExp(`e=${end}`));
    await page.close();
  });

  it('duplicate and reordered query params collapse to a canonical URL', async () => {
    const page = await browser.newPage();
    await page.goto(`${base}/ru/yacht-search/?s=2026-08-08&s=2026-08-01&loc=locality%3Aathens`);
    await page.waitForTimeout(300);
    const search = await page.evaluate(() => window.location.search);
    const decoded = decodeURIComponent(search);
    assert.ok(!decoded.match(/s=.*s=/), 'search still contains duplicate s values');
    assert.match(decoded, /s=2026-08-01/);
    assert.match(decoded, /loc=locality:athens/);
    await page.close();
  });

  it('invalid date range shows localized alert and focuses start input', async () => {
    const page = await browser.newPage();
    await page.goto(`${base}/draft/ru/athens/`);
    const min = await page.locator('input[name="s"]').getAttribute('min');
    assert.ok(min, 'input[name="s"] missing min attribute');
    const end = min;
    const start = addDays(min, 1);
    await page.fill('input[name="s"]', start);
    await page.evaluate((value) => {
      const input = document.querySelector('input[name="e"]');
      if (input instanceof HTMLInputElement) input.value = value;
    }, end);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(300);
    const alert = await page.locator('[role="alert"]').textContent();
    assert.ok(alert && alert.length > 0, 'alert is empty');
    const active = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, name: el.getAttribute('name') } : null;
    });
    assert.equal(active?.tag, 'INPUT');
    assert.equal(active?.name, 's');
    const invalidStart = await page.locator('input[name="s"]').getAttribute('aria-invalid');
    assert.equal(invalidStart, 'true');
    await page.close();
  });

  it('browse-only state shows rail and filters by geographic scope', async () => {
    const page = await browser.newPage();
    await page.goto(`${base}/draft/en/test/yacht-search?loc=locality%3Aathens`);
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => {
      const rail = document.querySelector('[data-yacht-rail]');
      const card = document.querySelector('[data-yacht-card]');
      return { railHidden: rail?.hidden, cardHidden: card?.hidden, boatType: card?.dataset.boatType };
    });
    assert.equal(state.railHidden, false, 'rail should be visible for matching yacht');
    assert.equal(state.cardHidden, false, 'Athens fixture card should be visible');
    assert.equal(state.boatType, 'Catamaran');
    await page.close();
  });

  it('browse-only state exposes real Athens inventory', async () => {
    const page = await browser.newPage();
    await page.goto(`${base}/en/yacht-search/?loc=locality%3Aathens`);
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => {
      const card = document.querySelector('[data-yacht-card]');
      return card ? { hidden: card.hidden, boatType: card.dataset.boatType } : null;
    });
    assert.ok(state, 'data-yacht-card not found');
    assert.equal(state.hidden, false, 'Athens inventory card should be visible');
    assert.ok(state.boatType, 'boat type must be present');
    const placeholder = await page.locator('[data-search-placeholder]').textContent();
    assert.ok(placeholder && placeholder.length > 0, 'placeholder is empty');
    await page.close();
  });

  it('price stays hidden for non-exact offers even with matching dates', async () => {
    const page = await browser.newPage();
    const s = '2026-08-01';
    const e = '2026-08-08';
    const g = '4';
    const sv = 'bareboat';
    const url = `${base}/draft/en/test/yacht-search?loc=locality%3Aathens&t=Catamaran&s=${s}&e=${e}&g=${g}&sv=${sv}`;
    await page.goto(url);
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => {
      const price = document.querySelector('[data-yacht-price]');
      return price ? { hidden: price.hidden, eligible: price.dataset.priceEligible } : null;
    });
    assert.ok(state, 'data-yacht-price not found');
    assert.equal(state.hidden, true, 'price should be hidden');
    assert.equal(state.eligible, 'false', 'price should not be eligible');
    await page.close();
  });

  it('both image and title links preserve full search context', async () => {
    const page = await browser.newPage();
    const s = '2026-08-01';
    const e = '2026-08-08';
    const g = '4';
    const sv = 'bareboat';
    const url = `${base}/draft/en/test/yacht-search?loc=locality%3Aathens&t=Catamaran&s=${s}&e=${e}&g=${g}&sv=${sv}`;
    await page.goto(url);
    await page.waitForTimeout(300);
    const links = await page.locator('[data-yacht-link]').all();
    assert.ok(links.length >= 2, 'expected at least image and title links');
    for (let i = 0; i < links.length; i++) {
      const href = await links[i].getAttribute('href');
      assert.ok(href, `link ${i} has no href`);
      assert.match(href, /loc=locality%3Aathens/, `link ${i} missing loc`);
      assert.match(href, /t=Catamaran/, `link ${i} missing t`);
      assert.match(href, new RegExp(`s=${s}`), `link ${i} missing s`);
      assert.match(href, new RegExp(`e=${e}`), `link ${i} missing e`);
      assert.match(href, new RegExp(`g=${g}`), `link ${i} missing g`);
      assert.match(href, new RegExp(`sv=${sv}`), `link ${i} missing sv`);
    }
    await page.close();
  });
});
