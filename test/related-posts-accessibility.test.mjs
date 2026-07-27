import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/RelatedPosts.astro', import.meta.url), 'utf8');

test('uses one named link per related article without a duplicate image name', () => {
  assert.match(source, /<a class="navi-rp__article-link" href=\{post\.route\}>/);
  assert.match(source, /<h3>\{post\.name\}<\/h3>/);
  assert.match(source, /<Picture src=\{img\} alt=""/);
  assert.doesNotMatch(source, /<h3><a href=\{post\.route\}>/);
});
