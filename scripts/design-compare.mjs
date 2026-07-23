#!/usr/bin/env node
/**
 * Screenshot harness for design parity checks during Webstudio → Astro migration.
 *
 * Usage:
 *   node scripts/design-compare.mjs --out <dir> <name>=<referenceUrl>::<candidateUrl> [...]
 *   node scripts/design-compare.mjs --out shots home-ru=https://navi.training/::http://localhost:4321/
 *
 * Captures full-page screenshots of both URLs at 1440 / 768 / 390 widths into:
 *   <out>/<name>.<width>.ref.png and <out>/<name>.<width>.new.png
 * Pass --widths 1440,390 to override. Pass only a reference (no "::candidate")
 * to capture one side.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const readFlag = (flag, fallback) => {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  const [value] = args.splice(i, 2).slice(1);
  return value;
};

const outDir = readFlag('--out', 'design-compare');
const widths = readFlag('--widths', '1440,768,390').split(',').map(Number);
const pairs = args.map((raw) => {
  const [name, urls] = raw.split('=');
  const [reference, candidate] = urls.split('::');
  return { name, reference, candidate };
});

if (!pairs.length) {
  console.error('No capture targets given.');
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

async function capture(url, path, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  } catch {
    // networkidle can hang on pages with long-polling scripts; fall back to load state
    await page.waitForLoadState('load').catch(() => {});
  }
  // dismiss cookie-consent dialogs so they don't cover the hero
  for (const label of ['Accept All', 'Accept all', 'Принять', 'Прийняти']) {
    const button = page.getByRole('button', { name: label }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => {});
      await page.waitForTimeout(400);
      break;
    }
  }
  // settle lazy images/fonts, then normalise animations
  await page.evaluate(async () => {
    await (document.fonts?.ready ?? Promise.resolve());
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 700));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
  await page.screenshot({ path, fullPage: true });
  await page.close();
  console.log('captured', path);
}

for (const { name, reference, candidate } of pairs) {
  for (const width of widths) {
    if (reference) await capture(reference, join(outDir, `${name}.${width}.ref.png`), width);
    if (candidate) await capture(candidate, join(outDir, `${name}.${width}.new.png`), width);
  }
}

await browser.close();
