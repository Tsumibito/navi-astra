import {writeFile, rename} from 'node:fs/promises';
import {validatePayloadContent} from '../src/lib/validate-payload-content.mjs';

const token = process.env.NAVI_RELEASE_TOKEN;
if (!token) throw Error('NAVI_RELEASE_TOKEN required for a production release');
const response = await fetch('https://studio.navi.training/api/release', {
  headers: {Authorization: 'Bearer ' + token}, redirect: 'error', signal: AbortSignal.timeout(90000),
});
if (!response.ok) throw Error('Studio export returned ' + response.status);
const bundles = await response.json();
const errors = validatePayloadContent(bundles.content);
if (!bundles.certificates.certificates?.length) errors.push('Missing certificates');
for (const cert of bundles.certificates.certificates || []) {
  for (const locale of ['en','ru','uk']) {
    if (!cert.translations[locale]?.name || !cert.frontImage) errors.push('Incomplete certificate ' + cert.id);
  }
}
if (errors.length) throw Error(errors.join('\n'));
for (const name of ['content','certificates']) {
  const file = new URL('../src/data/payload-' + name + '.json', import.meta.url);
  const temp = new URL(file.href + '.tmp');
  await writeFile(temp, JSON.stringify(bundles[name]) + '\n');
  await rename(temp, file);
}
console.log('Studio publication refreshed:', bundles.content.entries.length, 'editions');
