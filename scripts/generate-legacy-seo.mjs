import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const baselinePath = path.resolve(projectRoot, '../audit/baseline/pages.jsonl');
const targetPath = path.resolve(projectRoot, 'src/data/legacy-seo.json');

const lines = (await readFile(baselinePath, 'utf8')).split(/\r?\n/).filter(Boolean);
const seoByRoute = {};

for (const line of lines) {
  const page = JSON.parse(line);
  const pathname = new URL(page.url).pathname.replace(/\/+$/, '') || '/';
  if (!/^\/(?:ru|ua|en)\/(?:blog|tags)\//.test(pathname)) continue;
  if (!page.title || !page.description) continue;
  seoByRoute[pathname] = {
    title: page.title,
    description: page.description,
  };
}

const sorted = Object.fromEntries(Object.entries(seoByRoute).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(targetPath, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`Generated legacy SEO metadata for ${Object.keys(sorted).length} routes`);
