const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const runtimeUrl = '/navi-runtime.js?v=20260722-1315';
  const evolutionStyleUrl = '/navi-evolution-v1.css?v=20260722-1405';

const evolutionPageType = (path) => {
  if (/^(ru|ua|en)\/sailing-school$/.test(path)) return 'school';
  if (/^(ru|ua|en)\/blog$/.test(path)) return 'blog-index';
  if (/^(ru|ua|en)\/blog\/[^/]+$/.test(path)) return 'article';
  if (/^(ru|ua|en)\/tags$/.test(path)) return 'tags-index';
  if (/^(ru|ua|en)\/tags\/[^/]+$/.test(path)) return 'tag';
  if (/^(ru|ua|en)\/charter$/.test(path)) return 'charter';
  if (path === '' || /^(ru|ua|en)(\/|$)/.test(path)) return 'generic';
  return null;
};

const navigationCopy = {
  ru: {
    home: 'Главная', travel: 'Путешествия', charter: 'Аренда яхт', routes: 'Маршруты', regions: 'Регионы плавания', blog: 'Блог', about: 'О нас', team: 'Команда', contacts: 'Контакты', encyclopedia: 'Яхтенная энциклопедия', school: 'Яхтенная школа', explore: 'Исследовать', port: 'Базовый порт', slogan: 'От берега<br/>к новому горизонту.', action: 'Спланировать путешествие', encyclopediaTitle: 'Море говорит на своём языке', encyclopediaBody: 'Понятный справочник яхтенных терминов: от устройства судна и ветра до навигации и безопасности.', encyclopediaAction: 'Открыть энциклопедию', navigation: 'Основная навигация', footer: 'Навигация и контакты', socials: 'Navi.training в социальных сетях', homeAria: 'Navi.training, главная', privacy: 'Политика конфиденциальности', cookie: 'Cookie Policy', menu: 'Меню', closeMenu: 'Закрыть меню',
  },
  ua: {
    home: 'Головна', travel: 'Подорожі', charter: 'Оренда яхт', routes: 'Маршрути', regions: 'Регіони плавання', blog: 'Блог', about: 'Про нас', team: 'Команда', contacts: 'Контакти', encyclopedia: 'Яхтова енциклопедія', school: 'Яхтова школа', explore: 'Досліджувати', port: 'Базовий порт', slogan: 'Від берега<br/>до нового горизонту.', action: 'Спланувати подорож', encyclopediaTitle: 'Море говорить своєю мовою', encyclopediaBody: 'Зрозумілий довідник яхтових термінів: від будови судна й вітру до навігації та безпеки.', encyclopediaAction: 'Відкрити енциклопедію', navigation: 'Основна навігація', footer: 'Навігація та контакти', socials: 'Navi.training у соціальних мережах', homeAria: 'Navi.training, головна', privacy: 'Політика конфіденційності', cookie: 'Cookie Policy', menu: 'Меню', closeMenu: 'Закрити меню',
  },
  en: {
    home: 'Home', travel: 'Yacht travel', charter: 'Yacht charter', routes: 'Routes', regions: 'Sailing regions', blog: 'Journal', about: 'About', team: 'Team', contacts: 'Contacts', encyclopedia: 'Sailing encyclopedia', school: 'Sailing school', explore: 'Explore', port: 'Home port', slogan: 'From shore<br/>to a new horizon.', action: 'Plan a voyage', encyclopediaTitle: 'The sea has a language of its own', encyclopediaBody: 'A clear guide to sailing terms, from boat anatomy and wind to navigation and safety.', encyclopediaAction: 'Explore the encyclopedia', navigation: 'Main navigation', footer: 'Navigation and contacts', socials: 'Navi.training on social media', homeAria: 'Navi.training, home', privacy: 'Privacy Policy', cookie: 'Cookie Policy', menu: 'Menu', closeMenu: 'Close menu',
  },
};

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

const addBrandMetadata = (html) => {
  const iconMarkup = `<link rel="icon" type="image/png" sizes="48x48" href="/cgi/asset/Navi_logo_48x48_Jrw0nV6TLB6EdlDeYrhlw.png"/><link rel="apple-touch-icon" sizes="150x150" href="/cgi/asset/Navi_logo_150x150_C_9IEN2-7O865fBBu5MBc.png"/><link rel="manifest" href="/site.webmanifest"/><meta name="theme-color" content="#073746"/>`;
  return html
    .replace(/<link\b[^>]*rel="(?:shortcut )?icon"[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel="apple-touch-icon"[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel="manifest"[^>]*>/gi, '')
    .replace(/<meta\b[^>]*name="theme-color"[^>]*>/gi, '')
    .replace('</head>', `${iconMarkup}</head>`);
};

const improveAccessibility = (html, path) => {
  const locale = path.split('/')[0];
  const homeLabel = locale === 'ua' ? 'Головна Navi.training' : locale === 'en' ? 'Navi.training home' : 'Главная Navi.training';
  const currentPageLabel = locale === 'ua' ? 'Поточна сторінка' : locale === 'en' ? 'Current page' : 'Текущая страница';
  let output = html
    // Keep the modal/tracking hook without exposing a made-up ARIA role.
    .replaceAll('[role="formbutton"]', '[data-navi-formbutton]')
    .replace(/role="formbutton"/g, 'data-navi-formbutton="" role="button"')
    // Imported accordions have an inline toggle as well as the shared runtime.
    // Keep one source of truth so a click cannot open and immediately close.
    .replace(/(<button\b(?=[^>]*class="[^"]*\bw-item-trigger\b)[^>]*?)\s+onclick="[^"]*"([^>]*>)/g, '$1$2')
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

const addEvolutionLayer = (html, path) => {
  const pageType = evolutionPageType(path);
  if (!pageType) return html;

  const locale = path === '' ? 'ru' : path.split('/')[0];
  const copy = navigationCopy[locale] || navigationCopy.ru;
  const prefix = `/${locale}`;
  const homeHref = locale === 'ru' ? '/' : `${prefix}/home`;
  const currentCharter = path === `${locale}/charter` ? ' aria-current="page"' : '';
  const currentBlog = pageType === 'article' ? ' aria-current="page"' : '';
  const menu = `<div class="navi-evo-menu" role="navigation" aria-label="${copy.navigation}">
    <a href="${homeHref}">${copy.home}</a>
    <details>
      <summary>${copy.travel}</summary>
      <div class="navi-evo-submenu">
        <a href="${prefix}/charter">${copy.charter}</a>
        <a href="${prefix}/tags/sailing-routes">${copy.routes}</a>
        <a href="${prefix}/tags/sailing-regions">${copy.regions}</a>
      </div>
    </details>
    <a href="${prefix}/charter"${currentCharter}>${copy.charter}</a>
    <a href="${prefix}/blog"${currentBlog}>${copy.blog}</a>
    <a href="${prefix}/encyclopedia">${copy.encyclopedia}</a>
    <details>
      <summary>${copy.about}</summary>
      <div class="navi-evo-submenu">
        <a href="${prefix}/team/alex-burlakov">${copy.team}</a>
        <a href="mailto:alex@navi.training">${copy.contacts}</a>
      </div>
    </details>
  </div>
  <button class="navi-evo-mobile-toggle" type="button" aria-expanded="false" aria-controls="navi-evo-mobile-menu" aria-label="${copy.menu}"><span></span><span></span><span></span></button>
  <div class="navi-evo-mobile-menu" id="navi-evo-mobile-menu" hidden>
    <a href="${homeHref}">${copy.home}</a><a href="${prefix}/charter">${copy.charter}</a><a href="${prefix}/tags/sailing-routes">${copy.routes}</a><a href="${prefix}/blog">${copy.blog}</a><a href="${prefix}/encyclopedia">${copy.encyclopedia}</a><a href="${prefix}/sailing-school">${copy.school}</a>
  </div>`;
  const footer = `<footer class="navi-evo-footer" aria-label="${copy.footer}">
    <div class="navi-evo-footer__intro">
      <a class="navi-evo-footer__logo" href="${homeHref}" aria-label="${copy.homeAria}"><img src="/cgi/asset/65a273c4dc1efbe190fb4789_navi_logo_w_NybbEVNud_jdNz5SYGeb1.png" alt="Navi.training"/></a>
      <p class="navi-evo-kicker">Navi.training</p>
      <h2>${copy.slogan}</h2>
      <a class="navi-evo-contact" href="${prefix}/charter">${copy.action}</a>
      <div class="navi-evo-socials" aria-label="${copy.socials}">
        <a href="https://t.me/navi_training" target="_blank" rel="noopener" aria-label="Telegram"><img src="/social/telegram.svg" alt=""/></a>
        <a href="https://www.facebook.com/navi.training" target="_blank" rel="noopener" aria-label="Facebook"><img src="/social/facebook.svg" alt=""/></a>
        <a href="https://www.instagram.com/navi.training" target="_blank" rel="noopener" aria-label="Instagram"><img src="/social/instagram.svg" alt=""/></a>
        <a href="https://linkedin.com/company/navi-training" target="_blank" rel="noopener" aria-label="LinkedIn"><img src="/social/linkedin.svg" alt=""/></a>
        <a href="https://www.youtube.com/channel/UCNTYfzMJ05AUqYXN1mWdLcA" target="_blank" rel="noopener" aria-label="YouTube"><img src="/social/youtube.svg" alt=""/></a>
      </div>
    </div>
    <div class="navi-evo-footer__links">
      <p class="navi-evo-label">${copy.travel}</p>
      <a href="${prefix}/charter">${copy.charter}</a>
      <a href="${prefix}/tags/sailing-routes">${copy.routes}</a>
      <a href="${prefix}/tags/sailing-regions">${copy.regions}</a>
    </div>
    <div class="navi-evo-footer__links">
      <p class="navi-evo-label">${copy.explore}</p>
      <a href="${prefix}/blog">${copy.blog}</a>
      <a href="${prefix}/encyclopedia">${copy.encyclopedia}</a>
      <a href="${prefix}/sailing-school">${copy.school}</a>
      <a href="${prefix}/team/alex-burlakov">${copy.about}</a>
    </div>
    <div class="navi-evo-footer__place">
      <p class="navi-evo-label">${copy.port}</p>
      <strong>La Rochelle, France</strong>
      <span>46.1603° N&nbsp;&nbsp;1.1511° W</span>
      <address>5 Rue François Hennebique<br/>17140 Lagord, France</address>
    </div>
    <div class="navi-evo-footer__bottom"><span>© MON NAVI</span><a href="${prefix}/privacy-policy">${copy.privacy}</a><a href="${prefix}/cookie-policy">${copy.cookie}</a></div>
  </footer>`;

  let output = html
    .replace(/<figure class="navi-evo-article-hero-photo">[\s\S]*?<\/figure>/g, '')
    .replace(/\bnavi-evo-cta-panel\s*/g, '')
    .replace(/<div class="navi-evo-menu"[\s\S]*?<\/div><\/nav>/, '</nav>')
    .replace(/<section class="navi-evo-footer"[\s\S]*?<\/section>/, '')
    .replace(/<footer class="navi-evo-footer"[\s\S]*?<\/footer>/, '')
    .replace(/<link rel="stylesheet" href="\/navi-evolution-v1\.css\?v=[^"]*"\/>/, '')
    .replace(/\sdata-navi-evolution="v[1-6]"/i, '')
    .replace(/\sdata-navi-page="[^"]*"/i, '')
    .replace(/<body(\b[^>]*)>/i, `<body$1 data-navi-evolution="v6" data-navi-page="${pageType}">`)
    .replace('</head>', `<link rel="stylesheet" href="${evolutionStyleUrl}"/></head>`)
    .replace('</nav>', `${menu}</nav>`);

  if (path === '') {
    output = output
      .replace('<span class="w-text-1 c1pryads cchlovi">Наши направления</span> деятельности', '<span class="w-text-1 c1pryads cchlovi">Путешествия</span> и яхтенный чартер')
      .replace(/(<a[^>]*href=")\/ru\/sailing-school("[^>]*>[\s\S]*?)(Яхтенная школа)([\s\S]*?<\/a>)/, '$1/ru/charter$2Яхтенные путешествия$4');
  }

  if (path === '' || /^(ru|ua|en)\/home$/.test(path)) {
    output = output
      .replace(/mailto:alex@navi\.training\?subject=%D0%9F%D0%B5%D1%80%D0%B5%D0%B3%D0%BE%D0%BD\+%D1%8F%D1%85%D1%82%D1%8B/g, `${prefix}/yacht-delivery`)
      .replace(/mailto:alex@navi\.training\?subject=%D1%8F%D1%85%D1%82%D0%B5%D0%BD%D0%BD%D0%B0%D1%8F\+%D1%8D%D0%BA%D1%81%D0%BF%D0%B5%D1%80%D1%82%D0%B8%D0%B7%D0%B0/g, `${prefix}/yacht-expertise`);
  }

  output = output.replace(/<section(?:\s+data-evo-section="\d+")?\s+class="navi-home-encyclopedia"[\s\S]*?<\/section>/, '');

  const existingSectionIndices = [...output.matchAll(/data-evo-section="(\d+)"/g)].map((match) => Number(match[1]));
  let sectionIndex = existingSectionIndices.length ? Math.max(...existingSectionIndices) + 1 : 0;
  output = output.replace(/<section\b(?![^>]*data-evo-section)/g, () => `<section data-evo-section="${sectionIndex++}"`);
  const existingFooterIndices = [...output.matchAll(/data-evo-footer="(\d+)"/g)].map((match) => Number(match[1]));
  let footerIndex = existingFooterIndices.length ? Math.max(...existingFooterIndices) + 1 : 0;
  output = output.replace(/<footer\b(?![^>]*data-evo-footer)/g, () => `<footer data-evo-footer="${footerIndex++}"`);

  if (pageType === 'charter') {
    if (locale === 'ru') output = output.replace('>Нескольк цифр<', '>Несколько цифр<');
    output = output
      .replace(/(<section data-evo-section="0" class=")/, '$1navi-hero navi-hero--cinematic ')
      .replace(/(<section data-evo-section="1" class=")/, '$1navi-section navi-section--mist navi-section--cards ')
      .replace(/(<section data-evo-section="2" class=")/, '$1navi-section navi-panel navi-panel--sea navi-panel--stats ');
    output = output.replace(/(<section data-evo-section="1"[\s\S]*?<\/section>)/, (section) => (
      section.replace(/(<a\b[^>]*class=")([^"\n]*)("[^>]*>[\s\S]*?<img\b)/g, '$1navi-card navi-card--media $2$3')
    ));
    output = output.replace(/<section data-evo-section="\d+"[^>]*>\s*<\/section>/g, '');
    output = output.replace(/<footer\b[^>]*data-evo-footer="\d+"[^>]*>[\s\S]*?<\/footer>/g, (block) => {
      const photoCount = (block.match(/(?:^|_)l\d+(?:_|\.)/gi) || []).length;
      if (photoCount >= 6) return block.replace(/^<footer\b[^>]*>/, '<section class="navi-imported-photo-strip" aria-label="Sailing gallery">').replace(/<\/footer>$/, '</section>');
      return '';
    });
  }

  if (pageType === 'article') {
    output = output
      .replace('<div class="w-box cl0rqos ', '<div class="navi-evo-cta-panel w-box cl0rqos ')
      .replace(/<a([^>]*href="\/ua\/sailing-school\/?"[^>]*)>(Наша школа яхтингу)<\/a>/, (_, attributes, label) => (
        `<a${attributes.replace('class="', 'class="navi-evo-article-cta ')}>${label}</a>`
      ));
  }

  const lastFooterEnd = output.lastIndexOf('</footer>');
  const insertAt = lastFooterEnd >= 0 ? lastFooterEnd + 9 : output.lastIndexOf('</body>');
  if (insertAt >= 0) output = `${output.slice(0, insertAt)}${footer}${output.slice(insertAt)}`;
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
  output = addBrandMetadata(output);
  output = addEvolutionLayer(output, path);

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
    .replace(/<script src="\/navi-runtime\.js(?:\?v=[^"]*)?"(?: defer)?><\/script>/g, '');

  output = output.replace(
    /<style data-navi-runtime>[\s\S]*?<\/style>/,
    `<style data-navi-runtime>${runtimeStyles}</style>`,
  );

  if (!output.includes('<style data-navi-runtime>')) {
    output = output.replace('</head>', `<style data-navi-runtime>${runtimeStyles}</style></head>`);
  }
  if (!output.includes(`<script src="${runtimeUrl}"></script>`)) {
    output = output.replace('</body>', `<script src="${runtimeUrl}"></script></body>`);
  }

  return output;
};
