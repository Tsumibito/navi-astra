import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layouts = [
  'src/layouts/BaseLayout.astro',
  'src/layouts/ServiceLayout.astro',
  'src/layouts/LandingLayout.astro',
];

test('all public layouts load Zaraz before the consent and analytics bridges', async () => {
  for (const path of layouts) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.match(source, /import ZarazLoader from/);
    assert.match(
      source,
      /<head>[\s\S]*?<meta charset="utf-8" \/>\s*<ZarazLoader \/>\s*<ZarazConsentBootstrap \/>\s*<AnalyticsBootstrap \/>/,
    );
  }
});

test('Zaraz loader is idempotent and uses the same-origin initializer', async () => {
  const source = await readFile(
    new URL('../src/components/ZarazLoader.astro', import.meta.url),
    'utf8',
  );
  assert.match(source, /if \(window\.zaraz \|\| document\.querySelector/);
  assert.match(source, /script\.src = '\/cdn-cgi\/zaraz\/i\.js'/);
  assert.match(source, /script\.referrerPolicy = 'origin'/);
});

test('all public layouts load the shared Zaraz consent bridge early in head', async () => {
  for (const path of layouts) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.match(source, /import ZarazConsentBootstrap from/);
    assert.match(source, /<head>[\s\S]*?<ZarazLoader \/>\s*<ZarazConsentBootstrap \/>/);
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

test('Zaraz consent dialog gives initial keyboard focus to Accept All', async () => {
  const source = await readFile(
    new URL('../src/components/ZarazConsentBootstrap.astro', import.meta.url),
    'utf8',
  );

  assert.match(source, /dialog\.cf_modal\[open\]/);
  assert.match(source, /\.cf_button--accept/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /acceptAll\.setAttribute\('autofocus'/);
  assert.match(source, /acceptAll\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /classList\?\.contains\('cf_modal_container'\)/);
  assert.match(source, /setTimeout/);
  assert.match(source, /element\.shadowRoot/);
  assert.match(source, /dialog\.getRootNode\(\)\?\.activeElement/);
  assert.match(source, /observedConsentRoots/);
  assert.match(source, /pendingConsentDialogs/);
  assert.match(source, /consentDiscoveryInterval/);
  assert.match(source, /clearInterval/);
  assert.match(source, /focusedConsentDialogs/);
});
