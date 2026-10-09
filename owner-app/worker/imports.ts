import type {Env,Member} from './env';
import {parseCsv,IMPORT_STEP_ROWS} from '../shared/csv';
import {text,date,money,choice,categories,id,InputError} from '../shared/validation';
import {owner,body,json,HttpError,audit,jobAccess} from './security';
async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}

export async function importData(request:Request,env:Env,actor:Member,commit:boolean) {
  owner(actor);const input=await body(request,24000);
  const source=choice(input.source,['Invoice Simple','QuickBooks','Other'],'source');
  const kind=choice(input.kind,['expenses','invoices'],'import type');
  const csv=text(input.csv,'CSV',20000);
  if(!input.mapping || typeof input.mapping!=='object' || Array.isArray(input.mapping))throw new InputError('Match the file columns first.');
  const mapping=input.mapping as Record<string,unknown>;
  const [headers,...lines]=parseCsv(csv);const jobId=input.job_id?id(input.job_id):null;if(jobId)await jobAccess(env,actor,jobId);
  if(lines.length>IMPORT_STEP_ROWS)throw new InputError('Import up to three rows per step. Reopen the importer to split the file automatically.');
  const fileDigest=await digest(JSON.stringify({source,kind,csv,mapping,jobId}));
  const oldBatch=await env.DB.prepare('SELECT id FROM import_batches WHERE digest=?').bind(fileDigest).first();
  const seen=new Set<string>(),preview:Array<Record<string,unknown>>=[], errors:string[]=[];let duplicates=0;
  for(let i=0;i<lines.length;i++) {
    try {
      const get=(key:string,required=true)=>{const header=mapping[key];const index=typeof header==='string'?headers.indexOf(header):-1;if(index<0){if(required)throw new InputError(`Choose the ${key} column.`);return '';}return lines[i][index];};
      const row:Record<string,string|number|null>={date:date(get('date')),job_id:jobId};
      if(kind==='expenses')Object.assign(row,{vendor:text(get('vendor'),'Vendor',180),amount_cents:money(get('amount')),category:categories.includes(get('category',false) as typeof categories[number])?get('category',false):'Other',notes:text(get('notes',false),'Notes',2000,false)});
      else {const total=money(get('total'));const paid=get('paid',false)?money(get('paid',false)):0;if(paid>total)throw new InputError('Amount paid exceeds total.');Object.assign(row,{number:text(get('number'),'Invoice number',100),customer:text(get('customer'),'Customer',180),total_cents:total,paid_cents:paid});}
      if(kind==='expenses' && row.amount_cents===0)throw new InputError('Expense must be greater than zero.');
      // Invoice identity ignores payment updates: re-imports must not double-count the same invoice.
      const identity=kind==='invoices'?{source,kind,number:row.number,customer:row.customer}:{source,kind,date:row.date,vendor:row.vendor,amount:row.amount_cents};
      const fingerprint=await digest(JSON.stringify(identity));
      const exists=seen.has(fingerprint) || !!await env.DB.prepare(`SELECT id FROM ${kind} WHERE fingerprint=?`).bind(fingerprint).first();
      seen.add(fingerprint);if(exists)duplicates++;
      preview.push({...row,fingerprint,duplicate:exists,row:i+2});
    }catch(error){errors.push(`Row ${i+2}: ${error instanceof Error?error.message:'Check this row.'}`);}
  }
  if(!commit)return json({rows:preview,errors,duplicates,alreadyImported:!!oldBatch,addCount:preview.length-duplicates});
  if(errors.length)throw new InputError('Fix the preview errors before importing.');
  if(oldBatch)return json({id:oldBatch.id,added:0,duplicates,alreadyImported:true});
  const ready=preview.filter(row=>!row.duplicate);if(!ready.length)return json({id:null,added:0,duplicates});
  const batchId=crypto.randomUUID();
  const inserts=ready.map(row=>kind==='expenses'
    ?env.DB.prepare('INSERT INTO expenses(id,job_id,user_id,date,vendor,category,amount_cents,notes,import_id,fingerprint) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),jobId,actor.id,row.date,row.vendor,row.category,row.amount_cents,row.notes,batchId,row.fingerprint)
    :env.DB.prepare('INSERT INTO invoices(id,job_id,date,number,customer,total_cents,paid_cents,source,import_id,fingerprint) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),jobId,row.date,row.number,row.customer,row.total_cents,row.paid_cents,source,batchId,row.fingerprint));
  // D1 batch is atomic: a concurrent duplicate rolls back the entire import.
  await env.DB.batch([env.DB.prepare('INSERT INTO import_batches(id,source,kind,digest,row_count,owner_id) VALUES(?,?,?,?,?,?)').bind(batchId,source,kind,fileDigest,ready.length,actor.id),...inserts,audit(env,actor,'Imported records',batchId,jobId)]);
  return json({id:batchId,added:ready.length,duplicates},201);
}
export async function undoImport(env:Env,actor:Member,batchId:string) {
  owner(actor); const batch=await env.DB.prepare('SELECT kind,undone FROM import_batches WHERE id=?').bind(batchId).first<{kind:string,undone:number}>();
  if(!batch || batch.undone)throw new HttpError(409,'This import is unavailable or already undone.');
  const kind=choice(batch.kind,['expenses','invoices'],'type');
  if(await env.DB.prepare(`SELECT id FROM ${kind} WHERE import_id=? AND version<>1`).bind(batchId).first())throw new HttpError(409,'Some imported records were edited. Review and void them individually.');
  await env.DB.batch([env.DB.prepare(`UPDATE ${kind} SET status='void',version=version+1 WHERE import_id=? AND version=1`).bind(batchId),env.DB.prepare('UPDATE import_batches SET undone=1 WHERE id=?').bind(batchId),audit(env,actor,'Undid import',batchId)]);
  return json({ok:true});
}
export async function exportData(env:Env,actor:Member,kind:string,cursor='') {
  owner(actor);
  const columns:Record<string,string[]>={expenses:['id','job_id','user_id','date','vendor','category','amount_cents','currency','notes','status','import_id'],mileage:['id','job_id','user_id','date','vehicle','purpose','start_tenths','end_tenths','status'],invoices:['id','job_id','date','number','customer','total_cents','paid_cents','currency','source','status'],customers:['id','name','email','phone','address','notes'],jobs:['id','customer_id','title','address','status','scheduled_date','scope','owner_notes','quoted_cents']};
  if(!columns[kind])throw new HttpError(404,'Export not found.');
  if(cursor.length>80)throw new HttpError(400,'Invalid export page.');
  const rows=await env.DB.prepare(`SELECT ${columns[kind].join(',')} FROM ${kind} WHERE id>? ORDER BY id LIMIT 11`).bind(cursor).all<Record<string,unknown>>();
  const page=rows.results.slice(0,10);return json({columns:columns[kind],rows:page,next:rows.results.length>10?page[page.length-1].id:null});
}
