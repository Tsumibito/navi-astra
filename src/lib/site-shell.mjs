export const siteShellCopy = {
  ru: {
    home: 'Главная', travel: 'Путешествия', charter: 'Аренда яхт', routes: 'Маршруты', regions: 'Регионы плавания', blog: 'Блог', about: 'О нас', team: 'Команда', contacts: 'Контакты', encyclopedia: 'Яхтенная энциклопедия', school: 'Яхтенная школа', explore: 'Исследовать', port: 'Базовый порт', slogan: 'От берега<br/>к новому горизонту.', action: 'Спланировать путешествие', encyclopediaTitle: 'Море говорит на своём языке', encyclopediaBody: 'Понятный справочник яхтенных терминов: от устройства судна и ветра до навигации и безопасности.', encyclopediaAction: 'Открыть энциклопедию', navigation: 'Основная навигация', footer: 'Навигация и контакты', socials: 'Navi.training в социальных сетях', homeAria: 'Navi.training, главная', privacy: 'Политика конфиденциальности', cookie: 'Cookie Policy', menu: 'Меню', closeMenu: 'Закрыть меню', photoStrip: 'Фотографии яхтенных путешествий',
  },
  ua: {
    home: 'Головна', travel: 'Подорожі', charter: 'Оренда яхт', routes: 'Маршрути', regions: 'Регіони плавання', blog: 'Блог', about: 'Про нас', team: 'Команда', contacts: 'Контакти', encyclopedia: 'Яхтова енциклопедія', school: 'Яхтова школа', explore: 'Досліджувати', port: 'Базовий порт', slogan: 'Від берега<br/>до нового горизонту.', action: 'Спланувати подорож', encyclopediaTitle: 'Море говорить своєю мовою', encyclopediaBody: 'Зрозумілий довідник яхтових термінів: від будови судна й вітру до навігації та безпеки.', encyclopediaAction: 'Відкрити енциклопедію', navigation: 'Основна навігація', footer: 'Навігація та контакти', socials: 'Navi.training у соціальних мережах', homeAria: 'Navi.training, головна', privacy: 'Політика конфіденційності', cookie: 'Cookie Policy', menu: 'Меню', closeMenu: 'Закрити меню', photoStrip: 'Фотографії яхтових подорожей',
  },
  en: {
    home: 'Home', travel: 'Yacht travel', charter: 'Yacht charter', routes: 'Routes', regions: 'Sailing regions', blog: 'Journal', about: 'About', team: 'Team', contacts: 'Contacts', encyclopedia: 'Sailing encyclopedia', school: 'Sailing school', explore: 'Explore', port: 'Home port', slogan: 'From shore<br/>to a new horizon.', action: 'Plan a voyage', encyclopediaTitle: 'The sea has a language of its own', encyclopediaBody: 'A clear guide to sailing terms, from boat anatomy and wind to navigation and safety.', encyclopediaAction: 'Explore the encyclopedia', navigation: 'Main navigation', footer: 'Navigation and contacts', socials: 'Navi.training on social media', homeAria: 'Navi.training, home', privacy: 'Privacy Policy', cookie: 'Cookie Policy', menu: 'Menu', closeMenu: 'Close menu', photoStrip: 'Yacht travel photographs',
  },
};

export function renderSiteFooter(locale = 'ru') {
  const copy = siteShellCopy[locale] || siteShellCopy.en;
  const prefix = `/${locale}`;
  const homeHref = locale === 'ru' ? '/' : `${prefix}/home`;
  return `<footer class="navi-evo-footer" aria-label="${copy.footer}">
    <div class="navi-evo-footer__intro">
      <a class="navi-evo-footer__logo" href="${homeHref}" aria-label="${copy.homeAria}"><img src="/cgi/asset/65a273c4dc1efbe190fb4789_navi_logo_w_NybbEVNud_jdNz5SYGeb1.png" alt="Navi.training"/></a>
      <p class="navi-evo-kicker">Navi.training</p><h2>${copy.slogan}</h2><a class="navi-evo-contact" href="${prefix}/charter">${copy.action}</a>
      <div class="navi-evo-socials" aria-label="${copy.socials}">
        <a href="https://t.me/navi_training" target="_blank" rel="noopener" aria-label="Telegram"><img src="/social/telegram.svg" alt=""/></a><a href="https://www.facebook.com/navi.training" target="_blank" rel="noopener" aria-label="Facebook"><img src="/social/facebook.svg" alt=""/></a><a href="https://www.instagram.com/navi.training" target="_blank" rel="noopener" aria-label="Instagram"><img src="/social/instagram.svg" alt=""/></a><a href="https://linkedin.com/company/navi-training" target="_blank" rel="noopener" aria-label="LinkedIn"><img src="/social/linkedin.svg" alt=""/></a><a href="https://www.youtube.com/channel/UCNTYfzMJ05AUqYXN1mWdLcA" target="_blank" rel="noopener" aria-label="YouTube"><img src="/social/youtube.svg" alt=""/></a>
      </div>
    </div>
    <div class="navi-evo-footer__links"><p class="navi-evo-label">${copy.travel}</p><a href="${prefix}/charter">${copy.charter}</a><a href="${prefix}/tags/sailing-routes">${copy.routes}</a><a href="${prefix}/tags/sailing-regions">${copy.regions}</a></div>
    <div class="navi-evo-footer__links"><p class="navi-evo-label">${copy.explore}</p><a href="${prefix}/blog">${copy.blog}</a><a href="${prefix}/encyclopedia">${copy.encyclopedia}</a><a href="${prefix}/sailing-school">${copy.school}</a><a href="${prefix}/team/alex-burlakov">${copy.about}</a></div>
    <div class="navi-evo-footer__place"><p class="navi-evo-label">${copy.port}</p><strong>La Rochelle, France</strong><span>46.1603° N&nbsp;&nbsp;1.1511° W</span><address>5 Rue François Hennebique<br/>17140 Lagord, France</address></div>
    <div class="navi-evo-footer__bottom"><span>© MON NAVI</span><a href="${prefix}/privacy-policy">${copy.privacy}</a><a href="${prefix}/cookie-policy">${copy.cookie}</a></div>
  </footer>`;
}
