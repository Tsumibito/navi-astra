const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function renderChildren(node) {
  return (node?.children || []).map(renderNode).join('');
}

function renderNode(node) {
  if (!node) return '';
  if (node.type === 'text') {
    let value = escapeHtml(node.text || '');
    if (node.format & 1) value = `<strong>${value}</strong>`;
    if (node.format & 2) value = `<em>${value}</em>`;
    if (node.format & 8) value = `<u>${value}</u>`;
    if (node.format & 16) value = `<code>${value}</code>`;
    return value;
  }
  const children = renderChildren(node);
  if (node.type === 'root') return children;
  if (node.type === 'paragraph') return `<p>${children}</p>`;
  if (node.type === 'heading') return `<${node.tag || 'h2'}>${children}</${node.tag || 'h2'}>`;
  if (node.type === 'quote') return `<blockquote>${children}</blockquote>`;
  if (node.type === 'list') return `<${node.tag === 'ol' ? 'ol' : 'ul'}>${children}</${node.tag === 'ol' ? 'ol' : 'ul'}>`;
  if (node.type === 'listitem') return `<li>${children}</li>`;
  if (node.type === 'link' || node.type === 'autolink') {
    const href = node.fields?.url || node.url || '#';
    return `<a href="${escapeHtml(href)}">${children}</a>`;
  }
  if (node.type === 'linebreak') return '<br>';
  if (node.type === 'upload' && node.value && typeof node.value === 'object') {
    const source = node.value.url || node.value.filename;
    if (!source) return '';
    return `<figure><img src="${escapeHtml(source)}" alt="${escapeHtml(node.value.alt || '')}" loading="lazy"></figure>`;
  }
  return children;
}

function closingDiv(html, openingEnd) {
  const token = /<div\b[^>]*>|<\/div>/gi;
  token.lastIndex = openingEnd + 1;
  let depth = 1;
  for (let match; (match = token.exec(html));) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return { start: match.index, end: token.lastIndex };
  }
  return null;
}

function replaceMeta(html, attribute, attributeValue, value) {
  if (!value) return html;
  const pattern = new RegExp(`(<meta\\s+[^>]*${attribute}=["']${attributeValue}["'][^>]*content=["'])[^"']*(["'][^>]*>)`, 'i');
  return html.replace(pattern, `$1${escapeHtml(value)}$2`);
}

function payloadJSONLD(entry) {
  const value = entry.kind === 'author'
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        url: `https://navi.training${entry.route}`,
        mainEntity: {
          '@type': 'Person',
          name: entry.name,
          jobTitle: entry.position || undefined,
          description: entry.summary || undefined,
          image: entry.image?.url || undefined,
          url: `https://navi.training${entry.route}`,
          sameAs: (entry.links || []).map((link) => link?.url).filter((url) => /^https?:/i.test(url || '')),
        },
      }
    : entry.seo?.json_ld || entry.seo?.jsonLd;
  if (!value) return '';
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return `<script id="navi-payload-jsonld" type="application/ld+json">${JSON.stringify(parsed).replaceAll('<', '\\u003c')}</script>`;
  } catch {
    return '';
  }
}

const authorLabels = {
  ru: { back: 'Команда Navi.training', contact: 'Связаться', articles: 'Статьи автора', read: 'Читать статью' },
  uk: { back: 'Команда Navi.training', contact: 'Зв’язатися', articles: 'Статті автора', read: 'Читати статтю' },
  en: { back: 'The Navi.training team', contact: 'Contact', articles: 'Articles by the author', read: 'Read article' },
};

function authorProfileBlock(entry) {
  const labels = authorLabels[entry.locale] || authorLabels.en;
  const image = entry.image?.sizes?.card?.url || entry.image?.url || '';
  const links = (entry.links || []).filter((link) => link?.url);
  const contactLinks = links.map((link) => {
    const label = link.service === 'email' ? 'Email' : link.service === 'phone' ? 'Phone' : link.service || labels.contact;
    const external = /^https?:/i.test(link.url) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a class="navi-author-contact" href="${escapeHtml(link.url)}"${external}>${escapeHtml(label)}</a>`;
  }).join('');
  const bio = entry.bio?.root ? renderNode(entry.bio.root) : '';
  return `<section data-evo-section="0" class="navi-author-hero">
    <div class="navi-author-card">
      <a class="navi-author-back" href="/${entry.locale === 'uk' ? 'ua' : entry.locale}/team/">← ${labels.back}</a>
      <div class="navi-author-intro">
        ${image ? `<img class="navi-author-photo" src="${escapeHtml(image)}" alt="${escapeHtml(entry.image?.alt || entry.name)}">` : ''}
        <div>
          <h1>${escapeHtml(entry.name)}</h1>
          ${entry.position ? `<p class="navi-author-role">${escapeHtml(entry.position)}</p>` : ''}
          ${entry.summary ? `<p class="navi-author-summary">${escapeHtml(entry.summary)}</p>` : ''}
          ${contactLinks ? `<nav class="navi-author-contacts" aria-label="${labels.contact}">${contactLinks}</nav>` : ''}
        </div>
      </div>
      ${bio ? `<div class="navi-author-bio">${bio}</div>` : ''}
    </div>
  </section>`;
}

function authorPostsBlock(entry) {
  const posts = entry.relatedPosts || [];
  if (!posts.length) return '';
  const labels = authorLabels[entry.locale] || authorLabels.en;
  const cards = posts.map((post) => {
    const image = post.image?.sizes?.card?.url || post.image?.url || '';
    return `<article class="navi-author-post"><a href="${escapeHtml(post.route)}">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.imageAlt || post.name)}" loading="lazy">` : ''}
      <div><h3>${escapeHtml(post.name)}</h3>${post.summary ? `<p>${escapeHtml(post.summary)}</p>` : ''}<span>${labels.read} →</span></div>
    </a></article>`;
  }).join('');
  return `<section data-evo-section="1" class="navi-author-posts"><h2>${labels.articles}</h2><div class="navi-author-post-grid">${cards}</div></section>`;
}

const authorStyles = `<style id="navi-author-profile-style">
.navi-author-hero{box-sizing:border-box;min-height:760px;padding:clamp(110px,13vw,190px) 24px 96px;background:linear-gradient(rgba(5,37,48,.64),rgba(5,37,48,.82)),url('/cgi/asset/65f895a245162e324f6c32a4_im_head_2_Dp2AJPQEXOEYLvCklmCON.jpg') center/cover fixed;color:#073746}
.navi-author-card{box-sizing:border-box;width:min(920px,100%);margin:auto;padding:clamp(30px,6vw,72px);border-radius:28px;background:rgba(255,255,255,.96);box-shadow:0 28px 80px rgba(0,28,38,.28)}
.navi-author-back{display:inline-block;margin-bottom:34px;color:#7f4707;font:700 13px/1.2 Arial,sans-serif;text-decoration:none}
.navi-author-intro{display:grid;grid-template-columns:180px minmax(0,1fr);gap:38px;align-items:center}
.navi-author-photo{width:180px;height:180px;border:7px solid #fff;border-radius:50%;object-fit:cover;box-shadow:0 12px 32px rgba(7,55,70,.2)}
.navi-author-card h1{margin:0;color:#073746;font:400 clamp(42px,7vw,76px)/.98 'Tenor Sans',Arial,sans-serif}
.navi-author-role{margin:16px 0 0;color:#b45d00;font:700 14px/1.45 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
.navi-author-summary{max-width:58ch;margin:20px 0 0;color:#405c65;font:18px/1.65 Arial,sans-serif}
.navi-author-contacts{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.navi-author-contact{padding:10px 16px;border:1px solid #b9cbce;border-radius:999px;color:#073746;font:700 13px/1 Arial,sans-serif;text-decoration:none}.navi-author-contact:hover{border-color:#f0a147;background:#fff4e7}
.navi-author-bio{max-width:760px;margin:48px auto 0;padding-top:42px;border-top:1px solid #d6e0e2;color:#183f4b;font:17px/1.72 Arial,sans-serif}.navi-author-bio h2{margin:2.1em 0 .65em;color:#073746;font:400 clamp(28px,4vw,42px)/1.1 'Tenor Sans',Arial,sans-serif}.navi-author-bio h2:first-child{margin-top:0}.navi-author-bio p{margin:0 0 1.2em}.navi-author-bio li{margin:.65em 0}.navi-author-bio a{color:#9b5000;text-underline-offset:3px}
.navi-author-posts{box-sizing:border-box;padding:clamp(72px,9vw,120px) max(24px,calc((100vw - 1180px)/2));background:#f3f7f7;color:#073746}.navi-author-posts>h2{margin:0 0 42px;font:400 clamp(38px,6vw,66px)/1 'Tenor Sans',Arial,sans-serif}.navi-author-post-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.navi-author-post{overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 12px 36px rgba(7,55,70,.1)}.navi-author-post a{display:flex;height:100%;flex-direction:column;color:inherit;text-decoration:none}.navi-author-post img{width:100%;aspect-ratio:16/9;object-fit:cover}.navi-author-post div{display:flex;flex:1;flex-direction:column;padding:24px}.navi-author-post h3{margin:0;font:400 25px/1.16 'Tenor Sans',Arial,sans-serif}.navi-author-post p{color:#536b73;line-height:1.55}.navi-author-post span{margin-top:auto;padding-top:18px;color:#9b5000;font-weight:700}
@media(max-width:760px){.navi-author-hero{padding:90px 14px 60px;background-attachment:scroll}.navi-author-card{border-radius:20px}.navi-author-intro{grid-template-columns:1fr}.navi-author-photo{width:140px;height:140px}.navi-author-post-grid{grid-template-columns:1fr}.navi-author-bio{margin-top:36px;padding-top:32px}}
</style>`;

const faqLabels = {
  ru: { title: 'Частые вопросы', intro: 'Короткие ответы по теме' },
  uk: { title: 'Поширені запитання', intro: 'Короткі відповіді за темою' },
  en: { title: 'Frequently asked questions', intro: 'Short answers about this topic' },
};

function faqBlock(entry) {
  const faqs = (entry.faqs || []).filter((faq) => faq?.question && faq?.answer?.root);
  if (!faqs.length) return { html: '', jsonLD: '' };
  const labels = faqLabels[entry.locale] || faqLabels.en;
  const items = faqs.map((faq) => `<details><summary>${escapeHtml(faq.question)}<span aria-hidden="true">+</span></summary><div class="navi-payload-faq__answer">${renderNode(faq.answer.root)}</div></details>`).join('');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: renderNode(faq.answer.root).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() },
    })),
  };
  return {
    html: `<!-- navi-payload-faq:start --><section class="navi-payload-faq" aria-labelledby="navi-payload-faq-title-${escapeHtml(entry.id)}"><header><h2 id="navi-payload-faq-title-${escapeHtml(entry.id)}">${labels.title}</h2><p>${labels.intro}</p></header><div class="navi-payload-faq__items">${items}</div></section><!-- navi-payload-faq:end -->`,
    jsonLD: `<script id="navi-payload-faq-jsonld" type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`,
  };
}

export function hydratePayloadHtml(html, entry) {
  if (!entry) return html;
  const title = entry.seo?.metaTitle || entry.seo?.title || entry.name;
  const description = entry.seo?.metaDescription || entry.seo?.description || entry.summary;
  let output = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<h1(\b[^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${escapeHtml(entry.name)}</h1>`);
  if (/<meta\s+[^>]*name=["']viewport["'][^>]*>/i.test(output)) {
    output = output.replace(/<meta\s+[^>]*name=["']viewport["'][^>]*>/i, '<meta name="viewport" content="width=device-width, initial-scale=1">');
  } else {
    output = output.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1">');
  }
  output = replaceMeta(output, 'name', 'description', description);
  output = replaceMeta(output, 'property', 'og:title', title);
  output = replaceMeta(output, 'property', 'og:description', description);
  output = replaceMeta(output, 'property', 'og:url', `https://navi.training${entry.route}`);

  if (entry.kind === 'author') {
    output = output
      .replace(/<div class="w-html-embed"><script type="application\/ld\+json">[\s\S]*?<\/script><\/div>/i, '')
      .replace(/<script>window\.__remixContext = [\s\S]*?<\/script>/i, '')
      .replace(/<section data-evo-section="0"[\s\S]*?<\/section>/i, authorProfileBlock(entry))
      .replace(/<section data-evo-section="1"[\s\S]*?<\/section>/i, authorPostsBlock(entry))
      .replace(/<section data-evo-section="2"[\s\S]*?<\/section>/i, '');
    if (!output.includes('id="navi-author-profile-style"')) output = output.replace('</head>', `${authorStyles}</head>`);
  }

  if (entry.kind === 'post' && entry.content?.root) {
    const articleStart = output.indexOf('<article');
    const articleEnd = output.indexOf('</article>', articleStart);
    if (articleStart >= 0 && articleEnd > articleStart) {
      const embedStart = output.indexOf('<div class="w-markdown-embed', articleStart);
      if (embedStart >= 0 && embedStart < articleEnd) {
        const openingEnd = output.indexOf('>', embedStart);
        const close = closingDiv(output, openingEnd);
        if (close && close.start < articleEnd) {
          const content = renderNode(entry.content.root);
          output = `${output.slice(0, openingEnd + 1)}${content}${output.slice(close.start)}`;
        }
      }
    }
  }
  if (entry.kind === 'post') {
    const travelCta = entry.locale === 'ru'
      ? { title: 'Мечтаете отправиться в яхтенное путешествие?', body: 'Выберите маршрут и яхту для путешествия, которое запомнится надолго.', action: 'Спланировать путешествие', href: '/ru/charter' }
      : entry.locale === 'uk'
        ? { title: 'Мрієте вирушити у яхтову подорож?', body: 'Оберіть маршрут і яхту для подорожі, яку захочеться повторити.', action: 'Спланувати подорож', href: '/ua/charter' }
        : { title: 'Dreaming of a yacht journey?', body: 'Choose a route and a yacht for a journey worth remembering.', action: 'Plan your journey', href: '/en/charter' };
    output = output
      .replace(/Мечтаете научиться управлять яхтой\?|Мрієте навчитися керувати яхтою\?|Dream(?:ing)? of learning to sail(?: a yacht)?\?/gi, travelCta.title)
      .replace(/Обращайтесь, у нас всегда есть программа которая подойдет именно вам|Звертайтеся, у нас завжди є програма яка підійде саме вам|Contact us, we always have a program that is right for you/gi, travelCta.body)
      .replace(/Наша Яхтенная Школа|Наша школа яхтингу|Our sailing school/g, travelCta.action)
      .replace(/<a href="\/(?:ru|ua|en)\/sailing-school"([\s\S]*?)<\/a>/g, (link) => link.includes(travelCta.action) ? link.replace(/href="[^"]+"/, `href="${travelCta.href}"`) : link);
  }
  const jsonLD = payloadJSONLD(entry);
  if (jsonLD) {
    output = output.replace(/<script id="navi-payload-jsonld"[\s\S]*?<\/script>/i, '');
    output = output.replace('</head>', `${jsonLD}</head>`);
  }
  output = output
    .replace(/<!-- navi-payload-faq:start -->[\s\S]*?<!-- navi-payload-faq:end -->/g, '')
    .replace(/<script id="navi-payload-faq-jsonld"[\s\S]*?<\/script>/i, '');
  const faq = faqBlock(entry);
  if (faq.html) {
    if (entry.kind === 'post' && output.includes('</article>')) output = output.replace('</article>', `</article>${faq.html}`);
    else output = output.replace(/<footer\b/, `${faq.html}<footer`);
    output = output.replace('</head>', `${faq.jsonLD}</head>`);
  }
  const marker = `<meta name="navi-content-source" content="payload:${entry.kind}:${entry.id}:${entry.locale}">`;
  return output.includes('name="navi-content-source"') ? output : output.replace('</head>', `${marker}</head>`);
}
