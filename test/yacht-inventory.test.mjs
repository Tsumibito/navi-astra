import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getYachtInventory } from '../src/lib/charter/adapter.ts';

describe('getYachtInventory', () => {
  const now = '2026-07-25T00:00:00Z';

  it('returns fixture yachts with inventory fields', () => {
    const inventory = getYachtInventory('fixture', now);
    assert.ok(inventory.length > 0, 'inventory is empty');
    const yacht = inventory[0];
    assert.equal(typeof yacht.baseId, 'string', 'missing baseId');
    assert.ok(Array.isArray(yacht.baseFromIds), 'baseFromIds not an array');
    assert.ok(yacht.regionSlug, 'missing regionSlug');
    assert.ok(!yacht.regionSlug.includes(' '), `regionSlug contains spaces: ${yacht.regionSlug}`);
    assert.equal(yacht.kind, 'yacht');
    assert.ok(yacht.images.length > 0, 'yacht has no images');
    assert.ok(yacht.offers.length > 0, 'yacht has no offers');
    assert.equal(yacht.baseFromIds[0], yacht.offers[0].baseFromId);
  });

  it('uses slugified region without percent encoding', () => {
    const inventory = getYachtInventory('fixture', now);
    const yacht = inventory[0];
    assert.match(yacht.regionSlug, /^[a-z0-9-]+$/);
  });

  it('baseFromIds correspond to the public offers', () => {
    const inventory = getYachtInventory('fixture', now);
    for (const yacht of inventory) {
      const fromOffers = new Set(yacht.offers.map((o) => o.baseFromId));
      for (const id of yacht.baseFromIds) {
        assert.ok(fromOffers.has(id), `baseFromId ${id} not found in offers`);
      }
    }
  });
});
