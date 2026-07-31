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

describe('YachtRail scope on geography pages', () => {
  for (const [route, locales] of Object.entries({
    athens: ['ru', 'ua', 'en'],
    'alimos-marina': ['ru', 'ua', 'en'],
  })) {
    for (const locale of locales) {
      it(`${route} (${locale}) shows scoped demo type rails`, () => {
        const html = page(`draft/${locale}/${route}`);
        assert.ok(html, `page draft/${locale}/${route} not built`);
        assert.ok(html.includes('data-demo-rail-intro'), 'demo rail intro missing');
        assert.ok(html.includes('data-demo-disclaimer'), 'demo disclaimer missing');
        const railCount = [...html.matchAll(/data-yacht-rail/g)].length;
        assert.equal(railCount, 3, `expected 3 demo type rails, found ${railCount}`);
        const cardCount = [...html.matchAll(/data-yacht-card/g)].length;
        assert.equal(cardCount, 3, `expected 3 visible yacht cards, found ${cardCount}`);
        assert.ok(!html.includes('data-yacht-empty'), 'rail should not be empty');
      });
    }
  }
});
