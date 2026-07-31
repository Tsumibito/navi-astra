import registry from '../../data/geography-routes.json' with { type: 'json' };
import labels from '../../data/pilot-labels.json' with { type: 'json' };

export type Locale = 'ru' | 'ua' | 'en';

export type LocaleIntent = {
  locale: string;
  route_path: string;
  canonical_label: string;
  primary_query_cluster: string;
  supported_synonyms: string[];
};

export type RouteReadiness = {
  passes_data_gate: boolean;
  passes_media_gate: boolean;
  passes_guidance_gate: boolean;
  passes_editorial_gate: boolean;
  reasons: string[];
};

export type RouteMetrics = {
  catalogue_yacht_count: number;
  raw_offer_count?: number;
  loadable_offer_count: number;
  displayed_operator_count: number;
  yacht_type_distribution: Record<string, number>;
  capacity_range?: Record<string, number>;
};

export type RouteIntent = {
  route_id: string;
  page_family: string;
  route_path: string;
  parent_route_id?: string | null;
  child_route_ids: string[];
  type_route_ids: string[];
  sibling_route_ids: string[];
  entity_id: string;
  base_ids: string[];
  localizations: Record<Locale, LocaleIntent>;
  catalogue_metrics: RouteMetrics;
  readiness: RouteReadiness;
  disposition: 'index_candidate' | 'draft_only' | 'blocked';
  publication_mode: 'draft' | 'published';
  preselected_yacht_type?: string | null;
  indexable: boolean;
};

export type RouteRegistry = {
  schema_version: number;
  generated_at: string;
  source_snapshot_hash: string;
  routes: RouteIntent[];
};

export type PilotLabels = {
  schema_version: number;
  entities: Record<string, {
    en: string;
    ru: string;
    ua: string;
    prepositional: Record<Locale, string>;
  }>;
  yacht_types: Record<string, {
    nominative: Record<Locale, string>;
    genitive: Record<Locale, string>;
  }>;
};

const typedRegistry = registry as unknown as RouteRegistry;
const typedLabels = labels as unknown as PilotLabels;

const REQUIRED_LOCALES: Locale[] = ['en', 'ru', 'ua'];
const DISPOSITIONS = ['index_candidate', 'draft_only', 'blocked'];

function assertRoute(route: any, index: number): asserts route is RouteIntent {
  if (typeof route?.route_id !== 'string' || !route.route_id) {
    throw new Error(`Route ${index}: missing route_id`);
  }
  if (typeof route.route_path !== 'string' || !route.route_path) {
    throw new Error(`Route ${route.route_id}: missing route_path`);
  }
  if (typeof route.page_family !== 'string' || !route.page_family) {
    throw new Error(`Route ${route.route_id}: missing page_family`);
  }
  if (typeof route.entity_id !== 'string') {
    throw new Error(`Route ${route.route_id}: missing entity_id`);
  }
  if (!Array.isArray(route.base_ids)) {
    throw new Error(`Route ${route.route_id}: base_ids must be an array`);
  }
  if (!route.localizations || typeof route.localizations !== 'object') {
    throw new Error(`Route ${route.route_id}: missing localizations`);
  }
  for (const l of REQUIRED_LOCALES) {
    const loc = route.localizations[l];
    if (!loc || typeof loc.locale !== 'string' || typeof loc.canonical_label !== 'string' || !loc.canonical_label || typeof loc.primary_query_cluster !== 'string' || !loc.primary_query_cluster || !Array.isArray(loc.supported_synonyms)) {
      throw new Error(`Route ${route.route_id}: missing or invalid ${l} localization`);
    }
  }
  if (!route.catalogue_metrics || typeof route.catalogue_metrics !== 'object' || typeof route.catalogue_metrics.catalogue_yacht_count !== 'number') {
    throw new Error(`Route ${route.route_id}: missing catalogue_metrics`);
  }
  if (!DISPOSITIONS.includes(route.disposition)) {
    throw new Error(`Route ${route.route_id}: invalid disposition ${route.disposition}`);
  }
  if (!Array.isArray(route.child_route_ids) || !Array.isArray(route.type_route_ids) || !Array.isArray(route.sibling_route_ids)) {
    throw new Error(`Route ${route.route_id}: child/type/sibling fields must be arrays`);
  }
}

function assertRegistry(data: any): asserts data is RouteRegistry {
  if (typeof data?.schema_version !== 'number') {
    throw new Error('geography-routes.json missing schema_version');
  }
  if (!data.routes || !Array.isArray(data.routes)) {
    throw new Error('geography-routes.json is missing routes array');
  }
  const seen = new Set<string>();
  for (let i = 0; i < data.routes.length; i++) {
    const route = data.routes[i];
    assertRoute(route, i);
    if (seen.has(route.route_id)) {
      throw new Error(`Duplicate route_id: ${route.route_id}`);
    }
    seen.add(route.route_id);
  }
}

function assertPilotLabels(data: any): asserts data is PilotLabels {
  if (typeof data?.schema_version !== 'number') {
    throw new Error('pilot-labels.json missing schema_version');
  }
  if (!data.entities || typeof data.entities !== 'object') {
    throw new Error('pilot-labels.json missing entities');
  }
  if (!data.yacht_types || typeof data.yacht_types !== 'object') {
    throw new Error('pilot-labels.json missing yacht_types');
  }
}

assertRegistry(typedRegistry);
assertPilotLabels(typedLabels);

export function loadRouteRegistry(): RouteRegistry {
  return typedRegistry;
}

export function getRouteById(routeId: string): RouteIntent | undefined {
  return typedRegistry.routes.find((r) => r.route_id === routeId);
}

export function getRouteByPath(path: string): RouteIntent | undefined {
  return typedRegistry.routes.find((r) => r.route_path === path);
}

export function getSearchableRoutes(): RouteIntent[] {
  return typedRegistry.routes.filter((r) => r.disposition !== 'blocked');
}

export function getPilotLabels(): PilotLabels {
  return typedLabels;
}

export function getYachtTypeLabel(type: string, locale: Locale, form: 'nominative' | 'genitive' = 'nominative'): string {
  const entry = typedLabels.yacht_types?.[type]?.[form];
  if (!entry) return type;
  return entry[locale] ?? entry.en ?? type;
}

export function getRouteLabel(routeId: string, locale: Locale, form: 'nominative' | 'prepositional' = 'nominative'): string {
  const route = getRouteById(routeId);
  if (route) {
    return route.localizations[locale]?.canonical_label ?? route.route_id;
  }
  const entity = typedLabels.entities?.[routeId];
  if (entity) {
    return form === 'prepositional' ? (entity.prepositional?.[locale] ?? entity[locale]) : entity[locale];
  }
  return routeId;
}
