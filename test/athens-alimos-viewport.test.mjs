import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dist = decodeURIComponent(new URL('../dist/', import.meta.url).pathname.replace(/\/$/, ''));
const distReady = existsSync(dist);
const saveScreenshots = process.env.C4_SCREENSHOTS === '1';
const screenshotRoot = saveScreenshots
  ? join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'navi-astra-out', 'screenshots', 'c4')
  : null;
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

const expected = {
  athens: { ru: 'Афины', ua: 'Афіни', en: 'Athens' },
  'alimos-marina': { ru: 'Марина Алимос', ua: 'Марина Алімос', en: 'Alimos Marina' },
};

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
        it(`${name} ${locale} ${viewport.name} (${viewport.width}px) is a complete, scoped demo page`, async () => {
          const page = await browser.newPage({ viewport });
          const response = await page.goto(`${base}${path(locale)}`);
          assert.equal(response?.status(), 200, 'page must return HTTP 200');
          await page.waitForTimeout(500);

          const actual = await page.evaluate(() => {
            const overflow = document.documentElement.scrollWidth > window.innerWidth;
            const robot = document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
            const htmlLang = document.documentElement.lang;
            const title = document.title;
            const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
            const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent).join('\n');
            const cards = document.querySelectorAll('[data-yacht-card]');
            const rails = document.querySelectorAll('[data-yacht-rail]');
            const broken = [...document.querySelectorAll('img')].some((img) => img.complete && img.naturalWidth === 0);
            return { overflow, robot, htmlLang, title, canonical, ld, cardCount: cards.length, railCount: rails.length, broken };
          });

          assert.equal(actual.overflow, false, 'document has horizontal overflow');
          assert.equal(actual.robot, 'noindex, nofollow', 'robots meta must be noindex, nofollow');
          assert.equal(actual.htmlLang, locale, `html lang must match locale ${locale}`);
          assert.ok(actual.title.includes(expected[name][locale]), `title must include ${expected[name][locale]}`);
          assert.ok(actual.canonical.includes(path(locale).replace(/\/$/, '')), 'canonical link missing');

          let jsonld;
          assert.doesNotThrow(() => { jsonld = JSON.parse(actual.ld); }, 'JSON-LD must be valid');
          const graph = jsonld?.['@graph'] ?? [];
          assert.ok(graph.some((item) => item['@type'] === 'BreadcrumbList'), 'BreadcrumbList missing');
          const itemList = graph.find((item) => item['@type'] === 'ItemList');
          assert.ok(itemList, 'ItemList missing');
          assert.equal(itemList.itemListElement.length, actual.cardCount, 'ItemList length must equal visible card count');
          assert.ok(actual.cardCount > 0, 'at least one yacht card must render');
          assert.equal(actual.broken, false, 'all images in the viewport must load');

          if (saveScreenshots) {
            const shotDir = join(screenshotRoot, name);
            const shotPath = join(shotDir, `${locale}-${viewport.name}.png`);
            await mkdir(shotDir, { recursive: true });
            await page.screenshot({ path: shotPath, fullPage: true });
          }
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
