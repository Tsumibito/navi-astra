import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getYachtPageData, getAllFixtureYachts, slugify, regionFromBase } from '../src/lib/charter/adapter.ts';

describe('charter adapter', () => {
  it('slugify normalizes names to URL slugs', () => {
    assert.equal(slugify('Fountaine Pajot Saba 50 ¨Sunrise¨'), 'fountaine-pajot-saba-50-sunrise');
    assert.equal(slugify('Oceanis 46.1 Blue Satellite'), 'oceanis-461-blue-satellite');
  });

  it('regionFromBase extracts the country from the base label', () => {
    assert.equal(regionFromBase('Tortola / Road Town / Fort Burt Marina, British Virgin Islands'), 'British Virgin Islands');
    assert.equal(regionFromBase('Athens / Alimos Marina, Greece'), 'Greece');
  });

  it('getAllFixtureYachts exposes one pilot yacht with computed slugs', () => {
    const yachts = getAllFixtureYachts();
    assert.equal(yachts.length, 1);
    const [first] = yachts;
    assert.equal(first.yachtSlug, 'fountaine-pajot-saba-50-sunrise');
    assert.equal(first.regionSlug, 'british-virgin-islands');
  });

  it('getYachtPageData returns not-found for an unknown slug', () => {
    const result = getYachtPageData({ source: 'fixture', slug: 'unknown-yacht', locale: 'en' });
    assert.equal(result.kind, 'not-found');
  });

  it('getYachtPageData returns a yacht with a future selected offer', () => {
    const result = getYachtPageData({ source: 'fixture', slug: 'fountaine-pajot-saba-50-sunrise', locale: 'en' });
    assert.equal(result.kind, 'yacht');
    if (result.kind !== 'yacht') return;
    assert.equal(result.name, 'Fountaine Pajot Saba 50 ¨Sunrise¨');
    assert.ok(result.selectedOffer, 'expected a selected offer');
    const today = new Date().toISOString().slice(0, 10);
    assert.ok(
      result.selectedOffer.startDate > today,
      `expected selected offer start ${result.selectedOffer.startDate} to be after today ${today}`
    );
    assert.ok(result.images.length >= 5, `expected at least 5 images, got ${result.images.length}`);
    assert.ok(result.equipment.length > 0, 'expected at least one equipment group');
    assert.ok(['fresh', 'stale'].includes(result.freshness), `expected fresh or stale, got ${result.freshness}`);
    assert.ok(['exact', 'similar'].includes(result.ctaMode), `expected cta mode, got ${result.ctaMode}`);
  });

  it('exposes public image contract with R2 URLs and no source_url', () => {
    const result = getYachtPageData({ source: 'fixture', slug: 'fountaine-pajot-saba-50-sunrise', locale: 'en' });
    assert.equal(result.kind, 'yacht');
    if (result.kind !== 'yacht') return;
    for (const img of result.images) {
      assert.ok(img.url.includes('.r2.dev'), `expected R2 URL, got ${img.url}`);
      assert.ok(!img.url.includes('booking-manager.com'), `source URL leaked: ${img.url}`);
      assert.ok(img.imageId, 'expected image_id');
      assert.ok(img.role, 'expected role');
    }
  });
});
