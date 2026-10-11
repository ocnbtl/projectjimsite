import assert from 'node:assert/strict';
import { test } from 'node:test';

const base = process.env.SEO_TEST_BASE_URL ?? 'http://127.0.0.1:3103';
const quote = 'Hey man, just wanted to say thanks for the brick color match. She was really happy with it and said it exceeded her expectations and blends in way better than she thought it would. Appreciate you!!!';
const html = async (path) => (await fetch(`${base}${path}`)).text();
const markdown = async (path) => (await fetch(`${base}${path}`, { headers: { Accept: 'text/markdown' } })).text();
const schemas = (text) => [...text.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1]));

test('approved client message and exact company profile appear in HTML and Markdown', async () => {
  const text = await html('/');
  const md = await markdown('/');
  for (const view of [text, md]) {
    assert.ok(view.includes(quote));
    assert.match(view, /Joe Brown/);
    assert.match(view, /Integrity Masonry/);
    assert.match(view, /0x89e9d567b68747eb:0x426a80dc9a7eef5e/);
  }
  assert.match(text, /<blockquote>/);
  assert.match(text, /rel="noopener noreferrer"/);
  assert.ok(schemas(text).every((schema) => !schema.aggregateRating && !schema.review), 'message is not presented as a rated Google review');
});

test('both new services have visible destinations and matching machine-readable offers', async () => {
  const text = await html('/services');
  const md = await markdown('/services');
  const business = schemas(await html('/')).find((schema) => schema['@type'] === 'LocalBusiness');
  assert.equal(business.makesOffer.length, 5);
  for (const number of ['04', '05']) {
    assert.ok(text.includes(`id="service-${number}"`));
    const offer = business.makesOffer.find(({ itemOffered }) => itemOffered.url.endsWith(`#service-${number}`));
    assert.ok(offer);
    assert.ok(text.includes(offer.itemOffered.name));
    assert.ok(md.includes(offer.itemOffered.name));
  }
  for (const view of [text, md]) {
    assert.match(view, /verify the finished LRV against the supplied project standard/i);
    assert.doesNotMatch(view, /insurance pays|insurance will pay|guaranteed HOA approval/i);
  }
});

test('staining explanations, FAQ, and gallery navigation remain consistent and usable', async () => {
  const staining = await html('/masonry-staining');
  const md = await markdown('/masonry-staining');
  for (const view of [staining, md]) {
    for (const phrase of ['Look at the wall', 'Mix and test a sample', 'Apply the color', 'Check the finished work', 'Paint chalking on brick', 'HOA and LRV requirements']) {
      assert.ok(view.includes(phrase), phrase);
    }
  }
  assert.match(await html('/contact'), /Yes—we can help new brick blend in with an older wall/);
  const gallery = await html('/gallery');
  assert.match(gallery, /href="#finished-projects"/);
  assert.match(gallery, /id="finished-projects"/);
  assert.match(gallery, /Scroll down to view finished MCC projects/);
  assert.match(gallery, /More detail on what we do/);
});
