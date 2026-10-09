import { accessMember } from './access';
import type { Env, Member } from './env';
import { InputError } from '../shared/validation';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export const json = (data: unknown, status = 200) => Response.json(data, { status });
export async function member(request: Request, env: Env): Promise<Member> {
  return accessMember(request,env);
}
export function owner(actor: Member) { if (actor.role !== 'owner') throw new HttpError(403, 'Owner access required.'); }
export function fresh(actor: Member) { if (Date.now() - new Date(actor.sessionCreatedAt).getTime() > 900000) throw new HttpError(403, 'Sign out and sign in again before changing account access.'); }
export async function jobAccess(env: Env, actor: Member, jobId: string) {
  const row = await env.DB.prepare("SELECT j.id FROM jobs j WHERE j.id=? AND (?='owner' OR EXISTS(SELECT 1 FROM assignments a WHERE a.job_id=j.id AND a.user_id=?))").bind(jobId, actor.role, actor.id).first();
  if (!row) throw new HttpError(404, 'Job not found.');
}
export function mutationGuard(request: Request, env: Env) {
  if (request.headers.get('origin') !== env.APP_ORIGIN || request.headers.get('x-mcc-request') !== '1') throw new HttpError(403, 'Request origin not allowed.');
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'Request origin not allowed.');
}
export async function body(request: Request, max = 64000): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'Use JSON.');
  const length = Number(request.headers.get('content-length') || 0);
  if (length > max) throw new HttpError(413, 'This request is too large.');
  const bytes = await boundedBytes(request, max);
  try { const data = JSON.parse(new TextDecoder().decode(bytes)); if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(); return data; }
  catch { throw new InputError('Invalid request.'); }
}
export async function boundedBytes(request: {body: ReadableStream<Uint8Array>|null}, max: number) {
  const reader = request.body?.getReader(); if (!reader) throw new InputError('A body is required.');
  const chunks: Uint8Array[] = []; let total = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; total += value.length; if (total > max) { await reader.cancel(); throw new HttpError(413, 'This file is too large.'); } chunks.push(value); }
  const result = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; } return result;
}
export function audit(env: Env, actor: Member, action: string, entityId: string, jobId: string|null = null) {
  return env.DB.prepare('INSERT INTO activity(id,actor_id,action,entity_id,job_id) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(), actor.id, action, entityId, jobId);
}
export async function limit(env: Env, key: string, max: number, seconds = 60) {
  const now = Math.floor(Date.now()/1000);
  const result = await env.DB.prepare('INSERT INTO request_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING count').bind(key, now+seconds, now, now, now+seconds).first<{count:number}>();
  if (!result || result.count > max) throw new HttpError(429, 'Too many requests. Please wait a minute and try again.');
}
export function secure(response: Response) {
  const result = new Response(response.body, response);
  result.headers.set('Cache-Control', 'private, no-store');
  result.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  result.headers.set('X-Content-Type-Options', 'nosniff');
  result.headers.set('X-Frame-Options', 'DENY');
  result.headers.set('Referrer-Policy', 'no-referrer');
  result.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  result.headers.set('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
  return result;
}
