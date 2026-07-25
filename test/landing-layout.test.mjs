import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseLandingSnapshot, splitRemainingSnapshotSections, splitSnapshotSection } from '../src/lib/parse-snapshot-landing.mjs';

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

test('overlaps only the final campaign CTA section by 24px', () => {
  assert.match(source, /section\[data-evo-section="10"\]\s*\{[^}]*margin-top:\s*-24px/);
});

test('losslessly reassembles the charter snapshot body with every section extracted', () => {
  for (const [locale, snapshot, reviewSnapshot] of [
    ['ru', ruSnapshot],
    ['ua', uaSnapshot, ruSnapshot],
  ]) {
    const bodyContent = parseLandingSnapshot(snapshot, locale, reviewSnapshot).bodyContent;
    const hero = splitSnapshotSection(bodyContent, 0);
    assert.ok(hero);
    const audience = splitSnapshotSection(hero.after, 1);
    assert.ok(audience);
    const reviews = splitSnapshotSection(audience.after, 2);
    assert.ok(reviews);
    const remaining = splitRemainingSnapshotSections(reviews.after);
    assert.ok(remaining);

    assert.match(hero.section, /^<section\b[^>]*data-evo-section="0"/);
    assert.match(audience.section, /^<section\b[^>]*data-evo-section="1"/);
    assert.match(reviews.section, /^<section\b[^>]*data-evo-section="2"/);
    assert.ok(remaining.sections.length);
    assert.match(remaining.sections[0].section, /^<section\b[^>]*data-evo-section="3"/);
    for (const { section } of remaining.sections) assert.match(section, /^<section\b[^>]*data-evo-section="\d+"/);
    assert.equal(
      hero.before + hero.section + audience.before + audience.section + reviews.before + reviews.section
      + remaining.sections.map(({ before, section }) => before + section).join('') + remaining.after,
      bodyContent,
    );

    if (locale === 'ua') {
      assert.match(reviews.section, /Відгуки <span[^>]*>учасників курсу<\/span>/);
      assert.match(reviews.section, /Андрей Шевченко/);
    }
  }
});
