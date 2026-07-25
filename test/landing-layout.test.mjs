import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseLandingSnapshot, splitSnapshotSection } from '../src/lib/parse-snapshot-landing.mjs';

const source = await readFile(new URL('../src/layouts/LandingLayout.astro', import.meta.url), 'utf8');
const uaSnapshot = await readFile(new URL('../src/data/pages/charter-for-dummies-ua.html', import.meta.url), 'utf8');
const ruSnapshot = await readFile(new URL('../src/data/pages/charter-for-dummies-ru.html', import.meta.url), 'utf8');

test('keeps closed snapshot accordions collapsed', () => {
  assert.match(source, /details\.w-item:not\(\[open\]\)\s+\.w-item-content\s*\{\s*display:\s*none !important/);
});

test('does not preserve source whitespace as line boxes between terminal landing chrome', () => {
  assert.match(source, /body\s*\{[^}]*white-space:\s*normal/);
});

test('fills the throttled UA review section from the cached RU snapshot', () => {
  const data = parseLandingSnapshot(uaSnapshot, 'ua', ruSnapshot);
  assert.match(data.bodyContent, /Відгуки <span[^>]*>учасників курсу<\/span>/);
  assert.match(data.bodyContent, /Андрей Шевченко/);
});

test('extracts only the charter hero without changing its snapshot markup', () => {
  const bodyContent = parseLandingSnapshot(ruSnapshot, 'ru').bodyContent;
  const hero = splitSnapshotSection(bodyContent, 0);
  assert.ok(hero);
  assert.match(hero.section, /^<section\b[^>]*data-evo-section="0"/);
  assert.equal(hero.before + hero.section + hero.after, bodyContent);
  assert.match(hero.after, /^<section\b[^>]*data-evo-section="1"/);
});
