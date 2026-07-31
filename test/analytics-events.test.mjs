import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('all public layouts load the shared analytics adapter', async () => {
  for (const path of [
    'src/layouts/BaseLayout.astro',
    'src/layouts/LandingLayout.astro',
    'src/layouts/ServiceLayout.astro',
  ]) {
    const source = await read(path);
    assert.match(source, /import AnalyticsBootstrap from/);
    assert.match(source, /<ZarazConsentBootstrap \/>\s*<AnalyticsBootstrap \/>/);
  }
});

test('analytics adapter sends through Zaraz and keeps personal data out', async () => {
  const source = await read('src/components/AnalyticsBootstrap.astro');
  assert.match(source, /window\.zaraz\.track\(name, parameters\)/);
  assert.match(source, /window\.dataLayer\.push/);
  assert.match(source, /page_path: location\.pathname/);
  for (const pii of ['email', 'phone', 'firstName', 'message', 'location', 'utm']) {
    assert.doesNotMatch(source, new RegExp(`['"]${pii}['"]`));
  }
});

test('lead and subscription events fire only after a successful API response', async () => {
  const service = await read('src/components/ServiceLeadForm.astro');
  const newsletter = await read('src/components/NewsletterModal.astro');
  const waitlist = await read('src/components/CourseUnavailableModal.astro');

  assert.match(service, /if\(!response\.ok\) throw new Error\(\); analytics\('generate_lead'/);
  assert.match(newsletter, /if \(!response\.ok\) throw new Error\(\);\s*analytics\('sign_up'/);
  assert.match(waitlist, /if \(!response\.ok\) throw new Error\(\);\s*analytics\('sign_up'/);
  assert.match(service, /analytics\('form_open'/);
  assert.match(service, /analytics\('form_start'/);
});
