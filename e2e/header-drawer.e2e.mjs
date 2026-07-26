import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { join } from 'node:path';
import assert from 'node:assert';

const root = process.cwd();
const screenshotsDir = join(root, 'e2e', 'screenshots');
const port = 4321;
const baseUrl = `http://localhost:${port}`;
const astroBin = join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');

async function waitForServer(url, timeout = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await setTimeout(200);
  }
  throw new Error('astro dev server did not start');
}

async function run() {
  await mkdir(screenshotsDir, { recursive: true });

  // Start astro dev; inherit stdio so stderr is visible and diagnosable.
  const server = spawn('node', [astroBin, 'dev', '--port', String(port)], {
    cwd: root,
    stdio: 'inherit',
  });

  try {
    await waitForServer(baseUrl);

    const browser = await chromium.launch();
    const page = await browser.newPage();

    const widths = [767, 768, 1024, 1099, 1100, 1101, 1440];
    const routes = [
      { path: '/ru/yacht-delivery/', name: 'yacht-delivery' },
      { path: '/ru/charter/', name: 'charter' },
    ];

    // 1. Responsive screenshots and visibility contract
    for (const { path, name } of routes) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.screenshot({ path: join(screenshotsDir, `${name}-${width}.png`), fullPage: true });

        const isDesktop = width >= 1101;
        const burger = page.locator('#menuBtn');
        const nav = page.locator('.site-header__nav');
        if (isDesktop) {
          assert.strictEqual(await burger.isVisible(), false, `${name}@${width}: burger must be hidden on desktop`);
          assert.strictEqual(await nav.isVisible(), true, `${name}@${width}: desktop nav must be visible`);
          assert.strictEqual(await page.locator('#mobileDrawer').isVisible(), false, `${name}@${width}: drawer must be hidden on desktop`);
        } else {
          assert.strictEqual(await burger.isVisible(), true, `${name}@${width}: burger must be visible below 1101px`);
          assert.strictEqual(await nav.isVisible(), false, `${name}@${width}: desktop nav must be hidden below 1101px`);
        }
      }
    }

    // 2. Supported Popover API interactions on /ru/yacht-delivery/ at 768
    await page.setViewportSize({ width: 768, height: 800 });
    await page.goto(`${baseUrl}/ru/yacht-delivery/`, { waitUntil: 'networkidle', timeout: 60000 });
    const menuBtn = page.locator('#menuBtn');
    const drawer = page.locator('#mobileDrawer');

    await menuBtn.click();
    await setTimeout(300);
    assert.strictEqual(await menuBtn.getAttribute('aria-expanded'), 'true', 'supported: aria-expanded true after open');
    assert.strictEqual(await drawer.isVisible(), true, 'supported: drawer visible after open');
    assert.strictEqual(await page.evaluate(() => document.querySelector('main').inert), true, 'supported: main inert while open');

    await page.keyboard.press('Escape');
    await setTimeout(300);
    assert.strictEqual(await menuBtn.getAttribute('aria-expanded'), 'false', 'supported: Escape closes drawer');
    assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'menuBtn', 'supported: focus returns to burger');
    assert.strictEqual(await page.evaluate(() => document.querySelector('main').inert), false, 'supported: inert removed after close');

    await menuBtn.click();
    await setTimeout(300);
    const cta = drawer.locator('[data-open-service-form]').first();
    await cta.click();
    await setTimeout(300);
    assert.strictEqual(await menuBtn.getAttribute('aria-expanded'), 'false', 'supported: internal CTA closes drawer');

    // 3. Fallback without Popover API on /ru/yacht-delivery/ at 768
    const fallbackPage = await browser.newPage();
    await fallbackPage.addInitScript(() => {
      delete HTMLElement.prototype.showPopover;
      delete HTMLElement.prototype.hidePopover;
      delete HTMLElement.prototype.togglePopover;
    });
    await fallbackPage.setViewportSize({ width: 768, height: 800 });
    await fallbackPage.goto(`${baseUrl}/ru/yacht-delivery/`, { waitUntil: 'networkidle', timeout: 60000 });
    const fMenuBtn = fallbackPage.locator('#menuBtn');
    const fDrawer = fallbackPage.locator('#mobileDrawer');

    await fMenuBtn.click();
    await setTimeout(300);
    assert.strictEqual(await fMenuBtn.getAttribute('aria-expanded'), 'true', 'fallback: aria-expanded true after open');
    assert.strictEqual(await fDrawer.isVisible(), true, 'fallback: drawer visible after open');
    assert.strictEqual(await fallbackPage.evaluate(() => document.querySelector('main').inert), true, 'fallback: main inert while open');

    await fallbackPage.mouse.click(10, 10);
    await setTimeout(300);
    assert.strictEqual(await fMenuBtn.getAttribute('aria-expanded'), 'false', 'fallback: click outside closes drawer');
    assert.strictEqual(await fallbackPage.evaluate(() => document.activeElement.id), 'menuBtn', 'fallback: focus returns to burger');
    assert.strictEqual(await fallbackPage.evaluate(() => document.querySelector('main').inert), false, 'fallback: inert removed after outside click');

    await fMenuBtn.click();
    await setTimeout(300);
    await fallbackPage.setViewportSize({ width: 1440, height: 800 });
    await setTimeout(400);
    assert.strictEqual(await fMenuBtn.getAttribute('aria-expanded'), 'false', 'resize: drawer closes when crossing to desktop');
    assert.strictEqual(await fallbackPage.evaluate(() => document.querySelector('main').inert), false, 'resize: no leftover inert after desktop resize');

    await browser.close();
    console.log('e2e/header-drawer.e2e.mjs: all assertions passed');
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
