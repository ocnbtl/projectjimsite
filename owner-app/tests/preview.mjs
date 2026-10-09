// Local-only synthetic QA database. Never included in the Worker deployment.
import {createServer} from 'node:http';
import {harness} from './harness.mjs';
const h=await harness();
let signedIn=true;
const server=createServer(async(req,res)=>{
  try{
    if(req.url==='/cdn-cgi/access/logout'){signedIn=false;res.writeHead(302,{Location:'/'});res.end();return;}
    if(req.url==='/qa/sign-in'){signedIn=true;h.cookie=await h.sign('owner@example.invalid',{jti:crypto.randomUUID()});res.writeHead(302,{Location:'/'});res.end();return;}
    const chunks=[];for await(const c of req)chunks.push(c);
    const response=await h.mf.dispatchFetch(`http://localhost:8787${req.url}`,{method:req.method,headers:{...req.headers,...(signedIn?{'Cf-Access-Jwt-Assertion':h.cookie}:{})},body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
    res.statusCode=response.status;for(const [key,value] of response.headers)if(key!=='set-cookie')res.setHeader(key,value);
    const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);
    res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.statusCode=500;res.end('Local preview error');}
});
server.listen(8787,'127.0.0.1',()=>console.log('Synthetic local QA preview ready at http://localhost:8787'));
async function stop(){server.close();await h.mf.dispose();process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
