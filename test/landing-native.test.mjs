import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const routes = ['ru/charter-for-dummies', 'ua/charter-for-dummies', 'ru/yahting-dlya-vseh'];
const routeToFile = (route) => {
  const [locale, ...parts] = route.split('/');
  return `../src/data/pages/${parts.join('/')}-${locale}.json`;
};

test('landing route pages no longer import snapshot HTML or parser', async () => {
  for (const route of routes) {
    const file = await readFile(new URL(`../src/pages/${route}.astro`, import.meta.url), 'utf8');
    assert.doesNotMatch(file, /parse-snapshot-landing/);
    assert.doesNotMatch(file, /charter-for-dummies-ru\.html\?raw/);
    assert.doesNotMatch(file, /charter-for-dummies-ua\.html\?raw/);
    assert.doesNotMatch(file, /yahting-dlya-vseh-ru\.html\?raw/);
  }
});

test('landing data files provide required metadata and sections', async () => {
  for (const route of routes) {
    const data = JSON.parse(await readFile(new URL(routeToFile(route), import.meta.url), 'utf8'));
    assert.ok(data.meta, `${route}: meta missing`);
    assert.ok(data.meta.title, `${route}: title missing`);
    assert.ok(data.meta.description, `${route}: description missing`);
    assert.ok(data.meta.canonical, `${route}: canonical missing`);
    assert.ok(Array.isArray(data.sections) && data.sections.length > 0, `${route}: sections missing`);
  }
});

test('UA landing data is enriched with testimonials from RU snapshot', async () => {
  const uaData = JSON.parse(await readFile(new URL('../src/data/pages/charter-for-dummies-ua.json', import.meta.url), 'utf8'));
  const reviews = uaData.sections.find((s) => s.type === 'reviews');
  assert.ok(reviews, 'UA landing has reviews section');
  assert.ok(reviews.items.length > 0, 'UA landing has testimonials');
  assert.ok(reviews.title, 'UA landing reviews have localized title');
});

test('FaqAccordion preserves multiline answers as separate paragraphs', async () => {
  const source = await readFile(new URL('../src/components/FaqAccordion.astro', import.meta.url), 'utf8');
  assert.match(source, /paragraphs\(item\.a\)/);
  assert.match(source, /\.map\(\(p\) => <p>\{p\}<\/p>\)/);
});

test('LandingLayout does not include site header, footer or photo strip', async () => {
  const source = await readFile(new URL('../src/layouts/LandingLayout.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /import\s+Header/);
  assert.doesNotMatch(source, /import\s+Footer/);
  assert.doesNotMatch(source, /import\s+PhotoStrip/);
  assert.doesNotMatch(source, /<PhotoStrip/);
  assert.doesNotMatch(source, /<Footer/);
  assert.doesNotMatch(source, /navi-evolution-v1\.css/);
});
