import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('uses the ISO uk language code for Ukrainian documents', async () => {
  const layout = await read('src/layouts/BaseLayout.astro');
  const validator = await read('scripts/validate-build.mjs');
  assert.match(layout, /const htmlLang = locale === 'ua' \? 'uk' : locale/);
  assert.match(layout, /<html lang=\{htmlLang\}>/);
  assert.match(validator, /locale === 'ua'.*<html lang="uk/);
});

test('publishes reciprocal encyclopedia hreflang links', async () => {
  const page = await read('src/pages/[locale]/encyclopedia/[slug].astro');
  const validator = await read('scripts/validate-build.mjs');
  assert.match(page, /canonicalKey === term\.canonicalKey/);
  assert.match(page, /languageHrefs=\{languageHrefs\}/);
  assert.match(validator, /encyclopedia hreflang/);
});

test('redirects retired Search Console URLs to current canonical routes', async () => {
  const redirects = await read('public/_redirects');
  for (const legacy of [
    '/ru/tags/yahtennaya-shkola ',
    '/en/team/aleksej-burlakov ',
    '/ru/team/undefined ',
    '/ua/post/vidy-parusnyh-yaht---raznovidnosti-i-otlichiya ',
    '/en/yachting-for-everyone ',
  ]) {
    assert.ok(redirects.includes(legacy), `missing redirect for ${legacy.trim()}`);
  }
});
