import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
export const LOCALES = ['ru', 'ua', 'en'];

export const SEGMENT_TYPE = new Map([
  ['404.html', 'status'],
  ['blog', 'blog'],
  ['tags', 'tags'],
  ['team', 'team'],
  ['encyclopedia', 'encyclopedia'],
  ['cookie-policy', 'legal'],
  ['privacy-policy', 'legal'],
  ['refund-policy', 'legal'],
  ['payment-issue', 'status'],
  ['thank-you-page', 'status'],
  ['charter', 'service'],
  ['inshore-skipper-sail', 'service'],
  ['sailing-school', 'service'],
  ['yacht-delivery', 'service'],
  ['yacht-expertise', 'service'],
  ['charter-for-dummies', 'campaign'],
  ['yahting-dlya-vseh', 'campaign'],
  ['home', 'campaign'],
]);

export function normalizeRoute(input) {
  let s = String(input ?? '').trim().replace(/\\/g, '/');
  if (/^https?:\/\//i.test(s)) {
    try { s = new URL(s).pathname; } catch { /* ignore */ }
  }
  s = s.replace(/\/{2,}/g, '/');
  if (!s.startsWith('/') && s.includes('/')) {
    s = s.slice(s.indexOf('/') + 1);
  }
  if (s.endsWith('/index.html') || s === 'index.html') {
    s = s.endsWith('/index.html') ? s.slice(0, -'index.html'.length) : '/';
  }
  if (!s.startsWith('/')) s = '/' + s;
  if (s.endsWith('.html')) return s;
  if (s.length > 1 && !s.endsWith('/')) s += '/';
  return s;
}

export function detectDuplicateOwners(routes) {
  const dups = [];
  for (const [url, { owners }] of Object.entries(routes)) {
    if (owners.length > 1) dups.push({ url, owners });
  }
  return dups.sort((a, b) => a.url.localeCompare(b.url));
}

export function classify(url) {
  const parts = normalizeRoute(url).split('/').filter(Boolean);
  if (parts.length === 0) return 'root';
  const second = LOCALES.includes(parts[0]) ? parts[1] : parts[0];
  return SEGMENT_TYPE.get(second) || 'other';
}

export function isNoindex(url) {
  return classify(url) === 'status';
}

export function addRoute(routes, url, owner) {
  const normalized = normalizeRoute(url);
  if (!routes[normalized]) routes[normalized] = { owners: [], type: classify(normalized) };
  const r = routes[normalized];
  if (!r.owners.includes(owner)) r.owners.push(owner);
}

export async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}

let payloadCache = null;
export async function loadPayload() {
  if (!payloadCache) {
    payloadCache = JSON.parse(await readFile(join(ROOT, 'src/data/payload-content.json'), 'utf8'));
  }
  return payloadCache;
}

let legalCache = null;
export async function loadLegal() {
  if (!legalCache) {
    legalCache = JSON.parse(await readFile(join(ROOT, 'src/data/legal.json'), 'utf8'));
  }
  return legalCache;
}

export async function collectAstroRoutes(routes) {
  const pages = (await walk('src/pages')).filter((f) => f.endsWith('.astro'));
  for (const file of pages) {
    const rel = relative('src/pages', file).replace(/\\/g, '/');
    if (rel === '404.astro') continue;
    if (rel === 'index.astro') {
      addRoute(routes, '/', 'astro:src/pages/index.astro');
      continue;
    }
    if (rel === '[...path].astro') continue;

    const explicitMatch = rel.match(/^([ruaen]{2})\/([^/]+)\.astro$/);
    if (explicitMatch) {
      const [, locale, name] = explicitMatch;
      addRoute(routes, `/${locale}/${name}/`, `astro:src/pages/${rel}`);
      continue;
    }

    if (rel === '[locale]/blog/index.astro') {
      for (const locale of LOCALES) addRoute(routes, `/${locale}/blog/`, `astro:src/pages/${rel}`);
      continue;
    }
    if (rel === '[locale]/encyclopedia/index.astro') {
      for (const locale of LOCALES) addRoute(routes, `/${locale}/encyclopedia/`, `astro:src/pages/${rel}`);
      continue;
    }
    if (rel === '[locale]/tags/index.astro') {
      for (const locale of LOCALES) addRoute(routes, `/${locale}/tags/`, `astro:src/pages/${rel}`);
      continue;
    }
    if (rel === '[locale]/team/index.astro') {
      for (const locale of LOCALES) addRoute(routes, `/${locale}/team/`, `astro:src/pages/${rel}`);
      continue;
    }

    if (rel === '[locale]/blog/[slug].astro') {
      const payload = await loadPayload();
      for (const post of payload.entries.filter((e) => e.kind === 'post')) {
        addRoute(routes, post.route, `astro:src/pages/${rel}`);
      }
      continue;
    }
    if (rel === '[locale]/encyclopedia/[slug].astro') {
      const payload = await loadPayload();
      for (const term of payload.encyclopedia || []) {
        addRoute(routes, term.route, `astro:src/pages/${rel}`);
      }
      continue;
    }
    if (rel === '[locale]/tags/[slug].astro') {
      const payload = await loadPayload();
      for (const tag of payload.entries.filter((e) => e.kind === 'tag')) {
        addRoute(routes, tag.route, `astro:src/pages/${rel}`);
      }
      continue;
    }
    if (rel === '[locale]/team/[slug].astro') {
      const payload = await loadPayload();
      for (const author of payload.entries.filter((e) => e.kind === 'author')) {
        addRoute(routes, author.route, `astro:src/pages/${rel}`);
      }
      continue;
    }
  }
}

export async function collectLegalRoutes(routes) {
  const legal = await loadLegal();
  for (const [policy, locales] of Object.entries(legal)) {
    for (const locale of Object.keys(locales)) {
      addRoute(routes, `/${locale}/${policy}/`, 'data:src/data/legal.json');
    }
  }
}

export async function collectSitemapUrls() {
  const xml = await readFile(join(ROOT, 'public/sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => normalizeRoute(m[1]));
  return [...new Set(urls)].sort();
}
