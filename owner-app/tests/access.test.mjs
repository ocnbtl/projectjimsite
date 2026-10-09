import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair} from 'jose';
import {harness} from './harness.mjs';
import {readFile} from 'node:fs/promises';

test('Access identity rejects forged, expired, wrong-app and unapproved identities',async t=>{
  const h=await harness();
  const state=cookie=>h.request('state',{cookie});
  try{
    await t.test('email headers alone and malformed assertions cannot authenticate',async()=>{
      assert.equal((await h.request('state',{headers:{'Cf-Access-Authenticated-User-Email':'owner@example.invalid'}})).status,401);
      assert.equal((await state('not.a.jwt')).status,401);
    });
    await t.test('wrong signature rejected',async()=>{
      const foreign=await generateKeyPair('RS256');
      assert.equal((await state(await h.sign('owner@example.invalid',{},foreign.privateKey))).status,401);
    });
    await t.test('claims are checked, not merely decoded',async()=>{
      const now=Math.floor(Date.now()/1000);
      for(const claims of [{aud:['another-application']},{iss:'https://other.cloudflareaccess.com'},{exp:now-60},{iat:now+120},{iat:now-50000},{type:'service'},{email:null},{sub:null},{exp:null},{iat:null}]){
        assert.equal((await state(await h.sign('owner@example.invalid',claims))).status,401,JSON.stringify(claims));
      }
    });
    await t.test('valid stranger does not auto-enroll',async()=>{
      assert.equal((await state(await h.sign('stranger@example.invalid'))).status,403);
      assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM members').first()).n,1);
    });
    await t.test('signed subject is bound and cannot change silently',async()=>{
      assert.equal((await state(h.cookie)).status,200);
      assert.equal((await state(await h.sign('owner@example.invalid',{sub:'different-subject'}))).status,403);
    });
    await t.test('role claim cannot promote crew and restore does not revive old tokens',async()=>{
      const response=await h.request('team',{method:'POST',cookie:h.cookie,data:{name:'Synthetic subcontractor',email:'subcontractor@example.invalid'}});
      assert.equal(response.status,201);const {id}=await response.json();
      const crew=await h.sign('subcontractor@example.invalid',{role:'owner'});
      assert.equal((await (await state(crew)).json()).me.role,'crew');
      assert.equal((await h.request('export/expenses',{cookie:crew})).status,403);
      for(const active of [0,1])assert.equal((await h.request(`team/${id}/access`,{method:'POST',cookie:h.cookie,data:{active}})).status,200);
      assert.equal((await state(crew)).status,401);
      const boundary=await h.db.prepare('SELECT token_valid_after FROM members WHERE user_id=?').bind(id).first();
      assert.equal((await state(await h.sign('subcontractor@example.invalid',{iat:boundary.token_valid_after+1}))).status,200);
    });
    await t.test('logout blocks replay but a new verified assertion can sign in',async()=>{
      const response=await h.request('auth/sign-out',{method:'POST',cookie:h.cookie,data:{}});
      assert.deepEqual(await response.json(),{logoutUrl:'/cdn-cgi/access/logout'});
      assert.equal((await state(h.cookie)).status,403);
      assert.equal((await state(await h.sign('owner@example.invalid',{jti:'new-session'}))).status,200);
    });
    await t.test('approved owner setup supports Jim and Ocean, is repeat-safe, and grants owner permissions',async()=>{
      const sql=await readFile(new URL('../setup/approved-owners.sql',import.meta.url),'utf8');
      await h.db.exec(sql);await h.db.exec(sql);
      for(const email of ['james@masonrycolorcorrections.com','ocean@oceanbattelle.com']){
        const token=await h.sign(email);
        assert.equal((await (await state(token)).json()).me.role,'owner');
        assert.equal((await h.request('export/expenses',{cookie:token})).status,200);
        assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM user WHERE email=?').bind(email).first()).n,1);
      }
    });
  }finally{await h.mf.dispose();}
});
