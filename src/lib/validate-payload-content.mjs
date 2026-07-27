const ALLOWED_KINDS = new Set(['post', 'tag', 'author']);
const ALLOWED_LOCALES = new Set(['ru', 'uk', 'en']);
const ROUTE_PREFIX = { ru: '/ru/', uk: '/ua/', en: '/en/' };

export function validatePayloadContent({ entries, encyclopedia }) {
  const errors = [];
  if (!Array.isArray(entries) || entries.length === 0) {
    errors.push('entries must be a non-empty array');
    return errors;
  }

  const routes = new Set();
  const keys = new Set();
  for (const [index, entry] of entries.entries()) {
    const where = `entries[${index}]`;
    if (!ALLOWED_KINDS.has(entry.kind)) errors.push(`${where}: invalid kind ${entry.kind}`);
    if (!ALLOWED_LOCALES.has(entry.locale)) errors.push(`${where}: invalid locale ${entry.locale}`);
    if (entry.id == null) errors.push(`${where}: missing id`);
    if (!entry.name) errors.push(`${where}: missing name`);
    if (typeof entry.route !== 'string' || !entry.route) {
      errors.push(`${where}: missing route`);
    } else if (ALLOWED_LOCALES.has(entry.locale) && !entry.route.startsWith(ROUTE_PREFIX[entry.locale])) {
      errors.push(`${where}: route ${entry.route} does not match locale prefix ${ROUTE_PREFIX[entry.locale]}`);
    }
    if (routes.has(entry.route)) {
      errors.push(`duplicate route: ${entry.route}`);
    } else if (entry.route) {
      routes.add(entry.route);
    }
    const key = `${entry.kind}:${entry.locale}:${entry.id}`;
    if (keys.has(key)) errors.push(`duplicate kind/locale/id: ${key}`);
    else keys.add(key);
    if (entry.kind === 'post') {
      for (const relation of entry.authors || []) {
        const author = relation?.value ?? relation;
        const authorId = typeof author === 'object' ? author?.id : author;
        if (Number(authorId) !== 11) {
          errors.push(`${where}: post author must be Alex Burlakov (id 11), got ${authorId ?? 'missing'}`);
        }
      }
    }
  }

  if (Array.isArray(encyclopedia)) {
    const encRoutes = new Set();
    for (const [index, term] of encyclopedia.entries()) {
      const where = `encyclopedia[${index}]`;
      if (term.id == null) errors.push(`${where}: missing id`);
      if (!ALLOWED_LOCALES.has(term.locale)) errors.push(`${where}: invalid locale ${term.locale}`);
      if (!term.term) errors.push(`${where}: missing term`);
      if (typeof term.route !== 'string' || !term.route) {
        errors.push(`${where}: missing route`);
      } else if (ALLOWED_LOCALES.has(term.locale) && !term.route.startsWith(ROUTE_PREFIX[term.locale])) {
        errors.push(`${where}: route ${term.route} does not match locale prefix ${ROUTE_PREFIX[term.locale]}`);
      }
      if (encRoutes.has(term.route)) errors.push(`duplicate encyclopedia route: ${term.route}`);
      else if (term.route) encRoutes.add(term.route);
    }
  }

  return errors;
}
