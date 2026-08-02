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

function uniqueCardCount(html) {
  const hrefs = new Set();
  const matches = [...html.matchAll(/data-yacht-href="([^"]+)"/g)];
  for (const [, href] of matches) {
    hrefs.add(href);
  }
  return hrefs.size;
}

const expectedYachts = {
  athens: 18,
  'alimos-marina': 17,
};

describe('YachtRail scope on geography pages', () => {
  for (const [route, locales] of Object.entries({
    athens: ['ru', 'ua', 'en'],
    'alimos-marina': ['ru', 'ua', 'en'],
  })) {
    for (const locale of locales) {
      it(`${route} (${locale}) shows scoped real pilot rails`, () => {
        const html = page(`draft/${locale}/${route}`);
        assert.ok(html, `page draft/${locale}/${route} not built`);

        assert.ok(!html.includes('data-demo-rail-intro'), 'demo rail intro must be removed');
        assert.ok(!html.includes('data-demo-disclaimer'), 'demo disclaimer must be removed');
        assert.ok(!html.includes('Демо:'), 'ru demo prefix must be removed');
        assert.ok(!html.includes('Демо:'), 'ua demo prefix must be removed');
        assert.ok(!html.includes('Demo:'), 'en demo prefix must be removed');

        const railCount = [...html.matchAll(/data-yacht-rail/g)].length;
        assert.ok(railCount >= 2, `expected at least an all-yachts rail and one type rail, found ${railCount}`);

        const uniqueCards = uniqueCardCount(html);
        assert.equal(uniqueCards, expectedYachts[route], `expected ${expectedYachts[route]} unique pilot cards, found ${uniqueCards}`);

        assert.ok(!html.includes('data-yacht-empty'), 'rail should not be empty');

        const robot = html.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/)?.[1] ?? '';
        assert.ok(robot.includes('noindex'), 'draft pages must be noindex');
      });
    }
  }
});
