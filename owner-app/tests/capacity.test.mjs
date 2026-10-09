import {test} from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './harness.mjs';

test('ten active accounts is a hard cap and failed enrollment rolls back',async()=>{
  const h=await harness();
  try {
    const add=email=>h.request('team',{method:'POST',cookie:h.cookie,data:{name:'Synthetic crew',email}});
    const ids=[];
    for(let i=0;i<9;i++){
      const response=await add(`crew${i}@example.invalid`);
      assert.equal(response.status,201);ids.push((await response.json()).id);
    }
    assert.equal((await add('overflow@example.invalid')).status,409);
    assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM user').first()).n,10);
    assert.equal((await h.request(`team/${ids[0]}/access`,{method:'POST',cookie:h.cookie,data:{active:0}})).status,200);
    assert.equal((await add('replacement@example.invalid')).status,201);
    assert.equal((await h.request(`team/${ids[0]}/access`,{method:'POST',cookie:h.cookie,data:{active:1}})).status,409);
    assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM members WHERE active=1').first()).n,10);
  } finally {await h.mf.dispose();}
});
