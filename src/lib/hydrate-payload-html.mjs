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
  const value = entry.seo?.json_ld || entry.seo?.jsonLd;
  if (!value) return '';
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return `<script id="navi-payload-jsonld" type="application/ld+json">${JSON.stringify(parsed).replaceAll('<', '\\u003c')}</script>`;
  } catch {
    return '';
  }
}

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
  output = replaceMeta(output, 'name', 'description', description);
  output = replaceMeta(output, 'property', 'og:title', title);
  output = replaceMeta(output, 'property', 'og:description', description);
  output = replaceMeta(output, 'property', 'og:url', `https://navi.training${entry.route}`);

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
