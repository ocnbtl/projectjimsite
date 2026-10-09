export class ApiError extends Error {constructor(message:string,public status:number){super(message);}}
export async function api<T=Record<string,unknown>>(path:string,options:RequestInit={}):Promise<T> {
  const response=await fetch(`/api/${path}`,{...options,credentials:'same-origin',cache:'no-store',headers:{'X-MCC-Request':'1',...(options.body && typeof options.body==='string'?{'Content-Type':'application/json'}:{}),...options.headers}});
  if(response.redirected||!response.headers.get('content-type')?.includes('application/json')){window.dispatchEvent(new Event('mcc:signout'));throw new ApiError('Your sign-in expired. Continue to sign in again.',401);}
  const data=await response.json() as T & {error?:string;message?:string};
  if(!response.ok){if(response.status===401)window.dispatchEvent(new Event('mcc:signout'));throw new ApiError(data.error||data.message||'Please try again.',response.status);}
  return data;
}
export const post=<T=Record<string,unknown>>(path:string,data:unknown)=>api<T>(path,{method:'POST',body:JSON.stringify(data)});
