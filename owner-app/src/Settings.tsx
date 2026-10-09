import {useState} from 'react';
import type {State} from './types';
import {api} from './api';
import {exportCsv} from '../shared/csv';
import {ErrorText} from './ui';
export function Settings({state}:{state:State}) {
  const [busy,setBusy]=useState(''),[error,setError]=useState('');
  async function download(kind:string){
    setBusy(`Preparing ${kind}…`);setError('');
    try{
      let cursor='',columns:string[]=[],rows:Record<string,unknown>[]=[];
      do{const page=await api<{columns:string[];rows:Record<string,unknown>[];next:string|null}>(`export/${kind}?cursor=${encodeURIComponent(cursor)}`);columns=page.columns;rows.push(...page.rows);cursor=page.next??'';setBusy(`Preparing ${kind}: ${rows.length} records…`);}while(cursor);
      const url=URL.createObjectURL(new Blob([exportCsv(rows,columns)],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`mcc-${kind}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){setError(e instanceof Error?e.message:'Could not finish the export. No partial file was downloaded.');}finally{setBusy('');}
  }
  const percent=state.storage?Math.round(state.storage.used_bytes/state.storage.cap_bytes*100):0;
  return <div className="settings">
    <section><h2>Your account</h2><dl><dt>Name</dt><dd>{state.me.name}</dd><dt>Sign-in email</dt><dd>{state.me.email}</dd><dt>Access</dt><dd>{state.me.role==='owner'?'Owner':'Crew member'}</dd></dl><p className="muted">Contact the site administrator to change the account email or recover owner access.</p></section>
    <section><h2>Signing in</h2><p>You sign in with a one-time code sent to your approved email. There is no MCC password to change.</p><p>Use Sign out when you finish on a shared device. If you lose access to your email, contact the site administrator. Jim can disable a crew account immediately; the administrator can revoke Cloudflare sessions.</p></section>
    <section><h2>Privacy & records</h2><p>No advertising analytics or session recordings run in this dashboard. Receipt files require an authorized account.</p>
      {state.me.role==='owner'&&<>
        <h3>Storage & backups</h3><p>Receipt storage: {percent}% used of 200 MiB. Each expense keeps one compressed photo, up to 512 KB. Warnings appear at 70% and 85%. At the limit, uploads stop without buying extra storage or deleting saved photos.</p>
        <p>Keep original photos on your device. Ask Ocean for a full database backup at least weekly during active use and before a migration. It includes saved receipt photos; the CSV files below do not. Backups contain private business information and should be kept in a protected folder.</p>
        <p className="muted">The free service has daily usage limits. If a limit is reached, wait for the reset and retry. This app cannot upgrade the plan or purchase extra capacity. Capacity notices are in-app, not emailed.</p>
        <h3>Download records</h3><p>Amount columns ending in cents must be divided by 100; odometer columns ending in tenths must be divided by 10.</p><div className="actions">{['customers','jobs','expenses','mileage','invoices'].map(kind=><button key={kind} disabled={!!busy} onClick={()=>{void download(kind);}}>Export {kind}</button>)}</div><p role="status">{busy}</p><ErrorText message={error}/>
        <h3>Accounting imports</h3><p>Invoice Simple and QuickBooks CSV summaries can be reviewed in Money. Live account synchronization and receipt text extraction are not enabled.</p>
      </>}
    </section>
  </div>;
}
