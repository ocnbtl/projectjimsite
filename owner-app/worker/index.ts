import type {Env} from './env';
import {accessSignOut} from './access';
import {InputError,id} from '../shared/validation';
import {HttpError,secure,json,member,mutationGuard,limit} from './security';
import {state,saveRecord,assign,addNote} from './records';
import {uploadReceipt,downloadReceipt,removeReceipt,receiptInfo,beginReceipt,receiptPart,finishReceipt} from './receipt-storage';
import {importData,undoImport,exportData} from './imports';
import {createCrew,changeAccess} from './access-team';

async function route(request:Request,env:Env):Promise<Response> {
  const url=new URL(request.url),path=url.pathname;
  // Fail closed for remote deployments with local defaults or missing secrets.
  if(env.ENVIRONMENT!=='production' && !['localhost','127.0.0.1'].includes(url.hostname))throw new HttpError(503,'Office setup is incomplete.');
  if(env.ENVIRONMENT==='production' && (!env.APP_ORIGIN.startsWith('https://') || url.origin!==env.APP_ORIGIN))throw new HttpError(503,'Office setup is incomplete.');
  if(path==='/robots.txt')return new Response('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain'}});
  if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
  const mutate=!['GET','HEAD'].includes(request.method);
  if(mutate)mutationGuard(request,env);
  if(path==='/api/auth/sign-out'&&request.method==='POST')return accessSignOut(request,env);
  if(path.startsWith('/api/auth/')||path==='/api/setup')throw new HttpError(404,'Not found.');
  const actor=await member(request,env);
  if(mutate){const bucket=path==='/api/import/preview'?'preview':path==='/api/import/commit'?'import':/^\/api\/receipt-uploads\/[^/]+\/parts\//.test(path)?'photo-part':'write';await limit(env,`${bucket}:${actor.id}`,bucket==='photo-part'?180:bucket==='preview'||bucket==='import'?100:60);}
  if(path==='/api/state' && request.method==='GET'){
    if(url.searchParams.get('bootstrap')==='1'){
      const storage=actor.role==='owner'?await env.DB.prepare('SELECT used_bytes,cap_bytes FROM receipt_storage WHERE id=1').first():undefined;
      return json({me:{id:actor.id,name:actor.name,email:actor.email,role:actor.role},storage});
    }
    return state(env,actor,url.searchParams.get('collection')||'jobs',url.searchParams.get('cursor')||'');
  }
  let match=path.match(/^\/api\/(customers|jobs|expenses|mileage|invoices)(?:\/([\w-]+))?$/);
  if(match && ((request.method==='POST'&&!match[2]) || (request.method==='PUT'&&match[2])))return saveRecord(request,env,actor,match[1],match[2]?id(match[2]):undefined);
  match=path.match(/^\/api\/jobs\/([\w-]+)\/(assignments|notes)$/);
  if(match && request.method==='POST')return match[2]==='assignments'?assign(request,env,actor,id(match[1])):addNote(request,env,actor,id(match[1]));
  match=path.match(/^\/api\/expenses\/([\w-]+)\/receipt$/);
  if(match && request.method==='POST')return uploadReceipt(request,env,actor,id(match[1]));
  if(match && request.method==='GET')return receiptInfo(env,actor,id(match[1]));
  if(match && request.method==='DELETE')return removeReceipt(request,env,actor,id(match[1]));
  match=path.match(/^\/api\/expenses\/([\w-]+)\/receipt\/begin$/);
  if(match&&request.method==='POST')return beginReceipt(request,env,actor,id(match[1]));
  match=path.match(/^\/api\/receipt-uploads\/([\w-]+)\/parts\/(\d+)$/);
  if(match&&request.method==='PUT')return receiptPart(request,env,actor,id(match[1]),Number(match[2]));
  match=path.match(/^\/api\/receipt-uploads\/([\w-]+)\/finish$/);
  if(match&&request.method==='POST')return finishReceipt(env,actor,id(match[1]));
  match=path.match(/^\/api\/receipts\/([\w-]+)$/);
  if(match && request.method==='GET')return downloadReceipt(env,actor,id(match[1]),url.searchParams.get('preview')==='1');
  if(path==='/api/team' && request.method==='POST')return createCrew(request,env,actor);
  match=path.match(/^\/api\/team\/([\w-]+)\/(access)$/);
  if(match && request.method==='POST')return changeAccess(request,env,actor,id(match[1]));
  if(['/api/import/preview','/api/import/commit'].includes(path) && request.method==='POST')return importData(request,env,actor,path.endsWith('commit'));
  match=path.match(/^\/api\/import\/([\w-]+)\/undo$/);
  if(match && request.method==='POST')return undoImport(env,actor,id(match[1]));
  match=path.match(/^\/api\/export\/(\w+)$/);
  if(match && request.method==='GET')return exportData(env,actor,match[1],url.searchParams.get('cursor')||'');
  throw new HttpError(404,'Not found.');
}
export default {async fetch(request:Request,env:Env):Promise<Response> {
  try{return secure(await route(request,env));}
  catch(error){
    if(error instanceof HttpError)return secure(json({error:error.message},error.status));
    if(error instanceof InputError)return secure(json({error:error.message},400));
    if(error instanceof Error && error.message.includes('member_capacity'))return secure(json({error:'This office allows ten active accounts. Disable a departed crew member before adding another.'},409));
    // No SQL, credentials, request bodies or vendor stack traces reach clients or logs.
    if(error instanceof Error && /UNIQUE constraint/.test(error.message))return secure(json({error:'This record already exists. Refresh before trying again.'},409));
    return secure(json({error:'This could not be saved. Please refresh and try again.'},500));
  }
}};
