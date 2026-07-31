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

function skipIfMissing(html) {
  if (!html) return true;
  return false;
}

describe('YachtSearch HTML contract', { skip: !existsSync(dist) }, () => {
  for (const locale of ['ru', 'ua', 'en']) {
    it(`${locale}: athens form submits to /draft/${locale}/search with loc`, () => {
      const html = page(`draft/${locale}/athens`);
      if (skipIfMissing(html)) return;
      const form = html.match(/<form[^>]*data-yacht-search[^>]*>/);
      assert.ok(form, 'form with data-yacht-search not found');
      const action = form[0].match(/action="([^"]*)"/);
      assert.ok(action, 'form action missing');
      assert.match(action[1], new RegExp(`^/draft/${locale}/search\\?loc=`), `unexpected action: ${action[1]}`);
      assert.ok(html.includes('name="loc"'), 'loc select missing');
      assert.ok(html.includes('name="t"'), 'type select missing');
      assert.ok(html.includes('name="s"'), 'start date input missing');
      assert.ok(html.includes('name="e"'), 'end date input missing');
      assert.ok(html.includes('name="g"'), 'guests input missing');
      assert.ok(html.includes('name="sv"'), 'service select missing');
    });

    it(`${locale}: search page has noindex, follow and a results section`, () => {
      const html = page(`draft/${locale}/search`);
      if (skipIfMissing(html)) return;
      assert.match(html, /<meta[^>]*name="robots"[^>]*content="noindex, follow"/, 'missing noindex, follow robots meta');
      assert.ok(html.includes('data-search-results'), 'results container missing');
      assert.ok(html.includes('data-yacht-search'), 'yacht search form missing');
    });
  }

  it('search page canonical link points to /draft/{locale}/search', () => {
    for (const locale of ['ru', 'ua', 'en']) {
      const html = page(`draft/${locale}/search`);
      if (skipIfMissing(html)) return;
      assert.match(html, new RegExp(`<link[^>]*rel="canonical"[^>]*href="https://navi.training/draft/${locale}/search"`), `canonical mismatch for ${locale}`);
    }
  });
});
