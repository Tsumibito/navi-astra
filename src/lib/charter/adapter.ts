/**
 * Public charter adapter.
 *
 * Maps `charter.public_yachts` + `charter.public_offers` to a single, explicit
 * TypeScript view model. Switching between fixture data and live Neon staging is
 * isolated to this module.
 *
 * Staging integration is currently blocked: the public views are not yet exposed
 * by a connected reader and the fixture mode is the only supported source.
 */

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Public-row types (must match the SQL projection)
// ---------------------------------------------------------------------------

export interface PublicYachtRow {
  source: string;
  source_id: string;
  name: string;
  operator_id: string | null;
  operator_label: string | null;
  model: string | null;
  boat_type: string | null;
  year: number | null;
  length_m: number | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  base_id: string | null;
  base_label: string | null;
  content_hash: string;
  first_seen_at: string;
  last_seen_at: string;
  lifecycle_status: string;
}

export interface PublicOfferRow {
  source: string;
  source_id: string;
  yacht_source_id: string;
  run_id: string;
  starts_at: string;
  ends_at: string;
  date_from: string;
  date_to: string;
  duration_minutes: number;
  requested_duration_days: number | null;
  base_from_id: string;
  base_to_id: string;
  base_from_label: string;
  base_to_label: string;
  product: string;
  display_product: string;
  availability_state: string;
  availability_labels: string[];
  list_price_amount: string | null;
  price_amount: string | null;
  price_currency: string | null;
  discount_percent: string | null;
  security_deposit_amount: string | null;
  security_deposit_currency: string | null;
  seen_at: string;
  content_hash: string;
}

// ---------------------------------------------------------------------------
// View model exposed to pages and components
// ---------------------------------------------------------------------------

export interface YachtImage {
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
  role: 'exterior' | 'interior' | 'layout' | 'other';
}

export interface EquipmentGroup {
  group: string;
  items: string[];
}

export interface YachtOffer {
  publicOfferId: string;
  sourceYachtId: string;
  startDate: string;
  endDate: string;
  partyContext: string | null;
  currency: string | null;
  originalPrice: string | null;
  finalPrice: string | null;
  discountPercent: number | null;
  availability: string;
  observedAt: string;
}

export interface YachtDetailView {
  kind: 'yacht';
  publicYachtId: string;
  slug: string;
  slugSeed: string;
  name: string;
  model: string | null;
  builder: string | null;
  year: number | null;
  vesselClass: string | null;
  base: string | null;
  region: string | null;
  lengthM: number | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  equipment: EquipmentGroup[];
  images: YachtImage[];
  charterMode: string | null;
  operatorLabel: string | null;
  offers: YachtOffer[];
  selectedOffer: YachtOffer;
  observedAt: string;
  freshness: 'fresh' | 'stale' | 'expired';
}

export interface YachtNotFound {
  kind: 'not-found';
  slug: string;
}

export interface YachtUnavailable {
  kind: 'unavailable';
  reason: string;
}

export type YachtPageResult = YachtDetailView | YachtNotFound | YachtUnavailable;

// ---------------------------------------------------------------------------
// Private-field guard
// ---------------------------------------------------------------------------

const PRIVATE_KEY_PATTERNS = [
  /commission_/i,
  /source_operator/i,
  /source_url/i,
  /internal/i,
  /secret/i,
  /password/i,
  /token/i,
];

function isPrivateKey(key: string): boolean {
  return PRIVATE_KEY_PATTERNS.some((p) => p.test(key));
}

function guardNoPrivateFields(obj: unknown, path = 'root'): void {
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => guardNoPrivateFields(item, `${path}[${idx}]`));
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const next = `${path}.${key}`;
      if (isPrivateKey(key)) {
        throw new Error(`private field detected in public fixture: ${next}`);
      }
      guardNoPrivateFields((obj as Record<string, unknown>)[key], next);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function parseDecimal(value: string | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function regionFromBase(baseLabel: string | null): string | null {
  if (!baseLabel) return null;
  const afterSlash = baseLabel.split('/').pop()?.trim();
  return afterSlash || baseLabel;
}

function classifyFreshness(observedAt: string): YachtDetailView['freshness'] {
  const seen = new Date(observedAt).getTime();
  const now = Date.now();
  if (Number.isNaN(seen)) return 'stale';
  const ageMs = now - seen;
  const week = 7 * 24 * 60 * 60 * 1000;
  const day = 24 * 60 * 60 * 1000;
  if (ageMs < 0) return 'stale';
  if (ageMs < week) return 'fresh';
  // More than one week old but observed in this season is still usable information.
  if (ageMs < 4 * week) return 'stale';
  return 'expired';
}

function mapOffer(row: PublicOfferRow): YachtOffer {
  return {
    publicOfferId: row.source_id,
    sourceYachtId: row.yacht_source_id,
    startDate: row.date_from,
    endDate: row.date_to,
    partyContext:
      row.requested_duration_days !== null
        ? `${row.requested_duration_days} days`
        : null,
    currency: row.price_currency,
    originalPrice: row.list_price_amount,
    finalPrice: row.price_amount,
    discountPercent: parseDecimal(row.discount_percent),
    availability: row.availability_state,
    observedAt: row.seen_at,
  };
}

function mapYacht(yacht: PublicYachtRow, offers: PublicOfferRow[]): YachtDetailView {
  const slug = slugify(yacht.name);
  const mappedOffers = offers.map(mapOffer);
  const selected = mappedOffers[0];
  return {
    kind: 'yacht',
    publicYachtId: yacht.source_id,
    slug,
    slugSeed: slug,
    name: yacht.name,
    model: yacht.model,
    builder: null,
    year: yacht.year,
    vesselClass: yacht.boat_type,
    base: yacht.base_label,
    region: regionFromBase(yacht.base_label),
    lengthM: yacht.length_m,
    cabins: yacht.cabins,
    berths: yacht.berths,
    heads: yacht.heads,
    equipment: [],
    images: [],
    charterMode: offers[0]?.display_product ?? offers[0]?.product ?? yacht.boat_type ?? null,
    operatorLabel: yacht.operator_label,
    offers: mappedOffers,
    selectedOffer: selected,
    observedAt: selected.observedAt,
    freshness: classifyFreshness(selected.observedAt),
  };
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

interface FixtureBundle {
  public_yachts: PublicYachtRow[];
  public_offers: PublicOfferRow[];
}

function loadFixture(): FixtureBundle {
  const fixtureUrl = new URL('../../data/charter-fixture.json', import.meta.url);
  const raw = JSON.parse(fs.readFileSync(fileURLToPath(fixtureUrl), 'utf8')) as FixtureBundle;
  guardNoPrivateFields(raw);
  if (!Array.isArray(raw.public_yachts) || raw.public_yachts.length === 0) {
    throw new Error('charter fixture is missing public_yachts');
  }
  if (!Array.isArray(raw.public_offers)) {
    throw new Error('charter fixture is missing public_offers');
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetYachtOptions {
  /** Data source. Only `'fixture'` is supported until Neon staging is connected. */
  source: 'fixture';
  slug: string;
  /** Locale is passed through for freshness labels; it does not change data identity. */
  locale?: string;
}

export function getYachtPageData(options: GetYachtOptions): YachtPageResult {
  if (options.source !== 'fixture') {
    return { kind: 'unavailable', reason: 'staging integration is not yet connected' };
  }

  const fixture = loadFixture();
  const yacht = fixture.public_yachts.find((y) => slugify(y.name) === options.slug);
  if (!yacht) {
    return { kind: 'not-found', slug: options.slug };
  }

  const offers = fixture.public_offers.filter((o) => o.yacht_source_id === yacht.source_id);
  if (offers.length === 0) {
    return {
      kind: 'unavailable',
      reason: `no exact public offer found for yacht ${yacht.source_id}`,
    };
  }

  // Deterministic selection: most recently observed exact offer.
  offers.sort((a, b) => new Date(b.seen_at).getTime() - new Date(a.seen_at).getTime());
  return mapYacht(yacht, offers.slice(0, 1));
}
