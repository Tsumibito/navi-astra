import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getYachtPageData,
  getAllFixtureYachts,
  slugify,
  regionFromBase,
} from '../src/lib/charter/adapter.ts';

const baseYacht = {
  source: 'test',
  source_id: 'y1',
  name: 'Test Yacht 39',
  operator_id: null,
  operator_label: null,
  model: 'Test 39',
  boat_type: 'Sailboat',
  year: 2020,
  length_m: 11.9,
  cabins: 3,
  berths: 6,
  heads: 2,
  base_id: 'b1',
  base_label: 'Athens / Alimos Marina, Greece',
  content_hash: 'deadbeef',
  first_seen_at: '2026-07-01T00:00:00Z',
  last_seen_at: '2026-07-01T00:00:00Z',
  lifecycle_status: 'discovered',
};

function offerFixture({ source_id = 'o1', startDate, endDate, availability_state = 'unknown', seen_at = '2026-07-25T12:00:00Z' }) {
  return {
    source: 'test',
    source_id,
    yacht_source_id: 'y1',
    run_id: 'r1',
    starts_at: `${startDate}T10:00:00Z`,
    ends_at: `${endDate}T10:00:00Z`,
    date_from: startDate,
    date_to: endDate,
    duration_minutes: 10080,
    requested_duration_days: 7,
    base_from_id: 'b1',
    base_to_id: 'b1',
    base_from_label: 'Athens / Alimos Marina, Greece',
    base_to_label: 'Athens / Alimos Marina, Greece',
    product: 'Bareboat',
    display_product: 'Bareboat',
    availability_state,
    availability_labels: [],
    list_price_amount: '5000.00',
    price_amount: '4500.00',
    price_currency: 'EUR',
    discount_percent: '10',
    security_deposit_amount: null,
    security_deposit_currency: null,
    seen_at,
    content_hash: 'cafebabe',
  };
}

function fixtureFor(offer) {
  return {
    public_yachts: [baseYacht],
    public_offers: offer ? [offer] : [],
    public_yacht_images: [],
    public_yacht_specs: [],
  };
}

function page({ offer, now = '2026-07-26T12:00:00Z' }) {
  return getYachtPageData({
    source: 'fixture',
    slug: slugify(baseYacht.name),
    locale: 'en',
    now,
    fixture: fixtureFor(offer),
  });
}

describe('charter adapter', () => {
  it('slugify normalizes names to URL slugs', () => {
    assert.equal(slugify('Fountaine Pajot Saba 50 ¨Sunrise¨'), 'fountaine-pajot-saba-50-sunrise');
    assert.equal(slugify('Oceanis 46.1 Blue Satellite'), 'oceanis-461-blue-satellite');
  });

  it('regionFromBase extracts the country from the base label', () => {
    assert.equal(regionFromBase('Athens / Alimos Marina, Greece'), 'Greece');
    assert.equal(
      regionFromBase('Tortola / Road Town / Fort Burt Marina, British Virgin Islands'),
      'British Virgin Islands'
    );
  });

  it('getAllFixtureYachts exposes the committed pilot yacht', () => {
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

  it('selects a future confirmed offer as exact', () => {
    const result = page({
      offer: offerFixture({ startDate: '2026-08-01', endDate: '2026-08-08', availability_state: 'confirmed' }),
    });
    assert.equal(result.kind, 'yacht');
    if (result.kind !== 'yacht') return;
    assert.equal(result.freshness, 'fresh');
    assert.equal(result.ctaMode, 'exact');
    assert.equal(result.selectedOffer?.availability, 'confirmed');
  });

  it('keeps future unknown offer as similar with no exact CTA', () => {
    const result = page({
      offer: offerFixture({ startDate: '2026-08-01', endDate: '2026-08-08', availability_state: 'unknown' }),
    });
    assert.equal(result.kind, 'yacht');
    if (result.kind !== 'yacht') return;
    assert.equal(result.freshness, 'fresh');
    assert.equal(result.ctaMode, 'similar');
  });

  it('marks an old future observation as stale', () => {
    const result = page({
      offer: offerFixture({
        startDate: '2026-08-01',
        endDate: '2026-08-08',
        availability_state: 'confirmed',
        seen_at: '2026-07-10T00:00:00Z',
      }),
    });
    assert.equal(result.kind, 'yacht');
    if (result.kind !== 'yacht') return;
    assert.equal(result.freshness, 'stale');
    assert.equal(result.ctaMode, 'similar');
  });

  it('reports a started but not expired offer', () => {
    const result = page({
      offer: offerFixture({ startDate: '2026-07-24', endDate: '2026-08-01' }),
    });
    assert.equal(result.kind, 'yacht');
    if (result.kind !== 'yacht') return;
    assert.equal(result.freshness, 'started');
    assert.equal(result.selectedOffer, null);
  });

  it('reports an expired offer', () => {
    const result = page({
      offer: offerFixture({ startDate: '2026-07-20', endDate: '2026-07-25' }),
    });
    assert.equal(result.kind, 'yacht');
    if (result.kind !== 'yacht') return;
    assert.equal(result.freshness, 'expired');
    assert.equal(result.selectedOffer, null);
  });

  it('handles no offer', () => {
    const result = page({ offer: null });
    assert.equal(result.kind, 'yacht');
    if (result.kind !== 'yacht') return;
    assert.equal(result.freshness, 'no-offer');
    assert.equal(result.selectedOffer, null);
  });

  it('maps the committed fixture with real image metadata', () => {
    const result = getYachtPageData({ source: 'fixture', slug: 'fountaine-pajot-saba-50-sunrise', locale: 'en' });
    assert.equal(result.kind, 'yacht');
    if (result.kind !== 'yacht') return;
    assert.equal(result.name, 'Fountaine Pajot Saba 50 ¨Sunrise¨');
    assert.ok(result.images.length >= 5);
    for (const img of result.images) {
      assert.ok(img.url.includes('.r2.dev'), `expected R2 URL, got ${img.url}`);
      assert.ok(!img.url.includes('booking-manager.com'), `source hotlink leaked`);
      assert.ok(typeof img.width === 'number' && img.width > 0, `expected width, got ${img.width}`);
      assert.ok(typeof img.height === 'number' && img.height > 0, `expected height, got ${img.height}`);
      assert.equal(img.mimeType, 'image/webp');
      assert.ok(img.alt, 'expected alt text');
    }
    assert.ok(result.equipment.length > 0);
  });
});
