import {test} from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './harness.mjs';
test('200-row imports resume without duplicates and exports paginate completely',async()=>{
  const h=await harness(),{rawRequest:request,cookie,db}=h;
  const part=i=>({source:'Invoice Simple',kind:'expenses',mapping:{date:'Date',vendor:'Vendor',amount:'Amount'},csv:'Date,Vendor,Amount\n'+Array.from({length:Math.min(3,200-i*3)},(_,j)=>`2026-10-09,QA vendor ${i*3+j},10.00`).join('\n')});
  const send=(path,data)=>request(path,{method:'POST',cookie,data});
  try{
    for(let i=0;i<67;i++)assert.equal((await send('import/preview',part(i))).status,200);
    // Save part of the file, lose the response, then retry the same steps.
    for(let i=0;i<8;i++)assert.equal((await send('import/commit',part(i))).status,201);
    for(let i=0;i<67;i++)assert.equal((await send('import/commit',part(i))).status,i<8?200:201);
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM expenses').first()).n,200);
    const oversized=part(0);oversized.csv+='\n2026-10-09,Extra,1.00';assert.equal((await send('import/preview',oversized)).status,400);
    let cursor='',seen=new Set(),pages=0;
    do{const r=await request(`state?collection=expenses&cursor=${cursor}`,{cookie});assert.equal(r.status,200);const page=await r.json();assert.ok(page.rows.length<=10);for(const row of page.rows){assert.ok(!seen.has(row.id));seen.add(row.id);}cursor=page.next??'';pages++;}while(cursor);
    assert.equal(seen.size,200);assert.equal(pages,20);
    cursor='';let exported=0;
    do{const r=await request(`export/expenses?cursor=${cursor}`,{cookie});assert.equal(r.status,200);const page=await r.json();assert.ok(page.rows.length<=10);exported+=page.rows.length;cursor=page.next??'';}while(cursor);
    assert.equal(exported,200);
  }finally{await h.mf.dispose();}
});
