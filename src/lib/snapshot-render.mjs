import { isStandaloneCampaign } from './route-modes.mjs';
import { renderSiteFooter } from './site-shell.mjs';

const evolutionStylesheet = '/navi-evolution-v1.css?v=20260722-1725';

const restoreCharterCardGrid = (html, route) => {
  if (!/^(ru|ua|en)\/charter$/.test(route)) return html;
  return html
    .replace(/\/navi-evolution-v1\.css\?v=[^"]*/, evolutionStylesheet)
    .replace(
      /(<div class=")([^"\n]*)(">)(?=<a\b[^>]*class="[^"]*navi-card--media)/,
      '$1navi-card-grid $2$3',
    );
};

export const renderSnapshotHtml = (rawHtml, route = '') => {
  const normalizedRoute = route.replace(/^\/+|\/+$/g, '');
  if (isStandaloneCampaign(normalizedRoute)) {
    return rawHtml
      .replace(/<footer class="navi-evo-footer"[\s\S]*?<\/footer>/, '')
      .replace(/<link rel="stylesheet" href="\/navi-evolution-v1\.css\?v=[^"]*"\/>/, '')
      .replace(/\sdata-navi-evolution="v\d+"/i, '')
      .replace(/\sdata-navi-page="[^"]*"/i, '');
  }

  const locale = normalizedRoute.match(/^(ru|ua|en)(?:\/|$)/)?.[1] || 'ru';
  return restoreCharterCardGrid(
    rawHtml.replace(/<footer class="navi-evo-footer"[\s\S]*?<\/footer>/, renderSiteFooter(locale)),
    normalizedRoute,
  );
};
