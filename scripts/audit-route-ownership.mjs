import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const LOCALES = ['ru', 'ua', 'en'];

const CATCH_ALL_FILTER = /^(?:ru|ua|en)\/(?:home(?:\/|$)|charter(?:\/|$)|charter-for-dummies(?:\/|$)|yahting-dlya-vseh(?:\/|$)|sailing-school(?:\/|$)|inshore-skipper-sail(?:\/|$)|team\/[^/]+|blog(?:\/|$)|tags(?:\/|$)|cookie-policy|refund-policy|privacy-policy)/;

const SEGMENT_TYPE = new Map([
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

function classify(url) {
  const parts = url.split('/').filter(Boolean);
  if (parts.length === 0) return 'root';
  const second = ['ru', 'ua', 'en'].includes(parts[0]) ? parts[1] : parts[0];
  return SEGMENT_TYPE.get(second) || 'other';
}

function addRoute(routes, url, owner) {
  if (!routes[url]) routes[url] = { owners: [], type: classify(url) };
  const r = routes[url];
  if (!r.owners.includes(owner)) r.owners.push(owner);
}

async function walk(dir) {
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
async function loadPayload() {
  if (!payloadCache) {
    payloadCache = JSON.parse(await readFile(join(ROOT, 'src/data/payload-content.json'), 'utf8'));
  }
  return payloadCache;
}

async function collectAstroRoutes(routes) {
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
    if (rel === '[locale]/cookie-policy.astro') {
      for (const locale of LOCALES) addRoute(routes, `/${locale}/cookie-policy/`, `astro:src/pages/${rel}`);
      continue;
    }
    if (rel === '[locale]/privacy-policy.astro') {
      for (const locale of LOCALES) addRoute(routes, `/${locale}/privacy-policy/`, `astro:src/pages/${rel}`);
      continue;
    }
    if (rel === '[locale]/refund-policy.astro') {
      for (const locale of LOCALES) addRoute(routes, `/${locale}/refund-policy/`, `astro:src/pages/${rel}`);
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

async function collectSnapshotCatchAll(routes) {
  const files = (await walk('src/snapshots')).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const rel = relative('src/snapshots', file).replace(/\\/g, '/');
    let paramsPath;
    if (rel === '_root.html') {
      paramsPath = '';
    } else if (rel.endsWith('/index.html')) {
      paramsPath = rel.slice(0, -'/index.html'.length);
    } else {
      continue;
    }
    if (CATCH_ALL_FILTER.test(paramsPath)) continue;
    const url = paramsPath === '' ? '/' : `/${paramsPath}/`;
    addRoute(routes, url, 'astro:src/pages/[...path].astro');
  }
}

async function collectSitemapUrls() {
  const xml = await readFile(join(ROOT, 'public/sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => normalizeRoute(m[1]));
  return [...new Set(urls)].sort();
}

function sortObjectByKeys(obj) {
  const sorted = {};
  for (const key of Object.keys(obj).sort()) sorted[key] = obj[key];
  return sorted;
}

function buildReport(routes, sitemapUrls) {
  const nativeOrPayload = new Set();
  const allUrls = Object.keys(routes).sort();
  const sortedRoutes = {};
  for (const url of allUrls) {
    sortedRoutes[url] = routes[url];
    if (routes[url].owners.some((o) => o !== 'astro:src/pages/[...path].astro')) nativeOrPayload.add(url);
  }

  const conflicts = detectDuplicateOwners(routes);
  const missing = sitemapUrls.filter((u) => !nativeOrPayload.has(u));

  const byType = {};
  const byOwner = {};
  for (const url of allUrls) {
    const { type, owners } = routes[url];
    byType[type] = (byType[type] || 0) + 1;
    for (const owner of owners) byOwner[owner] = (byOwner[owner] || 0) + 1;
  }

  const summary = {
    total: allUrls.length,
    sitemap: sitemapUrls.length,
    byType: sortObjectByKeys(byType),
    byOwner: sortObjectByKeys(byOwner),
  };

  return { routes: sortedRoutes, conflicts, missing, summary };
}

async function main() {
  const routes = {};
  await collectAstroRoutes(routes);
  await collectSnapshotCatchAll(routes);
  const sitemapUrls = await collectSitemapUrls();
  const report = buildReport(routes, sitemapUrls);
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.conflicts.length > 0 || report.missing.length > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
