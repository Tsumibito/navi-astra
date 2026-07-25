#!/usr/bin/env node
/**
 * Generate .webp variants for public images and a dimensions manifest.
 * Runs as `npm run prebuild`; webp files live in public/ but are git-ignored.
 */
import { readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, extname, relative } from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = 'public';
const MANIFEST = 'src/data/image-dims.json';

const exts = new Set(['.jpg', '.jpeg', '.png']);

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'fonts') continue;
      yield* walk(path);
    } else if (exts.has(extname(entry.name).toLowerCase())) {
      yield path;
    }
  }
}

async function main() {
  const dims = Object.create(null);
  const images = [];
  for await (const path of walk(PUBLIC_DIR)) images.push(path);

  await mkdir(dirname(MANIFEST), { recursive: true });

  for (const path of images) {
    const base = path.replace(/\.[^.]+$/, '');
    const out = `${base}.webp`;
    const publicUrl = `/${relative(PUBLIC_DIR, path)}`;
    const webpUrl = `/${relative(PUBLIC_DIR, out)}`;

    let needs = true;
    try {
      const [inStat, outStat] = await Promise.all([stat(path), stat(out)]);
      needs = inStat.mtimeMs > outStat.mtimeMs;
    } catch {
      needs = true;
    }

    const meta = await sharp(path).rotate().metadata();
    dims[publicUrl] = { width: meta.width, height: meta.height, webp: webpUrl };

    if (needs) {
      await sharp(path).rotate().webp({ quality: 85, effort: 4 }).toFile(out);
      console.log(`Generated ${webpUrl}`);
    } else {
      console.log(`Skipped  ${webpUrl}`);
    }
  }

  await writeFile(MANIFEST, JSON.stringify(dims, null, 2) + '\n', 'utf-8');
  console.log(`Manifest written to ${MANIFEST} (${images.length} images)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
