import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../workers/lead-intake/src/index.ts';

test('queued deliveries authenticate to Studio and retry a failed notification', async(t)=>{
  const replies=[503,200], requests=[];
  t.mock.method(globalThis,'fetch',async(url,request)=>{
    requests.push({url,request});
    return new Response(null,{status:replies.shift()});
  });
  const actions=[];
  const message={body:{submissionId:'synthetic-probe-1234'},attempts:1,
    ack(){actions.push('ack');},retry(){actions.push('retry');}};
  const env={STUDIO_INTAKE_URL:'https://studio.example/api/intake',NAVI_INTAKE_TOKEN:'synthetic'};
  for(let i=0;i<2;i++) await worker.queue({messages:[message]},env);
  assert.deepEqual(actions,['retry','ack']);
  for(const {url,request} of requests){
    assert.equal(url,env.STUDIO_INTAKE_URL);
    assert.equal(request.headers.Authorization,'Bearer synthetic');
    assert.deepEqual(JSON.parse(request.body),message.body);
  }
});
