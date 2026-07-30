import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layouts = [
  'src/layouts/BaseLayout.astro',
  'src/layouts/ServiceLayout.astro',
  'src/layouts/LandingLayout.astro',
];

test('all public layouts load the shared Zaraz consent bridge early in head', async () => {
  for (const path of layouts) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.match(source, /import ZarazConsentBootstrap from/);
    assert.match(source, /<head>[\s\S]*?<meta charset="utf-8" \/>\s*<ZarazConsentBootstrap \/>/);
  }
});

test('Zaraz consent bridge maps the maintained purposes to Google consent mode', async () => {
  const source = await readFile(
    new URL('../src/components/ZarazConsentBootstrap.astro', import.meta.url),
    'utf8',
  );

  assert.match(source, /ANALYTICS_PURPOSE = 'amuB'/);
  assert.match(source, /MARKETING_PURPOSE = 'ICtY'/);
  assert.match(source, /analytics_storage:/);
  assert.match(source, /ad_storage:/);
  assert.match(source, /ad_user_data:/);
  assert.match(source, /ad_personalization:/);
  assert.match(source, /zarazConsentChoicesUpdated/);
});
