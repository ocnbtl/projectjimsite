import {useState} from 'react';
import {parseCsv,suggestMapping,importFields,IMPORT_STEP_ROWS as STEP} from '../shared/csv';
import {post} from './api';
import {type State,words,dollars} from './types';
import {Modal,Field,ErrorText} from './ui';
type Preview={rows:Record<string,unknown>[];errors:string[];duplicates:number;alreadyImported:boolean;addCount:number};
export function ImportPanel({state,onClose,onSaved}:{state:State;onClose:()=>void;onSaved:()=>Promise<void>}) {
  const [source,setSource]=useState('Invoice Simple'),[kind,setKind]=useState<'expenses'|'invoices'>('expenses'),[csv,setCsv]=useState(''),[headers,setHeaders]=useState<string[]>([]),[mapping,setMapping]=useState<Record<string,string>>({}),[job,setJob]=useState(''),[preview,setPreview]=useState<Preview|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState('');
  const payload={source,kind,csv,mapping,job_id:job};
  async function read(file?:File){setPreview(null);setError('');if(!file)return;if(file.size>500000){setError('Choose a CSV smaller than 500 KB.');return;}try{const raw=await file.text();const rows=parseCsv(raw);setCsv(raw);setHeaders(rows[0]);setMapping(suggestMapping(rows[0],kind));}catch(e){setCsv('');setHeaders([]);setError(e instanceof Error?e.message:'Could not read file.');}}
  function batches(){const [head,...rows]=parseCsv(csv);const quote=(v:string)=>'"'+v.replaceAll('"','""')+'"';const result:string[]=[];for(let i=0;i<rows.length;i+=STEP)result.push([head,...rows.slice(i,i+STEP)].map(row=>row.map(quote).join(',')).join('\n'));return result;}
  async function run(commit:boolean){
    setBusy(true);setError('');let completed=0;
    try{
      const parts=batches();const seen=new Set<string>();const combined:Preview={rows:[],errors:[],duplicates:0,alreadyImported:false,addCount:0};
      for(let i=0;i<parts.length;i++){
        setProgress(`${commit?'Saving':'Checking'} step ${i+1} of ${parts.length}…`);
        if(commit){await post('import/commit',{...payload,csv:parts[i]});completed++;}
        else{
          const part=await post<Preview>('import/preview',{...payload,csv:parts[i]});
          for(const row of part.rows){const key=String(row.fingerprint);const duplicate=Boolean(row.duplicate)||seen.has(key);seen.add(key);combined.rows.push({...row,duplicate,row:Number(row.row)+i*STEP});if(duplicate)combined.duplicates++;else combined.addCount++;}
          combined.errors.push(...part.errors.map(message=>`Step ${i+1}: ${message}`));
        }
      }
      if(commit){await onSaved();onClose();}else setPreview(combined);
    }catch(e){setError((e instanceof Error?e.message:'Could not import.')+(commit?' Saved steps are safe. Preview this same file again to skip previously saved records and continue.':''));if(commit){setPreview(null);await onSaved();}}
    finally{setBusy(false);setProgress(completed?`${completed} steps confirmed saved.`:'');}
  }
  return <Modal title="Import existing records" onClose={()=>!busy&&onClose()}><p>Upload an invoice or expense summary exported as CSV. Nothing is saved until you review and confirm.</p><fieldset disabled={busy}><div className="form-grid"><Field label="Source"><select value={source} onChange={e=>{setSource(e.target.value);setPreview(null);}}>{['Invoice Simple','QuickBooks','Other'].map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Records"><select value={kind} onChange={e=>{const next=e.target.value as typeof kind;setKind(next);setMapping(suggestMapping(headers,next));setPreview(null);}}><option value="expenses">Expenses</option><option value="invoices">Invoices</option></select></Field></div><Field label="CSV file" hint="Up to 200 rows. Export dates as YYYY-MM-DD and amounts in USD. PDF, Excel and QuickBooks backup files are not supported here."><input type="file" accept=".csv,text/csv" onChange={e=>{void read(e.target.files?.[0]);}}/></Field>
  {!!headers.length&&<><h3>Match your columns</h3><div className="form-grid">{importFields[kind].map(field=><Field label={words(field)} key={field}><select value={mapping[field]||''} onChange={e=>{setMapping({...mapping,[field]:e.target.value});setPreview(null);}}><option value="">Not in file</option>{headers.map(h=><option key={h}>{h}</option>)}</select></Field>)}</div><Field label="Assign to a job (optional)"><select value={job} onChange={e=>{setJob(e.target.value);setPreview(null);}}><option value="">Leave unassigned</option>{state.jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>)}</select></Field><p className="muted">Unmatched expense categories become Other. Missing payments are recorded as $0, never assumed paid. Existing invoice numbers for the same customer and source are skipped; update their payment amounts manually.</p><button onClick={()=>{void run(false);}}>Preview import</button></>}
  {preview&&<section className="import-preview"><h3>{preview.addCount} new · {preview.duplicates} duplicate rows</h3>{preview.alreadyImported&&<p className="error">This file has already been imported.</p>}{preview.errors.map(e=><p className="error" key={e}>{e}</p>)}<div className="preview-scroll"><table><thead><tr><th>Row</th><th>Date</th><th>{kind==='expenses'?'Vendor':'Invoice / customer'}</th><th>Amount</th><th>Action</th></tr></thead><tbody>{preview.rows.map(row=><tr key={String(row.row)}><td>{String(row.row)}</td><td>{String(row.date)}</td><td>{String(row.vendor??`${row.number} / ${row.customer}`)}</td><td>{dollars(row.amount_cents??row.total_cents)}</td><td>{row.duplicate?'Skip duplicate':'Add'}</td></tr>)}</tbody></table></div><p className="muted">Files are saved in small steps. If interrupted, select the same file again to continue without duplicating saved steps. Potential duplicates are skipped. Review the preview carefully; equal expenses can occasionally be separate purchases.</p></section>}
  <p role="status" aria-live="polite">{progress}</p><ErrorText message={error}/><div className="form-actions"><button onClick={onClose}>Cancel</button><button className="primary" disabled={!preview||!!preview.errors.length||preview.alreadyImported||preview.addCount===0} onClick={()=>{void run(true);}}>{busy?'Working…':'Confirm import'}</button></div></fieldset></Modal>;
}
