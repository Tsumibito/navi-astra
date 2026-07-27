import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/pages/CharterPage.astro', import.meta.url), 'utf8');

test('keeps the standard related-posts section on every localized charter route', () => {
  assert.match(source, /import RelatedPosts from '~\/components\/RelatedPosts\.astro'/);
  assert.match(source, /entry\.kind === 'post' && entry\.locale === dataLocale/);
  assert.match(source, /<RelatedPosts posts=\{posts\} locale=\{locale\} \/>/);
});

test('defers below-fold charter cards and avoids duplicate image names', () => {
  assert.doesNotMatch(source, /loading="eager"/);
  assert.match(source, /src=\{card\.img\} alt="" loading="lazy"/);
  assert.match(source, /src=\{dest\.img\} alt="" loading="lazy"/);
});
