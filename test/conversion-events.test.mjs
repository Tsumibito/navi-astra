import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const newsletter = await readFile(new URL('../src/components/NewsletterModal.astro', import.meta.url), 'utf8');
const service = await readFile(new URL('../src/components/ServiceLeadForm.astro', import.meta.url), 'utf8');
const waitlist = await readFile(new URL('../src/components/CourseUnavailableModal.astro', import.meta.url), 'utf8');

test('shows the newsletter only from the second distinct page in a session', () => {
  assert.match(newsletter, /previous\.lastPath === path/);
  assert.match(newsletter, /depth >= 2/);
  assert.match(newsletter, /preview \? 300 : 10000/);
});

test('records subscription only after Payload confirms success', () => {
  const success = newsletter.indexOf("analytics('sign_up'");
  assert.ok(success > newsletter.indexOf('if (!response.ok) throw new Error()'));
  assert.match(waitlist, /if \(!response\.ok\) throw new Error\(\);\s*analytics\('sign_up'/);
});

test('records confirmed leads and distinguishes yacht booking requests', () => {
  const success = service.indexOf("analytics('generate_lead'");
  assert.ok(success > service.indexOf('if (!response.ok) throw new Error()'));
  assert.match(service, /analytics\('booking_request_submit', \{ form_name:'yacht_booking_request'/);
  assert.match(service, /booking_action:String\(data\.get\('booking_action'\)/);
});

test('booking analytics uses the shared allowlisted, PII-safe helper', async () => {
  const bootstrap = await readFile(new URL('../src/components/AnalyticsBootstrap.astro', import.meta.url), 'utf8');
  assert.match(bootstrap, /'booking_action'/);
  assert.match(bootstrap, /page_path: location\.pathname/);
  assert.doesNotMatch(bootstrap.match(/const allowedParameters = new Set\(\[[\s\S]*?\]\)/)?.[0] || '', /email|phone|firstName|message/);
});
