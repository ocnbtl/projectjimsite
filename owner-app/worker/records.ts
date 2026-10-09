import type { Env, Member } from './env';
import { text, integer, date, id, choice, categories, statuses, InputError } from '../shared/validation';
import { audit, HttpError, jobAccess, owner, json, body } from './security';

export async function state(env:Env,actor:Member,collection='jobs',cursor=''){return statePage(env,actor,collection,cursor);}

// Keyset pages bound serialization/CPU independently of business history size.
// Authorization is repeated in every page query, including related records.
export async function statePage(env:Env,actor:Member,collection:string,cursor=''){
  if(cursor.length>180)throw new HttpError(400,'Invalid page.');
  const owned=actor.role==='owner';
  const queries:Record<string,{sql:string;args:unknown[]}>={
    jobs:{sql:`SELECT j.id,j.title,j.address,j.status,j.scheduled_date,j.scope,j.version,j.customer_id,c.name AS customer_name,c.phone AS customer_phone ${owned?',j.owner_notes,j.quoted_cents':''} FROM jobs j JOIN customers c ON c.id=j.customer_id WHERE j.id>? AND (?='owner' OR EXISTS(SELECT 1 FROM assignments a WHERE a.job_id=j.id AND a.user_id=?)) ORDER BY j.id LIMIT 11`,args:[cursor,actor.role,actor.id]},
    customers:{sql:'SELECT * FROM customers WHERE id>? ORDER BY id LIMIT 11',args:[cursor]},
    expenses:{sql:"SELECT e.*,r.id AS receipt_id,u.name AS submitted_by FROM expenses e LEFT JOIN receipts r ON r.expense_id=e.id JOIN user u ON u.id=e.user_id WHERE e.id>? AND (?='owner' OR e.user_id=?) ORDER BY e.id LIMIT 11",args:[cursor,actor.role,actor.id]},
    mileage:{sql:"SELECT m.*,u.name AS submitted_by FROM mileage m JOIN user u ON u.id=m.user_id WHERE m.id>? AND (?='owner' OR m.user_id=?) ORDER BY m.id LIMIT 11",args:[cursor,actor.role,actor.id]},
    invoices:{sql:'SELECT * FROM invoices WHERE id>? ORDER BY id LIMIT 11',args:[cursor]},
    team:{sql:'SELECT u.id,u.name,u.email,m.role,m.active FROM members m JOIN user u ON u.id=m.user_id WHERE u.id>? ORDER BY u.id LIMIT 11',args:[cursor]},
    notes:{sql:"SELECT n.*,u.name AS author FROM job_notes n JOIN user u ON u.id=n.author_id WHERE n.id>? AND (?='owner' OR EXISTS(SELECT 1 FROM assignments a WHERE a.job_id=n.job_id AND a.user_id=?)) ORDER BY n.id LIMIT 11",args:[cursor,actor.role,actor.id]},
    activity:{sql:"SELECT a.id,a.action,a.entity_id,a.job_id,a.created_at,u.name AS actor FROM activity a JOIN user u ON u.id=a.actor_id WHERE a.id>? AND (?='owner' OR a.actor_id=?) ORDER BY a.id LIMIT 11",args:[cursor,actor.role,actor.id]},
    assignments:{sql:"SELECT a.job_id||':'||a.user_id AS id,a.job_id,a.user_id,u.name FROM assignments a JOIN user u ON u.id=a.user_id WHERE a.job_id||':'||a.user_id>? AND (?='owner' OR EXISTS(SELECT 1 FROM assignments mine WHERE mine.job_id=a.job_id AND mine.user_id=?)) ORDER BY a.job_id||':'||a.user_id LIMIT 11",args:[cursor,actor.role,actor.id]},
    imports:{sql:'SELECT * FROM import_batches WHERE id>? ORDER BY id LIMIT 11',args:[cursor]}
  };
  const query=queries[collection];if(!query)throw new HttpError(404,'List not found.');
  if(!owned&&['customers','invoices','team','imports'].includes(collection))return json({rows:[],next:null});
  const result=await env.DB.prepare(query.sql).bind(...query.args).all<{id:string}>();const more=result.results.length>10,rows=result.results.slice(0,10);
  return json({rows,next:more?rows[rows.length-1].id:null});
}

export async function saveRecord(request: Request, env: Env, actor: Member, kind: string, recordId?: string) {
  const input = await body(request);
  const updating = !!recordId;
  const key = id(recordId || input.id);
  const version = updating ? integer(input.version, 'version',1) : 1;
  let table: string, fields: Record<string, string|number|null>;
  let jobId: string|null = null;
  switch(kind) {
    case 'customers': {
      owner(actor); table='customers';
      fields={ name:text(input.name,'Name',180), email:text(input.email ?? '', 'Email',254,false),phone:text(input.phone??'','Phone',40,false),address:text(input.address??'','Address',400,false),notes:text(input.notes??'','Notes',4000,false),archived:integer(input.archived??0,'archived',0,1) }; break;
    }
    case 'jobs': {
      owner(actor); table='jobs'; jobId=key;
      const customerId = id(input.customer_id);
      if (!await env.DB.prepare('SELECT id FROM customers WHERE id=?').bind(customerId).first()) throw new InputError('Choose a customer.');
      fields={customer_id:customerId,title:text(input.title,'Job name',180),address:text(input.address??'','Address',400,false),status:choice(input.status,statuses,'status'),scheduled_date:input.scheduled_date?date(input.scheduled_date):'',scope:text(input.scope??'','Work details',6000,false),owner_notes:text(input.owner_notes??'','Private notes',4000,false),quoted_cents:integer(input.quoted_cents??0,'Quote')}; break;
    }
    case 'expenses': {
      table='expenses'; jobId=input.job_id?id(input.job_id):null;
      if(jobId) await jobAccess(env,actor,jobId);
      const previous=updating ? await env.DB.prepare('SELECT user_id,status,job_id FROM expenses WHERE id=?').bind(key).first<{user_id:string,status:string,job_id:string|null}>():null;
      if(updating && (!previous || (actor.role!=='owner' && (previous.user_id!==actor.id || previous.status!=='submitted')))) throw new HttpError(403,'You can only edit your own unreviewed expenses.');
      if(actor.role!=='owner' && !jobId) throw new InputError('Choose an assigned job.');
      fields={job_id:jobId,user_id:previous?.user_id??actor.id,date:date(input.date),vendor:text(input.vendor,'Vendor',180),category:choice(input.category,categories,'category'),amount_cents:integer(input.amount_cents,'Amount',1),notes:text(input.notes??'','Notes',2000,false),status:actor.role==='owner'?choice(input.status??'submitted',['submitted','reviewed','void'],'status'):'submitted'}; break;
    }
    case 'mileage': {
      table='mileage';jobId=input.job_id?id(input.job_id):null;
      if(jobId) await jobAccess(env,actor,jobId);
      const previous=updating ? await env.DB.prepare('SELECT user_id FROM mileage WHERE id=?').bind(key).first<{user_id:string}>():null;
      if(updating && (!previous || (actor.role!=='owner' && previous.user_id!==actor.id))) throw new HttpError(403,'You can only edit your own mileage.');
      if(actor.role!=='owner' && !jobId) throw new InputError('Choose an assigned job.');
      const start=integer(input.start_tenths,'Starting odometer'); const end=integer(input.end_tenths,'Ending odometer',start);
      fields={job_id:jobId,user_id:previous?.user_id??actor.id,date:date(input.date),vehicle:text(input.vehicle,'Vehicle',120),purpose:text(input.purpose,'Trip purpose',500),start_tenths:start,end_tenths:end,status:choice(input.status??'recorded',['recorded','void'],'status')}; break;
    }
    case 'invoices': {
      owner(actor);table='invoices';jobId=input.job_id?id(input.job_id):null;if(jobId) await jobAccess(env,actor,jobId);
      const total=integer(input.total_cents,'Invoice total');
      fields={job_id:jobId,number:text(input.number,'Invoice number',100),customer:text(input.customer,'Customer',180),date:date(input.date),total_cents:total,paid_cents:integer(input.paid_cents,'Amount paid',0,total),status:choice(input.status??'recorded',['recorded','void'],'status'),source:text(input.source??'Manual','Source',80)};break;
    }
    default: throw new HttpError(404,'Not found.');
  }
  // All SQL identifiers above are fixed by the server; values are bound parameters.
  const columns=Object.keys(fields), values=Object.values(fields);
  const statement=updating ? env.DB.prepare(`UPDATE ${table} SET ${columns.map(c=>`${c}=?`).join(',')},version=version+1 WHERE id=? AND version=?`).bind(...values,key,version) : env.DB.prepare(`INSERT INTO ${table}(id,${columns.join(',')}) VALUES(?,${columns.map(()=>'?').join(',')})`).bind(key,...values);
  const changeAudit=env.DB.prepare('INSERT INTO activity(id,actor_id,action,entity_id,job_id) SELECT ?,?,?,?,? WHERE changes()>0').bind(crypto.randomUUID(),actor.id,`${updating?'Updated':'Added'} ${kind==='mileage'?'mileage':kind.slice(0,-1)}`,key,jobId);
  const result=await env.DB.batch([statement,changeAudit]);
  if(result[0].meta.changes!==1) throw new HttpError(409,'This record changed. Refresh and try again.');
  return json({id:key},updating?200:201);
}

export async function assign(request: Request, env: Env, actor: Member, jobId: string) {
  owner(actor); await jobAccess(env,actor,jobId); const input=await body(request);
  if(!Array.isArray(input.users) || input.users.length>30) throw new InputError('Choose up to 30 crew members.');
  const users=[...new Set(input.users.map(id))];
  for(const userId of users) if(!await env.DB.prepare('SELECT user_id FROM members WHERE user_id=? AND active=1').bind(userId).first()) throw new InputError('A selected account is inactive.');
  await env.DB.batch([env.DB.prepare('DELETE FROM assignments WHERE job_id=?').bind(jobId),...users.map(u=>env.DB.prepare('INSERT INTO assignments(job_id,user_id) VALUES(?,?)').bind(jobId,u)),audit(env,actor,'Updated crew',jobId,jobId)]);
  return json({ok:true});
}

export async function addNote(request:Request,env:Env,actor:Member,jobId:string) {
  await jobAccess(env,actor,jobId); const input=await body(request); const key=id(input.id);
  await env.DB.batch([env.DB.prepare('INSERT INTO job_notes(id,job_id,author_id,body) VALUES(?,?,?,?)').bind(key,jobId,actor.id,text(input.body,'Update',4000)),audit(env,actor,'Added job update',key,jobId)]);
  return json({id:key},201);
}
