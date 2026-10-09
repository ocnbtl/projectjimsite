import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {harness} from './harness.mjs';

test('capped receipt storage is atomic, private, and editable',async t=>{
  const h=await harness(),{db,request,cookie}=h;
  const expense=randomUUID(),path=`expenses/${expense}/receipt`;
  const photo=size=>{const b=new Uint8Array(size);b.set([255,216,255]);return b;};
  const put=async(version,bytes=photo(40000),target=path)=>{
    if(bytes.length<=32768||bytes.length>524288)return request(target,{method:'POST',cookie,raw:bytes,headers:{'Content-Type':'image/jpeg','X-Receipt-Version':version}});
    const begin=await request(target+'/begin',{method:'POST',cookie,data:{bytes:bytes.length},headers:{'X-Receipt-Version':version}});if(!begin.ok)return begin;
    const {id}=await begin.json();for(let start=0;start<bytes.length;start+=32768){const r=await request(`receipt-uploads/${id}/parts/${start/32768}`,{method:'PUT',cookie,raw:bytes.slice(start,start+32768)});if(!r.ok)return r;}
    return request(`receipt-uploads/${id}/finish`,{method:'POST',cookie});
  };
  const info=async()=>{const r=await request(path,{cookie});assert.equal(r.status,200);return r.json();};
  let receipt;
  try{
    const create=await request('expenses',{method:'POST',cookie,data:{id:expense,date:'2026-10-09',vendor:'Synthetic receipt QA',category:'Materials',amount_cents:1250}});assert.equal(create.status,201);
    await t.test('version required, unsupported and oversize rejected without writes',async()=>{
      assert.equal((await request(path,{method:'POST',cookie,raw:photo(12)})).status,428);
      assert.equal((await put('none',new TextEncoder().encode('<svg/>'))).status,415);
      assert.equal((await put('none',photo(524289))).status,413);
      assert.equal((await info()).receipt,null);
    });
    await t.test('max-size image chunks reassemble byte-for-byte and owner sees capacity',async()=>{
      const bytes=photo(524288),r=await put('none',bytes);assert.equal(r.status,201,await r.clone().text());receipt=(await r.json()).id;
      const got=await request(`receipts/${receipt}?preview=1`,{cookie});assert.equal(got.status,200);assert.match(got.headers.get('content-disposition'),/^inline/);assert.deepEqual(new Uint8Array(await got.arrayBuffer()),bytes);
      assert.equal((await db.prepare('SELECT count(*) n FROM receipt_chunks').first()).n,16);
      assert.equal((await info()).storage.used_bytes,524288);
      assert.equal((await request(`receipts/${receipt}`)).status,401);
    });
    await t.test('quota failure rolls back metadata, bytes, and activity',async()=>{
      await db.prepare('UPDATE receipt_storage SET cap_bytes=524288').run();
      // A second expense cannot consume any space, even while the first remains readable.
      const other=randomUUID();await request('expenses',{method:'POST',cookie,data:{id:other,date:'2026-10-09',vendor:'Second',category:'Materials',amount_cents:100}});
      const failed=await put('none',photo(40000),`expenses/${other}/receipt`);assert.equal(failed.status,507,await failed.clone().text());
      assert.equal((await info()).receipt.id,receipt);assert.equal((await info()).storage.used_bytes,524288);
      assert.equal((await db.prepare('SELECT count(*) n FROM receipt_write_guard').first()).n,0);
      // Replacing may reuse its own space, but a larger replacement must roll back entirely.
      let r=await put(receipt,photo(10000));assert.equal(r.status,201);receipt=(await r.json()).id;
      await db.prepare('UPDATE receipt_storage SET cap_bytes=10000').run();
      r=await put(receipt);assert.equal(r.status,507);
      assert.equal((await info()).receipt.id,receipt);assert.equal((await info()).storage.used_bytes,10000);
      assert.equal((await request(`receipts/${receipt}`,{cookie})).status,200);
    });
    await t.test('simultaneous replacement allows only one winner',async()=>{
      await db.prepare('UPDATE receipt_storage SET cap_bytes=209715200').run();
      const old=receipt,res=await Promise.all([put(old,photo(12000)),put(old,photo(12000))]);assert.deepEqual(res.map(r=>r.status).sort(),[201,409]);
      receipt=(await info()).receipt.id;assert.notEqual(receipt,old);
      assert.equal((await request(`receipts/${old}`,{cookie})).status,404);
      assert.equal((await info()).storage.used_bytes,12000);
    });
    await t.test('stale deletion rejected, valid deletion frees space and keeps expense',async()=>{
      assert.equal((await request(path,{method:'DELETE',cookie,headers:{'X-Receipt-Version':randomUUID()}})).status,409);
      assert.equal((await request(path,{method:'DELETE',cookie,headers:{'X-Receipt-Version':receipt}})).status,200);
      assert.equal((await info()).storage.used_bytes,0);assert.equal((await info()).receipt,null);
      assert.ok(await db.prepare('SELECT id FROM expenses WHERE id=?').bind(expense).first());
      assert.equal((await db.prepare('SELECT count(*) n FROM receipt_chunks').first()).n,0);
    });
    await t.test('void expense cannot be changed and guard protects against bypass',async()=>{
      await db.prepare("UPDATE expenses SET status='void' WHERE id=?").bind(expense).run();
      assert.equal((await put('none')).status,409);assert.equal((await info()).editable,false);
      const actor=await db.prepare("SELECT user_id FROM members WHERE role='owner'").first();
      await assert.rejects(db.prepare('INSERT INTO receipt_write_guard VALUES(?,?,?,?)').bind(randomUUID(),expense,actor.user_id,'').run(),/receipt_access/);
    });
  }finally{await h.mf.dispose();}
});
