import type {Env,Member} from './env';
import {email,text,integer,id} from '../shared/validation';
import {owner,fresh,body,json,HttpError,audit} from './security';
export async function createCrew(request:Request,env:Env,actor:Member){
  owner(actor);fresh(actor);const input=await body(request),address=email(input.email),name=text(input.name,'Name',120),userId=crypto.randomUUID(),now=Date.now();
  // Explicit member creation only. A valid Access login never auto-enrolls a stranger.
  await env.DB.batch([
    env.DB.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,0,?,?)').bind(userId,name,address,now,now),
    env.DB.prepare("INSERT INTO members(user_id,role) VALUES(?,'crew')").bind(userId),audit(env,actor,'Added crew member',userId)
  ]);
  return json({id:userId,requiresAccessApproval:true},201);
}
export async function changeAccess(request:Request,env:Env,actor:Member,userId:string){
  owner(actor);fresh(actor);const input=await body(request),active=integer(input.active,'Access',0,1);
  const target=await env.DB.prepare('SELECT role FROM members WHERE user_id=?').bind(id(userId)).first<{role:string}>();
  if(!target||target.role==='owner')throw new HttpError(403,'Owner access cannot be changed here.');
  await env.DB.batch([env.DB.prepare('UPDATE members SET active=?,token_valid_after=? WHERE user_id=?').bind(active,Math.floor(Date.now()/1000),userId),audit(env,actor,active?'Restored crew access':'Disabled crew access',userId)]);
  return json({ok:true});
}
