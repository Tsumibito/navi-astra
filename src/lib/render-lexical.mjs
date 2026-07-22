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
