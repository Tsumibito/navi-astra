import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const port = 8125;
const baseUrl = process.argv[2] || `http://127.0.0.1:${port}`;
const locales = ['ru', 'ua', 'en'];
const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1100', width: 1100, height: 800 },
  { name: '390', width: 390, height: 844 },
];
const slug = 'british-virgin-islands/fountaine-pajot-saba-50-sunrise';
const outDir = 't1-screenshots/charter-qa';

await mkdir(outDir, { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: 'dist', stdio: 'inherit' });
let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch(`${baseUrl}/index.html`);
    if (res.ok) { ready = true; break; }
  } catch {}
  await new Promise((r) => setTimeout(r, 200));
}
if (!ready) {
  server.kill();
  console.error('server did not start');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
let failed = false;
const englishUi = ['Get a quote', 'Open form', 'Request a similar option', 'MODEL', 'YEAR', 'TYPE', 'BASE', 'CHARTER MODE', 'On board'];

for (const locale of locales) {
  const url = `${baseUrl}/${locale}/yacht-charter/${slug}/`;

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    if (!response || response.status() !== 200) {
      console.error(`FAIL ${locale}-${vp.name}: HTTP ${response?.status()}`);
      failed = true;
      await context.close();
      continue;
    }

    const size = page.viewportSize();
    const failures = [];
    if (!size || size.width !== vp.width || size.height !== vp.height) {
      failures.push(`viewport mismatch: ${JSON.stringify(size)} expected ${vp.width}x${vp.height}`);
    }

    try {
      await page.waitForFunction(
        () => [...document.querySelectorAll('img[src^="/charter/yachts/"]')].every((img) => img.complete),
        { timeout: 10000 }
      );
    } catch (e) {
      failures.push('yacht images did not finish loading');
    }

    const checks = await page.evaluate(() => {
      const root = document.documentElement;
      const h1 = document.querySelector('h1');
      const h1Rect = h1?.getBoundingClientRect();
      const hero = document.querySelector('section[aria-label="Hero"]');
      const heroRect = hero?.getBoundingClientRect();
      const nav = document.querySelector('nav[aria-label="Breadcrumb"]');
      const navRect = nav?.getBoundingClientRect();
      const fallbackImages = Array.from(document.querySelectorAll('img[data-fallback], img[src^="data:image/svg+xml"]')).length;
      return {
        overflow: root.scrollWidth - root.clientWidth,
        h1Top: h1Rect?.top ?? null,
        h1Bottom: h1Rect?.bottom ?? null,
        viewportHeight: window.innerHeight,
        heroTop: heroRect?.top ?? null,
        navBottom: navRect ? navRect.top + navRect.height : null,
        fallbackImages,
      };
    });

    if (checks.overflow > 1) failures.push(`overflow ${checks.overflow}px`);
    if (checks.fallbackImages > 0) failures.push(`${checks.fallbackImages} fallback images`);
    if (checks.h1Top == null || checks.h1Top < 0 || checks.h1Bottom == null || checks.h1Bottom > checks.viewportHeight) {
      failures.push(`h1 not fully visible (top ${checks.h1Top}, bottom ${checks.h1Bottom}, viewport ${checks.viewportHeight})`);
    }
    if (checks.navBottom != null && checks.heroTop != null && checks.navBottom > checks.heroTop + 2) {
      failures.push(`breadcrumbs overlap hero (navBottom ${checks.navBottom}, heroTop ${checks.heroTop})`);
    }

    if (locale !== 'en') {
      const bodyText = await page.evaluate(() => document.body.innerText);
      for (const phrase of englishUi) {
        if (bodyText.includes(phrase)) {
          failures.push(`English UI leaked: "${phrase}"`);
        }
      }
    }

    const path = `${outDir}/${locale}-${vp.name}.png`;
    await page.screenshot({ path, fullPage: true });
    await context.close();

    if (failures.length) {
      console.error(`FAIL ${locale}-${vp.name}: ${failures.join('; ')}`);
      failed = true;
    } else {
      console.log(`PASS ${locale}-${vp.name} -> ${path}`);
    }
  }
}

await browser.close();
server.kill();
if (failed) process.exit(1);
console.log('all visual QA checks passed');
