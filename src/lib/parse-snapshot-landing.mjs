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

function cleanAttrs(str) {
  return str
    .replace(/\s+data-state="closed"/g, '')
    .replace(/\s+data-orientation="vertical"/g, '')
    .replace(/\s+data-ws-index="[^"]*"/g, '')
    .replace(/\s+data-radix-collection-item="[^"]*"/g, '')
    .replace(/\s+hidden=""/g, '')
    .replace(/\s+role="region"/g, '')
    .replace(/\s+aria-labelledby="[^"]*"/g, '')
    .replace(/\s+aria-controls="[^"]*"/g, '')
    .replace(/\s+aria-expanded="false"/g, '')
    .replace(/\s+id="radix-[^"]*"/g, '')
    .replace(/style="[^"]*--radix-accordion[^"]*"/g, '');
}

function transformWItem(item, contentByQuestion) {
  // Extract trigger text from .w-text inside .w-item-trigger.
  const triggerMatch = item.match(/class="[^"]*w-item-trigger[^"]*"[^>]*>[\s\S]*?<div[^>]*?class="[^"]*w-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const triggerText = triggerMatch ? decodeEntities(triggerMatch[1].replace(/<[^>]+>/g, '').trim()) : '';
  const answer = contentByQuestion.get(triggerText);
  if (!answer) return item;

  // 1. Wrap .w-item in <details> (keep all original classes).
  let newItem = item.replace(/^<div/i, '<details').replace(/<\/div>\s*$/i, '</details>');

  // 2. Change .w-item-header <h3> to <summary> (preserve all classes and children).
  newItem = newItem.replace(/<([a-z0-9]+)\b([^>]*?)class="([^"]*)w-item-header([^"]*)"/i, '<summary$2class="$3w-item-header$4"');
  newItem = newItem.replace(/<\/h3>/i, '</summary>');

  // 3. Change .w-item-trigger <button> to <div> so the parent <summary> handles toggling.
  newItem = newItem.replace(/<button\b([^>]*?)class="([^"]*)w-item-trigger([^"]*)"/i, '<div$1class="$2w-item-trigger$3"');
  newItem = newItem.replace(/<\/button>/i, '</div>');

  // 4. Replace .w-item-content inner with answer, keep outer tag.
  const contentMatch = newItem.match(/<div\b[^>]*?class="[^"]*w-item-content[^"]*"/i);
  if (contentMatch) {
    const contentStart = contentMatch.index;
    const contentTagEnd = newItem.indexOf('>', contentStart);
    const contentEnd = findBalancedEnd(newItem, contentStart, 'div');
    if (contentEnd !== -1) {
      const openTag = newItem.slice(contentStart, contentTagEnd + 1).replace(/\s+style="[^"]*"/i, '').replace(/hidden=""/gi, '');
      newItem = newItem.slice(0, contentStart) + cleanAttrs(openTag) + formatAnswer(answer) + newItem.slice(contentEnd);
    }
  }

  return cleanAttrs(newItem);
}

function transformWAccordions(html, contentByQuestion) {
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

    const itemRe = /<div\b[^>]*?class="(?:[^"]*\s)?w-item\s[^"]*"[^>]*>/gi;
    const items = [];
    let m2;
    while ((m2 = itemRe.exec(accordion)) !== null) {
      const itemEnd = findBalancedEnd(accordion, m2.index, 'div');
      if (itemEnd === -1) continue;
      items.push({ start: m2.index, end: itemEnd });
    }

    let newAccordion = accordion;
    for (let j = items.length - 1; j >= 0; j--) {
      const { start: s, end: e } = items[j];
      newAccordion = newAccordion.slice(0, s) + transformWItem(newAccordion.slice(s, e), contentByQuestion) + newAccordion.slice(e);
    }

    out = out.slice(0, start) + newAccordion + out.slice(end);
  }
  return out;
}

function stripPhotoStripSection(html) {
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

  const styleTags = [...rawHtml.matchAll(/<link[^>]*?rel=["']stylesheet["'][^>]*?\/?>/gi)]
    .map((m) => m[0])
    .filter((tag) => !/href=["'][^"]*navi-runtime\.css/.test(tag));

  const remixCtx = extractRemixContext(rawHtml);
  const contentByQuestion = getContentByQuestion(locale);

  const bodyMatch = rawHtml.match(/<body[^>]*?>([\s\S]*)<\/body>/i);
  let bodyContent = (bodyMatch ? bodyMatch[1] : '')
    .replace(/<style data-navi-runtime>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*?src=["']\/navi-runtime\.js(?:\?[^"']*)?["'][^>]*?>(?:<\/script>)?<\/script>/gi, '')
    .replace(/<script[^>]*?src=["']\/navi-runtime\.js(?:\?[^"']*)?["'][^>]*?\/?>/gi, '')
    .replace(/<div\b[^>]*?class="[^"]*navi-evo-menu[^"]*"[^>]*?>[\s\S]*?<\/div>\s*<\/nav>/gi, '')
    .replace(/<button\b[^>]*?class="[^"]*navi-evo-mobile-toggle[^"]*"[^>]*?>[\s\S]*?<\/button>/gi, '')
    .replace(/<div\b[^>]*?class="[^"]*navi-evo-mobile-menu[^"]*"[^>]*?>[\s\S]*?<\/div>/gi, '')
    .replace(/<footer\b[^>]*?>[\s\S]*?<\/footer>/gi, '')
    .replace(/<script[^>]*?src=["'][^"']*Navi-form[^"']*\.js[^"']*["'][^>]*?>(?:<\/script>)?<\/script>/gi, '')
    .replace(/<script[^>]*?src=["'][^"']*Navi-form[^"']*\.js[^"']*["'][^>]*?\/?>/gi, '')
    .replace(/<script[^>]*?>\s*window\.__remixContext\s*=\s*[\s\S]*?<\/script>/gi, '');

  bodyContent = transformWAccordions(bodyContent, contentByQuestion);
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
