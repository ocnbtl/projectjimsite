import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../lib/cloudflare-analytics.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const endpoint = 'https://cloudflareinsights.com/cdn-cgi/rum';

function fixture(hostname = 'masonrycolorcorrections.com') {
  const scripts = new Map();
  const sent = [];
  let consent = false;
  class XHR {
    open(...args) { this.args = args; }
    send(body) { sent.push({ type: 'xhr', args: this.args, body }); }
    abort() { this.aborted = true; }
  }
  const window = {
    location: { hostname, origin: `https://${hostname}` },
    fetch: async (...args) => { sent.push({ type: 'fetch', args }); return new Response(null, { status: 204 }); },
  };
  const navigator = { sendBeacon: (...args) => { sent.push({ type: 'beacon', args }); return true; } };
  const document = {
    getElementById: (id) => scripts.get(id),
    createElement: () => ({ dataset: {}, remove() { scripts.delete(this.id); } }),
    body: { appendChild: (script) => scripts.set(script.id, script) },
  };
  const context = vm.createContext({ exports: {}, window, navigator, document, XMLHttpRequest: XHR, URL, Request, Response });
  vm.runInContext(compiled, context);
  return {
    window, navigator, XHR, scripts, sent,
    consent(value) { consent = value; },
    init() { context.exports.initializeCloudflareAnalytics(() => consent); },
  };
}

test('no analytics script before consent; only one module script after consent', () => {
  const f = fixture();
  f.init();
  assert.equal(f.scripts.size, 0);
  f.consent(true);
  f.init();
  f.init();
  assert.equal(f.scripts.size, 1);
  const script = [...f.scripts.values()][0];
  assert.equal(script.type, 'module');
  assert.equal(script.src, 'https://static.cloudflareinsights.com/beacon.min.js');
  assert.deepEqual(JSON.parse(script.dataset.cfBeacon), { token: '7b41da40b5ea4946ada10b17e324c3de', spa: true });
});

test('localhost and preview hosts never contribute production analytics', () => {
  for (const host of ['localhost', '127.0.0.1', 'project-jimsite.vercel.app', 'masonrycolorcorrections.com.evil.example']) {
    const f = fixture(host);
    f.consent(true);
    f.init();
    assert.equal(f.scripts.size, 0, host);
  }
});

test('revocation stops beacon, fetch, and XHR without reloading or changing other requests', async () => {
  const f = fixture();
  f.consent(true);
  f.init();
  f.navigator.sendBeacon(endpoint, 'accepted');
  assert.equal(f.sent.length, 1);
  f.consent(false);
  assert.equal(f.navigator.sendBeacon(endpoint, 'declined'), false);
  await f.window.fetch(new Request(endpoint), { method: 'POST' });
  const xhr = new f.XHR();
  xhr.open('POST', endpoint);
  xhr.send('declined');
  assert.equal(xhr.aborted, true);
  assert.equal(f.sent.length, 1);
  await f.window.fetch('/api/consultation', { method: 'POST', body: 'mock-only' });
  f.navigator.sendBeacon('/mcc-route', 'unchanged');
  const other = new f.XHR();
  other.open('POST', '/api/example', false, 'name', 'pass');
  other.send('unchanged');
  assert.equal(f.sent.length, 4);
  assert.deepEqual(f.sent[3].args, ['POST', '/api/example', false, 'name', 'pass']);
  f.consent(true);
  f.init();
  f.navigator.sendBeacon(endpoint, 'accepted-again');
  assert.equal(f.sent.length, 5);
  assert.equal(f.scripts.size, 1);
});

test('failed script can retry and SSR is safe', () => {
  const f = fixture();
  f.consent(true);
  f.init();
  [...f.scripts.values()][0].onerror();
  assert.equal(f.scripts.size, 0);
  f.init();
  assert.equal(f.scripts.size, 1);
  const server = vm.createContext({ exports: {} });
  vm.runInContext(compiled, server);
  assert.doesNotThrow(() => server.exports.initializeCloudflareAnalytics(() => true));
});
