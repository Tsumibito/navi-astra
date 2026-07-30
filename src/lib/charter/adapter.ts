/**
 * Public charter adapter.
 *
 * Maps `charter.public_yachts`, `charter.public_offers`,
 * `charter.public_yacht_images` and `charter.public_yacht_specs` to one
 * explicit TypeScript view model. Switching fixture → Neon staging is isolated
 * to this module. Staging is currently blocked.
 */

import fixture from '../../data/charter-fixture.json' with { type: 'json' };

// ---------------------------------------------------------------------------
// Public-row contract (must match the SQL public projections)
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

export interface PublicImageRow {
  source: string;
  source_id: string;
  image_id: string;
  role: string;
  order: number;
  width: number;
  height: number;
  mime_type: string;
  alt: string | null;
  r2_url: string;
}

export interface PublicSpecRow {
  source: string;
  source_id: string;
  group: string;
  label: string;
  value: string;
  order: number;
}

// ---------------------------------------------------------------------------
// View model
// ---------------------------------------------------------------------------

export type MediaState = 'local_fixture' | 'r2_verified';

export interface YachtImage {
  imageId: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
  alt: string;
  role: string;
  order: number;
  mediaState: MediaState;
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
  product: string;
  displayProduct: string;
  partyContext: string | null;
  currency: string | null;
  originalPrice: string | null;
  finalPrice: string | null;
  discountPercent: number | null;
  availability: string;
  observedAt: string;
}

export type Freshness = 'fresh' | 'stale' | 'started' | 'expired' | 'no-offer';
export type CtaMode = 'exact' | 'similar' | 'none';

export interface YachtDetailView {
  kind: 'yacht';
  publicYachtId: string;
  slug: string;
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
  selectedOffer: YachtOffer | null;
  observedAt: string | null;
  freshness: Freshness;
  ctaMode: CtaMode;
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
  /source_url/i,
  /commission_/i,
  /source_operator/i,
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
        throw new Error(`private field detected in fixture: ${next}`);
      }
      guardNoPrivateFields((obj as Record<string, unknown>)[key], next);
    }
  }
}

// ---------------------------------------------------------------------------
// Fixture loading
// ---------------------------------------------------------------------------

export interface FixtureBundle {
  public_yachts: PublicYachtRow[];
  public_offers: PublicOfferRow[];
  public_yacht_images: PublicImageRow[];
  public_yacht_specs: PublicSpecRow[];
}

function loadFixture(): FixtureBundle {
  const raw = fixture as FixtureBundle;
  guardNoPrivateFields(raw);
  if (!Array.isArray(raw.public_yachts)) throw new Error('fixture missing public_yachts');
  if (!Array.isArray(raw.public_offers)) throw new Error('fixture missing public_offers');
  if (!Array.isArray(raw.public_yacht_images)) throw new Error('fixture missing public_yacht_images');
  if (!Array.isArray(raw.public_yacht_specs)) throw new Error('fixture missing public_yacht_specs');
  return raw;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function regionFromBase(baseLabel: string | null): string | null {
  if (!baseLabel) return null;
  const afterSlash = baseLabel.split('/').pop()?.trim();
  const parts = (afterSlash || baseLabel).split(',');
  const country = parts.pop()?.trim();
  return country || baseLabel;
}

function parseDecimal(value: string | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function offerState(offer: YachtOffer, now: Date): 'fresh' | 'stale' | 'started' | 'expired' {
  const nowDate = dateKey(now);
  const start = offer.startDate;
  const end = offer.endDate;

  if (end < nowDate) return 'expired';
  if (start <= nowDate && end >= nowDate) return 'started';

  // Future offer: freshness depends on observation age.
  const seen = new Date(offer.observedAt).getTime();
  const week = 7 * 24 * 60 * 60 * 1000;
  if (Number.isNaN(seen)) return 'stale';
  return now.getTime() - seen < week ? 'fresh' : 'stale';
}

function pickSelectedOffer(offers: YachtOffer[], now: Date): YachtOffer | null {
  const nowDate = dateKey(now);
  // Prefer a future, confirmed offer with the nearest start date.
  const future = offers
    .filter((o) => o.startDate > nowDate)
    .sort((a, b) => {
      const aIsConfirmed = a.availability === 'confirmed' ? 0 : 1;
      const bIsConfirmed = b.availability === 'confirmed' ? 0 : 1;
      if (aIsConfirmed !== bIsConfirmed) return aIsConfirmed - bIsConfirmed;
      return a.startDate.localeCompare(b.startDate);
    });
  return future[0] ?? null;
}

function pageFreshness(offers: YachtOffer[], now: Date): Freshness {
  if (offers.length === 0) return 'no-offer';
  const selected = pickSelectedOffer(offers, now);
  if (selected) return offerState(selected, now);
  // No live future offer: report started if any offer is in progress, else expired.
  const nowDate = dateKey(now);
  const started = offers.some((o) => o.startDate <= nowDate && o.endDate >= nowDate);
  if (started) return 'started';
  return 'expired';
}

function ctaMode(selected: YachtOffer | null, freshness: Freshness): CtaMode {
  if (!selected) return 'none';
  if (freshness === 'fresh' && selected.availability === 'confirmed') return 'exact';
  return 'similar';
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapOffer(row: PublicOfferRow): YachtOffer {
  return {
    publicOfferId: row.source_id,
    sourceYachtId: row.yacht_source_id,
    startDate: row.date_from,
    endDate: row.date_to,
    product: row.product,
    displayProduct: row.display_product,
    partyContext:
      row.requested_duration_days !== null ? `${row.requested_duration_days} days` : null,
    currency: row.price_currency,
    originalPrice: row.list_price_amount,
    finalPrice: row.price_amount,
    discountPercent: parseDecimal(row.discount_percent),
    availability: row.availability_state,
    observedAt: row.seen_at,
  };
}

function groupSpecs(specs: PublicSpecRow[]): EquipmentGroup[] {
  const grouped = new Map<string, string[]>();
  const ordered = [...specs].sort((a, b) => a.order - b.order);
  for (const spec of ordered) {
    const list = grouped.get(spec.group) ?? [];
    list.push(spec.label);
    grouped.set(spec.group, list);
  }
  return [...grouped.entries()].map(([group, items]) => ({ group, items }));
}

function mapYacht(
  yacht: PublicYachtRow,
  offers: YachtOffer[],
  images: YachtImage[],
  specs: PublicSpecRow[],
  now: Date
): YachtDetailView {
  const selected = pickSelectedOffer(offers, now);
  const freshness = pageFreshness(offers, now);
  const cta = ctaMode(selected, freshness);
  const base = yacht.base_label;
  const region = regionFromBase(base);

  return {
    kind: 'yacht',
    publicYachtId: yacht.source_id,
    slug: slugify(yacht.name),
    name: yacht.name,
    model: yacht.model,
    builder: null,
    year: yacht.year,
    vesselClass: yacht.boat_type,
    base,
    region,
    lengthM: yacht.length_m,
    cabins: yacht.cabins,
    berths: yacht.berths,
    heads: yacht.heads,
    equipment: groupSpecs(specs),
    images,
    charterMode: selected?.displayProduct ?? selected?.product ?? yacht.boat_type ?? null,
    operatorLabel: yacht.operator_label,
    offers,
    selectedOffer: selected,
    observedAt: selected?.observedAt ?? offers[0]?.observedAt ?? null,
    freshness,
    ctaMode: cta,
  };
}

function mapImage(row: PublicImageRow): YachtImage {
  const url = row.r2_url;
  const mediaState: MediaState =
    url.startsWith('/') || url.startsWith('https://navi.training/')
      ? 'local_fixture'
      : url.includes('.r2.dev')
        ? 'r2_verified'
        : 'local_fixture';
  return {
    imageId: row.image_id,
    url,
    width: row.width,
    height: row.height,
    mimeType: row.mime_type,
    alt: row.alt ?? '',
    role: row.role,
    order: row.order,
    mediaState,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetYachtOptions {
  /** Data source. Only `'fixture'` is supported until Neon staging is connected. */
  source: 'fixture';
  slug: string;
  locale?: string;
  /** ISO 8601 timestamp used as the current time for date-bound freshness logic. */
  now?: string;
  /** Optional fixture bundle for tests; when omitted, the committed fixture is loaded. */
  fixture?: FixtureBundle;
}

export function getYachtPageData(options: GetYachtOptions): YachtPageResult {
  if (options.source !== 'fixture') {
    return { kind: 'unavailable', reason: 'staging integration is not yet connected' };
  }

  const now = options.now ? new Date(options.now) : new Date();
  const { public_yachts, public_offers, public_yacht_images, public_yacht_specs } =
    options.fixture ?? loadFixture();
  const yacht = public_yachts.find((y) => slugify(y.name) === options.slug);
  if (!yacht) {
    return { kind: 'not-found', slug: options.slug };
  }

  const offers = public_offers
    .filter((o) => o.yacht_source_id === yacht.source_id)
    .map(mapOffer);

  const images = public_yacht_images
    .filter((img) => img.source_id === yacht.source_id)
    .sort((a, b) => a.order - b.order)
    .map(mapImage);

  const specs = public_yacht_specs
    .filter((spec) => spec.source_id === yacht.source_id)
    .sort((a, b) => a.order - b.order);

  return mapYacht(yacht, offers, images, specs, now);
}

export function getAllFixtureYachts(): Array<{
  yacht: PublicYachtRow;
  regionSlug: string;
  yachtSlug: string;
}> {
  const { public_yachts } = loadFixture();
  return public_yachts.map((yacht) => ({
    yacht,
    regionSlug: slugify(regionFromBase(yacht.base_label) ?? 'unknown'),
    yachtSlug: slugify(yacht.name),
  }));
}
