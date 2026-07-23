export function cleanLegalHtml(rawHtml) {
  const titleMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
  const descMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const pageTitle = titleMatch?.[1]?.trim() || '';
  const pageDesc = descMatch?.[1]?.trim() || '';

  const mainMatch = rawHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  let content = mainMatch?.[1] || '';
  content = content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/\s(class|style|id)=((?:"[^"]*")|(?:'[^']*'))/gi, '')
    .replace(/\sdata-(?!custom-class\b)[a-z0-9-]+=((?:"[^"]*")|(?:'[^']*'))/gi, '')
    .replace(/<img[^>]*srcset="[^"]*"[^>]*>/gi, (m) => m.replace(/\ssrcset="[^"]*"/i, '').replace(/\ssizes="[^"]*"/i, ''))
    .replace(/<span><\/span>/gi, '')
    .replace(/<div><\/div>/gi, '')
    .replace(/<bdt><\/bdt>/gi, '')
    .trim();

  return { pageTitle, pageDesc, content };
}
