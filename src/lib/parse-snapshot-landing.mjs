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

function getFaqMap(locale) {
  // ponytail: FAQ cached at build time from Baserow (RU+UA only).
  const map = landingData.faq[locale] || {};
  return new Map(Object.entries(map).map(([q, a]) => [q.trim(), a.trim()]));
}

function getProgramContent(locale) {
  const map = landingData.program[locale] || {};
  return new Map(Object.entries(map).map(([q, a]) => [q.trim(), a.trim()]));
}

function formatFaqAnswer(answer) {
  const paragraphs = answer
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`);
  return `<div class="navi-faq-answer">${paragraphs.join('')}</div>`;
}

function transformAccordionItem(item) {
  // Convert the outer .w-item div to <details> and clean accordion-only attributes.
  let newItem = item.replace(/^<div/i, '<details').replace(/<\/div>\s*$/i, '</details>');

  // The header can be an <h3> or a <div> depending on the section; turn it into <summary>.
  const headerMatch = newItem.match(/<([a-z0-9]+)([^>]*?)class="([^"]*)w-item-header([^"]*)"/i);
  if (headerMatch) {
    const tag = headerMatch[1];
    const openingRe = new RegExp(`<${tag}([^>]*?)class="([^"]*)w-item-header([^"]*)"`, 'i');
    newItem = newItem.replace(openingRe, '<summary$1class="$2w-item-header$3"');
    newItem = newItem.replace(new RegExp(`</${tag}>`, 'i'), '</summary>');
  }

  const attrsToRemove = [
    /\s+data-state="closed"/gi,
    /\s+data-orientation="vertical"/gi,
    /\s+data-ws-index="[^"]*"/gi,
    /\s+data-radix-collection-item="[^"]*"/gi,
    /\s+hidden=""/gi,
    /\s+role="region"/gi,
    /\s+aria-labelledby="[^"]*"/gi,
    /\s+aria-controls="[^"]*"/gi,
    /\s+aria-expanded="false"/gi,
  ];
  for (const re of attrsToRemove) {
    newItem = newItem.replace(re, '');
  }
  return newItem;
}

function populateAccordionContent(item, contentByQuestion) {
  // Match the trigger text from the first .w-text inside .w-item-header.
  const textMatch = item.match(/<div\b[^>]*?class="[^"]*w-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const triggerText = textMatch ? decodeEntities(textMatch[1].replace(/<[^>]+>/g, '').trim()) : '';
  const answer = contentByQuestion.get(triggerText);
  if (!answer) return item;

  const contentMatch = item.match(/<div\b[^>]*?class="[^"]*w-item-content[^"]*"/i);
  if (!contentMatch) return item;
  const contentStart = contentMatch.index;
  const contentEnd = findBalancedEnd(item, contentStart, 'div');
  if (contentEnd === -1) return item;
  const contentTagEnd = item.indexOf('>', contentStart);
  const openTag = item.slice(contentStart, contentTagEnd + 1);
  return item.slice(0, contentStart) + openTag + formatFaqAnswer(answer) + '</div>' + item.slice(contentEnd);
}

function transformAccordions(html, faqByQuestion) {
  const itemRe = /<div\b[^>]*?class="(?:[^"]*\s)?w-item\s[^"]*"/gi;
  const items = [];
  let m;
  while ((m = itemRe.exec(html)) !== null) {
    const end = findBalancedEnd(html, m.index, 'div');
    if (end === -1) continue;
    items.push({ start: m.index, end });
  }
  let out = html;
  for (let i = items.length - 1; i >= 0; i--) {
    const { start, end } = items[i];
    const item = out.slice(start, end);
    const populated = populateAccordionContent(item, faqByQuestion);
    out = out.slice(0, start) + transformAccordionItem(populated) + out.slice(end);
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
  const faqByQuestion = getFaqMap(locale);

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

  // Merge FAQ answers with the manually-provided program/bonus content for this course.
  const programContent = getProgramContent(locale);
  const contentByQuestion = new Map([...faqByQuestion, ...programContent]);
  bodyContent = transformAccordions(bodyContent, contentByQuestion);

  if (startDateErrored(remixCtx)) {
    const timerText = locale === 'ua' ? 'Незабаром' : 'Скоро';
    const dateText = locale === 'ua' ? 'Дату старту уточнюється' : 'Дата старта уточняется';
    bodyContent = bodyContent
      .replace(/(<p[^>]*?id=["']start_timer["'][^>]*?>)[^<]*(<\/p>)/i, `$1${timerText}$2`)
      .replace(/(<p[^>]*?id=["']start_date["'][^>]*?>)([^<]*)(<\/p>)/i, `$1${dateText}$2`);
  }

  return { title, description, canonical, alternates, og, schema, styleTags, bodyContent: bodyContent.trim() };
}
