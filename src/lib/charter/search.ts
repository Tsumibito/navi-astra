import {
  getRouteById,
  getSearchableRoutes,
  type Locale,
  type RouteIntent,
} from './routes.ts';


export type SearchState = {
  /** entity route_id of the selected scope (e.g. "locality:athens") */
  location: string;
  /** ISO start date */
  startDate: string;
  /** ISO end date */
  endDate: string;
  /** Preselected yacht type or null for "all" */
  yachtType: string | null;
  /** Number of guests, integer 1-12 */
  guests: number;
  /** Bareboat, skippered, crewed or null for "any" */
  service: 'bareboat' | 'skippered' | 'crewed' | null;
  /** Current UI locale */
  locale: Locale;
};

export const SUPPORTED_LOCALES: Locale[] = ['ru', 'ua', 'en'];
export const SUPPORTED_SERVICES = ['bareboat', 'skippered', 'crewed'] as const;
export type SupportedService = (typeof SUPPORTED_SERVICES)[number];

export const SEARCH_PARAM_KEYS = {
  location: 'loc',
  startDate: 's',
  endDate: 'e',
  yachtType: 't',
  guests: 'g',
  service: 'sv',
} as const;

function getQueryValue(params: URLSearchParams, key: string): string | null {
  const values = params.getAll(key);
  if (values.length === 0) return null;
  // Deterministic: sort and take the first value. This makes duplicate or
  // reordered parameters resolve to a single canonical value.
  return [...values].sort()[0];
}

export const SEARCH_ANALYTICS_EVENT = 'yacht_search';

export type SearchAnalyticsPayload = {
  event: 'yacht_search';
  locale: Locale;
  route_id: string;
  page_family: string;
  has_dates: boolean;
  yacht_type: string | null;
  guests: number;
  service: string | null;
};

function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const [year, month, day] = value.split('-').map(Number);
  // Defensive: month is 1-12 and day matches the parsed UTC day.
  return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month && d.getUTCDate() === day;
}

export function isSaturday(value: string): boolean {
  return isValidISODate(value) && new Date(`${value}T00:00:00Z`).getUTCDay() === 6;
}

export function nextSaturday(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  const delta = (6 - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function parseYachtType(value: string | null, applicableTypes: string[]): string | null {
  if (!value) return null;
  return applicableTypes.includes(value) ? value : null;
}

function parseService(value: string | null): SearchState['service'] {
  if (!value) return null;
  if (value === 'bareboat' || value === 'skippered' || value === 'crewed') return value;
  return null;
}

function parseGuests(value: string | null): number {
  if (!value) return 1;
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isInteger(n)) return 1;
  return Math.max(1, Math.min(12, n));
}

function parseDate(value: string | null): string {
  if (!value) return '';
  return isValidISODate(value) ? value : '';
}

export function defaultSearchState(route: RouteIntent, locale: Locale): SearchState {
  return {
    location: route.route_id,
    startDate: '',
    endDate: '',
    yachtType: route.preselected_yacht_type ?? null,
    guests: 1,
    service: null,
    locale,
  };
}

export function getApplicableYachtTypes(route: RouteIntent): string[] {
  if (route.preselected_yacht_type) return [route.preselected_yacht_type];
  const types = route.catalogue_metrics?.yacht_type_distribution ?? {};
  return Object.entries(types)
    .filter(([, count]) => count > 0)
    .map(([type]) => type)
    .sort();
}

export function normalizeSearchState(
  input: URLSearchParams | Record<string, string>,
  fallbackRouteId: string,
  locale: Locale,
): SearchState {
  const params = input instanceof URLSearchParams ? input : new URLSearchParams(input);
  const submittedLocation = getQueryValue(params, SEARCH_PARAM_KEYS.location) || fallbackRouteId;
  const submittedRoute = getRouteById(submittedLocation);
  const fallback = getRouteById(fallbackRouteId);
  const ultimateFallback = getSearchableRoutes()[0];
  const effectiveRoute = submittedRoute && submittedRoute.disposition !== 'blocked'
    ? submittedRoute
    : fallback && fallback.disposition !== 'blocked'
      ? fallback
      : ultimateFallback;
  const applicable = effectiveRoute ? getApplicableYachtTypes(effectiveRoute) : [];

  return {
    location: effectiveRoute?.route_id ?? submittedLocation,
    startDate: parseDate(getQueryValue(params, SEARCH_PARAM_KEYS.startDate)),
    endDate: parseDate(getQueryValue(params, SEARCH_PARAM_KEYS.endDate)),
    yachtType: parseYachtType(getQueryValue(params, SEARCH_PARAM_KEYS.yachtType), applicable),
    guests: parseGuests(getQueryValue(params, SEARCH_PARAM_KEYS.guests)),
    service: parseService(getQueryValue(params, SEARCH_PARAM_KEYS.service)),
    locale,
  };
}

export function denormalizeSearchState(state: SearchState): URLSearchParams {
  const p = new URLSearchParams();
  p.set(SEARCH_PARAM_KEYS.location, state.location);
  if (state.startDate) p.set(SEARCH_PARAM_KEYS.startDate, state.startDate);
  if (state.endDate) p.set(SEARCH_PARAM_KEYS.endDate, state.endDate);
  if (state.yachtType) p.set(SEARCH_PARAM_KEYS.yachtType, state.yachtType);
  if (state.guests !== 1) p.set(SEARCH_PARAM_KEYS.guests, String(state.guests));
  if (state.service) p.set(SEARCH_PARAM_KEYS.service, state.service);
  p.sort();
  return p;
}

export function buildSearchURL(state: SearchState): string {
  const params = denormalizeSearchState(state);
  const qs = params.toString();
  return `/${state.locale}/yacht-search/${qs ? `?${qs}` : ''}`;
}

export function buildSearchAnalyticsPayload(state: SearchState): SearchAnalyticsPayload {
  const route = getRouteById(state.location);
  return {
    event: SEARCH_ANALYTICS_EVENT,
    locale: state.locale,
    route_id: state.location,
    page_family: route?.page_family ?? 'unknown',
    has_dates: Boolean(state.startDate && state.endDate),
    yacht_type: state.yachtType,
    guests: state.guests,
    service: state.service,
  };
}

export function validateSearchState(
  state: SearchState,
  minDate?: string,
  maxDate?: string,
): { ok: boolean; errors: string[]; status: 'complete' | 'incomplete' | 'invalid' } {
  const errors: string[] = [];

  const route = getRouteById(state.location);
  if (!route) {
    errors.push('location is not a known route');
  } else if (route.disposition === 'blocked') {
    errors.push('location is not available for search');
  } else {
    const applicable = getApplicableYachtTypes(route);
    if (state.yachtType && !applicable.includes(state.yachtType)) {
      errors.push(`yacht type ${state.yachtType} is not applicable for this route`);
    }
  }

  if (!SUPPORTED_LOCALES.includes(state.locale)) {
    errors.push(`unsupported locale ${state.locale}`);
  }

  if (state.service && !SUPPORTED_SERVICES.includes(state.service)) {
    errors.push(`unknown service ${state.service}`);
  }

  if (!Number.isInteger(state.guests) || state.guests < 1 || state.guests > 12) {
    errors.push('guests must be an integer between 1 and 12');
  }

  const hasStart = Boolean(state.startDate);
  const hasEnd = Boolean(state.endDate);

  if (hasStart !== hasEnd) {
    errors.push('both start and end dates must be provided');
  }

  if (hasStart && hasEnd) {
    if (!isSaturday(state.startDate)) {
      errors.push('departure date must be a Saturday');
    }
    if (state.startDate > state.endDate) {
      errors.push('start date must not be after end date');
    }
    if (minDate && state.startDate < minDate) {
      errors.push('start date is in the past');
    }
    if (maxDate && state.endDate > maxDate) {
      errors.push('end date is too far in the future');
    }
  }

  const status: 'complete' | 'incomplete' | 'invalid' = errors.length > 0
    ? 'invalid'
    : !hasStart && !hasEnd
      ? 'incomplete'
      : 'complete';

  return { ok: errors.length === 0, errors, status };
}
