// Local runtime compatibility probe, NOT a Cloudflare CPU benchmark or login implementation.
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
const mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'password-local-only',modules:true,compatibilityDate:'2026-10-08',compatibilityFlags:['nodejs_compat'],script:`
export default {async fetch(){
  const results=[];
  for(const [hash,iterations] of [['SHA-256',600000],['SHA-512',210000]]){
    const start=Date.now();
    try{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('SYNTHETIC-ONLY-not-a-login'), 'PBKDF2',false,['deriveBits']);await crypto.subtle.deriveBits({name:'PBKDF2',hash,salt:crypto.getRandomValues(new Uint8Array(16)),iterations},key,256);results.push({hash,iterations,supported:true,localWallMs:Date.now()-start});}
    catch(e){results.push({hash,iterations,supported:false,error:e.message});}
  }
  return Response.json(results);
}};` }]}));
try{console.log(await (await mf.dispatchFetch('http://localhost/')).text());}finally{await mf.dispose();}
