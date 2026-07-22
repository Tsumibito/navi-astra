import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const snapshotsRoot = join(root, 'src/snapshots');
const payload = JSON.parse(await readFile(join(root, 'src/data/payload-content.json'), 'utf8'));
const activeTeamRoutes = new Set((payload.entries || [])
  .filter((entry) => entry.kind === 'author')
  .map((entry) => entry.route.endsWith('/') ? entry.route : `${entry.route}/`));

const walk = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
};

const snapshotRoutes = (await walk(snapshotsRoot))
  .filter((file) => file.endsWith('.html'))
  .map((file) => relative(snapshotsRoot, file))
  .map((route) => route === '_root.html' ? '/' : `/${route.replace(/\/index\.html$/, '/')}`);
const generatedRoutes = [
  '/ru/yacht-delivery/',
  '/ru/yacht-expertise/',
  '/ua/yacht-delivery/',
  '/ua/yacht-expertise/',
  '/en/yacht-delivery/',
  '/en/yacht-expertise/',
  ...['ru', 'ua', 'en'].map((locale) => `/${locale}/encyclopedia/`),
  ...(payload.encyclopedia || []).map((entry) => entry.route.endsWith('/') ? entry.route : `${entry.route}/`),
];
const routes = [...new Set([...snapshotRoutes, ...generatedRoutes])]
  .filter((route) => !/thank-you-page|404\.html/.test(route))
  .filter((route) => !/^\/(ru|ua|en)\/team\//.test(route) || activeTeamRoutes.has(route))
  .sort();
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>https://navi.training${route}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(join(root, 'public/sitemap.xml'), xml);
console.log(`Generated sitemap: ${routes.length} routes`);
