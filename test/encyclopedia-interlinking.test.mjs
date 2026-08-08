import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const addedConcepts = [
  'cockpit', 'deck', 'cabin', 'transom', 'freeboard', 'beam (width)', 'waterline', 'ballast',
  'anchor chain', 'anchor scope', 'telltale', 'luff', 'leech', 'sail foot', 'boom vang', 'outhaul', 'traveller',
  'buoyage', 'cardinal mark', 'lateral mark',
];

const localeRoute = (locale) => locale === 'uk' ? 'ua' : locale;

describe('encyclopedia publication and internal-link graph', () => {
  it('publishes every new concept in all three locales with reciprocal translations', async () => {
    const snapshot = JSON.parse(await readFile('src/data/payload-content.json', 'utf8'));
    const entries = snapshot.encyclopedia || [];
    for (const canonicalKey of addedConcepts) {
      const translations = entries.filter((entry) => entry.canonicalKey === canonicalKey);
      assert.deepEqual(
        new Set(translations.map((entry) => entry.locale)),
        new Set(['ru', 'uk', 'en']),
        `${canonicalKey} must have RU/UK/EN pages`,
      );
      for (const entry of translations) {
        assert.match(entry.route, new RegExp(`^/${localeRoute(entry.locale)}/encyclopedia/`));
      }
    }
  });

  it('gives each new page contextual links and at least two related encyclopedia pages', async () => {
    const snapshot = JSON.parse(await readFile('src/data/payload-content.json', 'utf8'));
    const entries = snapshot.encyclopedia || [];
    const allRoutes = new Set([
      ...(snapshot.entries || []).map((entry) => entry.route),
      ...entries.map((entry) => entry.route),
    ]);

    for (const entry of entries.filter((item) => addedConcepts.includes(item.canonicalKey))) {
      const inlineRoutes = [...String(entry.content || '').matchAll(/\[[^\]]+\]\((\/[^)]+)\)/g)].map((match) => match[1]);
      assert.ok(inlineRoutes.length >= 1, `${entry.route} must contain a contextual internal link`);
      assert.ok(inlineRoutes.every((route) => allRoutes.has(route)), `${entry.route} contains a broken internal link`);

      const tagIds = new Set((entry.relatedTags || []).map((tag) => String(tag.id)));
      const related = entries.filter((candidate) => {
        if (candidate.locale !== entry.locale || candidate.id === entry.id) return false;
        const sharesTag = (candidate.relatedTags || []).some((tag) => tagIds.has(String(tag.id)));
        return sharesTag || candidate.domain === entry.domain;
      });
      assert.ok(related.length >= 2, `${entry.route} needs at least two related encyclopedia pages`);
    }
  });
});
