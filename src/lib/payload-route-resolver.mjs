const SITE_HOSTS = new Set(["navi.training", "www.navi.training"]);

const COLLECTION_META = {
  posts: { segment: "blog", legacyLocale: "ru" },
  "posts-new": { segment: "blog", legacyLocale: "ru" },
  tags: { segment: "tags", legacyLocale: "en" },
  "tags-new": { segment: "tags", legacyLocale: "en" },
  authors: { segment: "team", legacyLocale: "en" },
  team: { segment: "team", legacyLocale: "en" },
  "team-new": { segment: "team", legacyLocale: "en" },
};

const localePath = (locale) => (locale === "uk" || locale === "ua" ? "ua" : locale);

function translationsOf(record) {
  return record.translations ?? record.localizations ?? record.localized ?? {};
}

function translation(record, locale) {
  const translations = translationsOf(record);
  const normalized = locale === "ua" ? "uk" : locale;
  if (Array.isArray(translations)) {
    return translations.find((item) => (item.locale ?? item._locale) === normalized) ?? {};
  }
  return translations[normalized] ?? translations[locale] ?? {};
}

function publicSlug(record, collection) {
  const meta = COLLECTION_META[collection];
  if (!meta) throw new Error(`Unsupported Payload collection: ${collection}`);
  return (
    record.publicSlug ??
    record.public_slug ??
    translation(record, meta.legacyLocale).slug ??
    record.slug
  );
}

/**
 * Resolve a Payload document to its already-indexed public URL.
 *
 * Existing posts intentionally keep their RU slug in every locale, tags their
 * EN slug, and authors their stable publicSlug. Localized slugs remain editorial
 * data and may be used for brand-new documents only when no publicSlug exists.
 */
export function legacyRouteFor(record, collection, locale) {
  const meta = COLLECTION_META[collection];
  if (!meta) throw new Error(`Unsupported Payload collection: ${collection}`);
  const slug = publicSlug(record, collection);
  if (!slug) throw new Error(`Payload ${collection} document ${record.id ?? "<unknown>"} has no public slug`);
  return `/${localePath(locale)}/${meta.segment}/${slug}`;
}

/** Build localized-slug -> preserved-public-route aliases for SSG link rewriting. */
export function createLegacyRouteIndex(collections) {
  const aliases = new Map();
  const canonical = new Map();

  for (const [collection, records] of Object.entries(collections)) {
    const meta = COLLECTION_META[collection];
    if (!meta) continue;
    for (const record of records ?? []) {
      for (const locale of ["ru", "uk", "en"]) {
        const route = legacyRouteFor(record, collection, locale);
        const pathLocale = localePath(locale);
        const localizedSlug = translation(record, locale).slug;
        canonical.set(`${collection}:${record.id}:${locale}`, route);
        aliases.set(route, route);
        if (localizedSlug) aliases.set(`/${pathLocale}/${meta.segment}/${localizedSlug}`, route);
      }
    }
  }

  return { aliases, canonical };
}

/** Rewrite one Payload href while preserving query strings and fragments. */
export function rewritePayloadHref(href, routeIndex, base = "https://navi.training/") {
  if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) return href;

  let url;
  try {
    url = new URL(href, base);
  } catch {
    return href;
  }
  if (!SITE_HOSTS.has(url.hostname)) return href;

  const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
  const rewritten = routeIndex.aliases.get(normalizedPath);
  if (!rewritten) return href;

  const result = `${rewritten}${url.search}${url.hash}`;
  return /^https?:\/\//i.test(href) ? `https://navi.training${result}` : result;
}

/**
 * Rewrite link fields in a Payload Lexical/JSON value without mutating the API
 * response. This is deliberately schema-tolerant (url and href link fields).
 */
export function rewritePayloadLinks(value, routeIndex, base) {
  if (Array.isArray(value)) {
    return value.map((item) => rewritePayloadLinks(item, routeIndex, base));
  }
  if (!value || typeof value !== "object") return value;

  const copy = {};
  for (const [key, child] of Object.entries(value)) {
    copy[key] =
      (key === "url" || key === "href") && typeof child === "string"
        ? rewritePayloadHref(child, routeIndex, base)
        : rewritePayloadLinks(child, routeIndex, base);
  }
  return copy;
}
