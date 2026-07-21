import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = join(root, 'src/data/payload-certificates.json');
const payloadUrl = process.env.PAYLOAD_API_URL?.replace(/\/$/, '');
const payloadSsgApiKey = process.env.PAYLOAD_SSG_API_KEY;
const payloadHeaders = payloadSsgApiKey ? { 'x-navi-ssg-key': payloadSsgApiKey } : {};

if (payloadUrl && !payloadSsgApiKey) {
  throw new Error('PAYLOAD_SSG_API_KEY is required when PAYLOAD_API_URL is configured');
}

const readJsonl = async (path) => (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
const readJsonlOptional = async (path) => {
  try { return await readJsonl(path); } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
};

const fromExport = async () => {
  const audit = join(root, '..', 'audit', 'payload');
  const [base, locales, media, trainingLocales, trainingRelations] = await Promise.all([
    readJsonl(join(audit, 'certificates_new.jsonl')),
    readJsonl(join(audit, 'certificates_new_locales.jsonl')),
    readJsonl(join(audit, 'media.jsonl')),
    readJsonlOptional(join(audit, 'trainings_new_locales.jsonl')),
    readJsonlOptional(join(audit, 'trainings_new_rels.jsonl')),
  ]);
  const mediaById = new Map(media.map((item) => [item.id, item]));
  const certificates = base.map((item) => ({
    id: item.id,
    status: item._status,
    frontImage: mediaById.get(item.front_image_id)?.sizes_card_url || mediaById.get(item.front_image_id)?.url,
    backImage: mediaById.get(item.back_image_id)?.sizes_card_url || mediaById.get(item.back_image_id)?.url,
    translations: Object.fromEntries(locales.filter((row) => row._parent_id === item.id).map((row) => [row._locale, {
      name: row.name, slug: row.slug, description: row.description, requirements: row.requirements, program: row.program,
    }])),
  }));
  const ruTrainingSlugs = new Map(trainingLocales.filter(({ _locale }) => _locale === 'ru').map((item) => [item._parent_id, item.slug]));
  const trainingCertificateIds = {};
  for (const relation of trainingRelations.filter(({ path }) => path === 'certificates')) {
    const slug = ruTrainingSlugs.get(relation.parent_id);
    if (slug) (trainingCertificateIds[slug] ||= []).push([relation.order ?? 0, relation.certificates_new_id]);
  }
  for (const [slug, values] of Object.entries(trainingCertificateIds)) {
    trainingCertificateIds[slug] = values.sort(([a], [b]) => a - b).map(([, id]) => id);
  }
  return { certificates, trainingCertificateIds };
};

const fromApi = async () => {
  const locales = ['ru', 'uk', 'en'];
  const localized = await Promise.all(locales.map(async (locale) => {
    const response = await fetch(`${payloadUrl}/api/certificates?limit=100&depth=2&locale=${locale}&fallback-locale=none`, { headers: payloadHeaders });
    if (!response.ok) throw new Error(`Payload certificates ${locale}: ${response.status}`);
    return [locale, (await response.json()).docs];
  }));
  const records = new Map();
  for (const [locale, docs] of localized) for (const doc of docs) {
    const record = records.get(doc.id) || {
      id: doc.id, status: doc._status, frontImage: doc.frontImage?.sizes?.card?.url || doc.frontImage?.url,
      backImage: doc.backImage?.sizes?.card?.url || doc.backImage?.url, translations: {},
    };
    record.translations[locale] = {
      name: doc.name, slug: doc.slug, description: doc.description, requirements: doc.requirements, program: doc.program,
    };
    records.set(doc.id, record);
  }
  return [...records.values()];
};

const trainingCertificateIds = new Map();
if (payloadUrl) {
  const response = await fetch(`${payloadUrl}/api/trainings?limit=100&depth=1&locale=ru&fallback-locale=none`, { headers: payloadHeaders });
  if (!response.ok) throw new Error(`Payload trainings: ${response.status}`);
  for (const training of (await response.json()).docs) {
    trainingCertificateIds.set(
      training.slug,
      (training.certificates || []).map((certificate) =>
        typeof certificate === 'object' ? certificate.id : certificate),
    );
  }
}

const source = payloadUrl ? { certificates: await fromApi() } : await fromExport();
const certificates = source.certificates;
if (!payloadUrl) for (const [slug, ids] of Object.entries(source.trainingCertificateIds)) trainingCertificateIds.set(slug, ids);
if (certificates.length !== 7) throw new Error(`Expected 7 Payload certificates, received ${certificates.length}`);
for (const certificate of certificates) for (const locale of ['ru', 'uk', 'en']) {
  if (!certificate.translations[locale]?.name || !certificate.frontImage) throw new Error(`Incomplete Payload certificate ${certificate.id}/${locale}`);
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: payloadUrl || 'read-only-payload-export',
  certificates,
  trainingCertificateIds: Object.fromEntries(trainingCertificateIds),
}, null, 2));
console.log(`Synced ${certificates.length} certificates × 3 locales from ${payloadUrl ? 'Payload API' : 'Payload export'}.`);
if (payloadUrl) console.log(`Synced certificate composition for ${trainingCertificateIds.size} trainings.`);
