/**
 * Verified Athens/Alimos pilot inventory loader.
 *
 * Consumes the deterministic bundle emitted by `public-inventory-export-astro`
 * and exposes scoped, private-field-checked, hash-verified pilot yachts.
 * It never merges into the BVI fixture or the global fixture loader.
 */

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { FixtureBundle, InventoryYacht, PublicYachtRow, YachtDetailView, YachtPageResult } from './adapter';
import { guardNoPrivateFields, slugify, mapYacht, mapImage, mapOffer } from './adapter';
import pilotBundle from '../../data/charter/athens-alimos-pilot.json' with { type: 'json' };
import pilotIndex from '../../data/charter/athens-alimos-pilot-index.json' with { type: 'json' };
import pilotManifest from '../../data/charter/athens-alimos-pilot-manifest.json' with { type: 'json' };

const APPROVED_R2_PUBLIC_DOMAIN = 'https://pub-c14094474319495887321b74b5186100.r2.dev';

interface PilotIndex {
  schema_version: number;
  source_bundle_run_id: string;
  source_bundle_manifest_sha256: string;
  generated_at: string;
  as_of: string;
  requested_route_ids: string[];
  yacht_ids_by_route: Record<string, string[]>;
  card_ready_yacht_ids_by_route: Record<string, string[]>;
  detail_ready_yacht_ids_by_route: Record<string, string[]>;
  yacht_type_counts_by_route: Record<string, Record<string, number>>;
  exported_union_counts: {
    public_yachts: number;
    public_offers: number;
    public_yacht_images: number;
    public_yacht_specs: number;
  };
  source: string;
  publication_mode: string;
  indexable: boolean;
}

interface PilotManifest {
  schema_version: number;
  builder_version: string;
  source_bundle_run_id: string;
  source_bundle_manifest_sha256: string;
  generated_at: string;
  as_of: string;
  requested_route_ids: string[];
  input_hashes: Record<string, string>;
  output_files: Record<string, string>;
  total_counts: {
    public_yachts: number;
    public_offers: number;
    public_images: number;
    public_yacht_specs: number;
  };
  completion_status: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function dataPath(name: string): string {
  return join(__dirname, '..', '..', 'data', 'charter', name);
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function validatePilotFiles(): void {
  const manifest = pilotManifest as unknown as PilotManifest;
  const index = pilotIndex as unknown as PilotIndex;
  const bundle = pilotBundle as unknown as FixtureBundle;

  if (manifest.schema_version !== 1) throw new Error('pilot manifest schema mismatch');
  if (index.schema_version !== 1) throw new Error('pilot index schema mismatch');
  if (index.source !== 'verified-public-inventory') throw new Error('pilot index source mismatch');
  if (index.publication_mode !== 'draft') throw new Error('pilot index publication_mode mismatch');
  if (index.indexable !== false) throw new Error('pilot index must be noindex');

  guardNoPrivateFields(bundle);
  guardNoPrivateFields(index);
  guardNoPrivateFields(manifest);

  // ponytail: runtime hash verification falls back to counts when Vite bundles
  // the JSON and the source file path is no longer reachable. Build-time
  // verification is covered by the exporter tests and `public-inventory-verify`.
  const bundlePath = dataPath('athens-alimos-pilot.json');
  const indexPath = dataPath('athens-alimos-pilot-index.json');
  if (existsSync(bundlePath) && existsSync(indexPath) && manifest.output_files) {
    const bundleHash = manifest.output_files['athens-alimos-pilot.json'];
    const indexHash = manifest.output_files['athens-alimos-pilot-index.json'];
    if (bundleHash && sha256File(bundlePath) !== bundleHash) {
      throw new Error('pilot bundle hash does not match manifest');
    }
    if (indexHash && sha256File(indexPath) !== indexHash) {
      throw new Error('pilot index hash does not match manifest');
    }
  }

  if (bundle.public_yachts.length !== manifest.total_counts.public_yachts) {
    throw new Error('pilot bundle yacht count does not match manifest');
  }
  if (bundle.public_yacht_images.length !== manifest.total_counts.public_images) {
    throw new Error('pilot bundle image count does not match manifest');
  }
  if (bundle.public_offers.length !== manifest.total_counts.public_offers) {
    throw new Error('pilot bundle offer count does not match manifest');
  }
  if (bundle.public_yacht_specs.length !== manifest.total_counts.public_yacht_specs) {
    throw new Error('pilot bundle spec count does not match manifest');
  }

  for (const img of bundle.public_yacht_images) {
    if (!img.r2_url.startsWith(APPROVED_R2_PUBLIC_DOMAIN)) {
      throw new Error(`pilot image not on approved R2 domain: ${img.image_id}`);
    }
    const urlKey = img.r2_url.split('/').pop() ?? '';
    if (!img.sha256 || urlKey !== img.sha256) {
      throw new Error(`pilot image sha256 mismatch: ${img.image_id}`);
    }
  }

  const excluded = '5620417700000106867';
  if (bundle.public_yachts.some((y) => y.source_id === excluded)) {
    throw new Error('excluded yacht entered pilot bundle');
  }
}

function buildSlugMap(yachts: { source_id: string; name: string }[]): Map<string, string> {
  const byId = new Map<string, string>();
  const seen = new Map<string, string>();
  for (const yacht of yachts) {
    let base = slugify(yacht.name);
    let slug = base;
    let counter = 1;
    while (seen.has(slug) && seen.get(slug) !== yacht.source_id) {
      slug = `${base}-${counter}`;
      counter += 1;
    }
    seen.set(slug, yacht.source_id);
    byId.set(yacht.source_id, slug);
  }
  return byId;
}

function getYachtScopeIds(yachtId: string, index: PilotIndex): string[] {
  const scopes: string[] = [];
  for (const [routeId, ids] of Object.entries(index.yacht_ids_by_route)) {
    if (ids.includes(yachtId)) scopes.push(routeId);
  }
  return scopes;
}

function mapPilotYacht(
  yacht: PublicYachtRow,
  bundle: FixtureBundle,
  now: Date,
): YachtDetailView {
  const offers = bundle.public_offers
    .filter((o) => o.yacht_source_id === yacht.source_id)
    .map(mapOffer);
  const images = bundle.public_yacht_images
    .filter((img) => img.source_id === yacht.source_id)
    .sort((a, b) => a.order - b.order)
    .map(mapImage)
    .map((img) => ({ ...img, mediaState: 'r2_verified' as const }));
  const specs = bundle.public_yacht_specs
    .filter((s) => s.source_id === yacht.source_id)
    .sort((a, b) => a.order - b.order);
  return mapYacht(yacht, offers, images, specs, now);
}

export interface PilotYacht extends InventoryYacht {
  scopeIds: string[];
}

let _pilotCache: {
  index: PilotIndex;
  yachts: PilotYacht[];
  slugByYachtId: Map<string, string>;
} | null = null;

function getPilotCache(): {
  index: PilotIndex;
  yachts: PilotYacht[];
  slugByYachtId: Map<string, string>;
} {
  if (!_pilotCache) {
    validatePilotFiles();

    const bundle = pilotBundle as unknown as FixtureBundle;
    const index = pilotIndex as unknown as PilotIndex;
    const slugByYachtId = buildSlugMap(bundle.public_yachts);
    const now = new Date();

    const yachts = bundle.public_yachts.map((y) => {
      const view = mapPilotYacht(y, bundle, now) as PilotYacht;
      view.slug = slugByYachtId.get(y.source_id) ?? slugify(y.name);
      view.scopeIds = getYachtScopeIds(y.source_id, index);
      view.regionSlug = 'greece';
      view.baseId = y.base_id ?? null;
      view.baseFromIds = bundle.public_offers
        .filter((o) => o.yacht_source_id === y.source_id)
        .map((o) => o.base_from_id ?? '');
      return view;
    });

    _pilotCache = { index, yachts, slugByYachtId };
  }
  return _pilotCache;
}

export function getPilotYachts(): PilotYacht[] {
  return getPilotCache().yachts;
}

export function getPilotYachtsByScope(scopeId: string): PilotYacht[] {
  return getPilotYachts().filter((y) => y.scopeIds.includes(scopeId));
}

export function getAllPilotYachts(): Array<{ regionSlug: string; yachtSlug: string; scopeIds: string[] }> {
  const { yachts, slugByYachtId } = getPilotCache();
  return yachts.map((y) => ({
    regionSlug: 'greece',
    yachtSlug: slugByYachtId.get(y.publicYachtId) ?? slugify(y.name),
    scopeIds: y.scopeIds,
  }));
}

export function getPilotYachtPageData(slug: string): YachtPageResult {
  const { yachts } = getPilotCache();
  const entry = yachts.find((y) => y.slug === slug);
  if (!entry) return { kind: 'not-found', slug };

  const bundle = pilotBundle as unknown as FixtureBundle;
  const row = bundle.public_yachts.find((y) => y.source_id === entry.publicYachtId);
  if (!row) return { kind: 'not-found', slug };

  const pageData = mapPilotYacht(row, bundle, new Date()) as PilotYacht;
  pageData.slug = entry.slug;
  pageData.scopeIds = entry.scopeIds;
  pageData.regionSlug = 'greece';
  pageData.baseId = entry.baseId;
  pageData.baseFromIds = entry.baseFromIds;
  return pageData;
}

export function isAthensYacht(yachtId: string): boolean {
  return getYachtScopeIds(yachtId, getPilotCache().index).includes('locality:athens');
}

export function isAlimosMarinaYacht(yachtId: string): boolean {
  return getYachtScopeIds(yachtId, getPilotCache().index).includes('marina:alimos-marina');
}

export function getPilotManifest(): PilotManifest {
  return pilotManifest as unknown as PilotManifest;
}

export function getPilotIndex(): PilotIndex {
  return pilotIndex as unknown as PilotIndex;
}
