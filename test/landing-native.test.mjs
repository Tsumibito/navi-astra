import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const service = await readFile(new URL('../src/components/ServiceLeadForm.astro', import.meta.url), 'utf8');
const landing = await readFile(new URL('../src/layouts/LandingLayout.astro', import.meta.url), 'utf8');

test('closes an existing dialog before opening a service form', () => {
  assert.match(service, /document\.querySelectorAll\('dialog\[open\]'\)\.forEach\(\(dialog\) => dialog\.close\(\)\)/);
});

test('closes an existing dialog before opening a campaign form', () => {
  assert.match(landing, /document\.querySelectorAll\('dialog\[open\]'\)\.forEach\(\(dialog\) => dialog\.close\(\)\)/);
});

test('suppresses newsletter prompts after a successful service lead', () => {
  assert.match(service, /localStorage\.setItem\('navi-newsletter-state-v1', JSON\.stringify\(\{ subscribed:true \}\)\)/);
});
