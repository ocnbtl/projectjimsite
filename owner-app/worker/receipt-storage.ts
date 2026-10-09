import type {Env,Member} from './env';
import {Buffer} from 'node:buffer';
import {audit,body,boundedBytes,HttpError,json} from './security';
import {receiptType} from './receipts';
export const MAX_RECEIPT=512*1024, CHUNK=32*1024;
async function expenseAccess(env:Env,actor:Member,expenseId:string,write=false){
  const e=await env.DB.prepare('SELECT user_id,status,job_id FROM expenses WHERE id=?').bind(expenseId).first<{user_id:string,status:string,job_id:string|null}>();
  if(!e||(actor.role!=='owner'&&e.user_id!==actor.id))throw new HttpError(404,'Expense not found.');
  if(write&&(e.status==='void'||(actor.role!=='owner'&&e.status!=='submitted')))throw new HttpError(409,'This expense is locked. Ask Jim to make the change.');
  return e;
}
export async function receiptInfo(env:Env,actor:Member,expenseId:string){
  const e=await expenseAccess(env,actor,expenseId);
  const receipt=await env.DB.prepare('SELECT id,mime,bytes FROM receipts WHERE expense_id=?').bind(expenseId).first();
  const storage=actor.role==='owner'?await env.DB.prepare('SELECT used_bytes,cap_bytes FROM receipt_storage WHERE id=1').first():undefined;
  return json({receipt,editable:e.status!=='void'&&(actor.role==='owner'||e.status==='submitted'),storage});
}
function guard(env:Env,actor:Member,expenseId:string,expected:string,operation:string){return env.DB.prepare('INSERT INTO receipt_write_guard(id,expense_id,actor_id,expected_id) VALUES(?,?,?,?)').bind(operation,expenseId,actor.id,expected);}
async function transaction(env:Env,statements:D1PreparedStatement[]){
  try{await env.DB.batch(statements);}catch(e){
    const message=e instanceof Error?e.message:'';
    if(message.includes('receipt_conflict'))throw new HttpError(409,'The receipt changed elsewhere. Close and reopen it before trying again.');
    if(message.includes('receipt_access'))throw new HttpError(409,'This expense is now locked. Refresh before trying again.');
    if(message.includes('receipt_incomplete'))throw new HttpError(409,'The photo upload is incomplete or expired. Your saved photo is unchanged. Try saving again.');
    if(message.includes('used_bytes<=cap_bytes'))throw new HttpError(507,'Receipt storage is full. Nothing was changed. Ask Jim to download and remove unneeded photos.');
    throw e;
  }
}
function expectedId(request:Request){
  const expected=request.headers.get('X-Receipt-Version');
  if(expected==='none')return '';
  if(expected===null||!/^([\w-]{1,80})?$/.test(expected))throw new HttpError(428,'Reopen the receipt before saving.');
  return expected;
}
export async function uploadReceipt(request:Request,env:Env,actor:Member,expenseId:string){
  const e=await expenseAccess(env,actor,expenseId,true),expected=expectedId(request);
  // Compatibility for small photos only. Larger photos use bounded staged transfers.
  const bytes=await boundedBytes(request,CHUNK),mime=receiptType(bytes);
  if(!mime)throw new HttpError(415,'Choose a JPEG, PNG, or WebP photo.');
  const receiptId=crypto.randomUUID(),operation=crypto.randomUUID();
  const statements=[guard(env,actor,expenseId,expected,operation),env.DB.prepare('DELETE FROM receipts WHERE expense_id=?').bind(expenseId),env.DB.prepare('INSERT INTO receipts(id,expense_id,object_key,mime,bytes,uploaded_by) VALUES(?,?,?,?,?,?)').bind(receiptId,expenseId,`d1:${receiptId}`,mime,bytes.length,actor.id)];
  // D1's default binary transport expands every byte into a JSON number. Hex uses
  // native encoding and SQLite decoding, retaining the exact original BLOB bytes.
  for(let i=0;i<bytes.length;i+=CHUNK)statements.push(env.DB.prepare('INSERT INTO receipt_chunks(receipt_id,part,data) VALUES(?,?,unhex(?))').bind(receiptId,i/CHUNK,Buffer.from(bytes.subarray(i,i+CHUNK)).toString('hex')));
  statements.push(audit(env,actor,expected?'Replaced receipt':'Attached receipt',expenseId,e.job_id),env.DB.prepare('DELETE FROM receipt_write_guard WHERE id=?').bind(operation));
  await transaction(env,statements);
  return json({id:receiptId},201);
}
export async function beginReceipt(request:Request,env:Env,actor:Member,expenseId:string){
  await expenseAccess(env,actor,expenseId,true);
  const expected=expectedId(request),input=await body(request,1024),size=Number(input.bytes);
  if(!Number.isInteger(size)||size<3||size>MAX_RECEIPT)throw new HttpError(400,'Choose a compressed photo up to 512 KB.');
  const uploadId=crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM receipt_uploads WHERE id IN (SELECT id FROM receipt_uploads WHERE expires_at<=unixepoch() LIMIT 10)'),
    env.DB.prepare('DELETE FROM receipt_upload_parts WHERE upload_id IN (SELECT id FROM receipt_uploads WHERE actor_id=?)').bind(actor.id),
    env.DB.prepare('DELETE FROM receipt_uploads WHERE actor_id=?').bind(actor.id),
    env.DB.prepare('INSERT INTO receipt_uploads(id,actor_id,expense_id,expected_id,bytes,expires_at) VALUES(?,?,?,?,?,unixepoch()+3600)').bind(uploadId,actor.id,expenseId,expected,size)
  ]);
  return json({id:uploadId,chunkBytes:CHUNK},201);
}
async function staged(env:Env,actor:Member,uploadId:string){
  const upload=await env.DB.prepare('SELECT * FROM receipt_uploads WHERE id=? AND actor_id=? AND expires_at>unixepoch()').bind(uploadId,actor.id).first<{id:string;expense_id:string;expected_id:string;bytes:number;mime:string}>();
  if(!upload)throw new HttpError(404,'This upload expired. Your saved photo is unchanged. Try saving again.');
  await expenseAccess(env,actor,upload.expense_id,true);return upload;
}
export async function receiptPart(request:Request,env:Env,actor:Member,uploadId:string,part:number){
  const upload=await staged(env,actor,uploadId);
  if(!Number.isInteger(part)||part<0||part>=Math.ceil(upload.bytes/CHUNK))throw new HttpError(400,'Invalid photo part.');
  const bytes=await boundedBytes(request,CHUNK),expected=Math.min(CHUNK,upload.bytes-part*CHUNK);
  if(bytes.length!==expected)throw new HttpError(400,'Photo part was incomplete. Try saving again.');
  const mime=part===0?receiptType(bytes):null;if(part===0&&!mime)throw new HttpError(415,'Choose a JPEG, PNG, or WebP photo.');
  const statements=[env.DB.prepare('INSERT INTO receipt_upload_parts(upload_id,part,data) VALUES(?,?,unhex(?)) ON CONFLICT(upload_id,part) DO UPDATE SET data=excluded.data').bind(uploadId,part,Buffer.from(bytes).toString('hex'))];
  if(mime)statements.push(env.DB.prepare('UPDATE receipt_uploads SET mime=? WHERE id=?').bind(mime,uploadId));
  await env.DB.batch(statements);return json({saved:part});
}
export async function finishReceipt(env:Env,actor:Member,uploadId:string){
  // A lost successful response can be retried without creating another receipt.
  const saved=await env.DB.prepare('SELECT id,expense_id FROM receipts WHERE id=? AND uploaded_by=?').bind(uploadId,actor.id).first<{id:string;expense_id:string}>();
  if(saved){await expenseAccess(env,actor,saved.expense_id);return json({id:saved.id},201);}
  const upload=await staged(env,actor,uploadId),e=await expenseAccess(env,actor,upload.expense_id,true),operation=crypto.randomUUID();
  await transaction(env,[
    guard(env,actor,upload.expense_id,upload.expected_id,operation),
    env.DB.prepare('INSERT INTO receipt_upload_guard(id) VALUES(?)').bind(uploadId),
    env.DB.prepare('DELETE FROM receipts WHERE expense_id=?').bind(upload.expense_id),
    env.DB.prepare('INSERT INTO receipts(id,expense_id,object_key,mime,bytes,uploaded_by) SELECT id,expense_id,?,mime,bytes,actor_id FROM receipt_uploads WHERE id=?').bind(`d1:${uploadId}`,uploadId),
    env.DB.prepare('INSERT INTO receipt_chunks(receipt_id,part,data) SELECT upload_id,part,data FROM receipt_upload_parts WHERE upload_id=?').bind(uploadId),
    audit(env,actor,upload.expected_id?'Replaced receipt':'Attached receipt',upload.expense_id,e.job_id),
    env.DB.prepare('DELETE FROM receipt_upload_guard WHERE id=?').bind(uploadId),
    env.DB.prepare('DELETE FROM receipt_uploads WHERE id=?').bind(uploadId),
    env.DB.prepare('DELETE FROM receipt_write_guard WHERE id=?').bind(operation)
  ]);return json({id:uploadId},201);
}
export async function removeReceipt(request:Request,env:Env,actor:Member,expenseId:string){
  const e=await expenseAccess(env,actor,expenseId,true),expected=expectedId(request),operation=crypto.randomUUID();
  if(!expected)throw new HttpError(400,'No receipt selected.');
  await transaction(env,[guard(env,actor,expenseId,expected,operation),env.DB.prepare('DELETE FROM receipts WHERE expense_id=?').bind(expenseId),audit(env,actor,'Removed receipt photo',expenseId,e.job_id),env.DB.prepare('DELETE FROM receipt_write_guard WHERE id=?').bind(operation)]);
  return json({removed:true});
}
export async function downloadReceipt(env:Env,actor:Member,receiptId:string,preview=false){
  const receipt=await env.DB.prepare("SELECT r.object_key,r.mime,r.bytes FROM receipts r JOIN expenses e ON e.id=r.expense_id WHERE r.id=? AND (?='owner' OR e.user_id=?)").bind(receiptId,actor.role,actor.id).first<{object_key:string,mime:string,bytes:number}>();
  if(!receipt)throw new HttpError(404,'Receipt not found.');
  if(!receipt.object_key.startsWith('d1:'))throw new HttpError(503,'This older receipt needs migration. Its record has been preserved.');
  const chunks=await env.DB.prepare('SELECT hex(data) AS encoded FROM receipt_chunks WHERE receipt_id=? ORDER BY part').bind(receiptId).all<{encoded:string}>();
  const bytes=new Uint8Array(receipt.bytes);let offset=0;
  for(const chunk of chunks.results){const data=Buffer.from(chunk.encoded,'hex');bytes.set(data,offset);offset+=data.length;}
  if(offset!==receipt.bytes)throw new HttpError(503,'The receipt could not be loaded. Please try again.');
  const extension=receipt.mime==='image/jpeg'?'jpg':receipt.mime==='image/png'?'png':'webp';
  return new Response(bytes,{headers:{'Content-Type':receipt.mime,'Content-Disposition':`${preview?'inline':'attachment'}; filename="receipt-${receiptId}.${extension}"`}});
}
