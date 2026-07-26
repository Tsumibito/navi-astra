#!/usr/bin/env node
/**
 * Download external Baserow S3 assets referenced in src/data/pages/*.json
 * into public/media/ and rewrite the JSON paths to local /media/... URLs.
 * ponytail: one-shot idempotent script; sequential downloads to avoid S3 ECONNRESET.
 */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';

const TARGETS = [
  'src/data/pages/charter.json',
  'src/data/pages/school.json',
  'src/data/pages/inshore.json',
];
const OUT_DIR = 'public/media';
const REMOTE_RE = /^https:\/\/baserow-backend-production20240528124524339000000001\.s3\.amazonaws\.com\/user_files\/.+/;

function collect(obj, downloads) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && REMOTE_RE.test(v)) {
      const filename = basename(v);
      const dest = join(OUT_DIR, filename);
      downloads.push({ url: v, dest });
      obj[k] = `/media/${filename}`;
    } else if (v && typeof v === 'object') {
      collect(v, downloads);
    }
  }
}

async function fetchBuffer(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === retries - 1) throw new Error(`Failed to fetch ${url}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error('unreachable');
}

async function download(url, dest) {
  if (existsSync(dest)) return;
  const buf = await fetchBuffer(url);
  const tmp = `${dest}.tmp`;
  await writeFile(tmp, buf);
  await rename(tmp, dest);
  console.log(`Downloaded ${dest}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const downloads = [];
  for (const file of TARGETS) {
    const data = JSON.parse(await readFile(file, 'utf8'));
    collect(data, downloads);
    await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
    if (downloads.length) console.log(`Rewrote ${file}`);
  }
  for (const { url, dest } of downloads) {
    await download(url, dest);
  }
  console.log(`Done. ${downloads.length} assets in ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
