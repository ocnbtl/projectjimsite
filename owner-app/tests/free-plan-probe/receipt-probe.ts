// Isolated synthetic-only probe. Never a production entrypoint or authentication fallback.
import {importJWK,jwtVerify} from 'jose';
import {uploadReceipt,downloadReceipt,removeReceipt,beginReceipt,receiptPart,finishReceipt} from '../../worker/receipt-storage';
import {state} from '../../worker/records';
import {importData} from '../../worker/imports';
import {mutationGuard,limit,secure} from '../../worker/security';
import type {Env,Member} from '../../worker/env';
interface ProbeEnv extends Env {PROBE_TOKEN:string;PROBE_PUBLIC_JWK:string;EXPIRES_AT:string}
let key:Awaited<ReturnType<typeof importJWK>>|undefined;
export default {async fetch(request:Request,env:ProbeEnv){
  if(!env.EXPIRES_AT||Date.now()>Number(env.EXPIRES_AT)||!env.PROBE_TOKEN||request.headers.get('Authorization')!==`Bearer ${env.PROBE_TOKEN}`)return new Response('Not found',{status:404});
  try{
    key??=await importJWK(JSON.parse(env.PROBE_PUBLIC_JWK),'RS256');
    const jwt=request.headers.get('X-Synthetic-Identity')||'';
    const {payload:claims}=await jwtVerify(jwt,key,{algorithms:['RS256'],issuer:'https://synthetic.invalid',audience:'mcc-isolated-probe',requiredClaims:['exp','iat','sub','email','type'],maxTokenAge:'12h',clockTolerance:5});
    if(claims.type!=='app'||claims.email!=='probe-receipts@example.invalid'||!claims.sub||claims.sub.length>255||!Number.isInteger(claims.iat)||!Number.isInteger(claims.exp))return new Response('Denied',{status:403});
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(jwt))),n=>n.toString(16).padStart(2,'0')).join('');
    const path=new URL(request.url).pathname;
    const actor:Member={id:'831ba026-24d0-43df-b808-294e7fbc61d7',email:'probe-receipts@example.invalid',name:'Synthetic owner',role:'owner',sessionCreatedAt:new Date()};
    const envForRequest={...env,APP_ORIGIN:new URL(request.url).origin};
    if(path==='/setup'){
      await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO user(id,name,email,createdAt,updatedAt) VALUES(?,?,?,0,0)').bind(actor.id,actor.name,actor.email),env.DB.prepare("INSERT OR IGNORE INTO members(user_id,role) VALUES(?,'owner')").bind(actor.id)]);
      return Response.json({ready:true});
    }
    const active=await env.DB.prepare('SELECT u.id,u.name,u.email,m.role,m.access_subject,m.token_valid_after FROM members m JOIN user u ON u.id=m.user_id WHERE u.email=? AND m.active=1 AND NOT EXISTS(SELECT 1 FROM access_revocations WHERE digest=?)').bind(claims.email,digest).first<{id:string;token_valid_after:number;access_subject:string|null}>();
    if(!active||Number(claims.iat)<=active.token_valid_after||(active.access_subject&&active.access_subject!==claims.sub))return new Response('Denied',{status:403});
    if(!active.access_subject)await env.DB.prepare('UPDATE members SET access_subject=? WHERE user_id=? AND access_subject IS NULL').bind(claims.sub,actor.id).run();
    if(request.method!=='GET'){mutationGuard(request,envForRequest);await limit(env,`probe:${actor.id}`,100);}
    if(path==='/state')return state(env,actor,'expenses');
    if(path==='/import')return importData(request,env,actor,false);
    if(path==='/expense'){
      const expenseId=crypto.randomUUID();
      await env.DB.prepare("INSERT INTO expenses(id,user_id,date,vendor,category,amount_cents) VALUES(?,?,'2026-10-09','Synthetic only','Other',100)").bind(expenseId,actor.id).run();
      return Response.json({id:expenseId});
    }
    const match=path.match(/^\/receipt\/([\w-]+)$/);
    const begin=path.match(/^\/begin\/([\w-]+)$/);if(begin)return beginReceipt(request,env,actor,begin[1]);
    const part=path.match(/^\/parts\/([\w-]+)\/(\d+)$/);if(part)return receiptPart(request,env,actor,part[1],Number(part[2]));
    const finish=path.match(/^\/finish\/([\w-]+)$/);if(finish)return finishReceipt(env,actor,finish[1]);
    if(match&&request.method==='POST')return uploadReceipt(request,env,actor,match[1]);
    if(match&&request.method==='GET')return downloadReceipt(env,actor,match[1]);
    if(match&&request.method==='DELETE')return removeReceipt(request,env,actor,match[1]);
    return Response.json({verified:true});
  }catch(e){return secure(Response.json({error:e instanceof Error?e.message:'Failed'},{status:500}));}
}};
