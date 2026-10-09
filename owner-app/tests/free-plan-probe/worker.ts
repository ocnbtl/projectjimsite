// Isolated synthetic benchmark with a dedicated test database. No real users or customer data.
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { parseCsv } from '../../shared/csv';
import office from '../../worker/index';
import type { Env } from '../../worker/env';
interface ProbeEnv extends Env { PROBE_TOKEN?: string; PROBE_HASH?: string; EXPIRES_AT?: string }
let count = 0;
export default {
  async fetch(request: Request, env: ProbeEnv) {
    const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
    if (!env.EXPIRES_AT || Date.now() > Number(env.EXPIRES_AT)) return new Response('Expired', { status: 410, headers });
    if (!env.PROBE_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.PROBE_TOKEN}`) return new Response('Not found', { status: 404, headers });
    if (++count > 200) return new Response('Limit reached', { status: 429, headers });
    if(new URL(request.url).pathname.startsWith('/api/')) return office.fetch(request,env);
    if (request.method !== 'POST') return new Response('Not found', {status:404,headers});
    const mode = new URL(request.url).pathname.slice(1);
    let passed = false;
    if (mode === 'control') passed = true;
    else if (mode === 'hash') passed = (await hashPassword('synthetic-benchmark-not-an-account')).includes(':');
    else if (mode === 'verify-good') passed = await verifyPassword({ hash: env.PROBE_HASH!, password: 'synthetic-benchmark-not-an-account' });
    else if (mode === 'verify-bad') passed = !await verifyPassword({ hash: env.PROBE_HASH!, password: 'incorrect-synthetic-password' });
    else if (mode === 'csv-200') {
      const csv = 'date,vendor,amount,category,notes\n' + Array.from({length:200}, (_,i) => `2026-10-09,Synthetic vendor ${i},42.50,Materials,${'x'.repeat(1000)}`).join('\n');
      passed = parseCsv(csv).length === 201;
    } else return new Response('Not found', { status: 404, headers });
    return Response.json({ mode, passed, colo: request.cf?.colo ?? null }, {headers});
  }
};
