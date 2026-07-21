import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const origin = 'https://navi.training';
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const snapshotsRoot = join(projectRoot, 'src/snapshots');
const publicRoot = join(projectRoot, 'public');
const runtimeSource = await readFile(join(publicRoot, 'navi-runtime.js'), 'utf8');
const localAssets = new Set();
const extraPaths = [
  '/ru/privacy-policy', '/ru/cookie-policy',
  '/ua/privacy-policy', '/ua/cookie-policy',
  '/en/privacy-policy', '/en/cookie-policy',
  '/ru/refund-policy',
];

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Navi Astro migration/1.0' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
};

const hasNativePracticePanel = (html) => {
  const visible = html.split('window.__remixContext')[0];
  const panel = visible.match(/<div[^>]*role="tabpanel"[^>]*id="[^"]*content-1"[^>]*>([\s\S]{0,500})/);
  return Boolean(panel && !/^\s*<\/div>/.test(panel[1]));
};

const practicePrograms = {
  ru: {
    lead: 'Курс включает в себя необходимые материалы для получения квалификации шкипера и радиооператора:',
    items: [
      '<b>Устройство парусной яхты:</b> основы конструкции и понятия.',
      'Техника безопасности: <b>правила поведения на борту</b> и использование спасательного оборудования.',
      'Подготовка к выходу в море: <b>приемка яхты</b>, инструктаж экипажа.',
      'Такелажное дело и <b>морские узлы:</b> основные узлы и их применение.',
      'Проверка оборудования и систем.',
      'Управление яхтой под двигателем: <b>основы маневрирования</b> и использования двигателя.',
      'Безопасность на яхте: отработка человек за бортом.',
      'Постановка на буй: подходы и выполнение.',
      '<b>Швартовка лагом</b> и заправка топливом: основные этапы и меры безопасности.',
      'Управление яхтой под парусом: принципы и техники плавания.',
      '<b>Постановка и уборка парусов:</b> методы и техники для разных типов парусов.',
      'Повороты и <b>маневры под парусами:</b> выполнение и практика основных маневров.',
      '<b>Взятие рифов:</b> методы уменьшения парусной площади в условиях сильного ветра.',
      'Тонкая настройка парусов: адаптация к изменяющимся условиям плавания.',
      '<b>Ориентирование в море и навигация:</b> основы работы с морской картой и прокладка маршрута.',
      'Постановка на якорь и снятие с якоря.',
      'Практическая метеорология и принятие решений по погоде.',
    ],
  },
  ua: {
    lead: 'Курс включає необхідні матеріали для отримання кваліфікації шкіпера та радіооператора:',
    items: [
      '<b>Будова вітрильної яхти:</b> основи конструкції та поняття.',
      'Техніка безпеки: <b>правила поведінки на борту</b> та використання рятувального обладнання.',
      'Підготовка до виходу в море: <b>приймання яхти</b>, інструктаж екіпажу.',
      'Такелажна справа та <b>морські вузли:</b> основні вузли та їх застосування.',
      'Перевірка обладнання та систем.',
      'Керування яхтою під двигуном: <b>основи маневрування</b> та використання двигуна.',
      'Безпека на яхті: відпрацювання «людина за бортом».',
      'Постановка на буй: підходи та виконання.',
      '<b>Швартування лагом</b> і заправка паливом: основні етапи та заходи безпеки.',
      'Керування яхтою під вітрилами: принципи та техніки плавання.',
      '<b>Постановка та прибирання вітрил:</b> методи й техніки для різних типів вітрил.',
      'Повороти та <b>маневри під вітрилами:</b> виконання і практика основних маневрів.',
      '<b>Взяття рифів:</b> зменшення площі вітрил за сильного вітру.',
      'Тонке налаштування вітрил відповідно до умов плавання.',
      '<b>Орієнтування в морі та навігація:</b> робота з морською картою і прокладання маршруту.',
      'Постановка на якір і зняття з якоря.',
      'Практична метеорологія та прийняття рішень щодо погоди.',
    ],
  },
  en: {
    lead: 'The course includes the practical training required to qualify as a skipper and radio operator:',
    items: [
      '<b>Sailing yacht construction:</b> essential structure and terminology.',
      'Safety procedures, conduct aboard and use of lifesaving equipment.',
      'Preparing to go to sea: <b>yacht handover</b> and crew briefing.',
      'Rigging and <b>nautical knots:</b> essential knots and their application.',
      'Inspection of equipment and onboard systems.',
      'Yacht handling under power: <b>manoeuvring</b> and engine operation.',
      'Man-overboard drills and recovery procedures.',
      'Picking up and leaving a mooring buoy.',
      '<b>Alongside mooring</b> and refuelling procedures.',
      'Yacht handling under sail.',
      '<b>Hoisting and lowering sails</b> of different types.',
      'Tacking, gybing and other <b>manoeuvres under sail</b>.',
      '<b>Reefing:</b> reducing sail area in strong wind.',
      'Fine sail trim for changing conditions.',
      '<b>Orientation and navigation at sea:</b> chart work and route planning.',
      'Anchoring and weighing anchor.',
      'Practical meteorology and weather-based decisions.',
    ],
  },
};

const hydratePracticeProgram = (html, path) => {
  const match = path.match(/^(ru|ua|en)\/inshore-skipper-sail$/);
  if (!match) return html;
  const copy = practicePrograms[match[1]];
  const content = `<div class="navi-practice-program"><h3>${copy.lead}</h3><div class="navi-practice-card"><ul>${copy.items.map((item) => `<li>${item}</li>`).join('')}</ul></div></div>`;
  return html.replace(
    /(<div[^>]*role="tabpanel"[^>]*id="[^"]*content-1"[^>]*>)\s*<\/div>/,
    `$1${content}</div>`,
  );
};

const fetchPage = async (url) => {
  const sourceUrl = new URL(url);
  if (sourceUrl.pathname !== '/' && !sourceUrl.pathname.endsWith('/')) sourceUrl.pathname += '/';
  let best = '';
  const dynamicPage = /\/(?:tags\/|sailing-school\/?$|home\/?$|inshore-skipper-sail\/?$|charter\/?$)/.test(sourceUrl.pathname);
  for (let attempt = 0; attempt < (dynamicPage ? 4 : 1); attempt++) {
    const requestUrl = new URL(sourceUrl);
    if (attempt) requestUrl.searchParams.set('_astro_import', `${Date.now()}-${attempt}`);
    const response = await fetch(requestUrl, {
      headers: { 'user-agent': 'Navi Astro migration/1.0' }, redirect: 'follow',
    });
    if (response.status >= 500) continue;
    const candidate = await response.text();
    const score = candidate.length
      + (/field_266014[034]/.test(candidate) ? 1_000_000 : 0)
      + (candidate.includes('field_4188340') || candidate.includes('"Slug"') ? 1_000_000 : 0)
      + (hasNativePracticePanel(candidate) ? 2_000_000 : 0);
    const bestScore = best.length
      + (/field_266014[034]/.test(best) ? 1_000_000 : 0)
      + (best.includes('field_4188340') || best.includes('"Slug"') ? 1_000_000 : 0)
      + (hasNativePracticePanel(best) ? 2_000_000 : 0);
    if (score > bestScore) best = candidate;
    if (!dynamicPage && !candidate.includes('var results = undefined')) break;
  }
  if (!best) throw new Error(`Unable to import page: ${url}`);
  return best;
};

const decodeCloudflareEmail = (hex) => {
  const key = Number.parseInt(hex.slice(0, 2), 16);
  const bytes = [];
  for (let index = 2; index < hex.length; index += 2) bytes.push(Number.parseInt(hex.slice(index, index + 2), 16) ^ key);
  return new TextDecoder().decode(Uint8Array.from(bytes));
};

const rewriteAssetUrls = (html) => html
  .replace(/<link rel="modulepreload"[^>]*>/g, '')
  .replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/g, '')
  .replace(
    /(?:https:\/\/navi\.training)?\/cgi\/image\/([A-Za-z0-9_-]+\.(?:avif|gif|jpe?g|png|svg|webp))\?[^"'\s,]*/gi,
    '/cgi/asset/$1',
  )
  .replace(
    /(?:https:\/\/navi\.training)?\/cgi\/image\/(https%3A\/\/[^?"'\s,]+)\?[^"'\s,]*/gi,
    (_, encodedUrl) => decodeURIComponent(encodedUrl),
  )
  .replace(/https:\/\/navi\.training\/(assets|cgi\/asset)\//g, '/$1/')
  .replace(/href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"/gi, (_, hex) => `href="mailto:${escapeHtml(decodeCloudflareEmail(hex))}"`)
  .replace(/href="\/cdn-cgi\/l\/email-protection"([^>]*data-cfemail="([0-9a-f]+)")/gi, (_, attributes, hex) => `href="mailto:${escapeHtml(decodeCloudflareEmail(hex))}"${attributes}`);

const collectLocalAssets = (html) => {
  for (const match of html.matchAll(/["'(=, ]\/(assets|cgi\/asset)\/([^"'\s<>,]+)/g)) {
    localAssets.add(`/${match[1]}/${match[2].replace(/&amp;/g, '&')}`);
  }
};

const normalizeDocumentLanguage = (html, path) => {
  const requestedLocale = path.split('/')[0];
  const locale = ['ru', 'ua', 'en'].includes(requestedLocale) ? requestedLocale : 'ru';
  const language = locale === 'ua' ? 'uk-UA' : locale === 'en' ? 'en' : 'ru-RU';
  return html.replace(/<html lang="[^"]*"/, `<html lang="${language}"`);
};

const ensureBlogAlternates = (html, path) => {
  const match = path.match(/^(ru|ua|en)\/blog\/(.+)$/);
  if (!match || /hreflang=/.test(html)) return html;
  const slug = match[2];
  const links = [
    `<link rel="alternate" hreflang="ru" href="${origin}/ru/blog/${slug}" />`,
    `<link rel="alternate" hreflang="uk" href="${origin}/ua/blog/${slug}" />`,
    `<link rel="alternate" hreflang="en" href="${origin}/en/blog/${slug}" />`,
    `<link rel="alternate" hreflang="x-default" href="${origin}/ru/blog/${slug}" />`,
  ].join('');
  return html.replace('</head>', `${links}</head>`);
};

const socialLabels = new Map([
  ['t.me/', ['Telegram', 'telegram']], ['facebook.com/', ['Facebook', 'facebook']],
  ['instagram.com/', ['Instagram', 'instagram']], ['linkedin.com/', ['LinkedIn', 'linkedin']],
  ['youtube.com/', ['YouTube', 'youtube']],
]);

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const hydrateFaqAnswers = (html) => {
  const faqRows = [];
  for (const match of html.matchAll(/var results = (\[[\s\S]*?\]);/g)) {
    try {
      const rows = JSON.parse(match[1]);
      for (const row of rows) {
        for (const [questionKey, answerKey] of [
          ['field_2660140', 'field_2660146'],
          ['field_2660143', 'field_2660145'],
          ['field_2660144', 'field_2660147'],
        ]) {
          if (row?.[questionKey] && row?.[answerKey]) faqRows.push({ question: row[questionKey], answer: row[answerKey] });
        }
      }
    } catch { /* A different embedded result set may not be plain JSON. */ }
  }
  let output = html;
  for (const row of faqRows) {
    const question = escapeHtml(row.question);
    const answer = escapeHtml(row.answer).replace(/\r?\n/g, '<br/>');
    let questionAt = -1;
    let searchFrom = 0;
    while ((searchFrom = output.indexOf(question, searchFrom)) >= 0) {
      const buttonAt = output.lastIndexOf('<button', searchFrom);
      if (buttonAt >= 0 && output.slice(buttonAt, searchFrom).includes('w-item-trigger')) {
        questionAt = searchFrom;
        break;
      }
      searchFrom += question.length;
    }
    if (questionAt < 0) continue;
    const regionAt = output.indexOf('role="region"', questionAt);
    if (regionAt < 0) continue;
    const regionOpenEnd = output.indexOf('>', regionAt);
    const regionClose = output.indexOf('</div>', regionOpenEnd);
    if (regionOpenEnd < 0 || regionClose < 0 || output.slice(regionOpenEnd + 1, regionClose).trim()) continue;
    output = `${output.slice(0, regionOpenEnd + 1)}<div class="navi-faq-answer"><p>${answer}</p></div>${output.slice(regionClose)}`;
  }
  return output;
};

const renderPostCards = (html, path) => {
  const contextMatch = html.match(/window\.__remixContext = (\{[\s\S]*?\});<\/script>/);
  if (!contextMatch) return html;
  let context;
  try { context = JSON.parse(contextMatch[1]); } catch { return html; }
  const requestedLocale = path.split('/')[0];
  const locale = ['ru', 'ua', 'en'].includes(requestedLocale) ? requestedLocale : 'ru';
  const isTagPage = /^(ru|ua|en)\/tags\//.test(path);
  const renderedBeforeContext = (html.slice(0, contextMatch.index).match(new RegExp(`href="/${locale}/blog/`, 'g')) || []).length;
  if (renderedBeforeContext > 0) return html;
  const posts = new Map();
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(visit);
    const slug = value.Slug || value.field_4188340;
    const title = value[`Name_${locale === 'ua' ? 'UA' : locale.toUpperCase()}`]
      || value.field_4188339 || value.field_4188352 || value.field_4188353 || value.field_4188354;
    const image = value['Main Image']?.[0]?.url || value.field_4188345?.[0]?.url;
    if (slug && title && image) posts.set(slug, { slug, title, image, read: value['Time to read'] || value.field_4188351 || '' });
    Object.values(value).forEach(visit);
  };
  visit(context);
  if (!posts.size) return html;
  const cards = [...posts.values()].map((post) => `<article class="navi-post-card"><a href="/${locale}/blog/${escapeHtml(post.slug)}"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy"/><div class="navi-post-card-body"><h3>${escapeHtml(post.title)}</h3>${post.read ? `<p>${escapeHtml(post.read)}</p>` : ''}</div></a></article>`).join('');
  const grid = `<div class="navi-post-grid">${cards}</div>`;
  if (isTagPage) return html.replace(/<footer\b/, `${grid}<footer`);
  const moreLabel = locale === 'ua' ? 'Ще статті' : locale === 'en' ? 'More blog posts' : 'Еще статьи';
  const linkAt = html.indexOf(`>${moreLabel}</a>`);
  if (linkAt >= 0) {
    const anchorAt = html.lastIndexOf('<a', linkAt);
    return `${html.slice(0, anchorAt)}${grid}${html.slice(anchorAt)}`;
  }
  return html;
};

const markdownInline = (value) => escapeHtml(value || '')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\\?\r?\n/g, '<br/>');

const renderCertificates = (html, path) => {
  if (!/^(ru|ua|en)\//.test(path)) return html;
  const contextMatch = html.match(/window\.__remixContext = (\{[\s\S]*?\});<\/script>/);
  if (!contextMatch) return html;
  let context;
  try { context = JSON.parse(contextMatch[1]); } catch { return html; }
  const rows = [];
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(visit);
    if (value.field_2954471 && value.field_2954552?.[0]?.url) rows.push(value);
    Object.values(value).forEach(visit);
  };
  visit(context);
  const certificates = [...new Map(rows.map((row) => [row.field_2954471, row])).values()]
    .filter((row) => row.field_2954473 !== false)
    .sort((a, b) => Number(a.order) - Number(b.order));
  if (certificates.length < 2) return html;
  const locale = path.split('/')[0];
  const copy = locale === 'ua'
    ? { course: 'Записатися на курс', school: 'Пройти навчання за цією програмою можна у школі Navi.training' }
    : locale === 'en'
      ? { course: 'Book the course', school: 'You can complete this programme at Navi.training sailing school' }
      : { course: 'Записаться на курс', school: 'Пройти обучение по этой программе можно в школе Navi.training' };
  let hydrated = html;
  for (const row of certificates) {
    const panelNeedle = `content-${row.field_2954471}`;
    let panelIdAt = hydrated.indexOf('role="tabpanel"');
    while (panelIdAt >= 0) {
      const openingStart = hydrated.lastIndexOf('<div', panelIdAt);
      const openingEnd = hydrated.indexOf('>', panelIdAt);
      if (hydrated.slice(openingStart, openingEnd).includes(panelNeedle)) break;
      panelIdAt = hydrated.indexOf('role="tabpanel"', openingEnd);
    }
    if (panelIdAt < 0) continue;
    const panelStart = hydrated.lastIndexOf('<div', panelIdAt);
    const panelOpenEnd = hydrated.indexOf('>', panelIdAt);
    const panelClose = hydrated.indexOf('</div>', panelOpenEnd);
    if (panelStart < 0 || panelOpenEnd < 0 || panelClose < 0 || hydrated.slice(panelOpenEnd + 1, panelClose).trim()) continue;
    const description = row.field_2954472 || row.field_2954479 || row.field_2954480 || '';
    const requirements = row.field_2954524 || row.field_2954525 || row.field_2954526 || '';
    const slug = row.field_2954528 || '';
    const formattedRequirements = markdownInline(requirements).replace(/(^|<br\/>)-\s*/g, '$1👍 ');
    const content = `<div class="navi-cert-panel-content"><img src="${escapeHtml(row.field_2954552[0].url)}" alt="${escapeHtml(row.field_2954471)}"/><div class="navi-cert-description-card"><h3>${escapeHtml(row.field_2954471)}</h3><div>${markdownInline(description)}</div></div><div class="navi-cert-requirements">${formattedRequirements}</div><p class="navi-cert-school">${copy.school}</p>${slug ? `<a class="navi-cert-cta" href="/${locale}/${escapeHtml(slug)}">${copy.course}</a>` : ''}</div>`;
    hydrated = `${hydrated.slice(0, panelOpenEnd + 1)}${content}${hydrated.slice(panelClose)}`;
  }
  if ((hydrated.match(/role="tabpanel"/g) || []).length >= certificates.length) return hydrated;
  const tabs = certificates.map((row, index) => `<button type="button" class="navi-cert-tab${index === 0 ? ' is-active' : ''}" data-cert-index="${index}" onclick="var b=this,r=b.closest('.navi-certificates');r.querySelectorAll('.navi-cert-tab').forEach(function(x){x.classList.toggle('is-active',x===b)});r.querySelectorAll('.navi-cert-panel').forEach(function(x){x.hidden=x.dataset.certIndex!==b.dataset.certIndex})">${escapeHtml(row.field_2954471)}</button>`).join('');
  const panels = certificates.map((row, index) => {
    const description = row.field_2954472 || row.field_2954479 || row.field_2954480 || '';
    const requirements = row.field_2954524 || row.field_2954525 || row.field_2954526 || '';
    const slug = row.field_2954528 || '';
    return `<section class="navi-cert-panel" data-cert-index="${index}"${index ? ' hidden' : ''}><img class="navi-cert-image" src="${escapeHtml(row.field_2954552[0].url)}" alt="${escapeHtml(row.field_2954471)}"/><div class="navi-cert-copy"><h3>${escapeHtml(row.field_2954471)}</h3><div class="navi-cert-description">${markdownInline(description)}</div><div class="navi-cert-requirements">${markdownInline(requirements)}</div>${slug ? `<a class="navi-cert-cta" href="/${locale}/${escapeHtml(slug)}">${copy.course}</a>` : ''}</div></section>`;
  }).join('');
  const component = `<div class="navi-certificates"><div class="navi-cert-tabs" role="tablist">${tabs}</div>${panels}</div>`;
  return html.replace(
    /(<div[^>]*class="[^"]*w-tabs[^"]*"[^>]*>)(\s*<div role="tablist"[^>]*><\/div>)/,
    (match, opening, emptyTablist) => `${opening.replace('class="', 'class="navi-certificate-host ')}${component}${emptyTablist}`,
  );
};

const renderStaticControls = (html) => {
  let output = html.replace(
    /<div role="formclosebutton"([^>]*)><\/div>/g,
    '<button type="button" role="formclosebutton" aria-label="Close" onclick="this.closest(\'#contact_modal_bg\').hidden=true"$1>×</button>',
  ).replace(
    /<button([^>]*class="[^"]*w-item-trigger[^"]*"[^>]*)>/g,
    '<button$1 onclick="var r=document.getElementById(this.getAttribute(\'aria-controls\')),o=this.getAttribute(\'aria-expanded\')!==\'true\';this.setAttribute(\'aria-expanded\',o);this.dataset.state=o?\'open\':\'closed\';if(r){r.hidden=!o;r.dataset.state=o?\'open\':\'closed\'}">',
  );
  for (const [fragment, [label, icon]] of socialLabels) {
    const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    output = output.replace(
      new RegExp(`<a([^>]*href="[^"]*${escaped}[^"]*"[^>]*)><\\/a>`, 'g'),
      `<a$1 aria-label="${label}" title="${label}"><img class="navi-social-icon" src="/social/${icon}.svg" alt="${label}" /></a>`,
    );
  }
  return hydrateFaqAnswers(output);
};

const injectAstroRuntime = (html, path) => hydratePracticeProgram(renderCertificates(renderPostCards(renderStaticControls(html), path), path), path)
  .replace('</head>', '<link rel="stylesheet" href="/navi-runtime.css" /></head>')
  .replace('</body>', `<script>${runtimeSource}</script><script src="/navi-runtime.js"></script></body>`);

const sitemap = await fetchText(`${origin}/sitemap.xml`);
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const urls = [...new Set([...sitemapUrls, ...extraPaths.map((path) => `${origin}${path}`)])];
if (urls.length === 0) throw new Error('The Webstudio sitemap contains no URLs.');

await rm(snapshotsRoot, { recursive: true, force: true });
await mkdir(snapshotsRoot, { recursive: true });
await mkdir(publicRoot, { recursive: true });

await mkdir(join(publicRoot, 'social'), { recursive: true });
for (const [, [, icon]] of socialLabels) {
  const response = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons/icons/${icon}.svg`);
  if (!response.ok) throw new Error(`Unable to download ${icon} social icon.`);
  await writeFile(join(publicRoot, 'social', `${icon}.svg`), Buffer.from(await response.arrayBuffer()));
}

let cursor = 0;
const failures = [];
const workers = Array.from({ length: 8 }, async () => {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    const path = new URL(url).pathname.replace(/^\/+|\/+$/g, '');
    const target = path
      ? join(snapshotsRoot, path, 'index.html')
      : join(snapshotsRoot, '_root.html');
    try {
      const html = injectAstroRuntime(ensureBlogAlternates(
        normalizeDocumentLanguage(rewriteAssetUrls(await fetchPage(url)), path), path,
      ), path);
      collectLocalAssets(html);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, html);
      process.stdout.write('.');
    } catch (error) {
      failures.push({ url, error: String(error) });
      process.stdout.write('x');
    }
  }
});

await Promise.all(workers);

// Baserow occasionally returns an empty resource while many pages are imported in parallel.
// Recheck only empty article collections sequentially so localized tag pages stay complete.
for (const url of urls) {
  const path = new URL(url).pathname.replace(/^\/+|\/+$/g, '');
  if (!/^(ru|ua|en)\/(?:tags\/[^/]+|sailing-school)$/.test(path)) continue;
  const target = join(snapshotsRoot, path, 'index.html');
  const current = await readFile(target, 'utf8');
  if (current.includes('class="navi-post-card"')) continue;
  for (let attempt = 0; attempt < 4; attempt++) {
    const retryUrl = new URL(url);
    if (!retryUrl.pathname.endsWith('/')) retryUrl.pathname += '/';
    retryUrl.searchParams.set('_astro_collection_retry', `${Date.now()}-${attempt}`);
    const response = await fetch(retryUrl, { headers: { 'user-agent': 'Navi Astro migration/1.0' } });
    if (!response.ok) continue;
    const source = await response.text();
    if (!source.includes('field_4188340') && !source.includes('"Slug"')) continue;
    const refreshed = injectAstroRuntime(ensureBlogAlternates(
      normalizeDocumentLanguage(rewriteAssetUrls(source), path), path,
    ), path);
    collectLocalAssets(refreshed);
    await writeFile(target, refreshed);
    break;
  }
}

for (const locale of ['ru', 'ua', 'en']) {
  const path = `${locale}/inshore-skipper-sail`;
  const target = join(snapshotsRoot, path, 'index.html');
  const current = await readFile(target, 'utf8');
  if ((current.match(/role="tabpanel"/g) || []).length >= 4 && !current.includes('var results = undefined')) continue;
  for (let attempt = 0; attempt < 16; attempt++) {
    const retryUrl = new URL(`${origin}/${path}/`);
    retryUrl.searchParams.set('_astro_program_retry', `${Date.now()}-${attempt}`);
    const response = await fetch(retryUrl, { headers: { 'user-agent': 'Navi Astro migration/1.0' } });
    if (!response.ok) continue;
    const source = await response.text();
    if ((source.match(/role="tabpanel"/g) || []).length < 4 || source.includes('var results = undefined')) continue;
    const refreshed = injectAstroRuntime(normalizeDocumentLanguage(rewriteAssetUrls(source), path), path);
    collectLocalAssets(refreshed);
    await writeFile(target, refreshed);
    break;
  }
}

await rm(join(publicRoot, 'assets'), { recursive: true, force: true });
await rm(join(publicRoot, 'cgi/asset'), { recursive: true, force: true });
const assetPaths = [...localAssets];
let assetCursor = 0;
const assetFailures = [];
const assetWorkers = Array.from({ length: 8 }, async () => {
  while (assetCursor < assetPaths.length) {
    const assetPath = assetPaths[assetCursor++];
    try {
      const response = await fetch(`${origin}${assetPath}`);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const target = join(publicRoot, assetPath.split('?')[0]);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      assetFailures.push({ assetPath, error: String(error) });
    }
  }
});
await Promise.all(assetWorkers);
failures.push(...assetFailures);
await writeFile(join(publicRoot, 'sitemap.xml'), sitemap);
await writeFile(join(publicRoot, 'robots.txt'), await fetchText(`${origin}/robots.txt`));
await writeFile(
  join(snapshotsRoot, 'manifest.json'),
  JSON.stringify({ source: origin, importedAt: new Date().toISOString(), pages: urls.length, sitemapPages: sitemapUrls.length, assets: assetPaths.length, failures }, null, 2),
);

process.stdout.write(`\nImported ${urls.length - failures.length}/${urls.length} pages.\n`);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
