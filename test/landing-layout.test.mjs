import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const landing = await readFile(new URL('../src/layouts/LandingLayout.astro', import.meta.url), 'utf8');
const campaignData = JSON.parse(await readFile(new URL('../src/data/pages/charter-for-dummies-ru.json', import.meta.url), 'utf8'));

const css = [
  '/navi-runtime.css',
  '/navi-evolution-v1.css',
  '/navi-standard-v1.css',
];

test('keeps closed landing accordions collapsed', () => {
  assert.match(landing, /details\.w-item:not\(\[open\]\)\s+\.w-item-content\s*\{\s*display:\s*none !important/);
});

test('does not preserve source whitespace as line boxes between terminal landing chrome', () => {
  assert.match(landing, /body\s*\{[^}]*white-space:\s*normal/);
});

test('links the required landing runtime stylesheets', () => {
  for (const href of css) {
    assert.ok(landing.includes(href), `missing stylesheet link ${href}`);
  }
});

test('emits json-ld schema and canonical link', () => {
  assert.match(landing, /<script type="application\/ld\+json"[^>]*set:html=\{JSON\.stringify\(effectiveSchema\)/);
  assert.match(landing, /<link rel="canonical" href=\{canonical\} \/>/);
});

test('keeps scroll restoration for reloads without fragment', () => {
  assert.match(landing, /history\.scrollRestoration = 'manual'/);
  assert.match(landing, /scrollTo\(0, 0\)/);
});

test('campaign data is valid and complete', () => {
  assert.equal(campaignData.locale, 'ru');
  assert.ok(campaignData.title);
  assert.ok(campaignData.description);
  assert.ok(campaignData.canonical);
});
