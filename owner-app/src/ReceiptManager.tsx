import {useEffect,useState} from 'react';
import {api} from './api';
import type {Row} from './types';
import {Modal,ErrorText,Field} from './ui';
import './receipts.css';

type Info={receipt:null|{id:string;bytes:number;mime:string};editable:boolean;storage?:{used_bytes:number;cap_bytes:number}};
const MAX=512*1024;
// Re-encoding strips camera metadata. No receipt is sent to an outside image service.
export async function compressReceipt(file:Blob,turns=0):Promise<Blob>{
  if(file.size>25*1024*1024)throw new Error('Choose a photo smaller than 25 MB.');
  const bitmap=await createImageBitmap(file);
  try{
    if(bitmap.width*bitmap.height>40_000_000)throw new Error('This photo is too large. Take a closer photo of the receipt.');
    for(const edge of [2200,1900,1600,1300]){
      const scale=Math.min(1,edge/Math.max(bitmap.width,bitmap.height)),w=Math.round(bitmap.width*scale),h=Math.round(bitmap.height*scale);
      const canvas=document.createElement('canvas');canvas.width=turns%2?h:w;canvas.height=turns%2?w:h;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Your browser could not prepare this photo.');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(turns*Math.PI/2);ctx.drawImage(bitmap,-w/2,-h/2,w,h);
      for(const quality of [.86,.76,.66]){
        const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare this photo.')),'image/jpeg',quality));
        if(blob.size<=MAX)return blob;
      }
    }
    throw new Error('This photo needs a closer crop. Crop it in your Photos app, then choose it again.');
  }finally{bitmap.close();}
}
export function ReceiptManager({expense,onClose,onSaved}:{expense:Row;onClose:()=>void;onSaved:()=>Promise<void>}){
  const [info,setInfo]=useState<Info|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(''),[original,setOriginal]=useState<Blob|null>(null),[photo,setPhoto]=useState<Blob|null>(null),[preview,setPreview]=useState(''),[turns,setTurns]=useState(0),[remove,setRemove]=useState(false),[checked,setChecked]=useState(false),[message,setMessage]=useState('');
  const path=`expenses/${expense.id}/receipt`;
  const [leaving,setLeaving]=useState(false);
  function close(){if(busy)return;if(photo)setLeaving(true);else onClose();}
  useEffect(()=>{if(!photo&&!busy)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[photo,busy]);
  async function load(){setInfo(await api<Info>(path));}
  useEffect(()=>{let active=true;api<Info>(path).then(v=>{if(active)setInfo(v);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[path]);
  useEffect(()=>{if(!photo){setPreview('');return;}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
  async function prepare(file:Blob,rotation=0){setBusy('Preparing photo…');setError('');setChecked(false);try{const next=await compressReceipt(file,rotation);setPhoto(next);setOriginal(file);setTurns(rotation);setMessage('');}catch(e){setError(e instanceof Error?e.message:'Could not read this photo. Try a JPEG, PNG, or WebP.');}finally{setBusy('');}}
  async function save(deleting=false){if(!info)return;setBusy(deleting?'Removing photo…':'Saving photo…');setError('');try{
    if(deleting)await api(path,{method:'DELETE',headers:{'X-Receipt-Version':info.receipt?.id??'none'}});
    else{
      if(!photo)throw new Error('Choose a photo first.');
      const upload=await api<{id:string;chunkBytes:number}>(`${path}/begin`,{method:'POST',body:JSON.stringify({bytes:photo.size}),headers:{'Content-Type':'application/json','X-Receipt-Version':info.receipt?.id??'none'}});
      for(let start=0;start<photo.size;start+=upload.chunkBytes){
        setBusy(`Saving photo… ${Math.round(start/photo.size*100)}%`);
        await api(`receipt-uploads/${upload.id}/parts/${start/upload.chunkBytes}`,{method:'PUT',body:photo.slice(start,start+upload.chunkBytes),headers:{'Content-Type':'application/octet-stream'}});
      }
      setBusy('Finishing photo…');await api(`receipt-uploads/${upload.id}/finish`,{method:'POST'});
    }
    setPhoto(null);setOriginal(null);setRemove(false);setLeaving(false);setMessage(deleting?'Photo removed. Your expense is unchanged.':'Receipt saved.');
    await load();await onSaved();
  }catch(e){setError(e instanceof Error?e.message:'Could not save. Your selected photo is still here.');}finally{setBusy('');}}
  const pct=info?.storage?Math.round(info.storage.used_bytes/info.storage.cap_bytes*100):0;
  return <Modal title="Receipt photo" onClose={close}><p className="muted">{expense.vendor} · {expense.date}</p>
    {leaving&&<section className="receipt-confirm" role="alert"><h3>This photo is not saved yet</h3><p>Your expense and any previously saved photo are safe.</p><div className="actions"><button onClick={()=>setLeaving(false)}>Keep editing</button><button onClick={onClose}>Discard unsaved photo</button></div></section>}
    {!info&&!error&&<p role="status">Loading receipt…</p>}
    <ErrorText message={error}/>{!info&&error&&<button onClick={()=>{setError('');void load().catch(e=>setError(e.message));}}>Try again</button>}
    {info&&<>{info.storage&&<p className={`receipt-storage ${pct>=70?'error':'muted'}`} role={pct>=70?'status':undefined}>Receipt storage: {pct}% used{pct>=85?'. Almost full. Download and review old photos before adding more.':pct>=70?'. Plan a backup and review soon.':''}</p>}
    {(preview||info.receipt)&&<div className="receipt-preview"><img src={preview||`/api/receipts/${info.receipt!.id}?preview=1`} alt={preview?'New receipt photo, not yet saved':'Saved receipt photo'} onError={()=>setError('The photo could not be displayed. Try downloading it or reopen this receipt.')}/></div>}
    {!preview&&info.receipt&&<a className="button" href={`/api/receipts/${info.receipt.id}`}>Download photo</a>}
    {!info.editable?<p>This expense is locked. You can view or download the receipt. Ask Jim if it needs a correction.</p>:<fieldset disabled={!!busy}>
      <Field label={info.receipt?'Replace photo':'Add a receipt photo'} hint="Take a photo or choose one. JPEG, PNG, or WebP. We save one compressed photo, up to 512 KB, without its location metadata."><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)void prepare(file);e.target.value='';}}/></Field>
      {photo&&<><div className="actions"><button onClick={()=>{if(original)void prepare(original,(turns+1)%4);}}>Rotate photo</button><button onClick={()=>{setPhoto(null);setOriginal(null);setChecked(false);}}>Discard new photo</button><span className="muted">{Math.ceil(photo.size/1024)} KB</span></div><label className="check"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>I can read the date, vendor, and total.</label><button className="primary" disabled={!checked} onClick={()=>{void save();}}>{info.receipt?'Save replacement':'Save receipt'}</button><p className="muted">{info.receipt?'The saved photo stays in place until the replacement succeeds.':'The expense is already saved. This adds its photo.'} Keep the original on your device if you need it.</p></>}
      {info.receipt&&!photo&&!remove&&<button className="text-button" onClick={()=>setRemove(true)}>Remove photo</button>}
      {remove&&<section className="receipt-confirm"><h3>Remove this photo?</h3><p>The expense stays. Download the photo first if you want a copy. Removal cannot be undone.</p><div className="actions"><button onClick={()=>setRemove(false)}>Keep photo</button><button onClick={()=>{void save(true);}}>Remove photo</button></div></section>}
    </fieldset>}</>}
    <p role="status" aria-live="polite">{busy||message}</p><div className="form-actions"><button disabled={!!busy} onClick={close}>Done</button></div>
  </Modal>;
}
