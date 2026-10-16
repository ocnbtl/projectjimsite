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
    assert.match(view, /A note from our client Joe after he hired us to color match the brick on his project\./);
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
  assert.match(css, /--message-gray: #d1d1d6;/);
  assert.match(css, /\.testimonialMessage blockquote \{[^}]*background: var\(--message-gray\);[^}]*color: #000;/s);
  assert.match(css, /\.testimonialMessage figcaption \{[^}]*justify-content: center;/s);
  assert.match(css, /\.testimonialQuoteFrame \{[^}]*grid-template-columns: var\(--quote-size\) minmax\(0, 840px\) var\(--quote-size\);/s);
});

test('homepage comparison and closing prompts are concise and keep the material labels', async () => {
  const text = await html('/');
  assert.match(text, /Slide to compare this entry wall before and after MCC’s color matching\./);
  assert.match(text, /Ready to start your project\?/);
  assert.match(text, /Send a few clear photos\./);
  assert.match(text, /Color-corrected brick/);
  assert.doesNotMatch(text, /Start with a few clear photos\.|Drag across this repaired entry wall/);
});

test('gallery titles lead each project and descriptive categories render as non-interactive tags', async () => {
  const text = await html('/gallery');
  const source = readFileSync(new URL('../content/projects.ts', import.meta.url), 'utf8');
  const categories = [...source.matchAll(/category: "([^"]+)"/g)].map((match) => match[1]);
  const tags = [...text.matchAll(/<ul class="gallery-category" aria-label="Project categories">(.*?)<\/ul>/gs)];
  assert.equal(tags.length, categories.length);
  assert.doesNotMatch(text, /class="gallery-number"|Project\s*(?:<!-- -->)?\s*0[1-5]/);
  assert.equal([...text.matchAll(/<header class="[^"]*projectHeading[^"]*"><h2/g)].length, categories.length);
  for (const [index, [, list]] of tags.entries()) {
    assert.deepEqual([...list.matchAll(/<li>(.*?)<\/li>/g)].map((match) => match[1]), categories[index].split('·').map((tag) => tag.trim().toLowerCase()));
    assert.doesNotMatch(list, /<(?:a|button)\b/);
  }
});

test('gallery uses one ordered full-width panel per project with alternating surfaces and labelled story sections', async () => {
  const text = await html('/gallery');
  assert.deepEqual([...text.matchAll(/data-project-panel="([^"]+)"/g)].map((match) => match[1]), ['charcoal', 'clay', 'ivory', 'charcoal', 'clay']);
  for (const label of ['What happened', 'MCC’s color work', 'Finished result']) {
    assert.equal([...text.matchAll(new RegExp(`<h3[^>]+>${label}</h3><p>`, 'g'))].length, 5);
  }
  assert.doesNotMatch(text, /class="gallery-secondary|class="gallery-card/);
  const css = readFileSync(new URL('../app/gallery/page.module.css', import.meta.url), 'utf8');
  assert.match(css, /\.gallery \{[^}]*display: grid;/s);
  assert.match(css, /@media \(max-width: 1599px\)/);
  assert.match(css, /@media \(max-width: 1000px\)/);
  assert.doesNotMatch(css, /margin-top: clamp\(-180px|object-fit: cover/);
});

test('gallery enlargements are limited to landscape projects above phone widths', () => {
  const css = readFileSync(new URL('../app/gallery/page.module.css', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../app/gallery/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /project.orientation === "portrait" \? "" : styles.landscapePanel/);
  assert.match(css, /@media \(min-width: 601px\) \{[\s\S]*?\.caseStudy h3 \{ font-size: 1.125rem; \}/);
  assert.match(css, /grid-template-areas: "heading media details";/);
  assert.doesNotMatch(page, /landscapeSummary/);
  assert.match(css, /minmax\(0, 2.2fr\)/);
  assert.doesNotMatch(css, /aspect-ratio:/);
});

test('each gallery description stays inside its heading below the tags', async () => {
  const text = await html('/gallery');
  const headings = [...text.matchAll(/<header class="[^"]*projectHeading[^"]*">(.*?)<\/header>/gs)];
  assert.equal(headings.length, 5);
  for (const [, heading] of headings) {
    assert.match(heading, /<\/ul><p class="[^"]*projectSummary[^"]*">[^<]+<\/p>$/);
  }
});

test('only the two photos with baked-in white edges receive a proportional trim', async () => {
  const text = await html('/gallery');
  const images = [...text.matchAll(/<img\b[^>]+>/g)].map(([image]) => image);
  const trimmed = images.filter((image) => image.includes('data-edge-trim='));
  assert.equal(trimmed.length, 2);
  assert.ok(trimmed.some((image) => image.includes('data-edge-trim="top"') && image.includes('addition-after.webp')));
  assert.ok(trimmed.some((image) => image.includes('data-edge-trim="bottom"') && image.includes('repair-before.webp')));
  const css = readFileSync(new URL('../components/project-pair.module.css', import.meta.url), 'utf8');
  assert.match(css, /transform: scale\(1.0125\);/);
  assert.match(css, /data-edge-trim="top"[^}]+transform-origin: center bottom;/s);
  assert.match(css, /data-edge-trim="bottom"[^}]+transform-origin: center top;/s);
});

test('Contact leads with the form, removes the project photo and places one FAQ group within the contact layout', async () => {
  const text = await html('/contact');
  assert.ok(text.indexOf('Request a project consultation') < text.indexOf('Prefer to call?'));
  assert.doesNotMatch(text, /contact-direct-image|Completed MCC project|Photos from close up and normal viewing distance help MCC/);
  assert.equal([...text.matchAll(/id="contact-faq-title"/g)].length, 1);
  assert.equal([...text.matchAll(/<details class="contact-faq-item"/g)].length, 4);
  const css = readFileSync(new URL('../app/contact/page.module.css', import.meta.url), 'utf8');
  assert.match(css, /grid-template-areas: "direct form" "faq form"/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*grid-template-areas: "form" "direct" "faq"/);
});

test('mobile service shapes reset fully and material photos and captions use compact heights', () => {
  const css = readFileSync(new URL('../app/home.module.css', import.meta.url), 'utf8');
  const mobileCards = css.slice(css.indexOf('  .heroServices {', css.indexOf('@media (max-width: 900px)', css.indexOf('.closingSteps'))));
  assert.match(mobileCards, /\.heroServices a:last-of-type \{\s*clip-path: none;/);
  assert.match(mobileCards, /\.heroServices a:last-of-type \{\s*border-bottom: 0;/);
  assert.match(css, /\.materialPhoto \{\s*height: clamp\(140px, 44vw, 240px\);\s*min-height: 0;/);
  assert.match(css, /\.materialLabel \{\s*grid-template-rows: auto auto;\s*height: auto;/);
  assert.match(css, /\.testimonial \+ \.closing \{\s*margin-top: clamp\(32px, 4vw, 64px\);/);
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
