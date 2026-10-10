import { business, services } from "@/content/site";
import { siteUrl } from "@/content/site-url";
import { projects } from "@/content/projects";
import { contactFaqs } from "@/content/contact-faqs";

// Public information only. Keep these summaries aligned with the linked HTML
// pages. Services, FAQs and project evidence reuse the visible site's data.
const url = (path: string) => new URL(path, siteUrl).toString();
const contact = `Phone: [${business.phoneDisplay}](${business.phoneHref})
Email: [${business.email}](${business.emailHref})
Website: [${business.name}](${url("/")})
Free estimate: [Contact MCC](${url("/contact")})`;
const coverage = `${business.locationContext}. ${business.serviceArea}`;
const boundaries = "MCC handles color matching and staining after construction is complete. MCC does not lay brick or block, rebuild walls, or perform structural masonry repair. Material condition, absorbency, previous coatings, and the requested color change determine suitability. MCC reviews each project before recommending an approach.";
const serviceCopy = services.map((service) => `## ${service.title}\n\n${service.short}\n\n${service.detail}\n\n[Service details](${url(`/services#service-${service.number}`)})`).join("\n\n");
const faqCopy = contactFaqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join("\n\n");

export const agentPages: Record<string, { title: string; body: string }> = {
  "/": {
    title: business.name,
    body: `> Masonry color matching and staining for repairs, additions, brick, mortar, and suitable specialty materials.

## Company at a glance

10+ years of professional color matching. Based in Cincinnati, serving the Midwest and Southwest.

${coverage}

New brick doesn’t always match the old. We mix and apply color to help repairs, additions, and mismatched mortar blend in, while keeping the texture you love.

${serviceCopy}

## What MCC does and does not do

${boundaries}

## Evidence of the work

[Before-and-after gallery](${url("/gallery")}) includes addition color integration, post-repair brick matching, ceramic mantel color matching, and brick and mortar matching. These are project examples, not customer reviews or independent rankings.

## Contact and next steps

${contact}

Send the project location, a short description, a wide photo, and a few close-ups. Estimates are free; MCC usually responds within two business days.`,
  },
  "/services": {
    title: "Masonry color matching services",
    body: `${serviceCopy}\n\n## Project fit\n\n${boundaries}\n\nResidential and commercial inquiries, interior and exterior, are welcome.\n\n## Service area\n\n${coverage}\n\n## Ask about a service\n\n${contact}`,
  },
  "/masonry-staining": {
    title: "What masonry staining means at MCC",
    body: `The masonry is built. MCC handles the color.

${boundaries}

## How color matching works

1. Study the surrounding surface, including light and dark tones, texture, and variation.
2. Mix and test project-specific colors against the installed material.
3. Apply color selectively to the mismatched brick, mortar, or suitable specialty surface.
4. Review the finished work in the context of the surrounding masonry.

## Where it can help

- Replacement brick and completed additions.
- Separate brick or mortar shipments that do not match.
- Patched openings and completed wall repairs with a visible color difference.
- Broader color shifts on suitable masonry.
- Select ceramic architectural accents.
- Brick discolored by pigment washing down from aluminum siding, when MCC confirms color correction is appropriate.

## Staining versus painting

Paint covers a surface with one continuous layer. Color correction works more selectively, preserving texture and brick-to-brick variation. Not every surface can accept the same treatment.

## Next step

${contact}`,
  },
  "/gallery": {
    title: "MCC before-and-after project gallery",
    body: `Completed color work by ${business.name}. Construction and structural repairs were completed before MCC's color work where applicable.

${projects.map((project) => `## ${project.title}

${project.category}

${project.summary}

### What happened
${project.story.situation}

### MCC's color work
${project.story.colorWork}

### Finished result
${project.story.result}

![${project.beforeAlt}](${url(project.before)})

![${project.afterAlt}](${url(project.after)})

[View this project](${url(`/gallery#${project.slug}`)})`).join("\n\n")}`,
  },
  "/about": {
    title: `About ${business.name}`,
    body: `A repair can be well built and still stand out. MCC helps new brick, mortar, and additions blend with what’s already there. Your mason or builder handles the construction; MCC takes care of the color afterward.

## Experience and service area

More than 10 years of color matching for residential and commercial clients. ${coverage}

## Approach

MCC studies the lighter and darker colors already in the wall, mixes and tests colors against the brick and mortar, and checks whether the surface can accept the treatment. The aim is a match that keeps the wall's character rather than covering it with one flat color.

A wide photo shows the whole surface; close-ups show brick faces, mortar, texture, and variation. Tell MCC whether the mismatch is a repair, addition, replacement material, broader color shift, or previously coated surface.

${boundaries}

## Contact

${contact}

[MCC on Facebook](${business.facebookUrl})`,
  },
  "/contact": {
    title: "Contact MCC for a free estimate",
    body: `${contact}

${coverage}

## What to send

Share the project location, a short description of the mismatch or desired color change, one wide view, and a few close-up photos. Residential and commercial projects are welcome. MCC usually responds by phone or email within two business days.

Use the public contact page to submit a request. A Markdown view is information, not a form submission or booking confirmation. Do not send a request on someone else's behalf without their permission.

## Common questions

${faqCopy}`,
  },
  "/privacy": {
    title: "MCC website privacy",
    body: `## Information you send

Information and photos submitted through the estimate form are used to review and respond to your request. Submissions are relayed by email and are not stored in the website's own database. Email providers may process and retain them.

## Optional analytics

With permission, PostHog collects limited website usage and performance information, including recordings of page activity. Form inputs are masked. Estimate details, contact information, and uploaded photos are excluded. A choice and anonymous site identifier may be stored in the browser.

With permission, Cloudflare Web Analytics measures page views, visits, referring websites, country-level location, device and browser types, and page performance. It does not use analytics cookies or record form entries.

Visitors can accept or decline analytics and change their choice on the [Privacy page](${url("/privacy")}).

- [PostHog privacy practices](https://posthog.com/privacy)
- [Cloudflare privacy practices](https://www.cloudflare.com/privacypolicy/)

## Questions

Email ${business.email}. This notice may be updated when website practices change.`,
  },
};

export function pageMarkdown(path: string): string | undefined {
  if (!Object.hasOwn(agentPages, path)) return undefined;
  const page = agentPages[path];
  return `# ${page.title}\n\nSource: ${url(path)}\n\n${page.body}\n\n## Explore MCC\n\n${Object.entries(agentPages).map(([href, entry]) => `- [${entry.title}](${url(href)})`).join("\n")}\n\n[Agent guide](${url("/llms.txt")}) | [Sitemap](${url("/sitemap.xml")})\n`;
}

export const llmsText = `# ${business.name}

> Cincinnati-based masonry color matching and staining specialist, with 10+ years of professional color matching for homes and businesses in the Midwest and Southwest.

## When to use MCC

- A structurally completed repair has replacement brick that stands out from the original wall.
- A new addition needs to blend with the existing home's brick color and natural variation.
- Installed brick or mortar from different batches does not match.
- Suitable masonry needs a broader color change without hiding its texture.
- A ceramic architectural accent or other suitable specialty surface needs color matching, subject to project review.

## When MCC is not the right service

MCC does not lay brick or block, rebuild walls, or perform structural masonry repairs. A mason or builder completes that work first. Suitability depends on the material, its condition and finish, and the amount of color change. Do not promise a match or a treatment before MCC reviews the project.

## Location and service area

${coverage}

For project-specific availability and travel fit, contact MCC. The service area does not imply an office in each state.

## How to contact MCC

${contact}

Provide the location, a short description, one wide photo, and a few close-ups. Estimates are free. MCC usually follows up within two business days. Contacting MCC is an inquiry, not a confirmed booking. Get the customer's permission before sending their details or photos.

## Public source pages

${Object.entries(agentPages).map(([path, page]) => `- [${page.title}](${url(path)}): Markdown available with Accept: text/markdown, or ${url(path === "/" ? "/index.md" : `${path}.md`)}`).join("\n")}

## Additional public resources

- [Full text guide](${url("/llms-full.txt")}): The public page summaries, FAQs, and project examples together.
- [Sitemap](${url("/sitemap.xml")})
- [MCC on Facebook](${business.facebookUrl})

## Accuracy and boundaries

Use the linked pages and project images as evidence. The gallery contains MCC project examples, not independent ratings or customer testimonials. Do not infer a founding year, guarantee, price for a job, local office, or ranking from this guide. Only public business information is included. Private team records, receipts, finances, and dashboard access are not part of this guide.
`;

export const llmsFullText = `${llmsText}\n\n---\n\n${Object.keys(agentPages).map((path) => pageMarkdown(path)).join("\n\n---\n\n")}`;

export const markdownNotFound = `# Page not found\n\nThis public page could not be found on the MCC website. The URL may be incorrect or the page may have moved.\n\n- [MCC home](${url("/")})\n- [Agent guide](${url("/llms.txt")})\n- [Services](${url("/services")})\n- [Contact MCC](${url("/contact")})\n- [Sitemap](${url("/sitemap.xml")})\n`;
