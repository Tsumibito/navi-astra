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
    await page.fill('input[name="e"]', end);
    await page.selectOption('select[name="t"]', 'Catamaran');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/draft\/en\/search/);
    const url = page.url();
    assert.match(url, /\/draft\/en\/search\?/);
    assert.match(url, /loc=locality%3Aathens/);
    assert.match(url, /t=Catamaran/);
    assert.match(url, new RegExp(`s=${start}`));
    assert.match(url, new RegExp(`e=${end}`));
    await page.close();
  });

  it('duplicate and reordered query params collapse to a canonical URL', async () => {
    const page = await browser.newPage();
    await page.goto(`${base}/draft/ru/search?s=2026-08-08&s=2026-08-01&loc=locality%3Aathens`);
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
    await page.fill('input[name="e"]', end);
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
});
