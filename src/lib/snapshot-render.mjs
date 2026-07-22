import { isStandaloneCampaign } from './route-modes.mjs';
import { renderSiteFooter } from './site-shell.mjs';

const evolutionStylesheet = '/navi-evolution-v1.css?v=20260722-1725';

const canonicalUrlForRoute = (route) => route
  ? `https://navi.training/${route}/`
  : 'https://navi.training/';

const addKnownImageDimensions = (html) => html
  .replace(/<img(?![^>]*\bwidth=)([^>]*\bsrc="[^"]*?-(\d+)x(\d+)-[^">]+"[^>]*)>/gi, '<img width="$2" height="$3"$1>')
  .replace(/<img(?![^>]*\bwidth=)([^>]*\bsrc="[^"]*JTKOvtDbnkuOpdJaWp0QhopEmhf6eodU_bb0a9a63e4942bba38640fae5dcf0a9aa66367783133d2495e4b84127c86fb7c\.jpg"[^>]*)>/gi, '<img width="1400" height="655"$1>')
  .replace(/<img(?![^>]*\bwidth=)([^>]*\bsrc="[^"]*z7mEn3jFu3gRYD2JfHFZor5pbQUpasxI_b07ee5562135e87faf19ada06196e7f9df9457c907d54cfb578401b6bd70dddc\.jpg"[^>]*)>/gi, '<img width="256" height="258"$1>')
  .replace(/<img(?![^>]*\bwidth=)([^>]*class="[^"]*navi-social-icon[^"]*"[^>]*)>/gi, '<img width="24" height="24"$1>');

const normalizeSearchMetadata = (html, route) => {
  const canonical = canonicalUrlForRoute(route);
  return addKnownImageDimensions(html
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/gi, '')
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/gi, '')
    .replace(/(<head[^>]*>)/i, `$1\n<link rel="canonical" href="${canonical}" />\n<meta property="og:url" content="${canonical}" />`)
    .replace(/(<link rel="alternate"\s+hreflang="[^"]+"\s+href="https:\/\/navi\.training)(\/(?:ru|ua|en)\/[^"?#]*?)(?:\/)?(?:\?[^"#]*)?("\s*\/?>)/gi, (_, start, path, end) => `${start}${path.replace(/\/$/, '')}/${end}`)
    .replace(/<script\s+src="https:\/\/code\.jquery\.com\/jquery-latest\.min\.js"\s*><\/script>/gi, ''));
};

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
  const normalizedHtml = normalizeSearchMetadata(rawHtml, normalizedRoute);
  if (isStandaloneCampaign(normalizedRoute)) {
    return normalizedHtml
      .replace(/<footer class="navi-evo-footer"[\s\S]*?<\/footer>/, '')
      .replace(/<link rel="stylesheet" href="\/navi-evolution-v1\.css\?v=[^"]*"\/>/, '')
      .replace(/\sdata-navi-evolution="v\d+"/i, '')
      .replace(/\sdata-navi-page="[^"]*"/i, '');
  }

  const locale = normalizedRoute.match(/^(ru|ua|en)(?:\/|$)/)?.[1] || 'ru';
  return restoreCharterCardGrid(
    normalizedHtml.replace(/<footer class="navi-evo-footer"[\s\S]*?<\/footer>/, renderSiteFooter(locale)),
    normalizedRoute,
  );
};
