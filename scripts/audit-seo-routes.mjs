import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const distRoot = join(root, 'dist');

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function routeForFile(file) {
  const rel = relative(distRoot, file).replaceAll('\\', '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'/index.html'.length)}/`;
  if (rel.endsWith('.html')) return `/${rel}`;
  return null;
}

function pagePath(pathname) {
  if (pathname === '/') return '/';
  if (/\.[a-z0-9]{2,8}$/i.test(pathname)) return null;
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function parseRedirects(source) {
  const redirects = new Map();
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const [from, to, status] = line.split(/\s+/);
    if (!from || !to || !['301', '308'].includes(status)) continue;
    redirects.set(from, to);
  }
  return redirects;
}

export async function auditSeoRoutes() {
  const issues = new Map();
  const addIssue = (kind, target, source = '') => {
    const key = `${kind}: ${target}`;
    if (!issues.has(key)) issues.set(key, new Set());
    if (source) issues.get(key).add(source);
  };
  const htmlFiles = (await walk(distRoot)).filter((file) => file.endsWith('.html'));
  const routes = new Map(htmlFiles.map((file) => [routeForFile(file), file]).filter(([route]) => route));
  const redirects = parseRedirects(await readFile(join(distRoot, '_redirects'), 'utf8'));
  const sitemap = await readFile(join(distRoot, 'sitemap.xml'), 'utf8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);

  for (const route of sitemapUrls) {
    if (!routes.has(route)) addIssue('Sitemap target is missing', route);
    if (redirects.has(route) || redirects.has(route.replace(/\/$/, ''))) {
      addIssue('Sitemap target redirects', route);
    }
  }

  for (const [sourceRoute, file] of routes) {
    if (/^\/draft\/(?:ru|ua|en)\/test\//.test(sourceRoute)) continue;
    const html = await readFile(file, 'utf8');
    for (const match of html.matchAll(/<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')[^>]*>/gi)) {
      const href = match[1] ?? match[2] ?? '';
      if (!href || /^(?:#|mailto:|tel:|javascript:)/i.test(href)) continue;
      let url;
      try { url = new URL(href, 'https://navi.training'); } catch { continue; }
      if (!['navi.training', 'www.navi.training'].includes(url.hostname)) continue;
      if (url.pathname.startsWith('/cdn-cgi/')) continue;
      const targetRoute = pagePath(url.pathname);
      if (!targetRoute) continue;
      const redirect = redirects.get(url.pathname) ?? redirects.get(targetRoute);
      if (redirect) {
        addIssue('Internal link redirects', url.pathname, sourceRoute);
        continue;
      }
      if (!routes.has(targetRoute)) addIssue('Internal link is missing', url.pathname, sourceRoute);
      else if (url.pathname !== targetRoute) addIssue('Internal link is not canonical', url.pathname, sourceRoute);
    }
  }

  for (const [from, to] of redirects) {
    if (!to.startsWith('/')) continue;
    const target = pagePath(new URL(to, 'https://navi.training').pathname);
    if (target && !routes.has(target)) addIssue('Redirect target is missing', to, from);
  }

  return [...issues.entries()].map(([message, sources]) => {
    const examples = [...sources].sort().slice(0, 3);
    const suffix = sources.size ? ` (${sources.size} source${sources.size === 1 ? '' : 's'}; e.g. ${examples.join(', ')})` : '';
    return `${message}${suffix}`;
  }).sort();
}

async function main() {
  const errors = await auditSeoRoutes();
  if (errors.length) {
    console.error(`SEO route audit failed (${errors.length}):\n${errors.join('\n')}`);
    process.exit(1);
  }
  console.log('SEO route audit passed: sitemap and internal links resolve directly to canonical pages.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
