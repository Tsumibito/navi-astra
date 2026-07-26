import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRoute, detectDuplicateOwners } from '../scripts/audit-route-ownership.mjs';

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

describe('detectDuplicateOwners', () => {
  it('returns an empty array when every route has one owner', () => {
    const routes = { '/a/': { owners: ['x'] }, '/b/': { owners: ['y'] } };
    assert.deepEqual(detectDuplicateOwners(routes), []);
  });

  it('returns routes with more than one owner sorted by URL', () => {
    const routes = {
      '/z/': { owners: ['a'] },
      '/a/': { owners: ['b', 'c'] },
      '/m/': { owners: ['d', 'e'] },
    };
    const dups = detectDuplicateOwners(routes);
    assert.equal(dups.length, 2);
    assert.equal(dups[0].url, '/a/');
    assert.deepEqual(dups[0].owners, ['b', 'c']);
    assert.equal(dups[1].url, '/m/');
    assert.deepEqual(dups[1].owners, ['d', 'e']);
  });
});
