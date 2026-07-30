// Visual QA for the three Sprint 9.4B geography drafts.
// Usage: npm run build && node test/geography-draft-qa.mjs
// Environment:
//   SCREENSHOT_DIR  - where to save full-page screenshots (default: qa-screenshots)
//   PREVIEW_PORT    - port for astro preview (default: 4321)

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const PORT = process.env.PREVIEW_PORT || 4321;
const BASE = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || 'qa-screenshots';

const ENTITIES = [
  { name: 'alimos-marina', path: '/draft/{locale}/alimos-marina', schemaType: 'BoatTerminal' },
  { name: 'athens', path: '/draft/{locale}/athens', schemaType: 'Place' },
  { name: 'saronic-gulf', path: '/draft/{locale}/saronic-gulf', schemaType: 'Place' },
];
const LOCALES = ['ru', 'ua', 'en'];
const WIDTHS = [390, 768, 1100, 1440];

const expectedH1 = {
  'alimos-marina': { ru: 'Марина Алимос', ua: 'Марина Алімос', en: 'Alimos Marina' },
  athens: { ru: 'Афины', ua: 'Афіни', en: 'Athens' },
  'saronic-gulf': { ru: 'Саронический залив', ua: 'Саронічна затока', en: 'Saronic Gulf' },
};

async function waitForServer(url, tries = 30) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await setTimeout(500);
  }
  throw new Error(`Server at ${url} did not start`);
}

async function startPreview() {
  const child = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  await waitForServer(BASE);
  return child;
}

async function getLdJson(page) {
  const text = await page.locator('script[type="application/ld+json"]').innerText();
  return JSON.parse(text);
}

async function runTests(browser) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const results = [];

  for (const entity of ENTITIES) {
    for (const locale of LOCALES) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        const href = entity.path.replace('{locale}', locale);
        await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });

        const shotName = `${entity.name}-${locale}-${width}.png`;
        const shotPath = join(SCREENSHOT_DIR, shotName);
        await page.screenshot({ fullPage: true, path: shotPath });

        // 1. noindex
        const robots = await page.locator('meta[name="robots"]').getAttribute('content');
        assert.equal(robots, 'noindex, nofollow', `${entity.name}/${locale}/${width}: robots meta`);

        // 2. canonical points to self
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        assert.ok(canonical.includes(href), `${entity.name}/${locale}/${width}: canonical contains ${href}`);

        // 3. reciprocal hreflang
        const alternates = await page.locator('link[rel="alternate"]').evaluateAll((els) =>
          els.map((el) => ({ href: el.getAttribute('href'), hreflang: el.getAttribute('hreflang') }))
        );
        const required = new Set(['ru', 'uk', 'en', 'x-default']);
        for (const a of alternates) {
          if (a.hreflang === 'x-default') {
            assert.ok(a.href.includes('/draft/ru/'), `${entity.name}/${locale}/${width}: x-default points to ru`);
            required.delete('x-default');
          } else if (required.has(a.hreflang)) {
            assert.ok(a.href.includes(`/draft/${a.hreflang === 'uk' ? 'ua' : a.hreflang}/`), `${entity.name}/${locale}/${width}: alternate ${a.hreflang}`);
            required.delete(a.hreflang);
          }
        }
        assert.equal(required.size, 0, `${entity.name}/${locale}/${width}: missing hreflang ${[...required].join(',')}`);

        // 4. H1 visible and localised
        const h1 = await page.locator('h1').first();
        assert.ok(await h1.isVisible(), `${entity.name}/${locale}/${width}: H1 visible`);
        const h1Text = await h1.innerText();
        assert.equal(h1Text, expectedH1[entity.name][locale], `${entity.name}/${locale}/${width}: H1 text`);

        // 5. JSON-LD
        const jsonLd = await getLdJson(page);
        if (entity.schemaType === 'BoatTerminal') {
          assert.equal(jsonLd['@type'], 'BoatTerminal', `${entity.name}/${locale}/${width}: JSON-LD type`);
          assert.ok(jsonLd.address, `${entity.name}/${locale}/${width}: JSON-LD address`);
        } else {
          assert.ok(Array.isArray(jsonLd['@graph']), `${entity.name}/${locale}/${width}: JSON-LD @graph array`);
          const place = jsonLd['@graph'].find((n) => n['@type'] === 'Place');
          assert.ok(place, `${entity.name}/${locale}/${width}: JSON-LD Place`);
        }

        // 6. no horizontal overflow
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        assert.equal(hasOverflow, false, `${entity.name}/${locale}/${width}: horizontal overflow`);

        results.push({ entity: entity.name, locale, width, shot: shotPath });
        await context.close();
      }
    }
  }
  return results;
}

async function main() {
  const server = await startPreview();
  const browser = await chromium.launch();
  let results;
  try {
    results = await runTests(browser);
    const summary = {
      total: results.length,
      expected: 36,
      items: results,
    };
    await writeFile(join(SCREENSHOT_DIR, 'geography-qa-summary.json'), JSON.stringify(summary, null, 2));
    console.log(`QA complete: ${results.length}/${36} screenshots saved to ${SCREENSHOT_DIR}`);
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
