import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/layouts/LandingLayout.astro', import.meta.url), 'utf8');

test('keeps closed snapshot accordions collapsed', () => {
  assert.match(source, /details\.w-item:not\(\[open\]\)\s+\.w-item-content\s*\{\s*display:\s*none !important/);
});

test('does not preserve source whitespace as line boxes between terminal landing chrome', () => {
  assert.match(source, /body\s*\{[^}]*white-space:\s*normal/);
});
