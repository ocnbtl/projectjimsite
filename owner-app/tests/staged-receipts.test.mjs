import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {harness} from './harness.mjs';
test('interrupted staged receipts preserve saved photos and retries are bounded',async()=>{
  const h=await harness(),{request,cookie,db}=h,id=randomUUID(),path=`expenses/${id}/receipt`;
  const send=(p,data,headers={})=>request(p,{method:'POST',cookie,data,headers});
  try{
    await send('expenses',{id,date:'2026-10-09',vendor:'QA',category:'Other',amount_cents:100});
    const old=await request(path,{method:'POST',cookie,raw:new Uint8Array([255,216,255]),headers:{'X-Receipt-Version':'none'}});assert.equal(old.status,201);const oldId=(await old.json()).id;
    const begin=await send(path+'/begin',{bytes:40000},{'X-Receipt-Version':oldId});const upload=(await begin.json()).id;
    assert.equal((await send(`receipt-uploads/${upload}/finish`)).status,409);
    assert.equal((await request(`receipts/${oldId}`,{cookie})).status,200);
    const bytes=new Uint8Array(40000);bytes.set([255,216,255]);
    for(const part of [0,0,1]){const r=await request(`receipt-uploads/${upload}/parts/${part}`,{method:'PUT',cookie,raw:bytes.slice(part*32768,(part+1)*32768)});assert.equal(r.status,200);}
    assert.equal((await send(`receipt-uploads/${upload}/finish`)).status,201);
    assert.equal((await send(`receipt-uploads/${upload}/finish`)).status,201);
    assert.equal((await request(`receipts/${oldId}`,{cookie})).status,404);
    const downloaded=await request(`receipts/${upload}`,{cookie});assert.deepEqual(new Uint8Array(await downloaded.arrayBuffer()),bytes);
    assert.equal((await db.prepare('SELECT count(*) n FROM receipt_uploads').first()).n,0);
    assert.equal((await db.prepare('SELECT count(*) n FROM receipt_upload_parts').first()).n,0);
    const again=await send(path+'/begin',{bytes:40000},{'X-Receipt-Version':upload});const expired=(await again.json()).id;
    await db.prepare('UPDATE receipt_uploads SET expires_at=0').run();
    assert.equal((await send(`receipt-uploads/${expired}/finish`)).status,404);
    assert.equal((await request(`receipts/${upload}`,{cookie})).status,200);
  }finally{await h.mf.dispose();}
});
