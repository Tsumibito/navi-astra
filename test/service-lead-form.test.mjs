import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/components/ServiceLeadForm.astro', import.meta.url), 'utf8');
const courseModalSource = await readFile(new URL('../src/components/CourseUnavailableModal.astro', import.meta.url), 'utf8');

test('requires the contact fields and uses native input types', () => {
  assert.match(source, /<input name="name" autocomplete="name" required/);
  assert.match(source, /<input name="phone" type="tel" autocomplete="tel" required/);
  assert.match(source, /<input name="email" type="email" autocomplete="email" required/);
  assert.match(source, /<textarea name="message" rows="4" required=\{!isYachtBooking\}>/);
  assert.match(source, /<input name="consent" type="checkbox" required/);
});

test('connects the submit action and form to its live validation status', () => {
  assert.match(source, /<form class:list=\{\["service-form", isYachtBooking && "service-form--booking"\]\} data-service-lead data-service=\{service\}/);
  assert.match(source, /<button type="submit" aria-describedby="service-form-status"><span data-submit-label>/);
  assert.match(source, /<p id="service-form-status" data-form-status aria-live="polite">/);
});

test('keeps booking and 48-hour hold as distinct yacht actions', () => {
  assert.match(source, /isYachtBooking && <input type="hidden" name="booking_action" value="booking" data-booking-action data-context/);
  assert.match(source, /'hold_48h'/);
  assert.match(source, /data-charter-format/);
  assert.match(source, /data-qualification-field/);
  assert.match(source, /data-hold-terms hidden/);
});

test('shows native invalid state using the accent border', () => {
  assert.match(source, /input:user-invalid[^}]*border-color:var\(--ds-accent/);
  assert.match(source, /textarea:user-invalid[^}]*border-color:var\(--ds-accent/);
});

test('keeps a closed dialog out of the document layout', () => {
  for (const modalSource of [source, courseModalSource]) {
    assert.match(modalSource, /\.service-modal:not\(\[open\]\)\s*\{\s*display:none/);
    assert.match(modalSource, /\.service-modal\[open\]\s*\{\s*display:grid/);
  }
});
