import type {State,Row} from './types';
export const collections=['jobs','customers','expenses','mileage','invoices','team','notes','activity','assignments','imports'] as const;
export async function loadState(get:<T>(path:string)=>Promise<T>,previous?:State):Promise<State>{
  const base=await get<Pick<State,'me'|'storage'>>('state?bootstrap=1');
  const result={...base,truncated:false,cursors:{}} as State;
  for(let group=0;group<collections.length;group+=3)await Promise.all(collections.slice(group,group+3).map(async name=>{
    let cursor=previous?.cursors?.[name]??'',rows:Row[]=previous?[...previous[name]]:[];
    if(previous&&!previous.cursors?.[name]){result[name]=rows;return;}
    for(let page=0;page<50;page++){
      const next=await get<{rows:Row[];next:string|null}>(`state?collection=${name}&cursor=${encodeURIComponent(cursor)}`);
      rows.push(...next.rows);cursor=next.next??'';if(!cursor)break;
    }
    result[name]=[...new Map(rows.map(row=>[row.id,row])).values()];
    if(cursor){result.cursors[name]=cursor;result.truncated=true;}
    result[name].sort((a,b)=>name==='customers'||name==='team'?String(a.name).localeCompare(String(b.name)):String(b.date??b.created_at??b.scheduled_date??'').localeCompare(String(a.date??a.created_at??a.scheduled_date??'')));
  }));
  return result;
}
