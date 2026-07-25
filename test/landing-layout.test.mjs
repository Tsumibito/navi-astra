import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/layouts/LandingLayout.astro', import.meta.url), 'utf8');

test('does not preserve source whitespace as line boxes between terminal landing chrome', () => {
  assert.match(source, /body\s*\{[^}]*white-space:\s*normal/);
});

test('uses a minimal shell without shared header, footer, photo strip or Webstudio styles', () => {
  assert.doesNotMatch(source, /import\s+Header/);
  assert.doesNotMatch(source, /import\s+Footer/);
  assert.doesNotMatch(source, /import\s+PhotoStrip/);
  assert.doesNotMatch(source, /<PhotoStrip/);
  assert.doesNotMatch(source, /<Footer/);
  assert.doesNotMatch(source, /navi-evolution-v1\.css/);
  assert.doesNotMatch(source, /details\.w-item/);
  assert.doesNotMatch(source, /navi-landing-answer/);
});
