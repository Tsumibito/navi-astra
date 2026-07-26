#!/usr/bin/env node
/**
 * Download external Baserow S3 assets referenced in src/data/pages/*.json
 * into public/media/ and rewrite JSON/HTML paths to local /media/... URLs.
 * Also snapshot landing HTML: strip runtime __remixContext resources and
 * save the original context to public/data/ for reference.
 * ponytail: one-shot idempotent script; sequential downloads to avoid S3 ECONNRESET.
 */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';

const DATA_PAGES = [
  'src/data/pages/charter.json',
  'src/data/pages/school.json',
  'src/data/pages/inshore.json',
];
const SNAPSHOT_PAGES = [
  'src/data/pages/charter-for-dummies-ru.json',
  'src/data/pages/charter-for-dummies-ua.json',
  'src/data/pages/yahting-dlya-vseh-ru.json',
];
const OUT_DIR = 'public/media';
const DATA_DIR = 'public/data';
const BASEROW_RE = /https:\/\/baserow-backend-production20240528124524339000000001\.s3\.amazonaws\.com\/user_files\/[^"'\s)]+/g;

function resolveLocal(url) {
  return `/media/${basename(url)}`;
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

function collect(obj, downloads) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && BASEROW_RE.test(v)) {
      downloads.add(v);
      obj[k] = resolveLocal(v);
    } else if (v && typeof v === 'object') {
      collect(v, downloads);
    }
  }
}

async function processDataPages(downloads) {
  for (const file of DATA_PAGES) {
    const data = JSON.parse(await readFile(file, 'utf8'));
    collect(data, downloads);
    await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }
}

async function processSnapshots(downloads) {
  await mkdir(DATA_DIR, { recursive: true });
  for (const file of SNAPSHOT_PAGES) {
    const data = JSON.parse(await readFile(file, 'utf8'));
    if (typeof data.body !== 'string') continue;
    let body = data.body;

    // 1. Localize baserow S3 images in HTML body.
    const seen = new Set();
    body = body.replace(BASEROW_RE, (url) => {
      if (!seen.has(url)) {
        seen.add(url);
        downloads.add(url);
      }
      return resolveLocal(url);
    });

    // 2. Remove __remixContext runtime loader (content is already prerendered).
    const contextMatch = body.match(/<script>window\.__remixContext\s*=\s*({[\s\S]*?});?<\/script>/);
    if (contextMatch) {
      const contextName = basename(file).replace(/\.json$/, '-context');
      const contextFile = `${DATA_DIR}/${contextName}.json`;
      if (!existsSync(contextFile)) {
        await writeFile(contextFile, JSON.stringify(JSON.parse(contextMatch[1]), null, 2) + '\n', 'utf8');
        console.log(`Saved ${contextFile}`);
      }
      body = body.replace(/<script>window\.__remixContext\s*=\s*{[\s\S]*?};?<\/script>/, '<script>window.__remixContext={"state":{"loaderData":{}}};</script>');
    }

    // 3. Drop baserow preconnect (no runtime calls left).
    body = body.replace(/<link rel="preconnect" href="https:\/\/baserow-backend-[^"]+" crossorigin\/?>/g, '');

    if (body !== data.body) {
      data.body = body;
      await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Rewrote ${file}`);
    }
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const downloads = new Set();
  await processDataPages(downloads);
  await processSnapshots(downloads);
  for (const url of downloads) {
    await download(url, join(OUT_DIR, basename(url)));
  }
  console.log(`Done. ${downloads.size} unique assets in ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
