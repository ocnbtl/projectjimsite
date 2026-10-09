import {timingSafeEqual} from 'node:crypto';
import {makeAuth,setupLink} from './auth';
import type {Env,Member} from './env';
import {email,text,integer,id} from '../shared/validation';
import {owner,fresh,body,json,HttpError,audit} from './security';

export async function bootstrap(request:Request,env:Env) {
  const input=await body(request);
  const supplied=typeof input.token==='string'?Buffer.from(input.token):Buffer.alloc(0);
  const expected=Buffer.from(env.BOOTSTRAP_TOKEN??'');
  if(expected.length<32 || supplied.length!==expected.length || !timingSafeEqual(supplied,expected))throw new HttpError(404,'Not found.');
  if(await env.DB.prepare("SELECT user_id FROM members WHERE role='owner'").first())throw new HttpError(409,'The owner is already configured.');
  const ownerEmail=email(env.OWNER_EMAIL);
  const auth=makeAuth(env);
  // Creates no password, no session and no email. Owner sets a fresh password via one-use link.
  let user=await env.DB.prepare('SELECT id FROM user WHERE email=?').bind(ownerEmail).first<{id:string}>();
  if(!user)user=(await auth.api.createUser({body:{email:ownerEmail,name:'Jim'}})).user;
  await env.DB.prepare("INSERT INTO members(user_id,role) VALUES(?,'owner')").bind(user.id).run();
  return json({setupLink:await setupLink(env,ownerEmail)});
}
export async function createCrew(request:Request,env:Env,actor:Member) {
  owner(actor);fresh(actor);const input=await body(request);
  const address=email(input.email),name=text(input.name,'Name',120);
  const auth=makeAuth(env);
  const result=await auth.api.createUser({body:{email:address,name}});
  await env.DB.batch([env.DB.prepare("INSERT INTO members(user_id,role) VALUES(?,'crew')").bind(result.user.id),audit(env,actor,'Created crew account',result.user.id)]);
  return json({id:result.user.id,setupLink:await setupLink(env,address)},201);
}
export async function changeAccess(request:Request,env:Env,actor:Member,userId:string) {
  owner(actor);fresh(actor);const input=await body(request),active=integer(input.active,'Access',0,1);
  const target=await env.DB.prepare('SELECT role FROM members WHERE user_id=?').bind(id(userId)).first<{role:string}>();
  if(!target || target.role==='owner')throw new HttpError(403,'Owner access cannot be changed here.');
  await env.DB.batch([env.DB.prepare('UPDATE members SET active=? WHERE user_id=?').bind(active,userId),env.DB.prepare('DELETE FROM session WHERE userId=?').bind(userId),audit(env,actor,active?'Restored crew access':'Disabled crew access',userId)]);
  return json({ok:true});
}
export async function recovery(env:Env,actor:Member,userId:string) {
  owner(actor);fresh(actor);
  const target=await env.DB.prepare("SELECT u.email FROM members m JOIN user u ON u.id=m.user_id WHERE m.user_id=? AND m.role='crew' AND m.active=1").bind(id(userId)).first<{email:string}>();
  if(!target)throw new HttpError(404,'Crew account not found.');
  await audit(env,actor,'Created recovery link',userId).run();
  return json({setupLink:await setupLink(env,target.email)});
}
