import {createRemoteJWKSet,jwtVerify} from 'jose';
import type {Env,Member} from './env';
import {HttpError,json} from './security';

let cached:{issuer:string;keys:ReturnType<typeof createRemoteJWKSet>}|undefined;
export function accessConfig(env:Env){
  const issuer=env.ACCESS_TEAM_DOMAIN;
  if(!issuer||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)||!env.ACCESS_AUD||!/^[a-zA-Z0-9_-]{10,128}$/.test(env.ACCESS_AUD))throw new HttpError(503,'Secure sign-in is not configured yet.');
  return {issuer,audience:env.ACCESS_AUD};
}
async function identity(request:Request,env:Env){
  const {issuer,audience}=accessConfig(env),token=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!token||token.length>12000)throw new HttpError(401,'Please sign in with your email code.');
  if(!cached||cached.issuer!==issuer)cached={issuer,keys:createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`),{timeoutDuration:5000,cacheMaxAge:600000})};
  let claims;
  try{claims=(await jwtVerify(token,cached.keys,{issuer,audience,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email','type'],maxTokenAge:'12h',clockTolerance:5})).payload;}
  catch{throw new HttpError(401,'Your sign-in expired or could not be verified. Please sign in again.');}
  if(claims.type!=='app'||typeof claims.email!=='string'||!claims.email.includes('@')||!claims.sub||claims.sub.length>255||!Number.isInteger(claims.iat)||!Number.isInteger(claims.exp)||Number(claims.iat)>Date.now()/1000+5)throw new HttpError(401,'Please use an approved email login.');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),n=>n.toString(16).padStart(2,'0')).join('');
  return {email:claims.email.trim().toLowerCase(),sub:claims.sub,iat:Number(claims.iat),exp:Number(claims.exp),digest};
}
export async function accessMember(request:Request,env:Env):Promise<Member>{
  const claim=await identity(request,env);
  const row=await env.DB.prepare('SELECT u.id,u.name,u.email,m.role,m.access_subject,m.token_valid_after FROM members m JOIN user u ON u.id=m.user_id WHERE u.email=? AND m.active=1 AND NOT EXISTS(SELECT 1 FROM access_revocations WHERE digest=?)').bind(claim.email,claim.digest).first<{id:string;name:string;email:string;role:'owner'|'crew';access_subject:string|null;token_valid_after:number}>();
  if(!row)throw new HttpError(403,'This email is not approved for this office. Ask Jim for access.');
  if(claim.iat<=row.token_valid_after)throw new HttpError(401,'Please sign in again to use your restored access.');
  if(row.access_subject&&row.access_subject!==claim.sub)throw new HttpError(403,'Your sign-in identity changed. Contact the administrator.');
  if(!row.access_subject){
    const bound=await env.DB.prepare('UPDATE members SET access_subject=? WHERE user_id=? AND active=1 AND token_valid_after<? AND (access_subject IS NULL OR access_subject=?) RETURNING user_id').bind(claim.sub,row.id,claim.iat,claim.sub).first();
    if(!bound)throw new HttpError(403,'Account access changed. Please sign in again.');
  }
  return {id:row.id,name:row.name,email:row.email,role:row.role,sessionCreatedAt:new Date(claim.iat*1000)};
}
export async function accessSignOut(request:Request,env:Env){
  const claim=await identity(request,env);
  await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO access_revocations(digest,expires_at) VALUES(?,?)').bind(claim.digest,claim.exp),env.DB.prepare('DELETE FROM access_revocations WHERE expires_at<?').bind(Math.floor(Date.now()/1000))]);
  return json({logoutUrl:'/cdn-cgi/access/logout'});
}
