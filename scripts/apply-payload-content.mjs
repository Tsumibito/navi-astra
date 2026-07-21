import fs from 'node:fs/promises';
import payloadContent from '../src/data/payload-content.json' with { type: 'json' };
import { hydratePayloadHtml } from '../src/lib/hydrate-payload-html.mjs';

let applied = 0;
for (const entry of payloadContent.entries) {
  const file = `src/snapshots${entry.route}index.html`;
  try {
    const source = await fs.readFile(file, 'utf8');
    const hydrated = hydratePayloadHtml(source, entry);
    if (hydrated !== source) await fs.writeFile(file, hydrated);
    applied += 1;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
console.log(`Applied Payload content to ${applied} existing localized pages.`);
