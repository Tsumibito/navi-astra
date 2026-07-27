import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeRoute, classify } from './catalog-routes.mjs';
import { generateSitemapUrls } from './generate-sitemap.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
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

function distRoute(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'/index.html'.length)}/`;
  if (rel.endsWith('.html')) return `/${rel}`;
  return null;
}

function localeFromRoute(route) {
  const first = route.split('/').filter(Boolean)[0];
  if (first === 'ua') return 'ua';
  if (first === 'en') return 'en';
  return 'ru';
}

export function validateCanonical(html, route) {
  const errors = [];
  const canonicalMatches = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
  const expectedCanonical = route === '/' ? 'https://navi.training/' : `https://navi.training${route.replace(/\/$/, '')}/`;
  if (canonicalMatches.length !== 1 || canonicalMatches[0]?.[1] !== expectedCanonical) {
    errors.push(`Invalid canonical: ${route}`);
  }

  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const searchMetadata = [...head.matchAll(/<(?:link|meta)\b[^>]*(?:canonical|alternate|og:url)[^>]*>/gi)]
    .map((match) => match[0])
    .join('\n');
  if (/__astro_collection_retry=/.test(searchMetadata)) errors.push(`Retry query leaked into metadata: ${route}`);
  return errors;
}

export function validateMissingRoutes(expectedSet, distSet) {
  const errors = [];
  for (const route of expectedSet) {
    if (!distSet.has(route)) {
      const file = route === '/' ? 'index.html' : `${route.replace(/^\//, '').replace(/\/$/, '')}/index.html`;
      errors.push(`Missing build route: ${file}`);
    }
  }
  return errors;
}

export function validateJsonLd(html, route) {
  const errors = [];
  if (!/type="application\/ld\+json"/.test(html)) {
    errors.push(`Missing JSON-LD: ${route}`);
  } else {
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(match[1]); }
      catch { errors.push(`Invalid JSON-LD: ${route}`); }
    }
  }
  return errors;
}

export function validateTagCards(actual, expected, route) {
  if (actual !== expected) {
    return [`Tag card count mismatch: ${route} (actual ${actual}, expected ${expected})`];
  }
  return [];
}

export function validateEnSailingTraining(cards) {
  if (cards == null || cards === 0) {
    return ['English sailing-training has no article cards'];
  }
  return [];
}

function validatePage(html, route, size) {
  const errors = [];
  const locale = localeFromRoute(route);

  if (size >= maxCloudflareFileSize) errors.push(`Cloudflare 25 MiB limit exceeded: ${route}`);
  if (!/<title>.+?<\/title>/s.test(html)) errors.push(`Missing title: ${route}`);
  if (!/<meta name="description" content=".+?"/s.test(html)) errors.push(`Missing description: ${route}`);

  errors.push(...validateCanonical(html, route));

  if (/jquery-latest\.min\.js/.test(html)) errors.push(`Legacy jQuery leaked into output: ${route}`);

  const htmlWithoutSocialImages = html.replace(/<meta[^>]*(?:property="og:image"|name="twitter:image")[^>]*>/g, '');
  if (/https:\/\/navi\.training\/(?:assets|cgi)\//.test(htmlWithoutSocialImages)) {
    errors.push(`Production-domain asset dependency: ${route}`);
  }

  errors.push(...validateJsonLd(html, route));

  if (/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/.test(html)) {
    errors.push(`Indexable page is noindex: ${route}`);
  }

  if (locale === 'ru' && !/<html lang="ru[^"]*"/.test(html)) errors.push(`Wrong RU html lang: ${route}`);
  if (locale === 'ua' && !/<html lang="uk[^"]*"/.test(html)) errors.push(`Wrong UA html lang: ${route}`);
  if (locale === 'en' && !/<html lang="en[^"]*"/.test(html)) errors.push(`Wrong EN html lang: ${route}`);

  const type = classify(route);
  const visible = html;
  if ((type === 'service' || type === 'campaign') && visible.includes('/navi-runtime.js')) {
    errors.push(`Native service/campaign includes runtime: ${route}`);
  }

  if (/^\/(ru|ua|en)\/blog\/.+\/$/.test(route)) {
    for (const hreflang of ['ru', 'uk', 'en', 'x-default']) {
      if (!new RegExp(`hreflang="${hreflang}"`).test(html)) {
        errors.push(`Missing ${hreflang} hreflang: ${route}`);
      }
    }
  }

  if (/^\/(ru|ua|en)\/encyclopedia\/.+\/$/.test(route)) {
    for (const hreflang of ['ru', 'uk', 'en', 'x-default']) {
      if (!new RegExp(`hreflang="${hreflang}"`).test(html)) {
        errors.push(`Missing ${hreflang} encyclopedia hreflang: ${route}`);
      }
    }
  }

  return errors;
}

function canonicalFooter(html) {
  return html.match(/<footer class="navi-evo-footer"[\s\S]*?<\/footer>/)?.[0]
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ');
}

async function runValidation() {
  const errors = [];
  const expectedUrls = await generateSitemapUrls();
  const expectedSet = new Set(expectedUrls);

  const sitemapXml = await readFile(join(root, 'public/sitemap.xml'), 'utf8');
  const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => normalizeRoute(match[1]));
  const sitemapSet = new Set(sitemapUrls);

  for (const route of expectedUrls) {
    if (!sitemapSet.has(route)) errors.push(`Missing sitemap route: ${route}`);
  }
  for (const route of sitemapUrls) {
    if (!expectedSet.has(route)) errors.push(`Sitemap contains non-indexable URL: ${route}`);
  }

  const distFiles = (await walk(distRoot)).filter((file) => file.endsWith('.html'));
  const distRoutes = new Map();
  for (const file of distFiles) {
    const route = distRoute(relative(distRoot, file));
    if (route) distRoutes.set(route, file);
  }
  const distSet = new Set(distRoutes.keys());

  errors.push(...validateMissingRoutes(expectedSet, distSet));

  const stats = { pages: distFiles.length, posts: 0, ru: 0, ua: 0, en: 0, jsonLd: 0 };
  let payloadCertificatePanels = 0;

  for (const route of expectedUrls) {
    const file = distRoutes.get(route);
    if (!file) continue;
    const buf = await readFile(file);
    const html = buf.toString('utf8');
    const visible = html;

    payloadCertificatePanels += (visible.match(/data-payload-certificate=/g) || []).length;
    if (/type="application\/ld\+json"/.test(html)) stats.jsonLd++;
    const locale = localeFromRoute(route);
    if (locale === 'ru') stats.ru++;
    if (locale === 'ua') stats.ua++;
    if (locale === 'en') stats.en++;

    errors.push(...validatePage(html, route, buf.length));
  }

  if (payloadCertificatePanels !== 27) errors.push(`Payload certificate SSG panels: ${payloadCertificatePanels}/27`);

  for (const locale of ['ru', 'ua', 'en']) {
    const school = await readFile(join(distRoot, locale, 'sailing-school', 'index.html'), 'utf8');
    const delivery = await readFile(join(distRoot, locale, 'yacht-delivery', 'index.html'), 'utf8');
    if (!canonicalFooter(school) || canonicalFooter(school) !== canonicalFooter(delivery)) {
      errors.push(`Shared footer mismatch: ${locale}/sailing-school vs ${locale}/yacht-delivery`);
    }
    if ((delivery.match(/astro-photo-strip__image/g) || []).length < 12) {
      errors.push(`Missing shared photo strip: ${locale}/yacht-delivery`);
    }
  }

  for (const locale of ['ru', 'ua', 'en']) {
    const teamIndex = await readFile(join(distRoot, locale, 'team', 'index.html'), 'utf8');
    if (!/<h1[^>]*>/.test(teamIndex)) errors.push(`Missing team index heading: ${locale}`);
    const blogIndex = await readFile(join(distRoot, locale, 'blog', 'index.html'), 'utf8');
    if (!/<h1[^>]*>/.test(blogIndex)) errors.push(`Missing blog index heading: ${locale}`);
  }

  const payloadContent = JSON.parse(await readFile(join(root, 'src/data/payload-content.json'), 'utf8'));

  for (const author of payloadContent.entries.filter((entry) => entry.kind === 'author')) {
    const authorHtml = await readFile(join(distRoot, author.route, 'index.html'), 'utf8');
    if (authorHtml.includes('undefined')) errors.push(`Undefined value in team profile: ${author.route}`);
    if (!/"@type":"ProfilePage"/.test(authorHtml)) errors.push(`Missing ProfilePage JSON-LD: ${author.route}`);
    if (!/<h1[^>]*>/.test(authorHtml)) errors.push(`Missing team profile heading: ${author.route}`);
  }

  for (const post of payloadContent.entries.filter((entry) => entry.kind === 'post')) {
    const postHtml = await readFile(join(distRoot, post.route, 'index.html'), 'utf8');
    if (postHtml.includes('undefined')) errors.push(`Undefined value in blog post: ${post.route}`);
    if (!/"@type":(?:"BlogPosting"|\[[^\]]*"BlogPosting")/.test(postHtml)) {
      errors.push(`Missing BlogPosting JSON-LD: ${post.route}`);
    }
    if (!/<h1[^>]*>/.test(postHtml)) errors.push(`Missing blog post heading: ${post.route}`);
    if (!/<title>[^<]+<\/title>/.test(postHtml)) errors.push(`Missing blog post title: ${post.route}`);
    if (!/<meta name="description"/.test(postHtml)) errors.push(`Missing blog post description: ${post.route}`);
    stats.posts++;
  }

  for (const term of payloadContent.encyclopedia || []) {
    const termHtml = await readFile(join(distRoot, term.route, 'index.html'), 'utf8');
    if (!/type="application\/ld\+json"[^>]*>[\s\S]*?"@type":"DefinedTerm"/.test(termHtml)) {
      errors.push(`Missing encyclopedia DefinedTerm JSON-LD: ${term.route}`);
    }
    if (!/<aside class="reading"[^>]*>[\s\S]*?<a href="\/(?:ru|ua|en)\/blog\//.test(termHtml)) {
      errors.push(`Missing encyclopedia recommended article: ${term.route}`);
    }
  }

  for (const entry of payloadContent.entries.filter((item) => item.kind === 'post' && item.faqs?.length)) {
    const faqHtml = await readFile(join(distRoot, entry.route, 'index.html'), 'utf8');
    const visible = faqHtml;
    if (!visible.includes('class="navi-payload-faq"')) errors.push(`Missing Payload FAQ block: ${entry.route}`);
    const renderedFaqs = (visible.match(/<details class="navi-payload-faq__item"/g) || []).length;
    if (renderedFaqs < entry.faqs.length) {
      errors.push(`Missing Payload FAQ items: ${entry.route} (${renderedFaqs}/${entry.faqs.length})`);
    }
    if (!/"@type":"FAQPage"/.test(visible)) errors.push(`Missing FAQPage JSON-LD: ${entry.route}`);
  }

  for (const locale of ['ru', 'ua']) {
    const faqHtml = await readFile(join(distRoot, locale, 'sailing-school', 'index.html'), 'utf8');
    const visible = faqHtml;
    const triggerCount = (visible.match(/class="navi-faq__item"/g) || []).length;
    const answerCount = (visible.match(/class="navi-faq__answer"/g) || []).length;
    if (triggerCount !== 5 || answerCount !== 5) errors.push(`Incomplete ${locale.toUpperCase()} sailing-school FAQ: ${answerCount}/${triggerCount}`);
  }

  for (const locale of ['ru', 'ua', 'en']) {
    const schoolHtml = await readFile(join(distRoot, locale, 'sailing-school', 'index.html'), 'utf8');
    const visibleSchool = schoolHtml;
    const schoolPosts = (visibleSchool.match(new RegExp(`href="/${locale}/blog/`, 'g')) || []).length;
    if (schoolPosts < 3) errors.push(`Missing ${locale.toUpperCase()} sailing-school article cards: ${schoolPosts}/3`);
    const certificatePanels = (visibleSchool.match(/role="tabpanel"/g) || []).length;
    if (certificatePanels !== 7) errors.push(`Incomplete ${locale.toUpperCase()} certificate tabs: ${certificatePanels}/7`);
  }

  for (const locale of ['ru', 'ua']) {
    const courseHtml = await readFile(join(distRoot, locale, 'inshore-skipper-sail', 'index.html'), 'utf8');
    const visibleCourse = courseHtml;
    const coursePanels = (visibleCourse.match(/class="in-program__panel"/g) || []).length;
    if (coursePanels < 2) errors.push(`Incomplete ${locale.toUpperCase()} course programme tabs: ${coursePanels}/2`);
    if (!visibleCourse.includes('data-program-panel="practice"')) errors.push(`Missing ${locale.toUpperCase()} sea-practice programme`);
    const courseCerts = (visibleCourse.match(/data-payload-certificate=/g) || []).length;
    if (courseCerts !== 2) errors.push(`Incomplete ${locale.toUpperCase()} course certificates: ${courseCerts}/2`);
  }

  let enSailingTrainingCards = null;
  for (const tag of payloadContent.entries.filter((e) => e.kind === 'tag')) {
    const pageLocale = tag.locale === 'uk' ? 'ua' : tag.locale;
    const tagFile = join(distRoot, tag.route.replace(/^\/+|\/+$/g, ''), 'index.html');
    const tagHtml = await readFile(tagFile, 'utf8');
    const visibleTag = tagHtml;
    const actual = (visibleTag.match(new RegExp(`<article class="navi-blog-card"[\\s\\S]*?<a href="/${pageLocale}/blog/`, 'g')) || []).length;
    const expected = (payloadContent.entries || [])
      .filter((e) => e.kind === 'post' && e.locale === tag.locale && (e.tags || []).some((t) => t?.value?.id === tag.id))
      .length;
    errors.push(...validateTagCards(actual, expected, tag.route));
    if (tag.locale === 'en' && tag.route?.endsWith('/sailing-training/')) enSailingTrainingCards = actual;
  }
  errors.push(...validateEnSailingTraining(enSailingTrainingCards));

  for (const required of ['sitemap.xml', 'robots.txt', '_headers', '_redirects', 'navi-runtime.css']) {
    try { await stat(join(distRoot, required)); }
    catch { errors.push(`Missing Cloudflare output file: ${required}`); }
  }

  try { await stat(join(distRoot, 'navi-runtime.js')); errors.push('dist/navi-runtime.js should not exist'); }
  catch {}

  for (const route of ['404.html', 'ru/thank-you-page/index.html', 'ua/thank-you-page/index.html', 'en/thank-you-page/index.html', 'ru/payment-issue/index.html', 'ua/payment-issue/index.html', 'en/payment-issue/index.html']) {
    try {
      const html = await readFile(join(distRoot, route), 'utf8');
      if (!/<meta name="robots" content="noindex, nofollow"/.test(html)) errors.push(`Missing noindex: ${route}`);
      if (!/<h1[\s>]/.test(html)) errors.push(`Missing status-page heading: ${route}`);
    } catch {
      errors.push(`Missing status route: ${route}`);
    }
  }

  for (const route of ['ru/charter-for-dummies', 'ua/charter-for-dummies', 'ru/yahting-dlya-vseh']) {
    const html = await readFile(join(distRoot, route, 'index.html'), 'utf8');
    if (/navi-evo-menu/.test(html)) errors.push(`Standalone campaign received shared menu: ${route}`);
    if (/<footer data-evo-footer/.test(html)) errors.push(`Standalone campaign kept snapshot footer: ${route}`);
  }

  for (const locale of ['ru', 'ua', 'en']) {
    if (sitemapUrls.includes(`/${locale}/payment-issue/`)) errors.push(`Payment issue leaked into sitemap: ${locale}`);
  }

  const charterHtml = await readFile(join(distRoot, 'ru/charter', 'index.html'), 'utf8');
  if ((charterHtml.match(/class="[^"]*navi-card--media/g) || []).length !== 4) errors.push('RU charter rental cards are incomplete');
  if ((charterHtml.match(/class="[^"]*navi-card-grid/g) || []).length !== 1) errors.push('RU charter rental card grid is missing');

  if (errors.length) {
    console.error(`Validation failed (${errors.length}):\n${errors.join('\n')}`);
    process.exit(1);
  }

  console.log('Navi Astro validation passed:', stats);
}

async function main() {
  await runValidation();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
