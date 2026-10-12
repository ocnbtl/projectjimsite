import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

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
    assert.match(view, /Don’t just take it from us/);
    assert.match(view, /A note from Joe after we matched the brick on his project\./);
  }
  assert.match(text, /<blockquote>/);
  assert.match(text, /rel="noopener noreferrer"/);
  assert.ok(schemas(text).every((schema) => !schema.aggregateRating && !schema.review), 'message is not presented as a rated Google review');
});

test('testimonial decoration preserves the quotation and is hidden from assistive technology', async () => {
  const text = await html('/');
  const section = text.match(/<section[^>]+aria-labelledby="client-word-title"[^>]*>(.*?)<\/section>/s)?.[1];
  assert.ok(section);
  const icons = [...section.matchAll(/<svg[^>]+class="[^"]*testimonialQuoteIcon[^\"]*"[^>]*>/g)];
  assert.equal(icons.length, 2);
  for (const [icon] of icons) {
    assert.match(icon, /aria-hidden="true"/);
    assert.match(icon, /focusable="false"/);
  }
  assert.equal(section.match(/<blockquote>/g)?.length, 1);
  assert.ok(section.includes(quote));
  const css = readFileSync(new URL('../app/home.module.css', import.meta.url), 'utf8');
  assert.match(css, /--message-gray: #e5e5ea;/);
  assert.match(css, /\.testimonialMessage blockquote \{[^}]*background: var\(--message-gray\);[^}]*color: #000;/s);
  assert.match(css, /\.testimonialMessage figcaption \{[^}]*justify-content: center;/s);
  assert.match(css, /\.testimonialQuoteFrame \{[^}]*grid-template-columns: var\(--quote-size\) minmax\(0, 840px\) var\(--quote-size\);/s);
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
    assert.match(view, /then stain the brick/i);
    assert.match(view, /Bring back your brick’s natural color/);
    assert.match(view, /Get the right color for your HOA or project/);
    assert.doesNotMatch(view, /verify the finished LRV|measure the finished surface|insurance pays|insurance will pay|guaranteed HOA approval/i);
  }
  assert.match(text, /See a finished project/);
  assert.match(text, /href="\/gallery#paint-chalking-color-correction"/);
  assert.doesNotMatch(text, /See the finished brick/);
});

test('staining explanations, FAQ, and gallery navigation remain consistent and usable', async () => {
  const staining = await html('/masonry-staining');
  const md = await markdown('/masonry-staining');
  for (const view of [staining, md]) {
    assert.doesNotMatch(view, /measure the finished surface against that standard/i);
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

test('expanded staining process and consultation wording stay consistent in HTML and Markdown', async () => {
  for (const view of [await html('/masonry-staining'), await markdown('/masonry-staining')]) {
    for (const phrase of ['A convincing match takes more than finding one similar shade.', 'lighter tones, darker accents, and weathering', 'We custom mix stains', 'small test samples', 'individual bricks and mortar joints', 'normal viewing distance', 'Let’s talk about your project.', 'which approach makes sense for your masonry']) {
      assert.ok(view.includes(phrase), phrase);
    }
    assert.doesNotMatch(view, /with the surface checked before we recommend|Show us what you’d like to change|an HOA color or LRV requirement, include that too/);
    assert.doesNotMatch(view, /guaranteed match|guaranteed HOA approval|verify the finished LRV/i);
  }
});

test('the approved sample and application copy is exact in both public views', async () => {
  const sample = 'We custom mix stains to work with the colors already in your wall, using small test samples to show how the color looks on your particular brick or mortar. We adjust the mix against the surrounding masonry or supplied standard before moving ahead with the work.';
  for (const view of [await html('/masonry-staining'), await markdown('/masonry-staining')]) {
    assert.ok(view.includes(sample));
    assert.ok(view.includes('We carry that same attention across the entire wall.'));
    assert.doesNotMatch(view, /custom-mix stains|not just one average shade|or an approved sample, before moving/);
  }
});

test('process introduction sits above a full-width responsive step list rather than a tall sidebar', () => {
  const css = readFileSync(new URL('../app/masonry-staining/page.module.css', import.meta.url), 'utf8');
  const section = css.match(/\.processSection \{([^}]+)\}/)?.[1];
  assert.match(section, /grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(css, /\.processHeading p \{\s*margin: 0;/);
  assert.match(css, /@media \(min-width: 1600px\) \{\s*\.processList \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
  assert.match(css, /@media \(max-width: 700px\) \{\s*\.processList \{ grid-template-columns: minmax\(0, 1fr\);/);
});

test('staining consultation puts Call before Estimate and preserves the real destinations', async () => {
  const view = await html('/masonry-staining');
  const cta = view.match(/<section[^>]+aria-labelledby="consultation-title"[^>]*>(.*?)<\/section>/s)?.[1];
  assert.ok(cta);
  const links = [...cta.matchAll(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gs)];
  assert.deepEqual(links.map((match) => match[1]), ['tel:+15136128421', '/contact']);
  for (const link of links) {
    assert.match(link[2], /<span[^>]+aria-hidden="true"/);
  }
  assert.match(view, /class="[^"]*resourceButton[^\"]*"[^>]*href="https:\/\/www.gobrick.com/);
});

test('paired sweeps preserve readable text, opposite directions, keyboard states and reduced motion', () => {
  const css = readFileSync(new URL('../app/masonry-staining/page.module.css', import.meta.url), 'utf8');
  assert.match(css, /\.ctaActions \.pairedButton\s*\{[^}]*overflow: hidden;[^}]*transform: none;/s);
  assert.match(css, /\.buttonFill\s*\{[^}]*background: var\(--clay\);[^}]*color: #fffaf5;[^}]*pointer-events: none;[^}]*transition: clip-path 260ms/s);
  assert.match(css, /\.callButton \.buttonFill \{ clip-path: inset\(0 100% 0 0\); \}/);
  assert.match(css, /\.callButton:hover \.buttonFill \{ clip-path: inset\(0 0 0 0\); \}/);
  assert.match(css, /\.estimateButton \.buttonFill \{ clip-path: inset\(0 0 0 0\); \}/);
  assert.match(css, /\.estimateButton:hover \.buttonFill \{ clip-path: inset\(0 0 0 100%\); \}/);
  assert.match(css, /\.callButton:focus-visible/);
  assert.match(css, /\.estimateButton:focus-visible/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.buttonFill \{ transition: none; \}/);
  assert.match(css, /\.resource \.resourceButton \{[^}]*font-size: 1rem;[^}]*min-height: 58px;/s);
});
