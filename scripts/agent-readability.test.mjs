import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const base = process.env.SEO_TEST_BASE_URL ?? 'http://127.0.0.1:3005';
const origin = 'https://masonrycolorcorrections.com';
const pages = ['/', '/services', '/masonry-staining', '/gallery', '/about', '/contact', '/privacy'];
const compiled = ts.transpileModule(readFileSync(new URL('../lib/markdown-negotiation.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = vm.createContext({ exports: {} });
vm.runInContext(compiled, context);
const { prefersMarkdown } = context.exports;
const get = (path, accept = 'text/markdown', options = {}) => fetch(`${base}${path}`, {
  ...options, headers: { Accept: accept, ...options.headers },
});
const schemas = (html) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));

test('negotiation honors explicit MIME types and quality weights', () => {
  for (const accept of [null, '*/*', 'text/html', 'text/markdown;q=0', 'text/markdown;q=0.5,text/html', 'text/markdown;q=bad']) {
    assert.equal(prefersMarkdown(accept), false, String(accept));
  }
  for (const accept of ['text/markdown', 'TEXT/MARKDOWN; charset=utf-8', 'text/markdown,text/html;q=0.5', 'text/markdown,*/*;q=0.1']) {
    assert.equal(prefersMarkdown(accept), true, accept);
  }
});

test('all public pages negotiate Markdown without replacing HTML or polluting caches', async () => {
  for (const path of pages) {
    for (const accept of ['text/markdown', 'text/html', 'text/markdown', '*/*']) {
      const response = await get(path, accept);
      assert.equal(response.status, 200, path);
      const text = await response.text();
      assert.match(response.headers.get('vary') ?? '', /\baccept\b/i, `${path}: Vary`);
      if (accept === 'text/markdown') {
        assert.match(response.headers.get('content-type'), /^text\/markdown/);
        assert.match(response.headers.get('cache-control'), /no-store/);
        assert.ok(text.startsWith('# '));
        assert.ok(text.includes(`Source: ${origin}${path}`));
        assert.doesNotMatch(text, /<html|<script/i);
      } else {
        assert.match(response.headers.get('content-type'), /^text\/html/);
        assert.match(text, /<h1/);
        assert.match(response.headers.get('link') ?? '', /rel="alternate"; type="text\/markdown"/);
      }
    }
  }
});

test('explicit Markdown aliases agree with negotiated content and point to HTML canonicals', async () => {
  for (const path of pages) {
    const alias = path === '/' ? '/index.md' : `${path}.md`;
    const response = await get(alias, 'text/html');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
    assert.ok(response.headers.get('link').includes(`<${origin}${path}>; rel="canonical"`));
    assert.equal(await response.text(), await (await get(path)).text());
  }
});

test('missing pages remain genuine 404s with useful recovery links', async () => {
  for (const path of ['/agent-readability-missing-page', '/agent-readability-missing-page.md']) {
    const response = await get(path);
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /^text\/markdown/);
    const text = await response.text();
    assert.match(text, /Page not found/);
    assert.match(text, /llms\.txt/);
    assert.match(text, /sitemap\.xml/);
  }
  const html404 = await get('/agent-readability-missing-page', 'text/html');
  assert.equal(html404.status, 404);
  assert.match(html404.headers.get('content-type'), /^text\/html/);
});

test('HEAD, framework navigation, public assets and API methods are preserved', async () => {
  const head = await get('/services', 'text/markdown', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.match(head.headers.get('content-type'), /^text\/markdown/);
  assert.equal(await head.text(), '');
  const rsc = await get('/services', 'text/markdown', { headers: { RSC: '1' } });
  assert.notEqual(rsc.headers.get('content-type')?.split(';')[0], 'text/markdown');
  for (const path of ['/robots.txt', '/sitemap.xml', '/images/brand/mcc-logo-transparent.png']) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    assert.doesNotMatch(response.headers.get('content-type'), /markdown/);
  }
  // GET cannot send an estimate; never POST to the live lead endpoint in this suite.
  assert.equal((await get('/api/consultation')).status, 405);
});

test('agent guides expose public evidence and correct use cases, not private credentials', async () => {
  const guide = await get('/llms.txt');
  assert.equal(guide.status, 200);
  assert.match(guide.headers.get('content-type'), /^text\/plain/);
  const text = await guide.text();
  assert.match(text, /When to use MCC/);
  assert.match(text, /does not lay brick/);
  assert.match(text, /513\) 612-8421/);
  assert.match(text, /Arizona/);
  assert.match(text, /permission before sending/);
  assert.doesNotMatch(text, /james@|ocean@|api[_-]?key|password:/i);
  const full = await (await get('/llms-full.txt')).text();
  for (const path of pages) assert.ok(full.includes(`Source: ${origin}${path}`));
  assert.match(full, /What happened/);
  assert.match(full, /Common questions/);
});

test('business schema contains truthful contact, city-level location and linked services', async () => {
  const html = await (await get('/', 'text/html')).text();
  assert.match(html, /name="is-agentic-site-type" content="business"/);
  const business = schemas(html).find((item) => item['@type'] === 'LocalBusiness');
  assert.equal(business.address['@type'], 'PostalAddress');
  assert.equal(business.address.addressLocality, 'Cincinnati');
  assert.equal(business.address.streetAddress, undefined);
  assert.equal(business.contactPoint.email, 'contact@masonrycolorcorrections.com');
  assert.equal(business.contactPoint.telephone, business.telephone);
  assert.equal(business.makesOffer.length, 3);
  const services = await (await get('/services', 'text/html')).text();
  for (const offer of business.makesOffer) {
    assert.equal(offer.itemOffered.provider['@id'], business['@id']);
    assert.ok(services.includes(`id="${new URL(offer.itemOffered.url).hash.slice(1)}"`));
  }
});

test('FAQ schema and Markdown reuse the exact visible questions and answers', async () => {
  const html = await (await get('/contact', 'text/html')).text();
  const faq = schemas(html).find((item) => item['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, 4);
  const markdown = await (await get('/contact')).text();
  for (const item of faq.mainEntity) {
    assert.ok(html.includes(`<h3>${item.name}</h3>`));
    assert.ok(html.includes(`<p>${item.acceptedAnswer.text}</p>`));
    assert.ok(markdown.includes(item.name));
    assert.ok(markdown.includes(item.acceptedAnswer.text));
  }
});
