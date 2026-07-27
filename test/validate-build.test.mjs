import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMissingRoutes,
  validateCanonical,
  validateJsonLd,
  validateTagCards,
  validateEnSailingTraining,
} from '../scripts/validate-build.mjs';

describe('validate-build', () => {
  describe('validateMissingRoutes', () => {
    it('reports missing dist routes', () => {
      const expected = new Set(['/ru/privacy-policy/', '/ua/cookie-policy/']);
      const dist = new Set(['/ru/privacy-policy/']);
      const errors = validateMissingRoutes(expected, dist);
      assert.ok(errors.some((e) => e.includes('Missing build route') && e.includes('ua/cookie-policy')));
    });

    it('returns empty when all expected routes are present', () => {
      const expected = new Set(['/ru/privacy-policy/', '/en/charter/']);
      const dist = new Set(['/ru/privacy-policy/', '/en/charter/']);
      assert.deepEqual(validateMissingRoutes(expected, dist), []);
    });
  });

  describe('validateCanonical', () => {
    it('accepts a single correct canonical', () => {
      const html = '<html><head><link rel="canonical" href="https://navi.training/en/charter/"></head><body><title>Test</title></body></html>';
      const errors = validateCanonical(html, '/en/charter/');
      assert.deepEqual(errors, []);
    });

    it('reports duplicate canonical links', () => {
      const html = '<html><head><link rel="canonical" href="https://navi.training/en/charter/"><link rel="canonical" href="https://navi.training/ru/charter/"></head><body><title>Test</title></body></html>';
      const errors = validateCanonical(html, '/en/charter/');
      assert.ok(errors.some((e) => e.includes('Invalid canonical')));
    });

    it('reports missing canonical', () => {
      const html = '<html><head></head><body><title>Test</title></body></html>';
      const errors = validateCanonical(html, '/en/charter/');
      assert.ok(errors.some((e) => e.includes('Invalid canonical')));
    });
  });

  describe('validateJsonLd', () => {
    it('reports missing JSON-LD', () => {
      const html = '<html><head><title>Test</title></head><body></body></html>';
      const errors = validateJsonLd(html, '/test/');
      assert.ok(errors.some((e) => e.includes('Missing JSON-LD')));
    });

    it('reports invalid JSON-LD', () => {
      const html = '<html><head><script type="application/ld+json">{ invalid</script></head><body></body></html>';
      const errors = validateJsonLd(html, '/test/');
      assert.ok(errors.some((e) => e.includes('Invalid JSON-LD')));
    });

    it('accepts valid JSON-LD', () => {
      const html = '<html><head><script type="application/ld+json">{"@type":"WebPage"}</script></head><body></body></html>';
      const errors = validateJsonLd(html, '/test/');
      assert.deepEqual(errors, []);
    });
  });

  describe('validateTagCards', () => {
    it('returns empty when actual equals expected', () => {
      assert.deepEqual(validateTagCards(5, 5, '/ru/tags/sailing-training/'), []);
    });

    it('reports per-locale mismatch', () => {
      const errors = validateTagCards(17, 19, '/en/tags/anchoring/');
      assert.ok(errors.some((e) => e.includes('Tag card count mismatch') && e.includes('actual 17') && e.includes('expected 19')));
    });
  });

  describe('validateEnSailingTraining', () => {
    it('reports when the category exists but has zero cards', () => {
      const errors = validateEnSailingTraining(0);
      assert.ok(errors.some((e) => e.includes('English sailing-training has no article cards')));
    });

    it('reports when the category is missing entirely', () => {
      const errors = validateEnSailingTraining(null);
      assert.ok(errors.some((e) => e.includes('English sailing-training has no article cards')));
    });

    it('returns empty when cards are present', () => {
      assert.deepEqual(validateEnSailingTraining(5), []);
    });
  });
});
