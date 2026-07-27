import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const repo = join(root, '..');
const pkg = JSON.parse(fs.readFileSync(join(repo, 'package.json'), 'utf8'));

describe('Payload pipeline does not mutate snapshots', () => {
  it('removes apply payload commands from package.json', () => {
    const hasApplyCommand = Object.keys(pkg.scripts || {}).some((k) => k.startsWith('apply:payload'));
    assert.strictEqual(hasApplyCommand, false, 'apply payload scripts still in package.json');
    assert.strictEqual(pkg.scripts.build.includes('apply:payload'), false, 'npm build still calls apply payload');
  });

  it('keeps explicit sync payload commands but removes them from npm build', () => {
    assert.ok(pkg.scripts['sync:payload-certificates'], 'sync:payload-certificates should remain as explicit command');
    assert.ok(pkg.scripts['sync:payload-content'], 'sync:payload-content should remain as explicit command');
    const build = pkg.scripts.build;
    assert.ok(!build.includes('sync:payload'), 'npm build should not reference sync:payload');
    assert.ok(!build.includes('apply:payload'), 'npm build should not reference apply:payload');
    assert.ok(!build.includes('sync-payload-'), 'npm build should not call sync-payload scripts');
    assert.ok(!build.includes('apply-payload-'), 'npm build should not call apply-payload scripts');
  });

  it('removes snapshot-hydration scripts and helper', () => {
    for (const file of ['scripts/apply-payload-certificates.mjs', 'scripts/apply-payload-content.mjs', 'src/lib/hydrate-payload-html.mjs']) {
      assert.strictEqual(fs.existsSync(join(repo, file)), false, `${file} should be removed`);
    }
  });

  it('sync scripts do not reference src/snapshots', () => {
    for (const file of ['scripts/sync-payload-content.mjs', 'scripts/sync-payload-certificates.mjs']) {
      const src = fs.readFileSync(join(repo, file), 'utf8');
      assert.ok(!src.includes('src/snapshots'), `${file} still references src/snapshots`);
      assert.ok(!src.includes('await fs.access'), `${file} still accesses snapshot files`);
    }
  });

  it('native certificates consumer imports canonical JSON', () => {
    const src = fs.readFileSync(join(repo, 'src/components/CertificatesTabs.astro'), 'utf8');
    assert.ok(src.includes('payload-certificates.json'), 'CertificatesTabs should import payload-certificates.json');
  });

  it('native content consumer imports canonical JSON', () => {
    const src = fs.readFileSync(join(repo, 'src/pages/[locale]/blog/[slug].astro'), 'utf8');
    assert.ok(src.includes('payload-content.json'), 'blog/[slug].astro should import payload-content.json');
  });
});

describe('Payload sync validation', () => {
  it('rejects a Payload API response with fewer than 7 certificates', async () => {
    const cert = {
      id: 1,
      _status: 'published',
      frontImage: { sizes: { card: { url: 'http://localhost/cert.jpg' } } },
      name: 'A',
      slug: 'a',
      description: 'd',
      requirements: 'r',
      program: 'p',
    };
    const body = JSON.stringify({ docs: Array.from({ length: 6 }, (_, i) => ({ ...cert, id: i + 1 })) });
    const server = createServer((req, res) => {
      if (req.url.startsWith('/api/certificates')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(body);
      } else if (req.url.startsWith('/api/trainings')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ docs: [] }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const child = spawn(process.execPath, ['scripts/sync-payload-certificates.mjs'], {
      cwd: repo,
      env: { ...process.env, PAYLOAD_API_URL: `http://127.0.0.1:${port}`, PAYLOAD_SSG_API_KEY: 'test-key' },
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d; });
    const code = await new Promise((resolve) => child.on('close', resolve));
    await new Promise((resolve) => server.close(resolve));
    assert.notStrictEqual(code, 0, 'sync should fail for invalid certificate count');
    assert.ok(stderr.includes('Expected 7 Payload certificates'), `expected validation error, got: ${stderr}`);
  });
});
