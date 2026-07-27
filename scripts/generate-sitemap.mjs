import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { collectAstroRoutes, collectLegalRoutes, isNoindex } from './catalog-routes.mjs';

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

export function buildSitemapXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((route) => `  <url><loc>https://navi.training${route}</loc></url>`).join('\n')}\n</urlset>\n`;
}

export async function writeSitemap(urls) {
  const xml = buildSitemapXml(urls);
  await writeFile(join(root, 'public/sitemap.xml'), xml);
  return urls;
}

async function main() {
  const urls = await generateSitemapUrls();
  await writeSitemap(urls);
  console.log(`Generated sitemap: ${urls.length} routes`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
