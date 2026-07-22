import fs from 'node:fs/promises';
import path from 'node:path';

const apiUrl = process.env.PAYLOAD_API_URL;
const apiKey = process.env.PAYLOAD_SSG_API_KEY;
if (!apiUrl || !apiKey) throw new Error('PAYLOAD_API_URL and PAYLOAD_SSG_API_KEY are required for the SSG build');

const locales = ['ru', 'uk', 'en'];
const routeLocales = { ru: 'ru', uk: 'ua', en: 'en' };
const collections = [
  { slug: 'posts-new', segment: 'blog', kind: 'post' },
  { slug: 'tags-new', segment: 'tags', kind: 'tag' },
  { slug: 'team-new', segment: 'team', kind: 'author' },
];
const legacyOverrides = {
  post: { 21: 'vidy-parusnyh-yaht---raznovidnosti-i-otlichiya' },
  author: { 11: 'alex-burlakov', 10: 'andrii-gov', 9: 'evgenia-pilgun' },
};

function lexicalText(value) {
  const visit = (node) => {
    if (!node) return '';
    if (Array.isArray(node)) return node.map(visit).join(' ');
    if (node.type === 'text') return node.text || '';
    return visit(node.children || node.root?.children || []);
  };
  return visit(value?.root || value).replace(/\s+/g, ' ').trim();
}

function relationshipIds(value) {
  return (value || []).flatMap((relation) => {
    const item = relation?.value ?? relation;
    const id = typeof item === 'object' ? item?.id : item;
    return id == null ? [] : [id];
  });
}

async function fetchCollection(slug, locale, depth) {
  const docs = [];
  let page = 1;
  let hasNextPage = true;
  while (hasNextPage) {
    const url = new URL(`/api/${slug}`, apiUrl);
    url.searchParams.set('limit', '100');
    url.searchParams.set('page', String(page));
    url.searchParams.set('depth', String(depth));
    url.searchParams.set('locale', locale);
    const response = await fetch(url, { headers: { 'x-navi-ssg-key': apiKey } });
    if (!response.ok) throw new Error(`Payload ${slug}/${locale}: HTTP ${response.status}`);
    const body = await response.json();
    docs.push(...body.docs);
    hasNextPage = Boolean(body.hasNextPage);
    page = body.nextPage || page + 1;
  }
  return docs;
}

const localized = {};
for (const collection of collections) {
  localized[collection.kind] = {};
  for (const locale of locales) {
    const docs = await fetchCollection(collection.slug, locale, collection.kind === 'post' ? 1 : 0);
    for (const doc of docs) {
      localized[collection.kind][doc.id] ??= {};
      localized[collection.kind][doc.id][locale] = doc;
    }
  }
}

const entries = [];
const routeAliases = new Map();
for (const collection of collections) {
  for (const translations of Object.values(localized[collection.kind])) {
    // Migrated SEO contract: posts used the RU slug, tags used the EN slug and
    // author slugs were language-neutral. Existing routes are the publication gate.
    const candidates = [...new Set([
      translations.ru?.publicSlug, translations.en?.publicSlug, translations.uk?.publicSlug,
      translations.ru?.slug, translations.en?.slug, translations.uk?.slug,
    ].filter(Boolean))];
    const documentId = translations.ru?.id ?? translations.en?.id ?? translations.uk?.id;
    let legacySlug = legacyOverrides[collection.kind]?.[documentId];
    for (const candidate of candidates) {
      for (const routeLocale of Object.values(routeLocales)) {
        try {
          await fs.access(path.resolve(`src/snapshots/${routeLocale}/${collection.segment}/${candidate}/index.html`));
          legacySlug = candidate;
          break;
        } catch { /* try the next stable candidate */ }
      }
      if (legacySlug) break;
    }
    // Team profiles did not historically have an index and future members may
    // not have a Webstudio snapshot. They still need a stable SSG route.
    if (!legacySlug && collection.kind === 'author') legacySlug = candidates[0];
    if (!legacySlug) continue;
    for (const locale of locales) {
      const pathLocale = routeLocales[locale];
      const localizedSlug = translations[locale]?.slug;
      if (localizedSlug) routeAliases.set(`/${pathLocale}/${collection.segment}/${localizedSlug}`, `/${pathLocale}/${collection.segment}/${legacySlug}`);
    }
    for (const locale of locales) {
      const doc = translations[locale];
      if (!doc) continue;
      const slug = legacySlug;
      if (!slug) continue;
      entries.push({
        kind: collection.kind,
        locale,
        route: `/${routeLocales[locale]}/${collection.segment}/${slug}/`,
        id: doc.id,
        name: doc.name,
        summary: collection.kind === 'author'
          ? lexicalText(doc.bio_summary)
          : doc.summary || doc.description || '',
        content: collection.kind === 'author' ? doc.bio || null : doc.content || null,
        seo: doc.seo || {},
        image: collection.kind === 'author' ? doc.photo || null : doc.image || null,
        position: doc.position || '',
        bioSummary: doc.bio_summary || null,
        bio: doc.bio || null,
        links: doc.links || [],
        order: doc.order ?? 0,
        postIds: collection.kind === 'author' ? relationshipIds(doc.posts) : [],
        authors: doc.authors || [],
        tags: doc.tags || [],
        faqs: doc.faqs || [],
        imageAlt: doc.imageAlt || '',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      });
    }
  }
}

function rewriteLinks(value) {
  if (Array.isArray(value)) return value.map(rewriteLinks);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => {
    if ((key === 'url' || key === 'href') && typeof child === 'string') {
      try {
        const absolute = new URL(child, 'https://navi.training');
        if (['navi.training', 'www.navi.training'].includes(absolute.hostname)) {
          const normalized = absolute.pathname.replace(/\/+$/, '') || '/';
          const target = routeAliases.get(normalized);
          if (target) return [key, `${target}${absolute.search}${absolute.hash}`];
        }
      } catch { /* retain malformed editorial href for audit */ }
    }
    return [key, rewriteLinks(child)];
  }));
}

for (const entry of entries) entry.content = rewriteLinks(entry.content);

const glossaryDocs = await fetchCollection('glossary-terms', 'ru', 1);
const encyclopedia = glossaryDocs.flatMap((doc) => (doc.translations || []).flatMap((translation) => {
  if (translation.status !== 'approved' || !translation.slug || !translation.encyclopediaText) return [];
  const routeLocale = routeLocales[translation.locale];
  if (!routeLocale) return [];
  const categories = (doc.categories || []).map((category) => typeof category === 'object' ? category.id : category);
  const relatedTags = categories.flatMap((categoryId) => {
    const tag = localized.tag[categoryId]?.[translation.locale];
    if (!tag) return [];
    const stableEntry = entries.find((entry) => entry.kind === 'tag' && entry.locale === translation.locale && entry.id === categoryId);
    return stableEntry ? [{ id: categoryId, name: tag.name, route: stableEntry.route }] : [];
  });
  return [{
    id: doc.id,
    canonicalKey: doc.canonicalKey,
    locale: translation.locale,
    route: `/${routeLocale}/encyclopedia/${translation.slug}/`,
    term: translation.term,
    aliases: (translation.aliases || []).map(({ value }) => value),
    definition: translation.definition || '',
    content: translation.encyclopediaText,
    usageNotes: translation.usageNotes || '',
    seoTitle: translation.seoTitle || translation.term,
    seoDescription: translation.seoDescription || translation.definition || '',
    imageAlt: translation.imageAlt || translation.term,
    illustration: doc.illustration || null,
    domain: doc.domain,
    categories,
    relatedTags,
    sources: (doc.sources || []).map(({ name, url, license, reusePolicy }) => ({ name, url, license, reusePolicy })),
    updatedAt: doc.updatedAt,
  }];
}));

entries.sort((a, b) => a.route.localeCompare(b.route));
encyclopedia.sort((a, b) => a.route.localeCompare(b.route));
const output = {
  source: apiUrl,
  generatedAt: new Date().toISOString(),
  counts: Object.fromEntries(collections.map(({ kind }) => [kind, entries.filter((entry) => entry.kind === kind).length])),
  entries,
  encyclopedia,
};
const target = path.resolve('src/data/payload-content.json');
await fs.writeFile(target, `${JSON.stringify(output)}\n`);
console.log(`Payload content synced: ${entries.length} localized pages (${JSON.stringify(output.counts)})`);
