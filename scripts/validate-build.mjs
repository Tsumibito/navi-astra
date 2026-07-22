import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const snapshotsRoot = join(root, 'src/snapshots');
const distRoot = join(root, 'dist');
const maxCloudflareFileSize = 25 * 1024 * 1024;

const walk = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
};

const hash = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];
const snapshotFiles = (await walk(snapshotsRoot)).filter((file) => file.endsWith('.html'));
const sitemap = await readFile(join(root, 'public/sitemap.xml'), 'utf8');
const payloadContent = JSON.parse(await readFile(join(root, 'src/data/payload-content.json'), 'utf8'));
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const stats = { pages: snapshotFiles.length, posts: 0, ru: 0, ua: 0, en: 0, jsonLd: 0 };
let payloadCertificatePanels = 0;

for (const sourceFile of snapshotFiles) {
  const sourceRelative = relative(snapshotsRoot, sourceFile);
  const routeRelative = sourceRelative === '_root.html' ? 'index.html' : sourceRelative;
  const outputFile = join(distRoot, routeRelative);
  const source = await readFile(sourceFile);
  let output;
  try {
    output = await readFile(outputFile);
  } catch {
    errors.push(`Missing build route: ${routeRelative}`);
    continue;
  }

  if (hash(source) !== hash(output)) errors.push(`HTML changed during build: ${routeRelative}`);
  if (output.length >= maxCloudflareFileSize) errors.push(`Cloudflare 25 MiB limit exceeded: ${routeRelative}`);

  const html = source.toString('utf8');
  payloadCertificatePanels += (html.match(/data-payload-certificate=/g) || []).length;
  if (!/<title>.+?<\/title>/s.test(html)) errors.push(`Missing title: ${routeRelative}`);
  if (!/<meta name="description" content=".+?"/s.test(html)) errors.push(`Missing description: ${routeRelative}`);
  if (!/<link rel="canonical" href=".+?"/s.test(html)) errors.push(`Missing canonical: ${routeRelative}`);
  if (!/type="application\/ld\+json"/.test(html)) errors.push(`Missing JSON-LD: ${routeRelative}`);
  else stats.jsonLd++;
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); }
    catch { errors.push(`Invalid JSON-LD: ${routeRelative}`); }
  }
  if (/https:\/\/navi\.training\/(?:assets|cgi)\//.test(html)) {
    errors.push(`Production-domain asset dependency: ${routeRelative}`);
  }
  if (!html.includes('/navi-runtime.js')
      || (!html.includes('/navi-runtime.css') && !html.includes('<style data-navi-runtime>'))) {
    errors.push(`Missing Astro interaction runtime: ${routeRelative}`);
  }

  if (sourceRelative.startsWith('ru/')) {
    stats.ru++;
    if (!/<html lang="ru-RU"/.test(html)) errors.push(`Wrong RU html lang: ${routeRelative}`);
  }
  if (sourceRelative.startsWith('ua/')) {
    stats.ua++;
    if (!/<html lang="uk-UA"/.test(html)) errors.push(`Wrong UA html lang: ${routeRelative}`);
  }
  if (sourceRelative.startsWith('en/')) {
    stats.en++;
    if (!/<html lang="en"/.test(html)) errors.push(`Wrong EN html lang: ${routeRelative}`);
  }
  if (/^(ru|ua|en)\/blog\/.+\/index\.html$/.test(sourceRelative)) {
    stats.posts++;
    for (const hreflang of ['ru', 'uk', 'en', 'x-default']) {
      if (!new RegExp(`hreflang="${hreflang}"`).test(html)) {
        errors.push(`Missing ${hreflang} hreflang: ${routeRelative}`);
      }
    }
  }
}

if (payloadCertificatePanels !== 27) errors.push(`Payload certificate SSG panels: ${payloadCertificatePanels}/27`);

if (snapshotFiles.length < sitemapUrls.length) {
  errors.push(`Sitemap routes missing from snapshots: ${sitemapUrls.length}/${snapshotFiles.length}`);
}

for (const route of ['ru/privacy-policy', 'ru/cookie-policy', 'ua/privacy-policy', 'ua/cookie-policy', 'en/privacy-policy', 'en/cookie-policy']) {
  if (!snapshotFiles.some((file) => relative(snapshotsRoot, file) === `${route}/index.html`)) errors.push(`Missing policy route: ${route}`);
}

for (const locale of ['ru', 'ua']) {
  const faqHtml = await readFile(join(snapshotsRoot, locale, 'sailing-school', 'index.html'), 'utf8');
  const triggerCount = (faqHtml.match(/w-item-trigger/g) || []).length;
  const answerCount = (faqHtml.match(/class="navi-faq-answer"/g) || []).length;
  if (triggerCount !== 5 || answerCount !== 5) errors.push(`Incomplete ${locale.toUpperCase()} sailing-school FAQ: ${answerCount}/${triggerCount}`);
}

for (const entry of payloadContent.entries.filter((item) => ['post', 'tag'].includes(item.kind) && item.faqs?.length)) {
  const faqFile = join(snapshotsRoot, entry.route, 'index.html');
  const faqHtml = await readFile(faqFile, 'utf8');
  const renderedFaqs = (faqHtml.match(/<details><summary>/g) || []).length;
  if (!faqHtml.includes('class="navi-payload-faq"') || renderedFaqs < entry.faqs.length) {
    errors.push(`Missing Payload FAQ block: ${entry.route} (${renderedFaqs}/${entry.faqs.length})`);
  }
  if (!faqHtml.includes('id="navi-payload-faq-jsonld"')) errors.push(`Missing FAQPage schema: ${entry.route}`);
}

for (const term of payloadContent.encyclopedia || []) {
  const termHtml = await readFile(join(distRoot, term.route, 'index.html'), 'utf8');
  if (!/<aside class="reading"[^>]*>[\s\S]*?<a href="\/(?:ru|ua|en)\/blog\//.test(termHtml)) {
    errors.push(`Missing encyclopedia recommended article: ${term.route}`);
  }
}

for (const locale of ['ru', 'ua', 'en']) {
  const schoolHtml = await readFile(join(snapshotsRoot, locale, 'sailing-school', 'index.html'), 'utf8');
  const visibleSchool = schoolHtml.split('window.__remixContext')[0];
  const schoolPosts = (visibleSchool.match(new RegExp(`href="/${locale}/blog/`, 'g')) || []).length;
  if (schoolPosts < 3) errors.push(`Missing ${locale.toUpperCase()} sailing-school article cards: ${schoolPosts}/3`);
  const certificatePanels = (schoolHtml.match(/role="tabpanel"/g) || []).length;
  if (certificatePanels !== 7) errors.push(`Incomplete ${locale.toUpperCase()} certificate tabs: ${certificatePanels}/7`);
  const courseHtml = await readFile(join(snapshotsRoot, locale, 'inshore-skipper-sail', 'index.html'), 'utf8');
  const coursePanels = (courseHtml.match(/role="tabpanel"/g) || []).length;
  if (coursePanels < 4) errors.push(`Incomplete ${locale.toUpperCase()} course programme tabs: ${coursePanels}/4`);
  if ((courseHtml.match(/class="navi-practice-program"/g) || []).length !== 1) errors.push(`Invalid ${locale.toUpperCase()} sea-practice programme`);
  if ((courseHtml.match(/data-payload-certificate=/g) || []).length !== 2) errors.push(`Incomplete ${locale.toUpperCase()} course certificates`);
}

const tagCardCounts = {};
for (const locale of ['ru', 'ua', 'en']) {
  const tagRoot = join(snapshotsRoot, locale, 'tags');
  for (const entry of await readdir(tagRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const tagHtml = await readFile(join(tagRoot, entry.name, 'index.html'), 'utf8');
    tagCardCounts[entry.name] ||= {};
    const visibleTag = tagHtml.split('window.__remixContext')[0];
    tagCardCounts[entry.name][locale] = (visibleTag.match(new RegExp(`href="/${locale}/blog/`, 'g')) || []).length;
  }
}
for (const [tag, counts] of Object.entries(tagCardCounts)) {
  if (new Set([counts.ru, counts.ua, counts.en]).size !== 1) {
    errors.push(`Localized tag card mismatch ${tag}: RU ${counts.ru}, UA ${counts.ua}, EN ${counts.en}`);
  }
}
if (!tagCardCounts['sailing-training']?.en) errors.push('English sailing-training has no article cards');

for (const required of ['sitemap.xml', 'robots.txt', '_headers', '_redirects', 'navi-runtime.js', 'navi-runtime.css']) {
  try { await stat(join(distRoot, required)); }
  catch { errors.push(`Missing Cloudflare output file: ${required}`); }
}

for (const route of ['404.html', 'ru/thank-you-page/index.html', 'ua/thank-you-page/index.html', 'en/thank-you-page/index.html']) {
  try {
    const html = await readFile(join(distRoot, route), 'utf8');
    if (!/<meta name="robots" content="noindex, nofollow"/.test(html)) errors.push(`Missing noindex: ${route}`);
    if (!/<h1[\s>]/.test(html)) errors.push(`Missing status-page heading: ${route}`);
  } catch {
    errors.push(`Missing status route: ${route}`);
  }
}

if (errors.length) {
  console.error(`Validation failed (${errors.length}):\n${errors.join('\n')}`);
  process.exit(1);
}

console.log('Navi Astro validation passed:', stats);
