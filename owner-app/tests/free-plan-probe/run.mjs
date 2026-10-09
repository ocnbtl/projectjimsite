// Explicit opt-in real Cloudflare test. Does not change the application or any plan.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '../..');
const config = 'tests/free-plan-probe/wrangler.jsonc';
if (!process.argv.includes('--live')) throw new Error('Pass --live only with authorization for isolated Cloudflare testing.');
const token = randomBytes(32).toString('hex');
function cli(args, input) {
  return new Promise((resolvePromise,reject) => {
    const child = spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config',config],{cwd:root,env:{...process.env,WRANGLER_LOG_PATH:resolve(root,'.test-output/probe-wrangler.log')},stdio:['pipe','pipe','pipe']});
    let output=''; child.stdout.on('data',v=>{output+=v;});child.stderr.on('data',v=>{output+=v;});
    child.on('error',reject);child.on('close',code=>{console.log(output.replaceAll(token,'[redacted]'));code===0?resolvePromise(output):reject(new Error(`Wrangler exited ${code}`));});
    child.stdin.end(input??'');
  });
}
const expiry = Date.now()+15*60*1000;
await cli(['d1','migrations','apply','mcc-free-plan-test','--remote']);
const deployed = await cli(['deploy','--var',`EXPIRES_AT:${expiry}`,'--var','APP_ORIGIN:https://mcc-free-plan-probe.oceanx1400.workers.dev','--var','ENVIRONMENT:production','--var','OWNER_EMAIL:probe-owner@example.invalid']);
const url = deployed.match(/https:\/\/mcc-free-plan-probe\.[a-z0-9-]+\.workers\.dev/)?.[0];
if(!url)throw new Error('Could not verify the deployed test URL.');
const bootstrapToken=randomBytes(32).toString('hex');
await cli(['secret','bulk'],JSON.stringify({PROBE_TOKEN:token,PROBE_HASH:await hashPassword('synthetic-benchmark-not-an-account'),AUTH_SECRET:randomBytes(48).toString('hex'),BOOTSTRAP_TOKEN:bootstrapToken}));
await delay(15000);
// A newly registered workers.dev hostname can take a moment to propagate.
let ready=false;
for(let attempt=0;attempt<8;attempt++) {
  const r=await fetch(`${url}/control`,{method:'POST',headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
  const body=await r.text();
  if(r.status===200 && body.includes('"passed":true')) { ready=true;break; }
  console.log(JSON.stringify({preflight:attempt+1,status:r.status,edgeNotReady:body.includes('Page not found')}));
  await delay(3000);
}
if(!ready)throw new Error('Control request did not pass; no benchmark conclusions can be drawn.');
const results=[];
async function sample(mode) {
  const start=performance.now();
  const response=await fetch(`${url}/${mode}`,{method:'POST',headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});
  const body=await response.text();
  const result={mode,status:response.status,roundTripMs:Math.round(performance.now()-start),body:body.slice(0,500)};
  results.push(result);console.log(JSON.stringify(result));
}
await sample('control');
for (const mode of ['hash','verify-good','verify-bad','csv-200']) for(let i=0;i<5;i++) await sample(mode);
// Modest burst, not a stress/load test.
await Promise.all(Array.from({length:5},()=>sample('verify-good')));
await sample('control');
const denied=await fetch(`${url}/control`,{method:'POST'});
console.log(JSON.stringify({unauthenticatedStatus:denied.status,requests:results.length,expiresAt:new Date(expiry).toISOString(),note:'Round-trip time is NOT Worker CPU time. Inspect Cloudflare metrics separately.'}));
console.log(JSON.stringify({summary:Object.fromEntries([...new Set(results.map(r=>r.mode))].map(mode=>[mode,{total:results.filter(r=>r.mode===mode).length,passed:results.filter(r=>r.mode===mode&&r.status===200&&JSON.parse(r.body).passed).length}]))}));
if(!process.argv.includes('--full'))process.exit(0);
const apiResults=[];
async function api(path,{method='GET',data,cookie,expected=200}={}) {
  const start=performance.now();
  const res=await fetch(`${url}/api/${path}`,{method,headers:{Authorization:`Bearer ${token}`,Origin:url,'X-MCC-Request':'1','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(30000)});
  const result={path,status:res.status,expected,roundTripMs:Math.round(performance.now()-start)};
  apiResults.push(result);console.log(JSON.stringify(result));
  assert.equal(res.status,expected,`API status for ${path}`);return res;
}
const setup=await (await api('setup',{method:'POST',data:{token:bootstrapToken}})).json();
const password=randomBytes(24).toString('base64url');
const resetToken=new URLSearchParams(new URL(setup.setupLink).hash.slice(1)).get('set-password');
await api('auth/reset-password',{method:'POST',data:{token:resetToken,newPassword:password}});
let ownerCookie='';
for(let i=0;i<3;i++) {
  const res=await api('auth/sign-in/email',{method:'POST',data:{email:'probe-owner@example.invalid',password}});
  const setCookies=res.headers.getSetCookie();
  assert(setCookies.some(c=>c.includes('HttpOnly')&&c.includes('Secure')));
  ownerCookie=setCookies.map(c=>c.split(';')[0]).join('; ');
}
await api('state',{expected:401});
await api('auth/sign-up/email',{method:'POST',data:{},expected:404});
const customerId=crypto.randomUUID(),jobId=crypto.randomUUID();
await api('customers',{method:'POST',cookie:ownerCookie,data:{id:customerId,name:'Synthetic test customer'},expected:201});
await api('jobs',{method:'POST',cookie:ownerCookie,data:{id:jobId,customer_id:customerId,title:'Synthetic test job',status:'scheduled',scope:'Synthetic only',owner_notes:'Private synthetic owner note',quoted_cents:100000},expected:201});
const team=await (await api('team',{method:'POST',cookie:ownerCookie,data:{name:'Synthetic crew',email:'probe-crew@example.invalid'},expected:201})).json();
const crewToken=new URLSearchParams(new URL(team.setupLink).hash.slice(1)).get('set-password');
await api('auth/reset-password',{method:'POST',data:{token:crewToken,newPassword:password}});
const crewLogin=await api('auth/sign-in/email',{method:'POST',data:{email:'probe-crew@example.invalid',password}});
const crewCookie=crewLogin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
await api(`jobs/${jobId}/assignments`,{method:'POST',cookie:ownerCookie,data:{users:[team.id]}});
const crewState=await (await api('state',{cookie:crewCookie})).json();
assert.equal(crewState.jobs.length,1);assert.equal(crewState.jobs[0].owner_notes,undefined);assert.equal(crewState.jobs[0].quoted_cents,undefined);assert.equal(crewState.customers.length,0);
await api('export/expenses',{cookie:crewCookie,expected:403});
await api('expenses',{method:'POST',cookie:crewCookie,data:{id:crypto.randomUUID(),job_id:jobId,date:'2026-10-09',vendor:'Synthetic materials',category:'Materials',amount_cents:4250},expected:201});
await api('mileage',{method:'POST',cookie:crewCookie,data:{id:crypto.randomUUID(),job_id:jobId,date:'2026-10-09',vehicle:'Synthetic truck',purpose:'Test trip',start_tenths:100000,end_tenths:100200},expected:201});
const importPayload={kind:'expenses',source:'Invoice Simple',csv:'Date,Vendor,Amount\n'+Array.from({length:200},(_,i)=>`2026-10-09,Synthetic vendor ${i},12.34`).join('\n'),mapping:{date:'Date',vendor:'Vendor',amount:'Amount'}};
await api('import/preview',{method:'POST',cookie:ownerCookie,data:importPayload});
await api('import/commit',{method:'POST',cookie:ownerCookie,data:importPayload,expected:201});
await api('state',{cookie:ownerCookie});
await api('export/expenses',{cookie:ownerCookie});
await api('auth/sign-out',{method:'POST',cookie:ownerCookie,data:{}});
await api('state',{cookie:ownerCookie,expected:401});
console.log(JSON.stringify({apiChecks:apiResults.length,passed:apiResults.every(r=>r.status===r.expected),note:'No R2 receipt upload or OCR tested; all records synthetic.'}));
