import fs from 'node:fs/promises';
import payloadContent from '../src/data/payload-content.json' with { type: 'json' };
import { hydratePayloadHtml } from '../src/lib/hydrate-payload-html.mjs';

let applied = 0;
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const activeAuthorSlugs = new Set(payloadContent.entries
  .filter((entry) => entry.kind === 'author')
  .map((entry) => entry.route.split('/').filter(Boolean).at(-1))
  .filter(Boolean));
const activeAuthorNames = [...new Set(payloadContent.entries
  .filter((entry) => entry.kind === 'author')
  .map((entry) => entry.name?.trim())
  .filter(Boolean))];

function filterInstructorSections(source) {
  return source.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g, (section) => {
    if (!/(?:Инструкторская команда|Інструкторська команда|Instructor team)/i.test(section)) return section;
    return section.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (card) => {
      const slug = card.match(/href="[^"]*\/team\/([^"/?#]+)\/?[^"]*"/i)?.[1];
      if (slug) return activeAuthorSlugs.has(slug) ? card : '';
      if (!/<img\b/i.test(card)) return card;
      return activeAuthorNames.some((name) => card.includes(name)) ? card : '';
    });
  });
}

function encyclopediaBlock(entry) {
  if (entry.kind !== 'tag') return '';
  const terms = (payloadContent.encyclopedia || []).filter((term) => term.locale === entry.locale && term.categories?.includes(entry.id));
  if (!terms.length) return '';
  const title = entry.locale === 'ru' ? 'Яхтенная энциклопедия' : entry.locale === 'uk' ? 'Яхтова енциклопедія' : 'Yachting Encyclopedia';
  const cards = terms.map((term) => `<a href="${escapeHtml(term.route)}" style="display:block;padding:20px;border:1px solid #dce5e9;border-radius:18px;color:#102e39;text-decoration:none;background:#fff"><strong style="font-size:1.25rem">${escapeHtml(term.term)}</strong><span style="display:block;margin-top:8px;line-height:1.5;color:#506068">${escapeHtml(term.definition)}</span></a>`).join('');
  return `<!-- navi-encyclopedia:start --><section style="max-width:1120px;margin:48px auto;padding:34px 24px"><h2 style="font-family:Tenor Sans,sans-serif;font-size:clamp(2rem,4vw,3.4rem);margin:0 0 24px">${title} Navi.training</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px">${cards}</div></section><!-- navi-encyclopedia:end -->`;
}

function blogIndexBlock(locale) {
  const posts = payloadContent.entries.filter((entry) => entry.kind === 'post' && entry.locale === locale).slice(0, 18);
  if (!posts.length) return '';
  const title = locale === 'ru' ? 'Свежие истории' : locale === 'uk' ? 'Свіжі історії' : 'Latest stories';
  const kicker = locale === 'ru' ? 'Бортовой журнал · Ля-Рошель' : locale === 'uk' ? 'Бортовий журнал · Ля-Рошель' : 'The logbook · La Rochelle';
  const action = locale === 'ru' ? 'Читать историю' : locale === 'uk' ? 'Читати історію' : 'Read the story';
  const dateLocale = locale === 'uk' ? 'uk-UA' : locale === 'en' ? 'en-GB' : 'ru-RU';
  const cards = posts.map((post) => {
    const image = post.image?.url || post.image?.src || '';
    const date = post.createdAt ? new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(post.createdAt)) : '';
    return `<article class="navi-blog-card"><a href="${escapeHtml(post.route)}">${image ? `<figure><img src="${escapeHtml(image)}" alt="${escapeHtml(post.imageAlt || post.name)}" loading="lazy"/></figure>` : ''}<div class="navi-blog-card__copy">${date ? `<time datetime="${escapeHtml(post.createdAt)}">${escapeHtml(date)}</time>` : ''}<h3>${escapeHtml(post.name)}</h3><p>${escapeHtml(post.summary || '')}</p><span>${action}<b aria-hidden="true">→</b></span></div></a></article>`;
  }).join('');
  return `<!-- navi-blog-index:start --><section class="navi-blog-index"><header><p>${kicker}</p><h2>${title}</h2><span>46.1603° N&nbsp;&nbsp;1.1511° W</span></header><div class="navi-blog-grid">${cards}</div></section><!-- navi-blog-index:end -->`;
}

for (const entry of payloadContent.entries) {
  const file = `src/snapshots${entry.route}index.html`;
  try {
    const source = await fs.readFile(file, 'utf8');
    let hydrated = hydratePayloadHtml(source, entry);
    hydrated = hydrated.replace(/<!-- navi-encyclopedia:start -->[\s\S]*?<!-- navi-encyclopedia:end -->/g, '');
    const block = encyclopediaBlock(entry);
    if (block) hydrated = hydrated.replace(/<footer\b/, `${block}<footer`);
    if (hydrated !== source) await fs.writeFile(file, hydrated);
    applied += 1;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

for (const locale of ['ru', 'uk', 'en']) {
  const routeLocale = locale === 'uk' ? 'ua' : locale;
  const file = `src/snapshots/${routeLocale}/blog/index.html`;
  try {
    const source = await fs.readFile(file, 'utf8');
    let hydrated = source.replace(/<!-- navi-blog-index:start -->[\s\S]*?<!-- navi-blog-index:end -->/g, '');
    hydrated = hydrated.replace(/<footer\b/, `${blogIndexBlock(locale)}<footer`);
    if (hydrated !== source) await fs.writeFile(file, hydrated);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const target = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(target) : [target];
  }))).flat();
}

let filteredTeamPages = 0;
for (const file of (await walk('src/snapshots')).filter((entry) => entry.endsWith('.html'))) {
  const source = await fs.readFile(file, 'utf8');
  const filtered = filterInstructorSections(source);
  if (filtered === source) continue;
  await fs.writeFile(file, filtered);
  filteredTeamPages += 1;
}
console.log(`Applied Payload content to ${applied} existing localized pages; filtered instructor sections on ${filteredTeamPages} pages.`);
