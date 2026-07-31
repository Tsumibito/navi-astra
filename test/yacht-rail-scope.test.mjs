import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = decodeURIComponent(new URL('../dist/', import.meta.url).pathname.replace(/\/$/, ''));

function page(relpath) {
  const p = join(dist, relpath, 'index.html');
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf-8');
}

const expected = {
  athens: {
    ru: { title: 'Яхты в каталоге' },
    ua: { title: 'Яхти в каталозі' },
    en: { title: 'Yachts in catalogue' },
  },
  'alimos-marina': {
    ru: { title: 'Яхты в каталоге' },
    ua: { title: 'Яхти в каталозі' },
    en: { title: 'Yachts in catalogue' },
  },
};

describe('YachtRail scope on geography pages', () => {
  for (const [route, locales] of Object.entries(expected)) {
    for (const [locale, labels] of Object.entries(locales)) {
      it(`${route} (${locale}) shows a scoped non-empty rail`, () => {
        const html = page(`draft/${locale}/${route}`);
        assert.ok(html, `page draft/${locale}/${route} not built`);
        assert.ok(html.includes('data-yacht-rail'), 'yacht rail missing');
        assert.ok(!html.includes('Available yachts'), 'rail title falsely claims availability');
        assert.ok(html.includes(labels.title), `expected title "${labels.title}" not found`);
        assert.ok(html.includes('data-yacht-card'), 'expected at least one yacht card');
        assert.ok(!html.includes('data-yacht-empty'), 'rail should not be empty');
      });
    }
  }
});
