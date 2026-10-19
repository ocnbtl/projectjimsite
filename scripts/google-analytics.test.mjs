import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const id = 'G-31N6YVTJ32';
const endpoint = 'https://www.google-analytics.com/g/collect';
const source = (name) => readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8');

test('concise consent UI preserves clear recording disclosure, neutral edges and equal mobile choices', () => {
  const component = readFileSync(new URL('../components/analytics-consent.tsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../components/analytics-consent.module.css', import.meta.url), 'utf8');
  const description = component.match(/<p id="analytics-consent-description">\s*([\s\S]*?)\s*<\/p>/)?.[1];
  assert.ok(description);
  assert.match(description, /optional analytics and page recordings/);
  assert.match(description, /Form entries and photos are excluded/);
  assert.doesNotMatch(description, /Google|Cloudflare|PostHog/i);
  assert.ok(description.trim().split(/\s+/).length <= 25);
  assert.match(component, /onClick=\{acceptAnalytics\}>\s*Accept\s*<\/button>/);
  assert.match(component, /onClick=\{declineAnalytics\}>\s*Decline\s*<\/button>/);
  assert.match(component, /href="\/privacy">Privacy details/);
  assert.match(css, /\.copy h2\s*\{[^}]*font-size: 1\.125rem/s);
  assert.doesNotMatch(css, /border-top:|linear-gradient/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

function fixture({ host = 'masonrycolorcorrections.com', consent = 'granted', search = '', env = 'production', webdriver = false, posthogEnabled = true } = {}) {
  const scripts = new Map(), sent = [], cookies = [], storage = new Map(), cache = new Map();
  if (consent) storage.set('mcc_analytics_consent_v2', consent);
  class XHR {
    open(...args) { this.args = args; }
    send(body) { sent.push({ type: 'xhr', args: this.args, body }); }
    abort() { this.aborted = true; }
  }
  const navigator = { webdriver, sendBeacon: (...args) => { sent.push({ type: 'beacon', args }); return true; } };
  const window = {
    location: new URL(`https://${host}/contact${search}`), navigator,
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    fetch: async (...args) => { sent.push({ type: 'fetch', args }); return new Response(null, { status: 204 }); },
  };
  const document = {
    referrer: 'https://www.google.com/search?q=private@example.com#private',
    getElementById: id => scripts.get(id),
    createElement: () => ({ dataset: {}, remove() { scripts.delete(this.id); } }),
    head: { appendChild: script => scripts.set(script.id, script) },
    body: { appendChild: script => scripts.set(script.id, script) },
    get cookie() { return 'mcc_ga=123;mcc_ga_31N6YVTJ32=456;unrelated=keep'; },
    set cookie(value) { cookies.push(value); },
  };
  const phCalls = [];
  const posthog = Object.fromEntries(['init', 'capture', 'opt_in_capturing', 'startSessionRecording', 'stopSessionRecording', 'opt_out_capturing'].map(name => [name, (...args) => phCalls.push([name, ...args])]));
  const context = vm.createContext({ window, navigator, document, XMLHttpRequest: XHR, URL, URLSearchParams, Request, Response, console,
    process: { env: { NODE_ENV: env, ...(posthogEnabled ? { NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: 'mock-public', NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com' } : {}) } },
  });
  function load(name) {
    if (name === 'posthog-js') return { __esModule: true, default: posthog };
    name = name.replace(/^\.\//, '');
    if (cache.has(name)) return cache.get(name);
    const exports = {};
    cache.set(name, exports);
    const js = ts.transpileModule(source(name), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInContext(`(function(require,exports){${js}\n})`, context)(load, exports);
    return exports;
  }
  const api = load('analytics'), google = load('google-analytics'), runtime = load('analytics-runtime');
  return { api, google, runtime, scripts, window, document, navigator, XHR, storage, sent, cookies, phCalls, context,
    commands: () => JSON.parse(JSON.stringify((window.dataLayer ?? []).map(command => Array.from(command)))),
    events: () => JSON.parse(JSON.stringify((window.dataLayer ?? []).map(command => Array.from(command)))).filter(a => a[0] === 'event'),
  };
}

test('pending/denied consent loads no Google, Cloudflare or PostHog and never backfills declined events', () => {
  for (const consent of [null, 'denied']) {
    const f = fixture({ consent });
    f.api.captureAnalyticsPageview('/contact');
    f.api.captureAnalyticsEvent('phone_link_clicked');
    assert.equal(f.scripts.size, 0);
    assert.equal(f.phCalls.length, 0);
    f.api.grantAnalyticsConsent();
    assert.equal(f.events().filter(e => e[1] === 'page_view').length, 1);
    assert.equal(f.events().filter(e => e[1] === 'phone_click').length, 0);
  }
});

test('all providers exclude preview/local hosts, automated browsers, nonproduction builds and staff browsers', () => {
  for (const options of [{ host: 'localhost' }, { host: '127.0.0.1' }, { host: 'project-jimsite.vercel.app' }, { host: 'masonrycolorcorrections.com.evil.example' }, { webdriver: true }, { env: 'development' }, { search: '?mcc_analytics=off' }]) {
    const f = fixture(options);
    f.api.grantAnalyticsConsent();
    f.api.captureAnalyticsEvent('consultation_request_submitted', { confirmation: 'email_provider_accepted' });
    assert.equal(f.scripts.size, 0, JSON.stringify(options));
    assert.equal(f.phCalls.length, 0);
    assert.equal(f.events().length, 0);
  }
});

test('testing exclusion persists across routes and is removed only explicitly', () => {
  const f = fixture({ search: '?mcc_analytics=off' });
  assert.equal(f.runtime.isAnalyticsRuntimeAllowed(), false);
  f.window.location.search = '';
  assert.equal(f.runtime.isAnalyticsRuntimeAllowed(), false);
  f.window.location.search = '?mcc_analytics=on';
  assert.equal(f.runtime.isAnalyticsRuntimeAllowed(), true);
  f.window.location.search = '';
  assert.equal(f.runtime.isAnalyticsRuntimeAllowed(), true);
});

test('the staff exclusion is saved before any consent decision', () => {
  const f = fixture({ search: '?mcc_analytics=off', consent: null });
  f.api.captureAnalyticsPageview('/privacy');
  f.window.location.search = '';
  assert.equal(f.runtime.isAnalyticsRuntimeAllowed(), false);
  f.api.grantAnalyticsConsent();
  assert.equal(f.scripts.size, 0);
});

test('legacy opt-ins get a fresh provider choice, while legacy declines remain declined', () => {
  const f = fixture({ consent: null });
  f.storage.set('mcc_analytics_consent', 'granted');
  assert.equal(f.api.getAnalyticsConsentStatus(), 'pending');
  f.storage.set('mcc_analytics_consent', 'denied');
  assert.equal(f.api.getAnalyticsConsentStatus(), 'denied');
});

test('one consented tag uses manual clean pageviews, analytics-only consent and no advertising features', () => {
  const f = fixture({ search: '?email=private@example.com#private' });
  f.api.captureAnalyticsPageview('/contact');
  f.api.captureAnalyticsPageview('/contact');
  f.api.grantAnalyticsConsent();
  assert.equal([...f.scripts.values()].filter(s => s.src?.includes('googletagmanager')).length, 1);
  const commands = f.commands();
  const config = commands.find(a => a[0] === 'config');
  assert.equal(config[1], id);
  assert.equal(config[2].send_page_view, false);
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(config[2].page_location, 'https://masonrycolorcorrections.com/contact');
  assert.equal(config[2].page_referrer, 'https://www.google.com/');
  for (const a of commands.filter(a => a[0] === 'consent')) {
    for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(a[2][key], 'denied');
  }
  assert.equal(f.events().filter(e => e[1] === 'page_view').length, 1);
  f.window.location.pathname = '/gallery';
  f.api.captureAnalyticsPageview('/gallery');
  assert.equal(f.events().at(-1)[2].page_referrer, 'https://masonrycolorcorrections.com/contact');
  assert.doesNotMatch(JSON.stringify(commands), /private@example|#private|email=/);
});

test('lead events require provider acceptance and forward only validated categorical fields', () => {
  const f = fixture();
  f.api.captureAnalyticsPageview('/contact');
  for (const confirmation of [undefined, false, 'attempted', 'email_provider_failed']) f.api.captureAnalyticsEvent('consultation_request_submitted', { confirmation });
  assert.equal(f.events().filter(e => e[1] === 'generate_lead').length, 0);
  f.api.captureAnalyticsEvent('consultation_request_submitted', {
    confirmation: 'email_provider_accepted', property_type: 'Residential', photo_count: 2,
    name: 'PRIVATE NAME', email: 'private@example.com', description: 'PRIVATE PROJECT', submissionId: 'PRIVATE ID', photos: 'PRIVATE PHOTO',
  });
  const lead = f.events().find(e => e[1] === 'generate_lead')[2];
  assert.deepEqual(lead, { send_to: id, form_id: 'estimate_request', lead_type: 'estimate_request', property_type: 'residential', photo_count: 2 });
  f.api.captureAnalyticsEvent('consultation_request_submitted', { confirmation: 'email_provider_accepted', property_type: 'PRIVATE NAME', photo_count: 999 });
  const invalid = f.events().at(-1)[2];
  assert.equal(invalid.property_type, undefined);
  assert.equal(invalid.photo_count, undefined);
});

test('phone/email clicks, starts, scroll milestones and errors are distinct from leads and contain no destinations', () => {
  const f = fixture();
  f.api.captureAnalyticsPageview('/contact');
  for (const event of ['consultation_form_started', 'phone_link_clicked', 'email_link_clicked']) f.api.captureAnalyticsEvent(event, { url: 'mailto:private@example.com', source_section: 'footer' });
  f.api.captureAnalyticsEvent('page_scroll_depth', { percent_scrolled: 50 });
  f.api.captureAnalyticsEvent('page_scroll_depth', { percent_scrolled: 95 });
  f.api.captureAnalyticsEvent('consultation_request_failed', { failure_reason: 'delivery_error', message: 'PRIVATE' });
  f.api.captureAnalyticsEvent('consultation_request_failed', { failure_reason: 'PRIVATE ERROR' });
  f.api.captureAnalyticsEvent('arbitrary_event', { customer: 'PRIVATE' });
  assert.deepEqual(f.events().map(e => e[1]), ['page_view', 'form_start', 'phone_click', 'email_click', 'scroll_depth', 'estimate_error']);
  assert.doesNotMatch(JSON.stringify(f.events()), /private|PRIVATE|mailto:/);
});

test('revoking consent disables GA immediately, discards queued events, clears only MCC cookies, and guards all transports', async () => {
  const f = fixture();
  f.api.captureAnalyticsPageview('/contact');
  f.navigator.sendBeacon(endpoint, 'before');
  assert.equal(f.sent.length, 1);
  f.api.denyAnalyticsConsent();
  assert.equal(f.window[`ga-disable-${id}`], true);
  assert.equal(f.events().length, 0);
  f.api.captureAnalyticsEvent('phone_link_clicked');
  assert.equal(f.events().length, 0);
  assert.equal(f.navigator.sendBeacon(endpoint, 'denied'), false);
  await f.window.fetch(new Request('https://region1.google-analytics.com/g/collect'), { method: 'POST' });
  const xhr = new f.XHR(); xhr.open('POST', endpoint); xhr.send('denied');
  assert.equal(xhr.aborted, true);
  assert.equal(f.sent.length, 1);
  assert.equal(f.cookies.length, 6);
  assert.ok(f.cookies.every(cookie => cookie.startsWith('mcc_ga') && !cookie.includes('unrelated')));
  await f.window.fetch('/api/consultation', { method: 'POST', body: 'LOCAL MOCK' });
  assert.equal(f.sent.length, 2);
  f.api.grantAnalyticsConsent();
  assert.equal(f.window[`ga-disable-${id}`], false);
  assert.equal(f.events().filter(e => e[1] === 'page_view').length, 1);
});

test('private/unknown routes and arbitrary URL paths cannot enter Google context', () => {
  const f = fixture();
  f.api.captureAnalyticsPageview('/contact');
  const count = f.events().length;
  for (const path of ['/office', '/contact/private@example.com', '/api/consultation']) {
    f.window.location.pathname = path;
    f.api.captureAnalyticsPageview(path);
    f.api.captureAnalyticsEvent('phone_link_clicked');
  }
  assert.equal(f.events().length, count);
  assert.equal(f.navigator.sendBeacon(endpoint, 'private-route'), false);
});

test('GA works independently of PostHog credentials; blocked script can retry without duplicate config', () => {
  const f = fixture({ posthogEnabled: false });
  f.api.grantAnalyticsConsent();
  assert.equal(f.events().filter(e => e[1] === 'page_view').length, 1);
  f.scripts.get('mcc-google-analytics').onerror();
  f.api.captureAnalyticsPageview('/contact');
  assert.equal(f.scripts.get('mcc-google-analytics').dataset.state, 'loading');
  assert.equal(f.commands().filter(a => a[0] === 'config').length, 1);
});

test('Google analytics module is inert during server rendering', () => {
  const compiled = ts.transpileModule(source('google-analytics'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = vm.createContext({ exports: {}, require: () => ({}) });
  vm.runInContext(compiled, context);
  assert.equal(context.exports.initializeGoogleAnalytics(() => true), false);
  assert.doesNotThrow(() => context.exports.stopGoogleAnalytics());
});

test('the actual estimate form emits a lead only after accepted success, never for rejection or a network failure', async () => {
  for (const outcome of ['accepted', 'rejected', 'network_error']) {
    const f = fixture();
    f.api.captureAnalyticsPageview('/contact');
    const fields = { name: 'PRIVATE NAME', phone: '5135550100', email: 'private@example.com', location: 'PRIVATE LOCATION', description: 'PRIVATE PROJECT', propertyType: 'Commercial' };
    class FormDataMock extends FormData {
      constructor(form) { super(); if (form) for (const [key, value] of Object.entries(fields)) this.set(key, value); }
    }
    Object.assign(f.context, { FormData: FormDataMock, File, crypto: { randomUUID: () => 'local-test-submission' },
      fetch: async () => {
        if (outcome === 'network_error') throw new Error('LOCAL MOCK');
        return Response.json({ accepted: outcome === 'accepted' }, { status: outcome === 'accepted' ? 200 : 503 });
      },
    });
    const jsx = (type, props) => ({ type, props });
    const react = { useState: initial => [initial, () => {}], useRef: current => ({ current }), useEffect: () => {} };
    const imports = name => {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === '@/lib/analytics') return f.api;
      if (name === '@/content/site') return { business: {} };
      return {};
    };
    const component = readFileSync(new URL('../components/estimate-form.tsx', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(component, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const exports = {};
    vm.runInContext(`(function(require,exports){${compiled}\n})`, f.context)(imports, exports);
    const form = exports.EstimateForm();
    form.props.onChangeCapture();
    form.props.onChangeCapture();
    await form.props.onSubmit({ preventDefault() {}, currentTarget: { reset() {} } });
    assert.equal(f.events().filter(e => e[1] === 'form_start').length, 1, outcome);
    assert.equal(f.events().filter(e => e[1] === 'generate_lead').length, outcome === 'accepted' ? 1 : 0, outcome);
    assert.doesNotMatch(JSON.stringify(f.events()), /PRIVATE|private@example|5135550100|local-test-submission/);
  }
});

test('the actual provider tracks contact links without interfering with navigation and deduplicates scroll milestones', () => {
  const f = fixture();
  const effects = [], listeners = new Map(), frames = new Map();
  let nextFrame = 0;
  class ElementMock {
    constructor(href = '', area = 'content') { this.href = href; this.area = area; }
    closest(selector) { if (selector === 'a[href]') return this; return selector === this.area ? this : null; }
    getAttribute() { return this.href; }
  }
  Object.assign(f.context, { Element: ElementMock });
  Object.assign(f.window, { innerHeight: 1000, scrollY: 0,
    addEventListener: (name, handler, options) => listeners.set(name, { handler, options }),
    removeEventListener: name => listeners.delete(name),
    requestAnimationFrame: handler => { const id = ++nextFrame; frames.set(id, handler); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  Object.assign(f.document, { documentElement: { scrollHeight: 4000 },
    addEventListener: (name, handler, options) => listeners.set(name, { handler, options }),
    removeEventListener: name => listeners.delete(name),
  });
  const code = readFileSync(new URL('../components/analytics-provider.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const imports = name => name === 'react' ? { useEffect: effect => effects.push(effect) }
    : name === 'next/navigation' ? { usePathname: () => '/contact' }
    : name === '@/lib/analytics' ? f.api : f.runtime;
  const exports = {};
  vm.runInContext(`(function(require,exports){${compiled}\n})`, f.context)(imports, exports);
  exports.AnalyticsProvider();
  const cleanups = effects.map(effect => effect());
  listeners.get('click').handler({ target: new ElementMock('tel:+15136128421', 'header') });
  listeners.get('click').handler({ target: new ElementMock('mailto:private@example.com', 'footer') });
  assert.equal(f.events().find(e => e[1] === 'phone_click')[2].source_section, 'header');
  assert.equal(f.events().find(e => e[1] === 'email_click')[2].source_section, 'footer');
  assert.equal(listeners.get('scroll').options.passive, true);
  function scroll(y) {
    f.window.scrollY = y;
    listeners.get('scroll').handler();
    listeners.get('scroll').handler();
    assert.equal(frames.size, 1);
    for (const [id, handler] of frames) { frames.delete(id); handler(); }
  }
  scroll(100); scroll(1000); scroll(2200); scroll(2300);
  assert.deepEqual(f.events().filter(e => e[1] === 'scroll_depth').map(e => e[2].percent_scrolled), [25, 50, 75]);
  assert.doesNotMatch(JSON.stringify(f.events()), /private@example|tel:|mailto:/);
  for (const cleanup of cleanups) cleanup?.();
  assert.equal(listeners.size, 0);
});
