import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('../lib/page-transitions.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
runInNewContext(compiled, { exports, URL, AbortController });
const { getPageTransitionTarget, createPageTransitionNavigator } = exports;

function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
function harness() {
  const observers = new Set(), timers = new Map(), transitions = [], calls = [];
  const mediaListeners = new Map(), documentListeners = new Map();
  const media = {
    matches: false,
    addEventListener: (name, fn) => mediaListeners.set(name, fn),
    removeEventListener: (name) => mediaListeners.delete(name),
  };
  let timerId = 0;
  const browser = {
    location: { href: 'https://masonrycolorcorrections.com/' }, innerHeight: 1000,
    matchMedia: () => media,
    MutationObserver: class {
      constructor(callback) { this.callback = callback; }
      observe() { observers.add(this); }
      disconnect() { observers.delete(this); }
    },
    setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  };
  const doc = {
    visibilityState: 'visible', documentElement: { dataset: {} }, body: {},
    panel: '/', headerTop: 18,
    addEventListener: (name, fn) => documentListeners.set(name, fn),
    removeEventListener: (name) => documentListeners.delete(name),
    querySelector(selector) {
      if (selector === '.site-header') return { getBoundingClientRect: () => ({ top: doc.headerTop, bottom: doc.headerTop + 140 }) };
      if (selector === '#main-content') return {};
      const path = selector.match(/data-page-route="([^"]+)"/)?.[1];
      return path === doc.panel ? { getClientRects: () => [1] } : null;
    },
    startViewTransition(callback) {
      const ready = deferred(), update = deferred(), finished = deferred();
      const item = {
        ready: ready.promise, updateCallbackDone: update.promise, finished: finished.promise,
        skipped: 0, skipTransition() { this.skipped++; },
        async run() { await callback(); update.resolve(); ready.resolve(); },
        finish: () => finished.resolve(), failSnapshot: () => ready.reject(new Error('snapshot skipped')),
      };
      transitions.push(item);
      return item;
    },
  };
  const router = {
    push(href, options) { calls.push({ method: 'push', href, ...options }); browser.location.href = new URL(href, browser.location.href).href; },
    replace(href, options) { calls.push({ method: 'replace', href, ...options }); browser.location.href = new URL(href, browser.location.href).href; },
  };
  const navigator = createPageTransitionNavigator(router, doc, browser);
  return {
    doc, browser, media, calls, transitions, observers, timers, navigator, mediaListeners, documentListeners,
    commit(path) { doc.panel = path; for (const observer of [...observers]) observer.callback(); },
    changeMotion() { media.matches = true; mediaListeners.get('change')?.(); },
    hide() { doc.visibilityState = 'hidden'; documentListeners.get('visibilitychange')?.(); },
    timeout() { for (const { fn, delay } of [...timers.values()]) { assert.equal(delay, 1200); fn(); } },
  };
}

test('only different public pages on the same origin are animated; anchors and external actions stay native', () => {
  const current = 'https://masonrycolorcorrections.com/services';
  for (const href of ['#service-04', '/services?x=1', '/services/', 'tel:+15136128421', 'mailto:contact@masonrycolorcorrections.com', 'https://office.masonrycolorcorrections.com/', 'https://example.com/gallery', '/api/consultation', '/llms.txt', '/unknown', 'javascript:alert(1)']) {
    assert.equal(getPageTransitionTarget(href, current), null, href);
  }
  const target = getPageTransitionTarget('/gallery#paint-chalking-color-correction', current);
  assert.equal(target.path, '/gallery');
  assert.equal(target.href, '/gallery#paint-chalking-color-correction');
});

test('URL changes alone cannot release the snapshot; actual destination content must be present', async () => {
  const h = harness();
  assert.equal(h.navigator.navigate('/gallery'), true);
  assert.equal(h.doc.documentElement.dataset.routeMotion, 'morph');
  const t = h.transitions[0];
  let done = false;
  const run = t.run().then(() => { done = true; });
  await Promise.resolve();
  assert.equal(h.calls.length, 1);
  assert.equal(done, false);
  h.commit('/services');
  await Promise.resolve();
  assert.equal(done, false);
  h.commit('/gallery');
  await run;
  assert.equal(t.skipped, 0);
  assert.equal(h.doc.documentElement.dataset.routeMotionPhase, 'animating');
  assert.equal(h.observers.size, 0);
  assert.equal(h.timers.size, 0);
  t.finish(); await Promise.resolve();
  assert.equal(h.doc.documentElement.dataset.routeMotion, undefined);
  assert.equal(h.doc.documentElement.dataset.routeMotionPhase, undefined);
  h.navigator.dispose();
});

test('unsupported browsers, reduced motion and hidden documents use normal Next navigation', () => {
  for (const mode of ['unsupported', 'reduced', 'hidden']) {
    const h = harness();
    if (mode === 'unsupported') delete h.doc.startViewTransition;
    if (mode === 'reduced') h.media.matches = true;
    if (mode === 'hidden') h.doc.visibilityState = 'hidden';
    assert.equal(h.navigator.navigate('/contact'), false, mode);
    assert.equal(h.calls.length, 0);
    assert.equal(h.doc.documentElement.dataset.routeMotion, undefined);
    h.navigator.dispose();
  }
});

test('slow routes release the animation without canceling navigation or leaking observers', async () => {
  const h = harness();
  h.navigator.navigate('/contact');
  const t = h.transitions[0], run = t.run();
  h.timeout(); await run;
  assert.equal(h.calls.length, 1);
  assert.equal(t.skipped, 1);
  assert.equal(h.observers.size, 0);
  assert.equal(h.timers.size, 0);
  t.finish(); await Promise.resolve(); h.navigator.dispose();
});

test('rapid clicks cannot revive an older route or clear the newest animation', async () => {
  const h = harness();
  h.navigator.navigate('/services');
  h.navigator.navigate('/contact');
  const [old, latest] = h.transitions;
  const run = latest.run();
  await old.run();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].href, '/contact');
  old.finish(); await Promise.resolve();
  assert.equal(h.doc.documentElement.dataset.routeMotion, 'morph');
  h.commit('/contact'); await run;
  latest.finish(); await Promise.resolve();
  assert.equal(h.doc.documentElement.dataset.routeMotion, undefined);
  h.navigator.dispose();
});

test('motion preference changes and backgrounding skip animation, but preserve the requested route', async () => {
  for (const action of ['changeMotion', 'hide']) {
    const h = harness();
    h.navigator.navigate('/about'); h[action]();
    const t = h.transitions[0]; await t.run();
    assert.equal(h.calls[0].href, '/about');
    assert.ok(t.skipped >= 1);
    t.finish(); await Promise.resolve(); h.navigator.dispose();
  }
});

test('new pointer or keyboard interaction releases visual snapshots without losing navigation', async () => {
  for (const event of ['pointermove', 'pointerdown', 'keydown', 'wheel']) {
    const h = harness();
    h.navigator.navigate('/gallery');
    h.documentListeners.get(event)();
    const t = h.transitions[0]; await t.run();
    assert.equal(h.calls[0].href, '/gallery');
    assert.ok(t.skipped >= 1);
    t.finish(); await Promise.resolve(); h.navigator.dispose();
    assert.equal(h.documentListeners.size, 0);
  }
});

test('navigation stays outside captured surfaces and respects reduced motion', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  assert.match(css, /html\[data-route-motion="morph"\] \{ view-transition-name: none;/);
  assert.doesNotMatch(css, /view-transition-name: mcc-(?:navigation|brand|menu|frame-header)/);
  assert.match(css, /\.site-header \{ transition: none; \}/);
});

test('replace/scroll options, offscreen fade, synchronous API failure, and cleanup preserve behavior', async () => {
  const h = harness();
  h.doc.headerTop = -300;
  h.navigator.navigate('/gallery#paint-chalking-color-correction', { replace: true, scroll: false });
  assert.equal(h.doc.documentElement.dataset.routeMotion, 'fade');
  const t = h.transitions[0], run = t.run(); h.commit('/gallery'); await run;
  assert.equal(h.calls[0].method, 'replace'); assert.equal(h.calls[0].scroll, false);
  t.failSnapshot(); t.finish(); await Promise.resolve();
  h.doc.startViewTransition = () => { throw new Error('unavailable'); };
  assert.equal(h.navigator.navigate('/contact'), true);
  assert.equal(h.calls.at(-1).href, '/contact');
  assert.equal(h.doc.documentElement.dataset.routeMotion, undefined);
  h.navigator.dispose();
  assert.equal(h.mediaListeners.size, 0); assert.equal(h.documentListeners.size, 0);
});

function linkHarness(navigate) {
  const linkExports = {};
  const source = ts.transpileModule(readFileSync(new URL('../components/page-transitions.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const jsx = (type, props) => ({ type, props });
  runInNewContext(source, {
    exports: linkExports,
    require: (name) => ({
      react: { createContext: () => ({}), useContext: () => navigate },
      'react/jsx-runtime': { jsx, jsxs: jsx },
      'next/link': { __esModule: true, default: 'next-link' },
      'next/navigation': {},
      '@/lib/page-transitions': {},
    })[name],
  });
  return linkExports.TransitionLink;
}

test('link adapter preserves Next link props, parent click handlers, prefetching, and navigation options', () => {
  const calls = [];
  const Link = linkHarness((href, options) => { calls.push({ href, ...options }); return true; });
  const onClick = () => {};
  const element = Link({ href: '/contact', scroll: false, replace: true, prefetch: false, onClick, children: 'Estimate' });
  assert.equal(element.type, 'next-link');
  assert.equal(element.props.onClick, onClick);
  assert.equal(element.props.prefetch, false);
  let prevented = 0;
  element.props.onNavigate({ preventDefault() { prevented++; } });
  assert.equal(prevented, 1);
  assert.equal(calls[0].href, '/contact');
  assert.equal(calls[0].replace, true); assert.equal(calls[0].scroll, false);
  const external = Link({ href: 'https://example.com', target: '_blank', rel: 'noopener', download: true });
  assert.equal(external.props.target, '_blank'); assert.equal(external.props.download, true);
});

test('link adapter respects an existing onNavigate cancellation and falls back without a provider', () => {
  let attempted = 0, prevented = 0;
  const Link = linkHarness(() => { attempted++; return true; });
  Link({ href: '/contact', onNavigate: (event) => event.preventDefault() }).props.onNavigate({ preventDefault() { prevented++; } });
  assert.equal(attempted, 0); assert.equal(prevented, 1);
  const Native = linkHarness(null);
  Native({ href: '/contact' }).props.onNavigate({ preventDefault() { prevented++; } });
  assert.equal(prevented, 1);
  Link({ href: { pathname: '/contact' } }).props.onNavigate({ preventDefault() { prevented++; } });
  assert.equal(attempted, 0);
});

test('a superseded in-flight route releases its observer without overriding the next request', async () => {
  const h = harness();
  h.navigator.navigate('/services');
  const old = h.transitions[0], oldRun = old.run();
  h.navigator.navigate('/contact');
  const latest = h.transitions[1], latestRun = latest.run();
  await oldRun;
  h.commit('/services'); await Promise.resolve();
  assert.equal(h.observers.size, 1);
  h.commit('/contact'); await latestRun;
  assert.equal(h.calls.at(-1).href, '/contact');
  latest.finish(); old.finish(); await Promise.resolve();
  assert.equal(h.observers.size, 0); assert.equal(h.timers.size, 0);
  assert.equal(h.doc.documentElement.dataset.routeMotion, undefined);
  h.navigator.dispose();
});
