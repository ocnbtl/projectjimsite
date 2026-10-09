import {useEffect,useRef,useId,type ReactNode,type FormEvent} from 'react';
export function Icon({name,size=20}:{name:string;size?:number}) {
  const paths:Record<string,ReactNode>={
    Today:<><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/></>,Jobs:<><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18"/></>,Customers:<><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/></>,Team:<><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/></>,Money:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M16 14h5"/></>,Settings:<><circle cx="12" cy="12" r="4"/><path d="m10 2 4 0 1 3 3 1 3 3-2 3 2 3-3 3-3 1-1 3h-4l-1-3-3-1-3-3 2-3-2-3 3-3 3-1z"/></>,logout:<><path d="M9 3H4v18h5M9 12h12m-5-5 5 5-5 5"/></>,receipt:<><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></>,car:<><path d="m4 10 2-6h12l2 6M4 10h16v9H4zM6 19v3M18 19v3M7 14h2M15 14h2"/></>,search:<><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,close:<path d="m6 6 12 12M6 18 18 6"/>,plus:<path d="M12 4v16M4 12h16"/>,back:<path d="m14 5-7 7 7 7"/>};
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]??paths.receipt}</svg>;
}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
export function ErrorText({message}:{message:string}){return message?<p className="error" role="alert">{message}</p>:null;}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
  const ref=useRef<HTMLDialogElement>(null),heading=useId();
  useEffect(()=>{const dialog=ref.current,previous=document.body.style.overflow;document.body.style.overflow='hidden';dialog?.showModal();return()=>{dialog?.close();document.body.style.overflow=previous;};},[]);
  return <dialog aria-labelledby={heading} ref={ref} onCancel={event=>{event.preventDefault();onClose();}}><div className="dialog-head"><h2 id={heading}>{title}</h2><button className="icon-button" aria-label="Close" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;
}
export function Form({onSubmit,children}:{onSubmit:(data:FormData)=>void;children:ReactNode}){return <form onSubmit={(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();onSubmit(new FormData(event.currentTarget));}}>{children}</form>;}
export function Empty({title,children,action}:{title:string;children?:ReactNode;action?:ReactNode}){return <div className="empty"><Icon name="receipt" size={56}/><h3>{title}</h3>{children&&<p>{children}</p>}{action}</div>;}
