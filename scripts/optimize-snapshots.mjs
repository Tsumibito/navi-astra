import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimizePageHtml } from './optimize-page-html.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const snapshotsRoot = join(root, 'src/snapshots');
const runtimeSource = await readFile(join(root, 'public/navi-runtime.js'), 'utf8');
const runtimeStyles = await readFile(join(root, 'public/navi-runtime.css'), 'utf8');

const walk = async (directory) => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
}))).flat();

let changed = 0;
for (const file of (await walk(snapshotsRoot)).filter((path) => path.endsWith('.html'))) {
  const source = await readFile(file, 'utf8');
  const route = relative(snapshotsRoot, file).replace(/\/index\.html$/, '').replace('_root.html', '');
  const optimized = optimizePageHtml(source, route, { runtimeSource, runtimeStyles });
  if (optimized === source) continue;
  await writeFile(file, optimized);
  changed += 1;
}

console.log(`Optimized ${changed} snapshots.`);
