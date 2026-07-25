/**
 * ponytail: thin wrapper to reuse the existing snapshot HTML as a body fragment
 * while promoting the head metadata into Astro props. This is a preview/Draft step
 * for T1; the full JSON/component refactor will replace the fragment later.
 */

import landingData from '../data/landing-charter-for-everybody.json' with { type: 'json' };

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

function getContentByQuestion(locale) {
  const faq = landingData.faq[locale] || {};
  const program = landingData.program[locale] || {};
  return new Map([...Object.entries(faq), ...Object.entries(program)].map(([q, a]) => [q.trim(), a.trim()]));
}

function formatAnswer(answer) {
  const paragraphs = answer
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`);
  return `<div class="navi-landing-answer">${paragraphs.join('')}</div>`;
}

function transformWItem(item, contentByQuestion) {
  // Extract trigger text from the first .w-text inside .w-item-trigger.
  const triggerMatch = item.match(/class="[^"]*w-item-trigger[^"]*"[^>]*>[\s\S]*?<div[^>]*?class="[^"]*w-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const triggerText = triggerMatch ? decodeEntities(triggerMatch[1].replace(/<[^>]+>/g, '').trim()) : '';
  const answer = contentByQuestion.get(triggerText);
  if (!answer) return item;

  // Wrap the trigger text and answer in a clean native <details>/<summary>.
  return `<details class="navi-landing-accordion"><summary class="navi-landing-accordion__summary">${escapeHtml(triggerText)}<span aria-hidden="true">+</span></summary>${formatAnswer(answer)}</details>`;
}

function transformWAccordions(html, contentByQuestion) {
  // Find every .w-accordion container and replace its .w-item children.
  const accordionRe = /<div\b[^>]*?class="[^"]*w-accordion[^"]*"[^>]*>/gi;
  const accordions = [];
  let m;
  while ((m = accordionRe.exec(html)) !== null) {
    const end = findBalancedEnd(html, m.index, 'div');
    if (end === -1) continue;
    accordions.push({ start: m.index, end });
  }

  let out = html;
  for (let i = accordions.length - 1; i >= 0; i--) {
    const { start, end } = accordions[i];
    const accordion = out.slice(start, end);

    // Find all .w-item children inside this accordion.
    const itemRe = /<div\b[^>]*?class="[^"]*w-item\s[^"]*"[^>]*>/gi;
    const items = [];
    let m2;
    while ((m2 = itemRe.exec(accordion)) !== null) {
      const itemEnd = findBalancedEnd(accordion, m2.index, 'div');
      if (itemEnd === -1) continue;
      items.push({ start: m2.index, end: itemEnd });
    }

    // Opening tag of the w-accordion container.
    const openTagEnd = accordion.indexOf('>', 0);
    const openTag = accordion.slice(0, openTagEnd + 1);
    const className = openTag.match(/class="([^"]*)"/);
    const newClass = className ? openTag.replace(/class="([^"]*)"/, `class="$1 navi-landing-accordion__wrap"`) : openTag.replace(/^<div/, '<div class="navi-landing-accordion__wrap"');

    let newInner = '';
    for (let j = items.length - 1; j >= 0; j--) {
      const { start: s, end: e } = items[j];
      newInner = transformWItem(accordion.slice(s, e), contentByQuestion) + newInner;
    }

    out = out.slice(0, start) + newClass + newInner + '</div>' + out.slice(end);
  }
  return out;
}

function stripPhotoStripSection(html) {
  // Remove the snapshot's own photo-strip section (160x160 images just before the footer).
  const sectionRe = /<section\b[^>]*?data-evo-section="\d+"[^>]*>/gi;
  const sections = [];
  let m;
  while ((m = sectionRe.exec(html)) !== null) {
    const end = html.indexOf('</section>', m.index);
    if (end === -1) continue;
    const block = html.slice(m.index, end + '</section>'.length);
    const isPhotoStrip = (block.match(/width="160"\s+height="160"/g) || []).length > 10;
    if (isPhotoStrip) sections.push({ start: m.index, end: end + '</section>'.length });
  }
  let out = html;
  for (let i = sections.length - 1; i >= 0; i--) {
    out = out.slice(0, sections[i].start) + out.slice(sections[i].end);
  }
  return out;
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
  const contentByQuestion = getContentByQuestion(locale);

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

  // Fix the broken Radix accordion markup in place while keeping the original section design.
  bodyContent = transformWAccordions(bodyContent, contentByQuestion);
  // Remove the snapshot's own photo strip; LandingLayout.astro renders PhotoStrip.astro.
  bodyContent = stripPhotoStripSection(bodyContent);

  if (startDateErrored(remixCtx)) {
    const timerText = locale === 'ua' ? 'Незабаром' : 'Скоро';
    const dateText = locale === 'ua' ? 'Дату старту уточнюється' : 'Дата старта уточняется';
    bodyContent = bodyContent
      .replace(/(<p[^>]*?id=["']start_timer["'][^>]*?>)[^<]*(<\/p>)/i, `$1${timerText}$2`)
      .replace(/(<p[^>]*?id=["']start_date["'][^>]*?>)([^<]*)(<\/p>)/i, `$1${dateText}$2`);
  }

  return { title, description, canonical, alternates, og, schema, styleTags, bodyContent: bodyContent.trim() };
}
