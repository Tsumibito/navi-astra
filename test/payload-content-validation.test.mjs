import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePayloadContent } from '../src/lib/validate-payload-content.mjs';

const baseEntry = (overrides = {}) => ({ kind: 'post', locale: 'ru', id: 1, route: '/ru/blog/first/', name: 'First', ...overrides });
const baseEncyclopedia = (overrides = {}) => ({ id: 1, locale: 'ru', route: '/ru/encyclopedia/first/', term: 'First', ...overrides });

describe('validatePayloadContent', () => {
  it('accepts a valid minimal fixture', () => {
    const errors = validatePayloadContent({ entries: [baseEntry()], encyclopedia: [baseEncyclopedia()] });
    assert.deepStrictEqual(errors, []);
  });

  it('rejects duplicate route', () => {
    const errors = validatePayloadContent({ entries: [baseEntry(), baseEntry({ id: 2 })], encyclopedia: [] });
    assert.ok(errors.some((e) => e.includes('duplicate route')), `expected duplicate route error, got ${errors}`);
  });

  it('rejects invalid locale', () => {
    const errors = validatePayloadContent({ entries: [baseEntry({ locale: 'fr', route: '/fr/blog/first/' })], encyclopedia: [] });
    assert.ok(errors.some((e) => e.includes('invalid locale')), `expected invalid locale error, got ${errors}`);
  });

  it('rejects route that does not match locale prefix', () => {
    const errors = validatePayloadContent({ entries: [baseEntry({ route: '/en/blog/first/' })], encyclopedia: [] });
    assert.ok(errors.some((e) => e.includes('does not match locale prefix')), `expected prefix error, got ${errors}`);
  });

  it('rejects missing route', () => {
    const errors = validatePayloadContent({ entries: [{ kind: 'post', locale: 'ru', id: 1, name: 'First' }], encyclopedia: [] });
    assert.ok(errors.some((e) => e.includes('missing route')), `expected missing route error, got ${errors}`);
  });

  it('rejects a post assigned to a retired author', () => {
    const entries = [baseEntry({ authors: [{ relationTo: 'team-new', value: 9 }] })];
    const errors = validatePayloadContent({ entries, encyclopedia: [] });
    assert.ok(errors.some((e) => e.includes('post author must be Alex Burlakov')), `expected author error, got ${errors}`);
  });

  it('accepts a post assigned to Alex Burlakov', () => {
    const entries = [baseEntry({ authors: [{ relationTo: 'team-new', value: { id: 11, name: 'Алексей Бурлаков' } }] })];
    assert.deepStrictEqual(validatePayloadContent({ entries, encyclopedia: [] }), []);
  });
});
