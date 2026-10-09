import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,extname,relative,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {loadState} from '../src/load-state.ts';
const root=resolve(import.meta.dirname,'..');
export async function harness(){
  const issuer='https://mcc-test.cloudflareaccess.com',audience='synthetic-mcc-office-audience',keys=await generateKeyPair('RS256');
  const publicKey={...await exportJWK(keys.publicKey),kid:'synthetic-key',use:'sig',alg:'RS256'};
  const mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'office-test',modules:true,scriptPath:resolve(root,'.test-output/index.js'),compatibilityDate:'2026-10-08',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],
    outboundService:async request=>request.url===issuer+'/cdn-cgi/access/certs'?Response.json({keys:[publicKey]}):new Response('No external network in tests',{status:503}),
    bindings:{APP_ORIGIN:'http://localhost:8787',ENVIRONMENT:'local',ACCESS_TEAM_DOMAIN:issuer,ACCESS_AUD:audience},
    serviceBindings:{ASSETS:async request=>{
      const url=new URL(request.url);let path=resolve(root,'dist','.'+url.pathname);
      const assetRelative=relative(resolve(root,'dist'),path);
      if(assetRelative.startsWith('..')||isAbsolute(assetRelative))path=resolve(root,'dist','index.html');
      let content;try{content=await readFile(path);}catch{path=resolve(root,'dist','index.html');content=await readFile(path);}
      return new Response(content,{headers:{'Content-Type':extname(path)==='.js'?'text/javascript':extname(path)==='.css'?'text/css':'text/html'}});
    }}
  }]}));
  const db=await mf.getD1Database('DB');
  try{for(const file of (await readdir(resolve(root,'migrations'))).filter(f=>f.endsWith('.sql')).sort())await db.exec((await readFile(resolve(root,'migrations',file),'utf8')).split('\n').filter(line=>!line.trimStart().startsWith('--')).join('\n'));}
  catch(error){await mf.dispose();throw error;}
  const ownerId=randomUUID(),now=Date.now();
  await db.batch([db.prepare('INSERT INTO user(id,name,email,createdAt,updatedAt) VALUES(?,?,?,?,?)').bind(ownerId,'Synthetic owner','owner@example.invalid',now,now),db.prepare("INSERT INTO members(user_id,role) VALUES(?,'owner')").bind(ownerId)]);
  const sign=async(email,overrides={},key=keys.privateKey)=>{
    const now=Math.floor(Date.now()/1000);
    return new SignJWT({email,type:'app',sub:'subject-'+email,iss:issuer,aud:[audience],iat:now,exp:now+3600,...overrides}).setProtectedHeader({alg:'RS256',kid:'synthetic-key'}).sign(key);
  };
  // Historical fixture argument name "cookie" now carries a signed Access assertion.
  const rawRequest=async(path,{method='GET',data,cookie,headers={},raw}={})=>mf.dispatchFetch('http://localhost:8787/api/'+path,{method,headers:{...(method!=='GET'?{'Origin':'http://localhost:8787','X-MCC-Request':'1','Content-Type':'application/json'}:{}),...(cookie?{'Cf-Access-Jwt-Assertion':cookie}:{}),...headers},body:raw??(data===undefined?undefined:JSON.stringify(data))});
  // Existing workflow assertions exercise the same paginated loader as the UI.
  const request=async(path,options={})=>{
    if(path!=='state')return rawRequest(path,options);
    const bootstrap=await rawRequest('state?bootstrap=1',options);if(!bootstrap.ok)return bootstrap;
    const state=await loadState(async p=>{const response=await rawRequest(p,options);if(!response.ok)throw new Error(`Page failed: ${response.status}`);return response.json();});
    return new Response(JSON.stringify(state),{status:200,headers:bootstrap.headers});
  };
  const login=email=>sign(email);
  const cookie=await login('owner@example.invalid');
  return {mf,db,request,rawRequest,cookie,login,sign,ownerId,issuer,audience};
}
