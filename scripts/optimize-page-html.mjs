const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const addAttribute = (tag, attribute) => tag.includes(`${attribute.split('=')[0]}=`)
  ? tag
  : /\s*\/>$/.test(tag)
    ? tag.replace(/\s*\/>$/, ` ${attribute}/>`)
    : tag.replace(/\s*>$/, ` ${attribute}>`);

const optimizeSailingSchoolPreloads = (html, path) => {
  if (!/^(ru|ua|en)\/sailing-school$/.test(path)) return html;

  return html.replace(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>/gi, (tag) => {
    const cleanTag = tag
      .replace(/\s+(?:media|fetchpriority)="[^"]*"/g, '')
      .replace(/\s+\/\s+(?:media|fetchpriority)="[^"]*"/g, '')
      .replace(/\s*\/>$/, '/>');
    if (tag.includes('im_head_1_mob')) {
      return addAttribute(addAttribute(cleanTag, 'media="(max-width: 767px)"'), 'fetchpriority="high"');
    }
    if (tag.includes('im_head_2_')) {
      return addAttribute(addAttribute(cleanTag, 'media="(min-width: 768px)"'), 'fetchpriority="high"');
    }
    return '';
  });
};

const improveAccessibility = (html, path) => {
  const locale = path.split('/')[0];
  const homeLabel = locale === 'ua' ? 'Головна Navi.training' : locale === 'en' ? 'Navi.training home' : 'Главная Navi.training';
  const currentPageLabel = locale === 'ua' ? 'Поточна сторінка' : locale === 'en' ? 'Current page' : 'Текущая страница';
  let output = html
    // Keep the modal/tracking hook without exposing a made-up ARIA role.
    .replaceAll('[role="formbutton"]', '[data-navi-formbutton]')
    .replace(/role="formbutton"/g, 'data-navi-formbutton="" role="button"')
    // IDs referenced by ARIA must not contain whitespace.
    .replace(/\b(id|aria-controls|aria-labelledby)="([^"]*\s[^"]*)"/g, (_, attribute, value) => (
      `${attribute}="${value.trim().replace(/\s+/g, '-')}"`
    ));

  output = output.replace(
    /<a(?![^>]*aria-label=)([^>]*)>(<img[^>]*navi_training_logo[^>]*>)<\/a>/gi,
    `<a aria-label="${homeLabel}"$1>$2</a>`,
  );
  output = output.replace(
    /<a(?![^>]*aria-label=)([^>]*aria-current="page"[^>]*)>/gi,
    `<a aria-label="${currentPageLabel}"$1>`,
  );

  if (!/<main\b/i.test(output)) {
    const navigationEnd = output.indexOf('</nav>');
    const footerStart = output.lastIndexOf('<footer');
    if (navigationEnd >= 0 && footerStart > navigationEnd) {
      output = `${output.slice(0, navigationEnd + 6)}<main id="main-content">${output.slice(navigationEnd + 6, footerStart)}</main>${output.slice(footerStart)}`;
    }
  }

  if (/^(ru|ua|en)\/sailing-school$/.test(path)) {
    output = output.replace(/<h4(\b[^>]*)>/g, '<h3$1>').replace(/<\/h4>/g, '</h3>');
  }
  return output;
};

export const optimizePageHtml = (html, path, { runtimeSource, runtimeStyles }) => {
  let output = html
    // A tracking pixel is not page content and must not compete with the LCP image.
    .replace(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*facebook\.com\/tr[^>]*>/gi, '')
    // Imported Cloudflare email decoders are unnecessary after addresses are rewritten.
    .replace(/<script\b[^>]*src="\/cdn-cgi\/scripts\/[^\"]*email-decode\.min\.js"[^>]*><\/script>/gi, '');

  // The phone widget is below the fold. Its CSS can safely finish after first paint.
  const phoneStylesheet = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/css/intlTelInput.css';
  if (output.includes(phoneStylesheet)) {
    output = output.replace(new RegExp(`<link\\b[^>]*href="${escapeRegExp(phoneStylesheet)}"[^>]*>`, 'g'), '');
    let previous;
    do {
      previous = output;
      output = output.replace(/<noscript>\s*<\/noscript>/g, '');
    } while (output !== previous);
    output = output.replace(
      '</head>',
      `<link href="${phoneStylesheet}" rel="stylesheet" media="print" onload="this.media='all'"/><noscript><link href="${phoneStylesheet}" rel="stylesheet"/></noscript></head>`,
    );
  }

  output = optimizeSailingSchoolPreloads(output, path);
  output = improveAccessibility(output, path);

  if (output.includes('baserow-backend-production20240528124524339000000001.s3.amazonaws.com')
      && !output.includes('rel="preconnect" href="https://baserow-backend-production20240528124524339000000001.s3.amazonaws.com"')) {
    output = output.replace(
      '</head>',
      '<link rel="preconnect" href="https://baserow-backend-production20240528124524339000000001.s3.amazonaws.com" crossorigin/></head>',
    );
  }

  // Older snapshots contain both an inline and an external copy of the same runtime.
  output = output
    .replace(new RegExp(`<script>${escapeRegExp(runtimeSource)}</script><script src="/navi-runtime\\.js"></script>`), '')
    .replace('<link rel="stylesheet" href="/navi-runtime.css" />', '')
    .replace('<script src="/navi-runtime.js" defer></script>', '<script src="/navi-runtime.js"></script>');

  output = output.replace(
    /<style data-navi-runtime>[\s\S]*?<\/style>/,
    `<style data-navi-runtime>${runtimeStyles}</style>`,
  );

  if (!output.includes('<style data-navi-runtime>')) {
    output = output.replace('</head>', `<style data-navi-runtime>${runtimeStyles}</style></head>`);
  }
  if (!output.includes('<script src="/navi-runtime.js"></script>')) {
    output = output.replace('</body>', '<script src="/navi-runtime.js"></script></body>');
  }

  return output;
};
