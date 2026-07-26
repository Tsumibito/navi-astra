import legacySeo from '../data/legacy-seo.json';

const normalizeRoute = (route = '/') => {
  const pathname = route.startsWith('http') ? new URL(route).pathname : route;
  return pathname.replace(/\/+$/, '') || '/';
};

const isUsableMetadata = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  const normalized = value.trim().toLowerCase();
  return !/^(?:undefined|null)(?:\s*\||$)/.test(normalized);
};

export function resolveLegacySeo(route, fallback = {}) {
  const legacy = legacySeo[normalizeRoute(route)];
  return {
    title: isUsableMetadata(legacy?.title)
      ? legacy.title
      : (fallback.title || 'Navi.training'),
    description: isUsableMetadata(legacy?.description)
      ? legacy.description
      : (fallback.description || ''),
  };
}
