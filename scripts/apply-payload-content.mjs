import fs from 'node:fs/promises';
import payloadContent from '../src/data/payload-content.json' with { type: 'json' };
import { hydratePayloadHtml } from '../src/lib/hydrate-payload-html.mjs';

let applied = 0;
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function encyclopediaBlock(entry) {
  if (entry.kind !== 'tag') return '';
  const terms = (payloadContent.encyclopedia || []).filter((term) => term.locale === entry.locale && term.categories?.includes(entry.id));
  if (!terms.length) return '';
  const title = entry.locale === 'ru' ? 'Яхтенная энциклопедия' : entry.locale === 'uk' ? 'Яхтова енциклопедія' : 'Yachting Encyclopedia';
  const cards = terms.map((term) => `<a href="${escapeHtml(term.route)}" style="display:block;padding:20px;border:1px solid #dce5e9;border-radius:18px;color:#102e39;text-decoration:none;background:#fff"><strong style="font-size:1.25rem">${escapeHtml(term.term)}</strong><span style="display:block;margin-top:8px;line-height:1.5;color:#506068">${escapeHtml(term.definition)}</span></a>`).join('');
  return `<!-- navi-encyclopedia:start --><section style="max-width:1120px;margin:48px auto;padding:34px 24px"><h2 style="font-family:Tenor Sans,sans-serif;font-size:clamp(2rem,4vw,3.4rem);margin:0 0 24px">${title} Navi.training</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px">${cards}</div></section><!-- navi-encyclopedia:end -->`;
}

for (const entry of payloadContent.entries) {
  const file = `src/snapshots${entry.route}index.html`;
  try {
    const source = await fs.readFile(file, 'utf8');
    let hydrated = hydratePayloadHtml(source, entry);
    hydrated = hydrated.replace(/<!-- navi-encyclopedia:start -->[\s\S]*?<!-- navi-encyclopedia:end -->/g, '');
    const block = encyclopediaBlock(entry);
    if (block) hydrated = hydrated.replace(/<footer\b/, `${block}<footer`);
    if (hydrated !== source) await fs.writeFile(file, hydrated);
    applied += 1;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
console.log(`Applied Payload content to ${applied} existing localized pages.`);
