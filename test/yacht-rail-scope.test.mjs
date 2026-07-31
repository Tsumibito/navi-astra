import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = decodeURIComponent(new URL('../dist/', import.meta.url).pathname.replace(/\/$/, ''));

function page(relpath) {
  const p = join(dist, relpath, 'index.html');
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf-8');
}

function skipIfMissing(html) {
  if (!html) return true;
  return false;
}

describe('YachtRail scope on geography pages', { skip: !existsSync(dist) }, () => {
  it('Athens page shows an honest scoped rail', () => {
    const html = page('draft/en/athens');
    if (skipIfMissing(html)) return;
    assert.ok(html.includes('data-yacht-rail'), 'yacht rail missing');
    assert.ok(!html.includes('Available yachts'), 'rail title falsely claims availability');
    assert.ok(html.includes('Yachts in catalogue'), 'expected honest rail title');
    assert.ok(html.includes('Yacht cards not yet loaded'), 'expected honest empty message');
  });

  it('Alimos page shows an honest scoped rail', () => {
    const html = page('draft/en/alimos-marina');
    if (skipIfMissing(html)) return;
    assert.ok(html.includes('data-yacht-rail'), 'yacht rail missing');
    assert.ok(!html.includes('Available yachts'), 'rail title falsely claims availability');
    assert.ok(html.includes('Yachts in catalogue'), 'expected honest rail title');
    assert.ok(html.includes('Yacht cards not yet loaded'), 'expected honest empty message');
  });
});
