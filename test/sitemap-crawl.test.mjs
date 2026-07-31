import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = decodeURIComponent(new URL('../', import.meta.url).pathname.replace(/\/$/, ''));

function sitemap(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf-8');
}

describe('Sitemap crawl contract', () => {
  it('public/sitemap.xml does not include draft or query URLs', () => {
    const xml = sitemap('public/sitemap.xml');
    assert.ok(xml, 'public/sitemap.xml not generated');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.ok(locs.length > 0, 'sitemap is empty');
    for (const loc of locs) {
      assert.ok(!loc.includes('/draft/'), `draft URL in sitemap: ${loc}`);
      assert.ok(!loc.includes('?'), `query URL in sitemap: ${loc}`);
    }
  });

  it('dist/sitemap.xml does not include draft or query URLs', () => {
    const xml = sitemap('dist/sitemap.xml');
    assert.ok(xml, 'dist/sitemap.xml not built');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const loc of locs) {
      assert.ok(!loc.includes('/draft/'), `draft URL in dist sitemap: ${loc}`);
      assert.ok(!loc.includes('?'), `query URL in dist sitemap: ${loc}`);
    }
  });
});
