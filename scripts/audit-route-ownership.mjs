import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  normalizeRoute,
  detectDuplicateOwners,
  collectAstroRoutes,
  collectLegalRoutes,
  collectSnapshotCatchAll,
  collectSitemapUrls,
} from './catalog-routes.mjs';

const ROOT = process.cwd();

export { normalizeRoute, detectDuplicateOwners } from './catalog-routes.mjs';

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
  await collectLegalRoutes(routes);
  await collectSnapshotCatchAll(routes);
  const sitemapUrls = await collectSitemapUrls();
  const report = buildReport(routes, sitemapUrls);
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.conflicts.length > 0 || report.missing.length > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
