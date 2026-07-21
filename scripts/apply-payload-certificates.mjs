import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const data = JSON.parse(await readFile(join(root, 'src/data/payload-certificates.json'), 'utf8'));
const escape = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const lexical = (value) => {
  const render = (node) => {
    if (!node) return '';
    if (node.type === 'text') {
      let text = escape(node.text).replace(/\\/g, '<br/>');
      if (node.format & 1) text = `<strong>${text}</strong>`;
      if (node.format & 2) text = `<em>${text}</em>`;
      return text;
    }
    const children = (node.children || []).map(render).join('');
    if (node.type === 'paragraph') return `<p>${children}</p>`;
    if (node.type === 'list') return `<${node.listType === 'number' ? 'ol' : 'ul'}>${children}</${node.listType === 'number' ? 'ol' : 'ul'}>`;
    if (node.type === 'listitem') return `<li>${children}</li>`;
    if (node.type === 'heading') return `<${node.tag || 'h3'}>${children}</${node.tag || 'h3'}>`;
    if (node.type === 'link') return `<a href="${escape(node.fields?.url || '#')}">${children}</a>`;
    return children;
  };
  return render(value?.root);
};

const closingDiv = (html, openEnd) => {
  const tokens = /<div\b|<\/div>/g;
  tokens.lastIndex = openEnd + 1;
  let depth = 1;
  for (let match; (match = tokens.exec(html));) {
    depth += match[0] === '</div>' ? -1 : 1;
    if (depth === 0) return match.index;
  }
  return -1;
};

const copy = {
  ru: { school: 'Пройти обучение по этой программе можно в школе Navi.training', cta: 'Записаться на курс' },
  uk: { school: 'Пройти навчання за цією програмою можна у школі Navi.training', cta: 'Записатися на курс' },
  en: { school: 'You can complete this programme at Navi.training sailing school', cta: 'Book the course' },
};

const certificatePanel = ({ certificate, item, locale, routeLocale }) => `
<div class="w-box cdemwpp c1b3w1jo cygw4y9 cuk625t c1pq9thf c5jlp6s cddo8 c1asvg2r c18lkjcg c1323h09 c1iqng9y czbkqtf" data-payload-certificate="${certificate.id}">
  <a href="#" class="w-box cz33b3q c1pkm2ub c1dgoupq c1ccnvu1">
    <img alt="ISSA Certificate ${escape(item.name)}" width="300" height="188" src="${escape(certificate.frontImage)}" class="w-image c15chqve c9gbpzd c1vlmgvj chdio7r cbi0451 c19p91xf cqki2z3 c2p1bej c1mzzadh c1tii2i2 cg6asij c1ov2pfo" sizes="100vw" decoding="async" loading="lazy"/>
  </a>
  <div class="w-box c5s1gsy c5xwrb4 crumcg9 c1qfuz5e c151j9wr c70nuf6 c17he2g3 c1d7vxvj c1u0vhvi">
    <h3 class="w-heading cbi0451 cauy5oq c12kwbt6 c1pzf9om cb7z7r cgrxvqm c166i2q5 coo7vsx">${escape(item.name)}</h3>
    <div class="w-markdown-embed c184ifw8 c118w3go covpzr1 c16phuu3 cnhcn81 cqn17cf">${lexical(item.description)}</div>
  </div>
  <div class="w-box czrujd2 c19yjq7l c19mlkf7 cxigwsq c1sn0kie c1o2sww5 corcot7 cmxtrx6 cn1rp76 c1y0vpch c10dvyte c1n3ug1l">
    <div class="w-markdown-embed cfo9219 cxdot8 covpzr1 c1unxyfx c1s8sxa4 c1ca8er4 cyhqd1k c1a265hb chn9zd4 c6fklmd c1qnl6dq">${lexical(item.requirements)}</div>
    <p class="w-paragraph c1wh9514 c184ifw8 cgrxvqm c1hbv2wj cxdot8 c19mb6n1 c47rmnr cnuezgx cmnqmoy c36idy5 clye8di cjduypj c1qdj0yn c1kcaglw ce3rzng">${copy[locale].school}</p>
    <div class="w-box c1ljd4y6 c1f8a37s c17fallg c733f6g cn4wbl5">
      <a href="/${routeLocale}/${escape(item.slug)}" class="w-link c8z0qqf c1w3dvzo c8am6oo c3t3i0 c1czdrvp c1djm0jv ceidqo1 cl2ovo3 ccvzq3m cxpwtqf c821emr c83gzdc chs31b7 c1i5dk4k c1vlmgvj c1tn6fw6 c12kwbt6 c1jhmvh3 c1gf7qnm cl0tcc4 czwpq9x c5ts0bn cgrxvqm covpzr1 cfo9219 c5jlp6s c1s7hyg1 cxmw781 c19p91xf chdio7r czhcakt c1dgoupq c1axi59t c1jo7zb9 c1ccnvu1 c16phuu3 cfibf5q c1s3z92 c1mwlgzx c18i0shf c693nah c5ye85y">${copy[locale].cta}</a>
    </div>
  </div>
</div>`;

let updated = 0;
for (const routeLocale of ['ru', 'ua', 'en']) for (const page of ['sailing-school', 'inshore-skipper-sail']) {
  const file = join(root, 'src/snapshots', routeLocale, page, 'index.html');
  let html = await readFile(file, 'utf8');
  const locale = routeLocale === 'ua' ? 'uk' : routeLocale;
  const allowedIds = page === 'sailing-school'
    ? new Set(data.certificates.map(({ id }) => id))
    : new Set(data.trainingCertificateIds?.[page] || data.certificates.map(({ id }) => id));
  for (const certificate of data.certificates) {
    if (!allowedIds.has(certificate.id)) continue;
    const item = certificate.translations[locale];
    const needles = [
      `content-${item.name}`,
      `content-${item.name.trim().replace(/\s+/g, '-')}`,
    ];
    let roleAt = html.indexOf('role="tabpanel"');
    while (roleAt >= 0) {
      const start = html.lastIndexOf('<div', roleAt);
      const end = html.indexOf('>', roleAt);
      if (needles.some((needle) => html.slice(start, end).includes(needle))) {
        const close = closingDiv(html, end);
        if (close < 0) throw new Error(`Unbalanced certificate panel: ${routeLocale}/${page}/${item.name}`);
        const content = certificatePanel({ certificate, item, locale, routeLocale });
        html = `${html.slice(0, end + 1)}${content}${html.slice(close)}`;
        updated++;
        break;
      }
      roleAt = html.indexOf('role="tabpanel"', end);
    }
  }
  await writeFile(file, html);
}
if (updated !== 27) throw new Error(`Expected to hydrate 27 certificate panels, hydrated ${updated}`);
console.log(`Applied Payload certificate content to ${updated} static panels.`);
