import {useEffect,useState} from 'react';
import {api,post,ApiError} from './api';
import {loadState} from './load-state';
import type {State,Page,Editor,Row} from './types';
import {AuthScreen} from './AuthScreen';
import {RecordEditor} from './RecordEditor';
import {ReceiptManager} from './ReceiptManager';
import {Jobs} from './Jobs';
import {Money} from './Money';
import {Team} from './Team';
import {Settings} from './Settings';
import {Icon,Empty,ErrorText} from './ui';
import './styles.css';


export function App(){
  const [state,setState]=useState<State|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[page,setPage]=useState<Page>('Today'),[selected,setSelected]=useState<string|null>(null),[editor,setEditor]=useState<Editor|null>(null),[receipt,setReceipt]=useState<Row|null>(null),[menu,setMenu]=useState(false),[customerQuery,setCustomerQuery]=useState('');
  async function reload(){const next=await loadState(api);setState(next);return next;}
  const [moreBusy,setMoreBusy]=useState(false);
  async function more(){if(!state)return;setMoreBusy(true);try{setState(await loadState(api,state));}catch(e){setError(e instanceof Error?e.message:'Could not load older records.');}finally{setMoreBusy(false);}}
  async function start(){setLoading(true);setError('');try{await reload();}catch(e){setState(null);if(!(e instanceof ApiError&&e.status===401))setError(e instanceof Error?e.message:'Could not load.');}finally{setLoading(false);}}
  useEffect(()=>{void start();const clear=()=>{setState(null);setEditor(null);setReceipt(null);setSelected(null);};window.addEventListener('mcc:signout',clear);return()=>window.removeEventListener('mcc:signout',clear);},[]);
  async function signOut(){try{const result=await post<{logoutUrl:string}>('auth/sign-out',{});window.location.assign(result.logoutUrl);setState(null);setEditor(null);setReceipt(null);setSelected(null);}catch(e){setError(e instanceof Error?e.message:'Could not sign out.');}}
  const refresh=async()=>{await reload();};
  if(loading)return <main className="loading" role="status">Opening your office…</main>;
  if(!state)return <><ErrorText message={error}/><AuthScreen/></>;
  const owner=state.me.role==='owner';
  const nav:Page[]=owner?['Today','Jobs','Customers','Money','Team']:['Today','Jobs'];
  function navigate(next:Page){setPage(next);setSelected(null);setMenu(false);setError('');}
  async function saved(id:string,kind:string){const next=await reload();if(kind==='expenses'&&!editor?.row){const expense=next.expenses.find(e=>e.id===id);if(expense)setReceipt(expense);}if(kind==='jobs'){setPage('Jobs');setSelected(id);}}
  return <div className="app-shell"><a className="skip" href="#main">Skip to content</a><div className="mobile-bar"><span className="wordmark">MCC</span><button onClick={()=>setMenu(!menu)} aria-expanded={menu} aria-controls="navigation">{menu?'Close menu':'Menu'}</button></div><aside className={`sidebar ${menu?'open':''}`} id="navigation"><div className="wordmark">MCC</div><nav aria-label="Main navigation">{nav.map(item=><button key={item} className={page===item?'selected':''} aria-current={page===item?'page':undefined} onClick={()=>navigate(item)}><Icon name={item}/>{item}</button>)}</nav><div className="sidebar-bottom"><button className={page==='Settings'?'selected':''} onClick={()=>navigate('Settings')}><Icon name="Settings"/>Settings</button><button onClick={()=>{void signOut();}}><Icon name="logout"/>Sign out</button></div></aside>
  <main id="main" className="workspace"><header className="page-head"><div><h1>{page}</h1>{page==='Today'&&<p>Your jobs and the details that keep them moving.</p>}</div>{['Today','Jobs'].includes(page)&&<div className="header-actions">{owner&&<button className="primary" onClick={()=>setEditor({kind:state.customers.length?'jobs':'customers'})}>New job</button>}<div className="actions"><button onClick={()=>setEditor({kind:'expenses',jobId:selected??undefined})}><Icon name="receipt"/>Add expense</button><button onClick={()=>setEditor({kind:'mileage',jobId:selected??undefined})}><Icon name="car"/>Log mileage</button></div></div>}</header><ErrorText message={error}/>{state.truncated&&<section role="status"><p className="error">More records are available. Totals cover only the loaded records until every page is loaded.</p><button disabled={moreBusy} onClick={()=>{void more();}}>{moreBusy?'Loading more…':'Load more records'}</button></section>}
  {owner&&state.storage&&state.storage.used_bytes/state.storage.cap_bytes>=.7&&<p role="status" className="error">Receipt storage is {Math.round(state.storage.used_bytes/state.storage.cap_bytes*100)}% full. Review Settings and arrange a backup. The office will stop new uploads at its limit, not purchase extra storage.</p>}
  {(page==='Today'||page==='Jobs')&&<Jobs state={state} isToday={page==='Today'} onEdit={setEditor} selected={selected} onSelect={setSelected} onReload={refresh} onReceipt={setReceipt}/>}
  {page==='Customers'&&owner&&<><div className="section-heading"><label className="search"><Icon name="search"/><input aria-label="Find a customer" placeholder="Find a customer" value={customerQuery} onChange={e=>setCustomerQuery(e.target.value)}/></label><button className="primary" onClick={()=>setEditor({kind:'customers'})}>Add customer</button></div>{!state.customers.length?<Empty title="Keep customer details in one place">Add a customer, then create their first job.</Empty>:state.customers.filter(c=>String(c.name).toLowerCase().includes(customerQuery.toLowerCase())).map(c=><div className="record-row" key={c.id}><span><strong>{c.name}{c.archived?' · Archived':''}</strong><small>{c.phone}{c.email?` · ${c.email}`:''}</small><small>{c.address}</small></span><button onClick={()=>setEditor({kind:'customers',row:c})}>Edit</button></div>)}</>}
  {page==='Money'&&owner&&<Money state={state} onEdit={setEditor} onReceipt={setReceipt} onReload={refresh}/>}
  {page==='Team'&&owner&&<Team state={state} onReload={refresh}/>}
  {page==='Settings'&&<Settings state={state}/>}
  {!owner&&page==='Today'&&<section className="activity"><h2>Your recent expenses</h2>{state.expenses.length?state.expenses.slice(0,10).map(e=><div className="record-row" key={e.id}><span><strong>{e.vendor}</strong><small>{e.date} · {e.status}</small></span>{(e.receipt_id||e.status==='submitted')&&<button onClick={()=>setReceipt(e)}>{e.receipt_id?'Receipt':'Add receipt'}</button>}</div>):<p className="muted">Your expense submissions will appear here.</p>}</section>}
  </main>{editor&&<RecordEditor editor={editor} state={state} onClose={()=>setEditor(null)} onSaved={saved}/>} {receipt&&<ReceiptManager expense={receipt} onClose={()=>setReceipt(null)} onSaved={refresh}/>}</div>;
}
