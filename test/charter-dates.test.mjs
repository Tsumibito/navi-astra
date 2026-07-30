import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatCharterDate } from '../src/lib/charter/dates.ts';

describe('formatCharterDate', () => {
  it('localizes 28 July for ru, ua, en', () => {
    assert.equal(formatCharterDate('2026-07-28', 'ru'), '28 июля');
    assert.equal(formatCharterDate('2026-07-28', 'ua'), '28 липня');
    assert.equal(formatCharterDate('2026-07-28', 'en'), '28 July');
  });

  it('localizes 15 March for ru, ua, en', () => {
    assert.equal(formatCharterDate('2030-03-15', 'ru'), '15 марта');
    assert.equal(formatCharterDate('2030-03-15', 'ua'), '15 березня');
    assert.equal(formatCharterDate('2030-03-15', 'en'), '15 March');
  });
});
