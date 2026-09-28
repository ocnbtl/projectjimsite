import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const filename = path.resolve(import.meta.dirname, '../app/api/consultation/route.ts');
const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const route = new Module(filename);
route.filename = filename;
route.paths = Module._nodeModulePaths(path.dirname(filename));
route._compile(compiled.outputText, filename);

function request(changes = {}, origin = 'http://localhost:3102', photos = []) {
  const form = new FormData();
  const fields = { name: 'MCC TEST', phone: '5135550100', email: 'test@example.com',
    location: 'Cincinnati', propertyType: 'Residential', description: 'LOCAL TEST ONLY',
    submissionId: 'mcc-local-regression', ...changes };
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  for (const photo of photos) form.append('photos', photo);
  return new Request('http://localhost:3102/api/consultation', {
    method: 'POST', headers: { origin }, body: form,
  });
}

test('consultation API acknowledges only provider-accepted requests', async (t) => {
  const names = ['RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL', 'TURNSTILE_SECRET_KEY'];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  t.after(() => { for (const name of names) {
    if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
  } });
  process.env.RESEND_API_KEY = 'local-test-only';
  process.env.CONTACT_TO_EMAIL = 'test@example.com';
  process.env.CONTACT_FROM_EMAIL = 'test@example.com';
  delete process.env.TURNSTILE_SECRET_KEY;
  let calls = [];
  let providerStatus = 200;
  let verification = true;
  let providerThrows = false;
  let verificationStatus = 200;
  let verificationThrows = false;
  const fetchMock = t.mock.method(global, 'fetch', async (url, options) => {
    calls.push({ url, options });
    if (String(url).includes('siteverify')) {
      if (verificationThrows) throw new DOMException('Local simulated timeout', 'TimeoutError');
      return Response.json({ success: verification }, { status: verificationStatus });
    }
    assert.equal(String(url), 'https://api.resend.com/emails');
    if (providerThrows) throw new DOMException('Local simulated timeout', 'TimeoutError');
    return Response.json({ id: 'local-test-email' }, { status: providerStatus });
  });
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});

  await t.test('valid request returns accepted and uses idempotency without a real email', async () => {
    const response = await route.exports.POST(request());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).accepted, true);
    assert.match(calls.at(-1).options.headers['Idempotency-Key'], /^consultation-/);
  });
  await t.test('provider rejection never returns accepted', async () => {
    providerStatus = 500;
    const response = await route.exports.POST(request());
    assert.equal(response.status, 502);
    assert.notEqual((await response.json()).accepted, true);
    providerStatus = 200;
  });
  await t.test('missing configuration fails clearly', async () => {
    delete process.env.RESEND_API_KEY;
    const response = await route.exports.POST(request());
    assert.equal(response.status, 503);
    assert.notEqual((await response.json()).accepted, true);
    process.env.RESEND_API_KEY = 'local-test-only';
  });
  await t.test('missing and invalid fields do not reach provider', async () => {
    calls = [];
    for (const fields of [{ name: '' }, { email: 'invalid' }]) {
      assert.equal((await route.exports.POST(request(fields))).status, 400);
    }
    assert.equal(calls.length, 0);
  });
  await t.test('honeypot does not send or count as accepted', async () => {
    calls = [];
    const response = await route.exports.POST(request({ website: 'spam' }));
    assert.notEqual((await response.json()).accepted, true);
    assert.equal(calls.length, 0);
  });
  await t.test('foreign origin cannot submit', async () => {
    assert.equal((await route.exports.POST(request({}, 'https://example.org'))).status, 403);
  });
  await t.test('Turnstile missing or rejected never reaches email provider', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'local-test-secret';
    calls = [];
    assert.equal((await route.exports.POST(request())).status, 400);
    verification = false;
    const response = await route.exports.POST(request({ 'cf-turnstile-response': 'test' }));
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, 'turnstile_verification_failed');
    assert.equal(calls.filter(({ url }) => String(url).includes('resend')).length, 0);
  });
  await t.test('verified Turnstile permits provider acceptance', async () => {
    verification = true;
    const response = await route.exports.POST(request({ 'cf-turnstile-response': 'test' }));
    assert.equal((await response.json()).accepted, true);
  });
  await t.test('unavailable security verification fails closed', async () => {
    for (const mode of ['http-error', 'timeout']) {
      calls = [];
      verificationStatus = mode === 'http-error' ? 503 : 200;
      verificationThrows = mode === 'timeout';
      const response = await route.exports.POST(request({ 'cf-turnstile-response': 'test' }));
      assert.equal(response.status, 503);
      assert.notEqual((await response.json()).accepted, true);
      assert.equal(calls.filter(({ url }) => String(url).includes('resend')).length, 0);
    }
    verificationThrows = false;
    verificationStatus = 200;
    delete process.env.TURNSTILE_SECRET_KEY;
  });
  await t.test('provider timeout never claims success or definite non-delivery', async () => {
    providerThrows = true;
    const response = await route.exports.POST(request());
    assert.equal(response.status, 500);
    const result = await response.json();
    assert.notEqual(result.accepted, true);
    assert.match(result.message, /could not confirm whether/);
    providerThrows = false;
  });
  await t.test('unchanged retries reuse the provider idempotency key', async () => {
    calls = [];
    await route.exports.POST(request());
    await route.exports.POST(request());
    await route.exports.POST(request({ submissionId: 'a-different-request' }));
    const keys = calls.map(({ options }) => options.headers['Idempotency-Key']);
    assert.equal(keys[0], keys[1]);
    assert.notEqual(keys[1], keys[2]);
  });
  await t.test('invalid photo type, count, individual size and total size never reach provider', async () => {
    const photo = (size, type = 'image/jpeg') => new File([new Uint8Array(size)], 'local-test.jpg', { type });
    for (const [photos, status] of [
      [[photo(10, 'text/plain')], 415],
      [Array.from({ length: 6 }, () => photo(10)), 400],
      [[photo(2_500_001)], 413],
      [[photo(2_000_000), photo(2_000_000)], 413],
    ]) {
      calls = [];
      assert.equal((await route.exports.POST(request({}, undefined, photos))).status, status);
      assert.equal(calls.length, 0);
    }
  });
  await t.test('valid photo and escaped text are included in the mocked email', async () => {
    const photo = new File(['local photo bytes'], '../test photo.png', { type: 'image/png' });
    const response = await route.exports.POST(request({ name: '<MCC & test>', description: '<script>test</script>\nNext line' }, undefined, [photo]));
    assert.equal((await response.json()).accepted, true);
    const payload = JSON.parse(calls.at(-1).options.body);
    assert.match(payload.html, /&lt;MCC &amp; test&gt;/);
    assert.doesNotMatch(payload.html, /<script>/);
    assert.match(payload.html, /<br \/>Next line/);
    assert.equal(payload.attachments.length, 1);
    assert.equal(payload.attachments[0].filename, '..-test-photo.png');
    assert.equal(payload.attachments[0].content, Buffer.from('local photo bytes').toString('base64'));
  });
  fetchMock.mock.restore();
});
