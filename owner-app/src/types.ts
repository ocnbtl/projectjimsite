export type Row = Record<string, string|number|null> & {id:string};
export type Person = {id:string;name:string;email:string;role:'owner'|'crew'};
export type State = {me:Person;jobs:Row[];customers:Row[];expenses:Row[];mileage:Row[];invoices:Row[];team:Row[];notes:Row[];activity:Row[];assignments:Row[];imports:Row[];truncated:boolean;cursors:Record<string,string>;storage?:{used_bytes:number;cap_bytes:number}};
export type Page = 'Today'|'Jobs'|'Customers'|'Money'|'Team'|'Settings';
export type Kind = 'customers'|'jobs'|'expenses'|'mileage'|'invoices';
export type Editor = {kind:Kind;row?:Row;jobId?:string};
export const dollars=(cents:unknown)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents||0)/100);
export const words=(text:unknown)=>String(text??'').replaceAll('_',' ').replace(/^./,s=>s.toUpperCase());
export const today=()=>new Date().toLocaleDateString('en-CA');
