import assert from 'node:assert/strict';
import { test } from 'node:test';

const base = process.env.SEO_TEST_BASE_URL ?? 'http://localhost:3103';
const canonicalOrigin = 'https://masonrycolorcorrections.com';
const paths = ['/', '/services', '/masonry-staining', '/gallery', '/about', '/contact', '/privacy'];

test('public pages have distinct canonical and sharing URLs with indexable content', async () => {
  const titles = new Set();
  for (const path of paths) {
    const response = await fetch(`${base}${path}`, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /<h1[\s>]/, path);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g) ?? [];
    assert.equal(canonical.length, 1, `${path}: exactly one canonical`);
    const canonicalHref = canonical[0].match(/href="([^"]+)"/)?.[1];
    assert.equal(new URL(canonicalHref).href, new URL(path, canonicalOrigin).href, path);
    const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
    assert.equal(ogUrl?.replace(/\/$/, ''), `${canonicalOrigin}${path}`.replace(/\/$/, ''), path);
    assert.match(html, /<meta property="og:image" content="[^"]+"/, path);
    titles.add(html.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  assert.equal(titles.size, paths.length);
});

test('only public page slash aliases redirect, preserving query strings', async () => {
  for (const path of paths.slice(1)) {
    const response = await fetch(`${base}${path}/?utm_source=seo-test`, { redirect: 'manual' });
    assert.equal(response.status, 308, path);
    const location = new URL(response.headers.get('location'), base);
    assert.equal(location.pathname, path);
    assert.equal(location.searchParams.get('utm_source'), 'seo-test');
  }
  // GET cannot submit a lead. This verifies no slash redirect was added to the API.
  for (const path of ['/api/consultation', '/api/consultation/']) {
    const response = await fetch(`${base}${path}`, { redirect: 'manual' });
    assert.equal(response.status, 405, path);
  }
});

test('sitemap lists seven preferred URLs without fabricated modification dates', async () => {
  const response = await fetch(`${base}/sitemap.xml`);
  assert.equal(response.status, 200);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls, paths.map((path) => `${canonicalOrigin}${path === '/' ? '' : path}`));
  assert.doesNotMatch(xml, /<lastmod>/);
});

test('Contact FAQ uses four closed native disclosures with crawlable answers', async () => {
  const html = await (await fetch(`${base}/contact`)).text();
  assert.match(html, /Common questions/);
  assert.match(html, /Can you match new brick to an older wall\?/);
  assert.match(html, /Do you repair or rebuild the masonry\?/);
  assert.match(html, /usually within two business days/);
  assert.match(html, /Ohio, Kentucky, Indiana, West Virginia, Michigan, Texas, Arizona, and New Mexico/);
  assert.doesNotMatch(html, /How did you hear|How did you find/);
  const disclosures = html.match(/<details class="contact-faq-item"[^>]*>/g) ?? [];
  assert.equal(disclosures.length, 4);
  assert.ok(disclosures.every((tag) => !/\bopen\b/.test(tag)));
  assert.equal((html.match(/<summary>/g) ?? []).length, 4);
  assert.match(html, /contact-faq-grid/);
});

test('homepage exposes the preferred site name, matching identity and useful description', async () => {
  const html = await (await fetch(`${base}/`)).text();
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(description?.startsWith('Masonry Color Corrections LLC:'));
  assert.match(description, /10\+ years of brick staining and color matching/);
  assert.match(description, /Cincinnati/);
  assert.match(description, /\(513\) 612-8421/);
  assert.ok(description.length <= 160);
  assert.match(html, /<meta property="og:site_name" content="Masonry Color Corrections LLC"/);
  assert.match(html, /10\+ years of professional color matching/);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  const websites = schemas.filter((schema) => schema['@type'] === 'WebSite');
  assert.equal(websites.length, 1);
  assert.equal(websites[0].name, 'Masonry Color Corrections LLC');
  assert.equal(websites[0].url, `${canonicalOrigin}/`);
  const business = schemas.find((schema) => schema['@type'] === 'LocalBusiness');
  assert.equal(business.name, websites[0].name);
  assert.equal(business['@id'], websites[0].publisher['@id']);
  assert.equal(business.telephone, '+1-513-612-8421');
  assert.match(business.logo, /^https:\/\/masonrycolorcorrections\.com\/images\/brand\//);
  assert.equal(business.sameAs.length, 1);
  assert.match(business.description, /does not lay brick or perform structural masonry repair/);
  assert.equal(business.aggregateRating, undefined, 'Do not invent reviews');
  assert.equal(business.foundingDate, undefined, 'Do not infer an exact founding date');
});

test('navigation is excluded from snippets without excluding the useful main content', async () => {
  const html = await (await fetch(`${base}/`)).text();
  assert.match(html, /<div class="header-inner" data-nosnippet="true">/);
  assert.match(html, /<span class="brand-logo-frame" data-nosnippet="true">/);
  assert.match(html, /<div class="footer-legal" data-nosnippet="true">/);
  const main = html.match(/<main id="main-content">(.*?)<\/main>/s)?.[1];
  assert.ok(main);
  assert.doesNotMatch(main, /data-nosnippet/);
  assert.match(main, /New brick doesn’t always match the old/);
});

test('analytics disclosure and security policy allow only the intended Cloudflare services', async () => {
  const response = await fetch(`${base}/privacy`);
  const policy = response.headers.get('content-security-policy');
  assert.match(policy, /script-src[^;]*https:\/\/static\.cloudflareinsights\.com/);
  assert.match(policy, /connect-src[^;]*https:\/\/cloudflareinsights\.com\/cdn-cgi\/rum/);
  const html = await response.text();
  assert.match(html, /With your permission, Cloudflare Web Analytics/);
  assert.doesNotMatch(html, /<script[^>]*src="https:\/\/static\.cloudflareinsights\.com/);
});
