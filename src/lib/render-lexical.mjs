const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function safeHref(value = '') {
  const href = String(value).trim();
  return /^(?:https?:\/\/|mailto:|tel:|\/|#)/i.test(href) ? href : '#';
}

export function renderLexical(node) {
  if (!node) return '';
  if (node.root) return renderLexical(node.root);
  if (Array.isArray(node)) return node.map(renderLexical).join('');
  if (node.type === 'text') {
    let value = escapeHtml(node.text || '');
    if (node.format & 1) value = `<strong>${value}</strong>`;
    if (node.format & 2) value = `<em>${value}</em>`;
    if (node.format & 8) value = `<u>${value}</u>`;
    if (node.format & 16) value = `<code>${value}</code>`;
    return value;
  }
  const children = renderLexical(node.children || []);
  if (node.type === 'root') return children;
  if (node.type === 'paragraph') return `<p>${children}</p>`;
  if (node.type === 'heading') {
    const tag = ['h2', 'h3', 'h4'].includes(node.tag) ? node.tag : 'h2';
    return `<${tag}>${children}</${tag}>`;
  }
  if (node.type === 'quote') return `<blockquote>${children}</blockquote>`;
  if (node.type === 'list') return `<${node.tag === 'ol' ? 'ol' : 'ul'}>${children}</${node.tag === 'ol' ? 'ol' : 'ul'}>`;
  if (node.type === 'listitem') return `<li>${children}</li>`;
  if (node.type === 'link' || node.type === 'autolink') {
    const href = escapeHtml(safeHref(node.fields?.url || node.url));
    return `<a href="${href}">${children}</a>`;
  }
  if (node.type === 'linebreak') return '<br>';
  if (node.type === 'upload') {
    const v = node.value || {};
    const sizes = v.sizes || {};
    const src = sizes.post?.url || sizes.card?.url || sizes.og?.url || v.url || v.thumbnailURL;
    if (!src) return '';
    const srcSet = [sizes.card, sizes.post, { url: v.url, width: v.width }]
      .filter(Boolean)
      .filter((s) => s.url && s.width)
      .filter((s, i, a) => a.findIndex((x) => x.url === s.url) === i)
      .sort((a, b) => a.width - b.width)
      .map((s) => `${escapeHtml(s.url)} ${s.width}w`)
      .join(', ');
    const sizesAttr = '(max-width: 760px) 100vw, 760px';
    const alt = escapeHtml(v.alt || '');
    const w = v.width ? ` width="${v.width}"` : '';
    const h = v.height ? ` height="${v.height}"` : '';
    return `<figure><img src="${escapeHtml(src)}" alt="${alt}"${w}${h} loading="lazy" decoding="async"${srcSet ? ` srcset="${srcSet}" sizes="${sizesAttr}"` : ''} /></figure>`;
  }
  return children;
}

export function lexicalText(value) {
  const visit = (node) => {
    if (!node) return '';
    if (node.root) return visit(node.root);
    if (Array.isArray(node)) return node.map(visit).join(' ');
    if (node.type === 'text') return node.text || '';
    return visit(node.children || []);
  };
  return visit(value).replace(/\s+/g, ' ').trim();
}
