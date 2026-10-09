import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {harness} from './harness.mjs';
import {parseCsv,csvCell,suggestMapping} from '../shared/csv.ts';
import {money,date} from '../shared/validation.ts';

test('CSV and financial input validation',()=>{
  assert.equal(money('$1,234.56'),123456);assert.throws(()=>money('1.999'));assert.throws(()=>money('-1'));assert.throws(()=>date('2026-02-30'));
  assert.deepEqual(parseCsv('date,vendor\r\n2026-10-08,"A, B"'),[['date','vendor'],['2026-10-08','A, B']]);
  assert.throws(()=>parseCsv('a,b\n"oops,b'));assert.throws(()=>parseCsv('a,a\n1,2'));
  assert.equal(csvCell('=SUM(A1:A2)'),"\"'=SUM(A1:A2)\"");assert.equal(csvCell(' @SUM(1)'),"\"' @SUM(1)\"");
  assert.equal(suggestMapping(['Expense Date','Vendor','Amount'],'expenses').date,'Expense Date');
});

test('real Worker + D1 + signed Cloudflare Access workflow and authorization',async t=>{
  const h=await harness();const {request,cookie,db}=h;
  const send=(path,data,extra={})=>request(path,{method:'POST',data,cookie,...extra});
  let crewCookie='',crewId='',secondCookie='',expenseId='',receiptId='';
  const customerId=randomUUID(),jobId=randomUUID();
  try{
    await t.test('anonymous denied, security headers set, public signup/admin denied',async()=>{
      const res=await request('state');assert.equal(res.status,401);assert.equal(res.headers.get('cache-control'),'private, no-store');assert.match(res.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(res.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
      assert.equal((await send('auth/sign-up/email',{})).status,404);assert.equal((await send('auth/admin/create-user',{})).status,404);
    });
    await t.test('bootstrap cannot run twice; origin and custom-header required',async()=>{
      assert.equal((await send('setup',{})).status,404);
      assert.equal((await send('customers',{}, {headers:{Origin:'https://attacker.invalid'}})).status,403);
      assert.equal((await send('customers',{}, {headers:{'X-MCC-Request':''}})).status,403);
    });
    await t.test('owner creates customer and job, stale edits rejected',async()=>{
      assert.equal((await send('customers',{id:customerId,name:'QA customer',phone:'555-0100'})).status,201);
      assert.equal((await send('jobs',{id:jobId,customer_id:customerId,title:'QA brick matching',status:'scheduled',owner_notes:'OWNER ONLY NOTE',quoted_cents:150000,scope:'Match repaired brick'})).status,201);
      const edit={id:customerId,version:1,name:'QA customer updated'};
      assert.equal((await request(`customers/${customerId}`,{method:'PUT',cookie,data:edit})).status,200);
      assert.equal((await request(`customers/${customerId}`,{method:'PUT',cookie,data:edit})).status,409);
    });
    async function crew(email,name){const res=await send('team',{email,name});assert.equal(res.status,201);const data=await res.json();assert.equal(data.requiresAccessApproval,true);assert.equal(data.setupLink,undefined);return {id:data.id,cookie:await h.login(email)};}
    await t.test('explicit crew approvals, personal emails, and permissions enforced',async()=>{
      const a=await crew('crew-a@gmail.com','QA Crew A');crewId=a.id;crewCookie=a.cookie;
      const b=await crew('crew-b@outlook.com','QA Crew B');secondCookie=b.cookie;
      let state=await (await request('state',{cookie:crewCookie})).json();assert.equal(state.jobs.length,0);assert.equal(state.customers.length,0);assert.equal(state.invoices.length,0);assert.equal(state.team.length,0);
      assert.equal((await send(`jobs/${jobId}/assignments`,{users:[crewId]})).status,200);
      state=await (await request('state',{cookie:crewCookie})).json();assert.equal(state.jobs.length,1);assert.equal(state.jobs[0].owner_notes,undefined);assert.equal(state.jobs[0].quoted_cents,undefined);
      assert.equal((await send('customers',{id:randomUUID(),name:'No'}, {cookie:crewCookie})).status,403);
      assert.equal((await request('export/expenses',{cookie:crewCookie})).status,403);
      assert.equal((await send('team',{name:'No',email:'no@example.invalid'}, {cookie:crewCookie})).status,403);
    });
    await t.test('crew notes require assignment and cannot access other jobs',async()=>{
      assert.equal((await send(`jobs/${jobId}/notes`,{id:randomUUID(),body:'Work ready'}, {cookie:crewCookie})).status,201);
      assert.equal((await send(`jobs/${jobId}/notes`,{id:randomUUID(),body:'No'}, {cookie:secondCookie})).status,404);
    });
    await t.test('expense validation, private receipt bytes, no cross-crew access',async()=>{
      expenseId=randomUUID();const expense={id:expenseId,job_id:jobId,date:'2026-10-08',vendor:'QA Materials',category:'Materials',amount_cents:4250};
      assert.equal((await send('expenses',{...expense,amount_cents:-1},{cookie:crewCookie})).status,400);
      assert.equal((await send('expenses',expense,{cookie:crewCookie})).status,201);
      const bad=await request(`expenses/${expenseId}/receipt`,{method:'POST',cookie:crewCookie,raw:'<svg/>',headers:{'Content-Type':'image/svg+xml','X-Receipt-Version':'none'}});assert.equal(bad.status,415);
      const bytes=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
      const upload=await request(`expenses/${expenseId}/receipt`,{method:'POST',cookie:crewCookie,raw:bytes,headers:{'Content-Type':'image/png','X-Receipt-Version':'none'}});assert.equal(upload.status,201);receiptId=(await upload.json()).id;
      assert.equal((await request(`receipts/${receiptId}`,{cookie:secondCookie})).status,404);assert.equal((await request(`receipts/${receiptId}`)).status,401);
      const own=await request(`receipts/${receiptId}`,{cookie:crewCookie});assert.equal(own.status,200);assert.match(own.headers.get('content-disposition'),/^attachment/);assert.deepEqual(new Uint8Array(await own.arrayBuffer()),bytes);
      assert.equal((await request(`receipts/${receiptId}`,{cookie})).status,200);
      const otherState=await (await request('state',{cookie:secondCookie})).json();assert.equal(otherState.expenses.length,0);
    });
    await t.test('mileage rejects backwards readings; saves valid trip',async()=>{
      const trip={id:randomUUID(),job_id:jobId,date:'2026-10-08',vehicle:'QA truck',purpose:'Job travel',start_tenths:123400,end_tenths:123600};
      assert.equal((await send('mileage',{...trip,end_tenths:100},{cookie:crewCookie})).status,400);assert.equal((await send('mileage',trip,{cookie:crewCookie})).status,201);
    });
    let batch;
    const csvPayload={source:'Invoice Simple',kind:'expenses',csv:'Date,Vendor,Amount\n2026-10-07,QA Tools,24.55\n2026-10-07,QA Tools,24.55',mapping:{date:'Date',vendor:'Vendor',amount:'Amount'}};
    await t.test('imports preview without writes, deduplicate, commit atomically, reject repeat',async()=>{
      const before=await db.prepare('SELECT COUNT(*) AS n FROM expenses').first();
      const preview=await send('import/preview',csvPayload);assert.equal(preview.status,200);const data=await preview.json();assert.equal(data.addCount,1);assert.equal(data.duplicates,1);
      assert.deepEqual(await db.prepare('SELECT COUNT(*) AS n FROM expenses').first(),before);
      const commit=await send('import/commit',csvPayload);assert.equal(commit.status,201);batch=(await commit.json()).id;
      const replay=await send('import/commit',csvPayload);assert.equal(replay.status,200);assert.equal((await replay.json()).added,0);
      assert.equal((await send('import/preview',csvPayload,{cookie:crewCookie})).status,403);
    });
    await t.test('undo retains records; CSV export is owner only',async()=>{
      assert.equal((await send(`import/${batch}/undo`,{})).status,200);const row=await db.prepare('SELECT status FROM expenses WHERE import_id=?').bind(batch).first();assert.equal(row.status,'void');
      const res=await request('export/expenses',{cookie});assert.equal(res.status,200);assert.match(await res.text(),/amount_cents/);
    });
    await t.test('owner review locks crew editing; revocation blocks already signed-in crew',async()=>{
      const expense=await db.prepare('SELECT * FROM expenses WHERE id=?').bind(expenseId).first();
      assert.equal((await request(`expenses/${expenseId}`,{method:'PUT',cookie,data:{...expense,status:'reviewed'}})).status,200);
      assert.equal((await request(`expenses/${expenseId}`,{method:'PUT',cookie:crewCookie,data:{...expense,version:2}})).status,403);
      const receiptInfo=await (await request(`expenses/${expenseId}/receipt`,{cookie:crewCookie})).json();assert.equal(receiptInfo.editable,false);assert.equal(receiptInfo.storage,undefined);
      assert.equal((await request(`expenses/${expenseId}/receipt`,{method:'DELETE',cookie:crewCookie,headers:{'X-Receipt-Version':receiptId}})).status,409);
      assert.equal((await request(`expenses/${expenseId}/receipt`,{method:'POST',cookie:crewCookie,raw:new Uint8Array([255,216,255]),headers:{'X-Receipt-Version':receiptId}})).status,409);
      assert.equal((await request(`expenses/${expenseId}/receipt`,{method:'DELETE',cookie:secondCookie,headers:{'X-Receipt-Version':receiptId}})).status,404);
      assert.equal((await request(`receipts/${receiptId}`,{cookie:crewCookie})).status,200);
      assert.equal((await send(`team/${crewId}/access`,{active:0})).status,200);
      assert.equal((await request('state',{cookie:crewCookie})).status,403);
      assert.equal((await request(`receipts/${receiptId}`,{cookie:crewCookie})).status,403);
    });
    await t.test('sign-out invalidates session',async()=>{
      assert.equal((await send('auth/sign-out',{})).status,200);assert.equal((await request('state',{cookie})).status,403);
    });
  }finally{await h.mf.dispose();}
});
