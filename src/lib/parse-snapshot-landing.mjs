/**
 * ponytail: thin wrapper to reuse the existing snapshot HTML as a body fragment
 * while promoting the head metadata into Astro props. This is a preview/Draft step
 * for T1; the full JSON/component refactor will replace the fragment later.
 */

const decodeEntities = (value = '') => value
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function findBalancedEnd(html, startIdx, tag = 'div') {
  const open = `<${tag}`;
  const close = `</${tag}>`;
  const openLen = open.length;
  const closeLen = close.length;
  let depth = 1;
  let pos = startIdx + openLen;
  while (depth > 0) {
    const openIdx = html.indexOf(open, pos);
    const closeIdx = html.indexOf(close, pos);
    if (closeIdx === -1) return -1;
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++;
      pos = openIdx + openLen;
    } else {
      depth--;
      pos = closeIdx + closeLen;
      if (depth === 0) return pos;
    }
  }
  return pos;
}

function extractRemixContext(rawHtml) {
  const match = rawHtml.match(/window\.__remixContext\s*=\s*([\s\S]*?);\s*<\/script>/);
  if (!match) return {};
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return {};
  }
}

import landingData from '../data/landing-charter-for-everybody.json' with { type: 'json' };

function stripSnapshotSections(html) {
  // Remove <section data-evo-section="N"> blocks that contain accordion or
  // photo-strip content. These are re-rendered as proper components from JSON.
  // Returns { html, strippedAccordions }.
  const sectionRe = /<section\b[^>]*?data-evo-section="\d+"[^>]*>/gi;
  const sections = [];
  let m;
  while ((m = sectionRe.exec(html)) !== null) {
    const end = html.indexOf('</section>', m.index);
    if (end === -1) continue;
    const block = html.slice(m.index, end + '</section>'.length);
    const isAccordion = /class="[^"]*w-accordion[^"]*"/.test(block);
    const isPhotoStrip = (block.match(/width="160"\s+height="160"/g) || []).length > 10;
    if (isAccordion || isPhotoStrip) {
      sections.push({ start: m.index, end: end + '</section>'.length, isAccordion });
    }
  }
  let out = html;
  let strippedAccordions = false;
  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i].isAccordion) strippedAccordions = true;
    out = out.slice(0, sections[i].start) + out.slice(sections[i].end);
  }
  return { html: out, strippedAccordions };
}

function getFaqEntries(locale) {
  const map = landingData.faq[locale] || {};
  return Object.entries(map).map(([question, answer]) => ({ question, answer }));
}

function getProgramEntries(locale) {
  const map = landingData.program[locale] || {};
  return Object.entries(map).map(([question, answer]) => ({ question, answer }));
}

function startDateErrored(ctx) {
  const loaders = Object.values(ctx.state?.loaderData || {});
  const resource = loaders.find((v) => v?.resources && v.resources.Start_date_1)?.resources?.Start_date_1;
  return typeof resource?.data === 'string' && /error/i.test(resource.data);
}

export function parseLandingSnapshot(rawHtml, locale) {
  const title = decodeEntities(rawHtml.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const description = decodeEntities(
    rawHtml.match(/<meta[^>]*?name=["']description["'][^>]*?content=["']([^"]*)["'][^>]*?>/i)?.[1]
    ?? rawHtml.match(/<meta[^>]*?content=["']([^"]*)["'][^>]*?name=["']description["'][^>]*?>/i)?.[1]
    ?? ''
  );

  const canonicalMatch = rawHtml.match(/<link[^>]*?rel=["']canonical["'][^>]*?href=["']([^"]+)["'][^>]*?>/i);
  let canonical = canonicalMatch?.[1] ?? `https://navi.training/${locale}/`;
  canonical = canonical.replace(/\/?$/, '/');

  const alternateTags = [...rawHtml.matchAll(/<link[^>]*?rel=["']alternate["'][^>]*?hreflang=["']([^"]+)["'][^>]*?href=["']([^"]+)["'][^>]*?\/?>/gi)];
  const alternates = alternateTags.map(([, hreflang, href]) => ({ hreflang, href: href.replace(/\/?$/, '/') }));

  const og = {};
  for (const prop of ['og:url', 'og:title', 'og:description', 'og:image', 'og:type', 'og:site_name']) {
    const re = new RegExp(`<meta[^>]*?property=["']${prop.replace('.', '\\.')}["'][^>]*?content=["']([^"]*)["'][^>]*?/?>`, 'i');
    const match = rawHtml.match(re)?.[1];
    if (match) {
      const key = prop.replace('og:', '');
      og[key === 'site_name' ? 'site_name' : key] = decodeEntities(match);
    }
  }

  const schemaMatch = rawHtml.match(/<script[^>]*?type=["']application\/ld\+json["'][^>]*?>([\s\S]*?)<\/script>/i);
  const schema = schemaMatch ? JSON.parse(schemaMatch[1]) : undefined;

  // Keep the original <link> tag strings so we preserve media/attributes.
  const styleTags = [...rawHtml.matchAll(/<link[^>]*?rel=["']stylesheet["'][^>]*?\/?>/gi)]
    .map((m) => m[0])
    .filter((tag) => !/href=["'][^"]*navi-runtime\.css/.test(tag));

  const remixCtx = extractRemixContext(rawHtml);

  const bodyMatch = rawHtml.match(/<body[^>]*?>([\s\S]*)<\/body>/i);
  let bodyContent = (bodyMatch ? bodyMatch[1] : '')
    // Remove the inline runtime styles and the duplicate runtime script.
    .replace(/<style data-navi-runtime>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*?src=["']\/navi-runtime\.js(?:\?[^"']*)?["'][^>]*?>(?:<\/script>)?<\/script>/gi, '')
    .replace(/<script[^>]*?src=["']\/navi-runtime\.js(?:\?[^"']*)?["'][^>]*?\/?>/gi, '')
    // Strip the shared navigation menu and footer; both are rendered by the
    // standard Footer.astro / PhotoStrip.astro components in LandingLayout.
    .replace(/<div\b[^>]*?class="[^"]*navi-evo-menu[^"]*"[^>]*?>[\s\S]*?<\/div>\s*<\/nav>/gi, '')
    .replace(/<button\b[^>]*?class="[^"]*navi-evo-mobile-toggle[^"]*"[^>]*?>[\s\S]*?<\/button>/gi, '')
    .replace(/<div\b[^>]*?class="[^"]*navi-evo-mobile-menu[^"]*"[^>]*?>[\s\S]*?<\/div>/gi, '')
    .replace(/<footer\b[^>]*?>[\s\S]*?<\/footer>/gi, '')
    // Remove the external Webstudio form/landing script; we handle the buttons ourselves.
    .replace(/<script[^>]*?src=["'][^"']*Navi-form[^"']*\.js[^"']*["'][^>]*?>(?:<\/script>)?<\/script>/gi, '')
    .replace(/<script[^>]*?src=["'][^"']*Navi-form[^"']*\.js[^"']*["'][^>]*?\/?>/gi, '')
    // Remove the Remix hydration context (content is now inlined above).
    .replace(/<script[^>]*?>\s*window\.__remixContext\s*=\s*[\s\S]*?<\/script>/gi, '');

  // Strip snapshot accordion sections and photo-strip sections; these are
  // re-rendered as proper PostFaq-style components from cached JSON data.
  // Only return FAQ/program entries if accordion sections were actually stripped.
  const { html: strippedBody, strippedAccordions } = stripSnapshotSections(bodyContent);
  bodyContent = strippedBody;

  if (startDateErrored(remixCtx)) {
    const timerText = locale === 'ua' ? 'Незабаром' : 'Скоро';
    const dateText = locale === 'ua' ? 'Дату старту уточнюється' : 'Дата старта уточняется';
    bodyContent = bodyContent
      .replace(/(<p[^>]*?id=["']start_timer["'][^>]*?>)[^<]*(<\/p>)/i, `$1${timerText}$2`)
      .replace(/(<p[^>]*?id=["']start_date["'][^>]*?>)([^<]*)(<\/p>)/i, `$1${dateText}$2`);
  }

  return {
    title, description, canonical, alternates, og, schema, styleTags,
    bodyContent: bodyContent.trim(),
    faqEntries: strippedAccordions ? getFaqEntries(locale) : [],
    programEntries: strippedAccordions ? getProgramEntries(locale) : [],
  };
}
