import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { collectAstroRoutes, collectLegalRoutes, isNoindex, loadLegal, loadPayload } from './catalog-routes.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

export async function generateSitemapUrls() {
  const routes = {};
  await collectAstroRoutes(routes);
  await collectLegalRoutes(routes);

  const urls = Object.keys(routes)
    .filter((url) => !isNoindex(url))
    .sort((a, b) => a.localeCompare(b));

  return [...new Set(urls)];
}

const routeLocale = (locale) => locale === 'uk' ? 'ua' : locale;
const hreflang = (locale) => locale === 'ua' || locale === 'uk' ? 'uk' : locale;
const xml = (value) => String(value).replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);

export async function generateSitemapEntries() {
  const urls = await generateSitemapUrls();
  const accepted = new Set(urls);
  const metadata = new Map();
  const groups = new Map();
  const assigned = new Set();
  const add = (group, route, locale, updatedAt) => {
    if (!accepted.has(route)) return;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ route, locale: routeLocale(locale) });
    assigned.add(route);
    if (updatedAt) metadata.set(route, { lastmod: String(updatedAt).slice(0, 10) });
  };

  const payload = await loadPayload();
  for (const entry of payload.entries || []) add(`payload:${entry.kind}:${entry.id}`, entry.route, entry.locale, entry.updatedAt);
  for (const entry of payload.encyclopedia || []) add(`encyclopedia:${entry.canonicalKey}`, entry.route, entry.locale, entry.updatedAt);

  const legal = await loadLegal();
  for (const [policy, locales] of Object.entries(legal)) {
    for (const locale of Object.keys(locales)) add(`legal:${policy}`, `/${locale}/${policy}/`, locale, locales[locale]?.updatedAt);
  }

  for (const route of urls) {
    if (assigned.has(route)) continue;
    const match = route.match(/^\/(ru|ua|en)\/(.+)$/);
    if (match) add(`static:${match[2]}`, route, match[1]);
  }

  const alternates = new Map();
  for (const members of groups.values()) {
    const unique = members.filter((member, index) => members.findIndex((candidate) => candidate.locale === member.locale) === index);
    if (unique.length < 2) continue;
    for (const member of unique) alternates.set(member.route, unique);
  }
  return urls.map((route) => ({ route, ...metadata.get(route), alternates: alternates.get(route) || [] }));
}

export function buildSitemapXml(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.map(({ route, lastmod, alternates = [] }) => `  <url>\n    <loc>https://navi.training${xml(route)}</loc>${lastmod ? `\n    <lastmod>${xml(lastmod)}</lastmod>` : ''}${alternates.map((alternate) => `\n    <xhtml:link rel="alternate" hreflang="${hreflang(alternate.locale)}" href="https://navi.training${xml(alternate.route)}" />`).join('')}\n  </url>`).join('\n')}\n</urlset>\n`;
}

export async function writeSitemap(entries) {
  const sitemap = buildSitemapXml(entries);
  await writeFile(join(root, 'public/sitemap.xml'), sitemap);
  return entries;
}

async function main() {
  const entries = await generateSitemapEntries();
  await writeSitemap(entries);
  console.log(`Generated sitemap: ${entries.length} routes`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
