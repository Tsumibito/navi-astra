export interface Claim {
  topic: string;
  predicate: string;
  value: any;
  source_id: string;
  source_url: string | null;
  source_title: string | null;
  accessed_date: string | null;
  verification_status: string;
  evidence_excerpt: string | null;
}

export interface CatalogueMetrics {
  catalogue_yacht_count: number;
  raw_offer_count: number;
  loadable_offer_count: number;
  displayed_operator_count: number;
  source_snapshot_hash: string;
  captured_at: string;
  yacht_type_distribution: Record<string, number>;
  capacity_range: Record<string, number | null>;
}

export interface GeographyPack {
  entity_id: string;
  entity_type: string;
  canonical_label: string;
  alternate_labels: string[];
  identity: Record<string, any>;
  claims: Claim[];
  relations: Array<{ source: string; target: string; type: string }>;
  catalogue_metrics: CatalogueMetrics;
  missing_topics: string[];
  editorial_notes: any[];
}

export function getClaim(pack: GeographyPack, topic: string, predicate?: string): Claim | undefined {
  return pack.claims.find((c) => c.topic === topic && (predicate === undefined || c.predicate === predicate));
}

export function getClaimValue<T = any>(pack: GeographyPack, topic: string, predicate?: string, fallback?: T): T | undefined {
  const c = getClaim(pack, topic, predicate);
  return c ? (c.value as T) : fallback;
}

export function getCoordinates(pack: GeographyPack): { latitude: number; longitude: number } | undefined {
  const c = getClaim(pack, 'coordinates', 'coordinates');
  if (!c) return undefined;
  const v = c.value as { latitude?: number; longitude?: number } | undefined;
  if (v && typeof v.latitude === 'number' && typeof v.longitude === 'number') {
    return { latitude: v.latitude, longitude: v.longitude };
  }
  return undefined;
}

export function getAddress(pack: GeographyPack): Record<string, string> | undefined {
  return getClaimValue<Record<string, string>>(pack, 'identity', 'address');
}

export function getRelatedByType(pack: GeographyPack, relationType: string, direction: 'out' | 'in' = 'out'): string[] {
  const matches: string[] = [];
  for (const r of pack.relations) {
    if (r.type !== relationType) continue;
    if (direction === 'out' && r.source === pack.entity_id && !matches.includes(r.target)) matches.push(r.target);
    if (direction === 'in' && r.target === pack.entity_id && !matches.includes(r.source)) matches.push(r.source);
  }
  return matches;
}

export function getContainedIn(pack: GeographyPack): string[] {
  const fromClaims = pack.claims
    .filter((c) => c.topic === 'membership' && c.predicate === 'located_in')
    .map((c) => c.value as string);
  const fromRelations = pack.relations
    .filter((r) => r.source === pack.entity_id && r.type === 'located_in')
    .map((r) => r.target);
  return [...new Set([...fromClaims, ...fromRelations])];
}

export function getMetropolitanContext(pack: GeographyPack): string | undefined {
  const c = pack.claims.find((x) => x.topic === 'membership' && x.predicate === 'metropolitan_context');
  return c ? (c.value as string) : undefined;
}

export function getPrimaryBases(pack: GeographyPack): string[] {
  const c = getClaim(pack, 'principal_bases', 'principal_bases');
  if (!c) return [];
  const v = c.value as string[] | undefined;
  return Array.isArray(v) ? v : [];
}

export function getBasesMarinas(pack: GeographyPack): string[] {
  const c = getClaim(pack, 'bases_marinas', 'bases');
  if (!c) return [];
  const v = c.value as string[] | undefined;
  return Array.isArray(v) ? v : [];
}

export function getTransport(pack: GeographyPack): Record<string, any> | undefined {
  return getClaimValue<Record<string, any>>(pack, 'transport', 'airport_access');
}

export function labelFor(entityId: string): string {
  return entityId.split(':').pop()?.replace(/-/g, ' ') || entityId;
}

export function hrefFor(entityId: string, locale: string): string {
  const slug = entityId.split(':').pop() || entityId;
  return `/${locale}/draft/${slug}`;
}
