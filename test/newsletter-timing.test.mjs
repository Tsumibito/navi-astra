import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/components/NewsletterModal.astro', import.meta.url), 'utf8');

test('newsletter waits for thirty seconds of real visible engagement', () => {
  assert.match(source, /let remaining = 30000/);
  assert.match(source, /addEventListener\('scroll', markEngaged/);
  assert.match(source, /addEventListener\('pointerdown', markEngaged/);
  assert.match(source, /addEventListener\('keydown', markEngaged/);
  assert.match(source, /visibilitychange/);
  assert.doesNotMatch(source, /:\s*20000/);
});

test('newsletter honeypot still has an accessible name', () => {
  assert.match(source, /name="company" aria-label="Company"/);
});
