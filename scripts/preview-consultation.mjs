// Local UI QA only. Never sends real email or connects to a real PostHog project.
import http from 'node:http';
import next from 'next';

if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  throw new Error('The consultation fixture is local-only.');
}
process.env.RESEND_API_KEY = 'mcc-local-fixture-only';
process.env.CONTACT_TO_EMAIL = 'test@example.com';
process.env.CONTACT_FROM_EMAIL = 'test@example.com';
delete process.env.TURNSTILE_SECRET_KEY;
delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
delete process.env.NEXT_PUBLIC_POSTHOG_HOST;

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url === 'https://api.resend.com/emails') {
    if (options?.headers?.Authorization !== 'Bearer mcc-local-fixture-only') {
      throw new Error('Unexpected credentials in local fixture');
    }
    const payload = JSON.parse(options.body);
    const fail = payload.html.includes('LOCAL_FAILURE');
    await new Promise((resolve) => setTimeout(resolve, 900));
    console.log(`LOCAL FIXTURE: provider ${fail ? 'rejected' : 'accepted'}, no email sent`);
    return Response.json({ id: 'local-fixture' }, { status: fail ? 502 : 200 });
  }
  return originalFetch(input, options);
};

const app = next({ dev: true, hostname: '127.0.0.1', port: 3102 });
await app.prepare();
http.createServer(app.getRequestHandler()).listen(3102, '127.0.0.1', () => {
  console.log('Local form QA: http://127.0.0.1:3102/contact (no real emails or analytics)');
});
