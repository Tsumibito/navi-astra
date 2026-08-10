import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dist = decodeURIComponent(new URL('../dist/', import.meta.url).pathname.replace(/\/$/, ''));
const browser = await chromium.launch().catch(() => null);
const output = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'navi-astra-out', 'screenshots', 'saronic-9-6b');
const mime = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.avif':'image/avif','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2' };

function startServer() { return new Promise((resolve) => { const server = createServer(async(req,res) => { let path=(req.url||'/').split('?')[0]; let file=join(dist,decodeURIComponent(path)); let info=await stat(file).catch(()=>null); if(info?.isDirectory()) file=join(file,'index.html'); const body=await readFile(file).catch(()=>null); if(!body){res.writeHead(404);res.end();return} res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(body); }); server.listen(0,'127.0.0.1',()=>resolve(server)); }); }

describe('Saronic region page', () => {
  let server; let base;
  before(async()=>{ if(!existsSync(dist)) throw new Error('Run npm run build'); if(!browser) throw new Error('Install Chromium'); server=await startServer(); base=`http://127.0.0.1:${server.address().port}`; await mkdir(output,{recursive:true}); });
  after(async()=>{server?.close();await browser?.close();});
  for(const locale of ['ru','ua','en']) for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1440,height:900}]) it(`${locale} ${viewport.name}`,async()=>{
    const page=await browser.newPage({viewport});
    const response=await page.goto(`${base}/${locale}/yacht-charter/greece/saronic-gulf/`);
    assert.equal(response?.status(),200);
    await page.waitForTimeout(700);
    const state=await page.evaluate(()=>{
      const hero=document.querySelector('.geo-hero-frame')?.getBoundingClientRect();
      const map=JSON.parse(document.querySelector('[data-geography-map]')?.getAttribute('data-map')||'{}');
      return { overflow:document.documentElement.scrollWidth>innerWidth, robots:document.querySelector('meta[name="robots"]')?.content, hero:hero&&{left:hero.left,right:innerWidth-hero.right}, points:map.points?.length, hasBase:!!document.querySelector('.region-practical__base'), hasAirport:!!document.querySelector('.region-practical__airport'), islands:document.querySelectorAll('.island-guide article').length, weather:!!document.querySelector('[data-marine-weather]') };
    });
    assert.equal(state.overflow,false); assert.equal(state.robots,'noindex, nofollow'); assert.ok(state.hero.left>0&&state.hero.right>0,'hero needs visible side boundaries'); assert.equal(state.points,4); assert.equal(state.hasBase,true); assert.equal(state.hasAirport,true); assert.equal(state.islands,3); assert.equal(state.weather,true);
    await page.screenshot({path:join(output,`${locale}-${viewport.name}.png`),fullPage:true}); await page.close();
  });
});
