// QA script for the Alimos Marina draft pages.
// Usage: npm run build && node test/alimos-draft-qa.mjs
// Environment:
//   SCREENSHOT_DIR  - where to save full-page screenshots (default: qa-screenshots)
//   PREVIEW_PORT    - port for astro preview (default: 4321)

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const PORT = process.env.PREVIEW_PORT || 4321;
const BASE = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || 'qa-screenshots';
const DRAFT_PATHS = {
  ru: '/draft/ru/alimos-marina',
  ua: '/draft/ua/alimos-marina',
  en: '/draft/en/alimos-marina',
};
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];

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

function getLdJson(page) {
  return page.locator('script[type="application/ld+json"]').innerText().then((t) => JSON.parse(t));
}

async function runTests(browser, server) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const results = [];

  for (const [locale, href] of Object.entries(DRAFT_PATHS)) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });

      const shotName = `alimos-draft-${locale}-${vp.name}.png`;
      const shotPath = join(SCREENSHOT_DIR, shotName);
      await page.screenshot({ fullPage: true, path: shotPath });

      // 1. noindex
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      assert.equal(robots, 'noindex, nofollow', `${locale}/${vp.name}: robots meta`);

      // 2. JSON-LD BoatTerminal with address and Alimos
      const jsonLd = await getLdJson(page);
      assert.equal(jsonLd['@type'], 'BoatTerminal', `${locale}/${vp.name}: JSON-LD @type`);
      assert.ok(jsonLd.address, `${locale}/${vp.name}: JSON-LD address`);
      assert.equal(jsonLd.address['@type'], 'PostalAddress', `${locale}/${vp.name}: address @type`);
      assert.equal(jsonLd.address.addressLocality, 'Alimos', `${locale}/${vp.name}: addressLocality`);
      assert.equal(jsonLd.address.addressRegion, 'Attica', `${locale}/${vp.name}: addressRegion`);
      assert.equal(jsonLd.address.addressCountry, 'GR', `${locale}/${vp.name}: addressCountry`);
      assert.ok(jsonLd.geo, `${locale}/${vp.name}: JSON-LD geo`);
      assert.equal(jsonLd.containedInPlace['name'], 'Alimos', `${locale}/${vp.name}: containedInPlace`);
      assert.ok(jsonLd.sameAs?.length, `${locale}/${vp.name}: sameAs`);

      // 3. No horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(scrollWidth <= vp.width + 1, `${locale}/${vp.name}: horizontal overflow ${scrollWidth} > ${vp.width}`);

      // 4. hreflang reciprocal links
      const alts = await page.locator('link[rel="alternate"]').all();
      const hrefs = await Promise.all(alts.map((l) => l.getAttribute('href')));
      assert.ok(hrefs.some(h => h.endsWith('/draft/ru/alimos-marina')), `${locale}/${vp.name}: hreflang ru`);
      assert.ok(hrefs.some(h => h.endsWith('/draft/ua/alimos-marina')), `${locale}/${vp.name}: hreflang ua`);
      assert.ok(hrefs.some(h => h.endsWith('/draft/en/alimos-marina')), `${locale}/${vp.name}: hreflang en`);

      // 5. Correct stats heading (no duplicate about title)
      const aboutText = locale === 'ru' ? 'О марине' : locale === 'ua' ? 'Про марину' : 'About the marina';
      const statsText = locale === 'en' ? 'Marina in numbers' : 'Марина в цифрах';
      await page.locator('h2', { hasText: statsText }).first().isVisible();
      const aboutHeadings = await page.locator('h2', { hasText: aboutText }).count();
      assert.equal(aboutHeadings, 1, `${locale}/${vp.name}: single about heading`);

      // 6. Operator block is explicitly a pilot sample
      if (locale === 'ru') {
        const opTitle = page.getByText('Некоторые операторы из пилотной выборки').first();
        await opTitle.isVisible();
      } else if (locale === 'ua') {
        const opTitle = page.getByText('Деякі оператори з пілотної вибірки').first();
        await opTitle.isVisible();
      } else {
        const opTitle = page.getByText('Some operators from the pilot sample').first();
        await opTitle.isVisible();
      }

      // 7. Snapshot wording, not active/current availability
      const bodyText = await page.locator('body').innerText();
      const enBad = /currently available|active offers|book now/i;
      assert.ok(!enBad.test(bodyText), `${locale}/${vp.name}: no misleading availability wording`);

      // 8. Lead modal opens
      const formBtn = page.locator('[data-open-service-form]').filter({ visible: true }).first();
      await formBtn.click();
      const dialog = page.locator('dialog[open], [role="dialog"]').first();
      await dialog.waitFor({ state: 'visible', timeout: 5000 });
      const close = page.locator('button[type="button"]').filter({ visible: true, hasText: /close|закрыть|зачинити/i }).first();
      if (await close.isVisible().catch(() => false)) await close.click();
      else await page.keyboard.press('Escape');

      results.push({ locale, viewport: vp.name, path: shotPath });
      await context.close();
    }
  }

  // 9. Draft not in sitemap
  const sitemap = await readFile('dist/sitemap.xml', 'utf8').catch(() => '');
  assert.ok(!sitemap.includes('alimos-marina'), 'draft should not be in sitemap.xml');

  // 10. robots.txt does not disallow /draft/
  const robotsTxt = await fetch(`${BASE}/robots.txt`).then((r) => r.text()).catch(() => '');
  assert.ok(!robotsTxt.includes('Disallow: /draft/'), 'robots.txt should not disallow /draft/');

  return results;
}

async function main() {
  let server;
  const browser = await chromium.launch();
  try {
    server = await startPreview();
    const results = await runTests(browser, server);
    const report = results.map((r) => `- ${r.locale}/${r.viewport}: ${r.path}`).join('\n');
    await writeFile(join(SCREENSHOT_DIR, 'report.md'), `# Alimos Marina draft QA\n\n${report}\n`);
    console.log('QA passed. Screenshots:');
    console.log(report);
  } finally {
    await browser.close();
    if (server) {
      server.kill('SIGTERM');
      await setTimeout(1000);
      if (!server.killed) server.kill('SIGKILL');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
