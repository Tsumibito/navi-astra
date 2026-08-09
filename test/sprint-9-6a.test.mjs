import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = decodeURIComponent(new URL('../dist/', import.meta.url).pathname.replace(/\/$/, ''));
const locales = ['ru', 'ua', 'en'];
const publicPages = [
  'yacht-charter/greece/saronic-gulf',
  'yacht-charter/greece/athens/alimos-marina',
  'yacht-routes/greece/saronic-gulf/alimos-aegina-poros-hydra',
];

const page = (locale, route) => readFileSync(join(dist, locale, route, 'index.html'), 'utf8');

test('rejected Sprint 9.6A pages stay quarantined while their URLs remain available', () => {
  for (const locale of locales) {
    for (const route of publicPages) {
      const html = page(locale, route);
      assert.match(html, /<meta[^>]+name="robots"[^>]+noindex/i, `${locale}/${route} must remain noindex until editorial and visual acceptance`);
      assert.match(html, /data-geography-map/, `${locale}/${route} has no geography map`);
      assert.match(html, new RegExp(`https://navi\.training/${locale}/${route}/`), `${locale}/${route} canonical missing`);
      assert.match(html, /hreflang="(?:ru|uk|en|x-default)"/, `${locale}/${route} hreflang missing`);
    }
  }
});

test('region and marina expose yacht search and real R2-backed yacht cards', () => {
  for (const locale of locales) {
    for (const route of publicPages.slice(0, 2)) {
      const html = page(locale, route);
      assert.match(html, /data-yacht-search/, `${locale}/${route} search missing`);
      assert.match(html, /data-yacht-card/, `${locale}/${route} yacht cards missing`);
      assert.match(html, /pub-c14094474319495887321b74b5186100\.r2\.dev/, `${locale}/${route} R2 media missing`);
    }
  }
});

test('quarantined geography pages and query search stay out of sitemap', () => {
  const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
  for (const locale of locales) {
    for (const route of publicPages) assert.doesNotMatch(sitemap, new RegExp(`/${locale}/${route}/`));
    assert.doesNotMatch(sitemap, new RegExp(`/${locale}/yacht-search/`));
  }
});

test('encyclopedia entries render FAQPage structured data and visible questions', () => {
  const html = readFileSync(join(dist, 'ru', 'encyclopedia', 'ais-avtomaticheskaya-identifikatsionnaya-sistema', 'index.html'), 'utf8');
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /<section class="entry-faq"[^>]*>/);
  assert.match(html, /<details(?:\s|>)/);
  assert.match(html, /class="faq-links"/);
  assert.match(html, /class="faq-links"[^>]*>.*href="\/ru\/encyclopedia\/morskoj-radar\//s);
});
