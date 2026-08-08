import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildSitemapXml, generateSitemapEntries } from '../scripts/generate-sitemap.mjs';

describe('human-readable sitemap', () => {
  it('keeps the XML sitemap machine-readable and attaches the shared XSL presentation', async () => {
    const entries = await generateSitemapEntries();
    const xml = buildSitemapXml(entries);
    assert.match(xml, /<\?xml-stylesheet type="text\/xsl" href="\/sitemap\.xsl"\?>/);
    assert.match(xml, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
    assert.match(xml, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
    assert.equal([...xml.matchAll(/<loc>/g)].length, entries.length);
  });

  it('publishes reciprocal language alternates for Payload encyclopedia entries', async () => {
    const entries = await generateSitemapEntries();
    const anchor = entries.find((entry) => entry.route === '/en/encyclopedia/anchor/');
    assert.ok(anchor, 'expected the published anchor encyclopedia route');
    assert.deepEqual(new Set(anchor.alternates.map((entry) => entry.locale)), new Set(['ru', 'ua', 'en']));
  });

  it('uses the Navi visual contract without client-side scripts', async () => {
    const xsl = await readFile('public/sitemap.xsl', 'utf8');
    assert.match(xsl, /--sea:#073746/);
    assert.match(xsl, /--orange:#ffb052/);
    assert.match(xsl, /Карта маршрутов/);
    assert.doesNotMatch(xsl, /<script\b/i);
  });
});
