import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRoute,
  isNoindex,
  collectAstroRoutes,
  collectLegalRoutes,
  collectSnapshotCatchAll,
  detectDuplicateOwners,
} from '../scripts/catalog-routes.mjs';
import { generateSitemapUrls } from '../scripts/generate-sitemap.mjs';

describe('catalog-routes', () => {
  describe('normalizeRoute', () => {
    it('normalizes dist index paths', () => {
      assert.equal(normalizeRoute('dist/index.html'), '/');
      assert.equal(normalizeRoute('dist/foo/index.html'), '/foo/');
      assert.equal(normalizeRoute('dist/404.html'), '/404.html');
    });

    it('collapses leading and trailing slashes', () => {
      assert.equal(normalizeRoute('//'), '/');
      assert.equal(normalizeRoute('/bar'), '/bar/');
      assert.equal(normalizeRoute('https://navi.training/en/blog'), '/en/blog/');
      assert.equal(normalizeRoute('https://navi.training/'), '/');
    });

    it('keeps .html pages and adds trailing slash to directories', () => {
      assert.equal(normalizeRoute('/baz/'), '/baz/');
      assert.equal(normalizeRoute('/404.html'), '/404.html');
      assert.equal(normalizeRoute('/qux'), '/qux/');
    });
  });

  describe('isNoindex', () => {
    it('marks 404 as noindex', () => {
      assert.equal(isNoindex('/404.html'), true);
    });

    it('marks payment-issue as noindex', () => {
      assert.equal(isNoindex('/ru/payment-issue/'), true);
      assert.equal(isNoindex('/en/payment-issue/'), true);
    });

    it('marks thank-you-page as noindex', () => {
      assert.equal(isNoindex('/ru/thank-you-page/'), true);
      assert.equal(isNoindex('/ua/thank-you-page/'), true);
    });

    it('does not mark legal, service or campaign pages as noindex', () => {
      assert.equal(isNoindex('/ru/privacy-policy/'), false);
      assert.equal(isNoindex('/ua/cookie-policy/'), false);
      assert.equal(isNoindex('/en/charter/'), false);
      assert.equal(isNoindex('/ru/yacht-delivery/'), false);
      assert.equal(isNoindex('/ru/charter-for-dummies/'), false);
      assert.equal(isNoindex('/'), false);
    });
  });

  describe('route parity', () => {
    it('sitemap URLs equal indexable Astro + Legal catalog routes', async () => {
      const routes = {};
      await collectAstroRoutes(routes);
      await collectLegalRoutes(routes);
      const expected = Object.keys(routes)
        .filter((url) => !isNoindex(url))
        .sort((a, b) => a.localeCompare(b));
      const actual = await generateSitemapUrls();
      assert.deepEqual(actual, expected);
    });

    it('sitemap does not include snapshot catch-all routes', async () => {
      const routes = {};
      await collectAstroRoutes(routes);
      await collectLegalRoutes(routes);
      const snapshotOnly = {};
      await collectSnapshotCatchAll(snapshotOnly);
      const sitemap = await generateSitemapUrls();
      const sitemapSet = new Set(sitemap);
      const astroLegalSet = new Set(Object.keys(routes));
      for (const url of Object.keys(snapshotOnly)) {
        if (astroLegalSet.has(url)) continue;
        assert.equal(sitemapSet.has(url), false, `${url} should not be in sitemap`);
      }
    });

    it('produces deterministic sorted URLs', async () => {
      const urls = await generateSitemapUrls();
      const sorted = [...urls].sort((a, b) => a.localeCompare(b));
      assert.deepEqual(urls, sorted);
      assert.equal(new Set(urls).size, urls.length);
    });
  });

  describe('audit baseline', () => {
    it('exposes the two expected catch-all conflicts until S2.5', async () => {
      const routes = {};
      await collectAstroRoutes(routes);
      await collectLegalRoutes(routes);
      await collectSnapshotCatchAll(routes);
      const conflicts = detectDuplicateOwners(routes);
      const urls = conflicts.map((c) => c.url).sort();
      assert.deepEqual(urls, ['/', '/ua/payment-issue/']);
    });
  });
});
