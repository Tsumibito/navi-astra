import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const dist = 'dist';
const region = 'british-virgin-islands';
const slug = 'fountaine-pajot-saba-50-sunrise';

function pagePath(locale) {
  return `${dist}/${locale}/yacht-charter/${region}/${slug}/index.html`;
}

describe('charter route HTML output', () => {
  it('builds pages for ru, ua and en', async () => {
    for (const locale of ['ru', 'ua', 'en']) {
      const html = await readFile(pagePath(locale), 'utf8');
      assert.match(html, /Fountaine Pajot Saba 50/);
      assert.ok(html.includes('<title>'), `missing title for ${locale}`);
    }
  });

  it('does not generate a page for an unknown yacht slug', async () => {
    await assert.rejects(
      () => readFile(`${dist}/ru/yacht-charter/${region}/unknown-yacht/index.html`, 'utf8'),
      /ENOENT/
    );
    const notFound = await readFile(`${dist}/404.html`, 'utf8');
    assert.ok(/404|Not Found|Не найдено/.test(notFound), 'expected a real 404 page');
  });

  it('emits reciprocal hreflang alternates', async () => {
    const html = await readFile(pagePath('en'), 'utf8');
    for (const hreflang of ['ru', 'uk', 'en', 'x-default']) {
      assert.match(html, new RegExp(`hreflang="${hreflang}"`));
    }
  });

  it('does not emit Offer or PreOrder JSON-LD for unknown availability', async () => {
    const html = await readFile(pagePath('en'), 'utf8');
    assert.ok(!html.includes('"@type":"Offer"'), 'Offer JSON-LD emitted for unknown availability');
    assert.ok(!html.includes('PreOrder'), 'PreOrder emitted');
  });

  it('does not leak private fields into HTML', async () => {
    const html = await readFile(pagePath('en'), 'utf8');
    assert.ok(!html.includes('source_url'), 'source_url leaked');
    assert.ok(!html.includes('commission_'), 'commission field leaked');
    assert.ok(!html.includes('booking-manager.com'), 'source hotlink leaked');
  });

  it('includes lead-form context fields', async () => {
    const html = await readFile(pagePath('en'), 'utf8');
    assert.ok(html.includes('name="yacht_id"'), 'missing yacht_id context');
    assert.ok(html.includes('name="offer_id"'), 'missing offer_id context');
  });

  it('excludes fixture yacht from sitemap', async () => {
    const sitemap = await readFile('public/sitemap.xml', 'utf8');
    assert.ok(!sitemap.includes(`/yacht-charter/${region}/${slug}/`), 'fixture yacht in sitemap');
  });

  it('marks fixture pages as noindex', async () => {
    const html = await readFile(pagePath('en'), 'utf8');
    assert.ok(html.includes('<meta name="robots" content="noindex, nofollow"'), 'missing noindex');
  });

  it('formats selected offer dates for each locale', async () => {
    const ru = await readFile(pagePath('ru'), 'utf8');
    const ua = await readFile(pagePath('ua'), 'utf8');
    const en = await readFile(pagePath('en'), 'utf8');
    assert.ok(ru.includes('28 июля'), 'ru start date not localised');
    assert.ok(ua.includes('28 липня'), 'ua start date not localised');
    assert.ok(en.includes('28 July'), 'en start date not localised');
  });
});
