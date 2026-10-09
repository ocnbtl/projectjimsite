import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
if(!process.argv.includes('--live'))throw new Error('Explicit --live opt-in required.');
const root=resolve(import.meta.dirname,'../..'),config='tests/free-plan-probe/receipt-probe.jsonc',token=randomBytes(32).toString('hex');
const keys=await generateKeyPair('RS256');
const signed=await new SignJWT({email:'probe-receipts@example.invalid',type:'app'}).setProtectedHeader({alg:'RS256'}).setIssuer('https://synthetic.invalid').setAudience('mcc-isolated-probe').setSubject('synthetic-owner').setIssuedAt().setExpirationTime('15m').sign(keys.privateKey);
function cli(args,input){return new Promise((ok,fail)=>{
  const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,...(args.includes('--config')?[]:['--config',config])],{cwd:root,stdio:['pipe','pipe','pipe']});let out='';child.stdout.on('data',v=>out+=v);child.stderr.on('data',v=>out+=v);child.on('error',fail);child.on('close',code=>{const safe=out.replaceAll(token,'[redacted]').replaceAll(signed,'[redacted]');console.log(safe);code?fail(new Error('CLI failed')):ok(safe);});child.stdin.end(input??'');
});}
try{
  await cli(['d1','migrations','apply','mcc-free-plan-test','--remote']);
  await cli(['secret','bulk'],JSON.stringify({PROBE_TOKEN:token,PROBE_PUBLIC_JWK:JSON.stringify(await exportJWK(keys.publicKey))}));
  const deployed=await cli(['deploy','--var',`EXPIRES_AT:${Date.now()+12*60*1000}`]);
  const url=deployed.match(/https:\/\/mcc-free-plan-probe\.[\w-]+\.workers\.dev/)?.[0];if(!url)throw new Error('No verified test URL');
  async function call(path,{method='GET',body,headers={}}={}){const r=await fetch(url+path,{method,headers:{Authorization:`Bearer ${token}`,'X-Synthetic-Identity':signed,Origin:url,'X-MCC-Request':'1',...headers},body,signal:AbortSignal.timeout(30000)});console.log(JSON.stringify({path,method,status:r.status,ray:r.headers.get('cf-ray')}));return r;}
  let setup;for(let i=0;i<8;i++){setup=await call('/setup');if(setup.ok)break;await delay(3000);}assert.equal(setup.status,200);
  for(let n=0;n<3;n++){
    assert.equal((await call('/control')).status,200);
    const id=(await (await call('/expense',{method:'POST'})).json()).id;
    const bytes=new Uint8Array(512*1024);bytes.set([255,216,255]);
    const begun=await call(`/begin/${id}`,{method:'POST',body:JSON.stringify({bytes:bytes.length}),headers:{'Content-Type':'application/json','X-Receipt-Version':'none'}});assert.equal(begun.status,201);const uploadId=(await begun.json()).id;
    for(let start=0;start<bytes.length;start+=32768){const part=await call(`/parts/${uploadId}/${start/32768}`,{method:'PUT',body:bytes.slice(start,start+32768)});assert.equal(part.status,200);}
    const uploaded=await call(`/finish/${uploadId}`,{method:'POST'});
    assert.equal(uploaded.status,201);const receipt=(await uploaded.json()).id;
    const download=await call(`/receipt/${receipt}`);assert.equal(download.status,200);assert.equal((await download.arrayBuffer()).byteLength,bytes.length);
    assert.equal((await call('/state')).status,200);
  }
  for(const rows of [3]){
    const body=JSON.stringify({source:'Other',kind:'expenses',csv:'Date,Vendor,Amount\n'+Array.from({length:rows},(_,i)=>`2026-10-09,Synthetic ${i},10.00`).join('\n'),mapping:{date:'Date',vendor:'Vendor',amount:'Amount'}});
    const r=await call('/import',{method:'POST',body,headers:{'Content-Type':'application/json'}});console.log(JSON.stringify({rows,status:r.status}));assert.equal(r.status,200);
  }
  const concurrent=await Promise.all(Array.from({length:10},()=>call('/state')));assert.ok(concurrent.every(r=>r.status===200));
  await cli(['d1','execute','mcc-free-plan-test','--remote','--command','SELECT used_bytes,cap_bytes FROM receipt_storage;']);
  console.log('Probe finished. These are function-level synthetic tests, not live Access delivery or full middleware CPU proof.');
}finally{
  await cli(['deploy','--config','tests/free-plan-probe/wrangler.jsonc','--var','EXPIRES_AT:0']);
}
