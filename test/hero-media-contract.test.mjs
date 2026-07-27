import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('HeroMedia keeps the shared responsive LCP contract', async () => {
  const source = await read('src/components/HeroMedia.astro');

  assert.match(source, /type="image\/avif"/);
  assert.match(source, /type="image\/webp"/);
  assert.match(source, /sizes="100vw"/);
  assert.match(source, /loading="eager"/);
  assert.match(source, /fetchpriority="high"/);
  assert.match(source, /object-fit:cover/);
});

test('BaseLayout supports a matching responsive high-priority preload', async () => {
  const source = await read('src/layouts/BaseLayout.astro');

  assert.match(source, /rel="preload"/);
  assert.match(source, /as="image"/);
  assert.match(source, /imagesrcset=/);
  assert.match(source, /imagesizes=/);
  assert.match(source, /fetchpriority="high"/);
});

test('canonical cinematic Hero cannot fall back to a CSS background image', async () => {
  const [component, styles] = await Promise.all([
    read('src/components/design-system/Hero.astro'),
    read('src/styles/design-system.css'),
  ]);

  assert.match(component, /import HeroMedia from '\.\.\/HeroMedia\.astro'/);
  assert.match(component, /variant === 'cinematic'/);
  assert.match(component, /imageWidths\.length < 2/);
  assert.doesNotMatch(component, /--ds-hero-image/);
  assert.doesNotMatch(styles, /--ds-hero-image/);
});

test('design tokens preserve the brand orange action surface', async () => {
  const styles = await read('src/styles/design-system.css');

  assert.match(styles, /--ds-action:#ffb052/);
  assert.match(styles, /--ds-accent-on-dark:#ffb052/);
});
