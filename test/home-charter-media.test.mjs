import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/pages/HomePage.astro', import.meta.url), 'utf8');

test('loads the below-fold charter photograph as low-priority lazy content', () => {
  assert.match(source, /class="home-charter__media"/);
  assert.match(source, /loading="lazy"/);
  assert.match(source, /fetchpriority="low"/);
  assert.doesNotMatch(source, /\.home-charter\{[^}]*background:url/);
});
