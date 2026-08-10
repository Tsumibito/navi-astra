import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSearchState,
  getApplicableYachtTypes,
  normalizeSearchState,
  denormalizeSearchState,
  buildSearchURL,
  buildSearchAnalyticsPayload,
  validateSearchState,
  nextSaturday,
} from '../src/lib/charter/search.ts';

const athensRoute = {
  route_id: 'locality:athens',
  route_path: 'yacht-charter/greece/athens',
  localizations: {
    en: { locale: 'en', canonical_label: 'Athens', primary_query_cluster: 'yacht charter in Athens', route_path: 'yacht-charter/greece/athens' },
    ru: { locale: 'ru', canonical_label: 'Афины', primary_query_cluster: 'аренда яхт в Афинах', route_path: 'yacht-charter/greece/athens' },
    ua: { locale: 'ua', canonical_label: 'Афіни', primary_query_cluster: 'оренда яхт в Афінах', route_path: 'yacht-charter/greece/athens' },
  },
  catalogue_metrics: {
    catalogue_yacht_count: 532,
    yacht_type_distribution: {
      'Sailing boat': 323,
      'Catamaran': 173,
      'Motoryacht': 20,
    },
  },
  preselected_yacht_type: null,
  child_route_ids: [],
  type_route_ids: [],
  sibling_route_ids: [],
  base_ids: ['13', '1519'],
  disposition: 'draft_only',
};

const catamaranRoute = {
  ...athensRoute,
  route_id: 'locality:athens:type:Catamaran',
  route_path: 'yacht-charter/greece/athens/catamarans',
  preselected_yacht_type: 'Catamaran',
  parent_route_id: 'locality:athens',
};

describe('defaultSearchState', () => {
  it('uses route_id as location and null yacht type for base route', () => {
    const state = defaultSearchState(athensRoute, 'ru');
    assert.equal(state.location, 'locality:athens');
    assert.equal(state.yachtType, null);
    assert.equal(state.locale, 'ru');
  });

  it('preselects the yacht type for type routes', () => {
    const state = defaultSearchState(catamaranRoute, 'en');
    assert.equal(state.yachtType, 'Catamaran');
  });
});

describe('getApplicableYachtTypes', () => {
  it('lists all types for a base route with counts > 0', () => {
    const types = getApplicableYachtTypes(athensRoute);
    assert.deepEqual(types, ['Catamaran', 'Motoryacht', 'Sailing boat']);
  });

  it('returns only the preselected type for type routes', () => {
    const types = getApplicableYachtTypes(catamaranRoute);
    assert.deepEqual(types, ['Catamaran']);
  });
});

describe('normalizeSearchState', () => {
  it('rejects unknown yacht types, services and clamps guests', () => {
    const params = new URLSearchParams({ t: 'Submarine', sv: 'luxury', g: '15', s: '2026-08-01', e: '2026-08-08' });
    const state = normalizeSearchState(params, 'locality:athens', 'ru');
    assert.equal(state.location, 'locality:athens');
    assert.equal(state.yachtType, null);
    assert.equal(state.service, null);
    assert.equal(state.guests, 12);
    assert.equal(state.startDate, '2026-08-01');
    assert.equal(state.endDate, '2026-08-08');
  });

  it('rejects invalid and impossible dates', () => {
    const params = new URLSearchParams({ s: '2026-99-99', e: '2026-02-31', loc: 'locality:athens' });
    const state = normalizeSearchState(params, 'locality:athens', 'en');
    assert.equal(state.startDate, '');
    assert.equal(state.endDate, '');
  });

  it('rejects fractional guests', () => {
    const params = new URLSearchParams({ g: '2.5', loc: 'locality:athens' });
    const state = normalizeSearchState(params, 'locality:athens', 'en');
    assert.equal(state.guests, 1);
  });

  it('ignores duplicate values and picks the deterministic first sorted value', () => {
    const asc = new URLSearchParams('s=2026-08-01&s=2026-08-08&loc=locality:athens');
    const desc = new URLSearchParams('s=2026-08-08&s=2026-08-01&loc=locality:athens');
    const ascState = normalizeSearchState(asc, 'locality:athens', 'ru');
    const descState = normalizeSearchState(desc, 'locality:athens', 'ru');
    assert.equal(ascState.startDate, '2026-08-01');
    assert.equal(descState.startDate, '2026-08-01');
  });

  it('preserves known type and service', () => {
    const params = new URLSearchParams({ t: 'Catamaran', sv: 'skippered', g: '4' });
    const state = normalizeSearchState(params, 'locality:athens', 'en');
    assert.equal(state.yachtType, 'Catamaran');
    assert.equal(state.service, 'skippered');
    assert.equal(state.guests, 4);
  });
});

describe('denormalizeSearchState and buildSearchURL', () => {
  it('round-trips a state to a canonical results URL with sorted params', () => {
    const state = { ...defaultSearchState(athensRoute, 'ru'), startDate: '2026-07-28', endDate: '2026-08-04', guests: 4 };
    const url = buildSearchURL(state);
    assert.match(url, /^\/ru\/yacht-search\/\?/);
    assert.match(url, /e=2026-08-04/);
    assert.match(url, /g=4/);
    assert.match(url, /loc=locality%3Aathens/);
    assert.match(url, /s=2026-07-28/);
  });

  it('omits default values from query string', () => {
    const state = defaultSearchState(athensRoute, 'en');
    const params = denormalizeSearchState(state);
    assert.equal(params.get('g'), null);
    assert.equal(params.get('loc'), 'locality:athens');
    assert.equal(params.get('s'), null);
  });

  it('encodes the preselected type route in the results URL', () => {
    const state = defaultSearchState(catamaranRoute, 'ua');
    const url = buildSearchURL(state);
    assert.match(url, /^\/ua\/yacht-search\/\?/);
    assert.match(url, /loc=locality%3Aathens%3Atype%3ACatamaran/);
    assert.match(url, /t=Catamaran/);
  });

  it('produces a deterministic search results URL', () => {
    assert.equal(buildSearchURL(defaultSearchState(athensRoute, 'ru')), '/ru/yacht-search/?loc=locality%3Aathens');
    assert.equal(buildSearchURL(defaultSearchState(athensRoute, 'en')), '/en/yacht-search/?loc=locality%3Aathens');
  });
});

describe('validateSearchState', () => {
  const min = '2026-08-01';
  const max = '2027-08-01';

  it('passes for a valid state and marks it complete', () => {
    const state = { ...defaultSearchState(athensRoute, 'ru'), startDate: '2026-08-01', endDate: '2026-08-08' };
    const { ok, errors, status } = validateSearchState(state, min, max);
    assert.equal(ok, true);
    assert.equal(errors.length, 0);
    assert.equal(status, 'complete');
  });

  it('marks browse-only state as incomplete', () => {
    const state = defaultSearchState(athensRoute, 'ru');
    const { ok, status } = validateSearchState(state, min, max);
    assert.equal(ok, true);
    assert.equal(status, 'incomplete');
  });

  it('fails on past start date', () => {
    const state = { ...defaultSearchState(athensRoute, 'ru'), startDate: '2020-01-01', endDate: '2020-01-08' };
    const { ok, errors } = validateSearchState(state, min, max);
    assert.equal(ok, false);
    assert.ok(errors.some((e) => e.includes('past')));
  });

  it('fails when only one date is provided', () => {
    const state = { ...defaultSearchState(athensRoute, 'ru'), startDate: '2026-08-01' };
    const { ok, errors } = validateSearchState(state, min, max);
    assert.equal(ok, false);
    assert.ok(errors.some((e) => e.includes('both')));
  });

  it('fails for an inapplicable yacht type', () => {
    const state = { ...defaultSearchState(athensRoute, 'ru'), yachtType: 'Submarine' };
    const { ok, errors } = validateSearchState(state, min, max);
    assert.equal(ok, false);
    assert.ok(errors.some((e) => e.includes('not applicable')));
  });

  it('accepts departures only on Saturday and finds the next Saturday', () => {
    assert.equal(nextSaturday('2026-08-10'), '2026-08-15');
    const state = { ...defaultSearchState(athensRoute, 'ru'), startDate: '2026-08-03', endDate: '2026-08-10' };
    const { ok, errors } = validateSearchState(state, min, max);
    assert.equal(ok, false);
    assert.ok(errors.includes('departure date must be a Saturday'));
  });
});

describe('buildSearchAnalyticsPayload', () => {
  it('contains no PII and only allowed search fields', () => {
    const state = { ...defaultSearchState(athensRoute, 'ru'), startDate: '2026-08-01', endDate: '2026-08-08' };
    const payload = buildSearchAnalyticsPayload(state);
    assert.equal(payload.event, 'yacht_search');
    assert.equal(payload.route_id, 'locality:athens');
    assert.equal(payload.has_dates, true);
    assert.equal(payload.guests, 1);
    assert.equal('name' in payload, false);
    assert.equal('email' in payload, false);
  });
});
