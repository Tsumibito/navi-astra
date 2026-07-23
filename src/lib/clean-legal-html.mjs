/**
 * Clean Webstudio/Termly legal snapshot HTML into semantic prose.
 * - strips <style>/<script>/<noscript> blocks
 * - unwraps <bdt> editor artifacts (keeps inner text)
 * - removes class/style/id and data-* attrs EXCEPT data-custom-class
 * - removes empty inline tags (<span></span>, <bdt></bdt>, <div><br></div> chains)
 * - trims leading/trailing stray closing tags from <main> extraction
 */
export function cleanLegalHtml(rawHtml) {
  const titleMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
  const descMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const pageTitle = titleMatch?.[1]?.trim() || '';
  const pageDesc = descMatch?.[1]?.trim() || '';

  const mainMatch = rawHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  let content = mainMatch?.[1] || rawHtml;

  content = content
    // drop embedded style/script/noscript
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    // ponytail: Webstudio appends a 24-thumb gallery (160x160) at the end of every legal page.
    // Truncate from the first 160x160 img to the end — it's always trailing, never inline prose.
    .replace(/<img[^>]*width="160"[^>]*height="160"[\s\S]*$/i, '')
    // unwrap <bdt> tags — keep inner content
    .replace(/<bdt\b[^>]*>/gi, '')
    .replace(/<\/bdt>/gi, '')
    // remove all attrs except data-custom-class
    .replace(/\s(class|style|id)=((?:"[^"]*")|(?:'[^']*'))/gi, '')
    .replace(/\sdata-(?!custom-class\b)[a-z0-9-]+=((?:"[^"]*")|(?:'[^']*'))/gi, '')
    // remove srcset/sizes from imgs
    .replace(/\ssrcset="[^"]*"/gi, '')
    .replace(/\ssizes="[^"]*"/gi, '')
    // collapse empty inline tags
    .replace(/<span>\s*<\/span>/gi, '')
    .replace(/<strong>\s*<\/strong>/gi, '')
    .replace(/<em>\s*<\/em>/gi, '')
    .replace(/<div>\s*<br>\s*<\/div>/gi, '<br>')
    .replace(/<div>\s*<\/div>/gi, '')
    // collapse multiple <br>
    .replace(/(<br>\s*){3,}/gi, '<br><br>')
    // trim leading stray closing tags and trailing stray opening tags
    .replace(/^[\s]*(<\/[a-z]+>\s*)+/i, '')
    .replace(/(\s*<[a-z]+>[\s]*)+$/i, '')
    .trim();

  return { pageTitle, pageDesc, content };
}
