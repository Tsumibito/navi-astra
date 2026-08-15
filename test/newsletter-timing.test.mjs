import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/components/NewsletterModal.astro', import.meta.url), 'utf8');

test('newsletter waits until the second distinct page in the session', () => {
  assert.match(source, /previous\.lastPath === path/);
  assert.match(source, /depth >= 2/);
  assert.match(source, /preview \? 300 : 10000/);
  assert.doesNotMatch(source, /let remaining = 30000/);
});

test('newsletter honeypot still has an accessible name', () => {
  assert.match(source, /name="company" aria-label="Company"/);
});
