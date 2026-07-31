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

const pages = [
  { name: 'athens', path: (l) => `/draft/${l}/athens/` },
  { name: 'alimos-marina', path: (l) => `/draft/${l}/alimos-marina/` },
];
const locales = ['ru', 'ua', 'en'];
const viewports = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1100, height: 800, name: 'laptop' },
  { width: 1440, height: 900, name: 'desktop' },
];

describe('Athens and Alimos viewport QA', () => {
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

  for (const { name, path } of pages) {
    for (const locale of locales) {
      for (const viewport of viewports) {
        it(`${name} ${locale} ${viewport.name} (${viewport.width}px) has no horizontal overflow`, async () => {
          const page = await browser.newPage({ viewport });
          await page.goto(`${base}${path(locale)}`);
          await page.waitForTimeout(300);
          const overflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });
          assert.equal(overflow, false, 'document has horizontal overflow');
          await page.close();
        });
      }
    }
  }

  for (const { name, path } of pages) {
    it(`${name} keyboard can tab through the search form`, async () => {
      const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
      await page.goto(`${base}${path('en')}`);
      await page.waitForTimeout(300);
      await page.keyboard.press('Tab');
      const first = await page.evaluate(() => document.activeElement?.tagName);
      assert.ok(first, 'first focusable not found');
      let found = false;
      for (let i = 0; i < 20; i++) {
        const active = await page.evaluate(() => document.activeElement?.getAttribute('name'));
        if (active === 'loc') {
          found = true;
          break;
        }
        await page.keyboard.press('Tab');
      }
      assert.ok(found, 'could not Tab to the location select of YachtSearch');
      await page.close();
    });
  }
});
