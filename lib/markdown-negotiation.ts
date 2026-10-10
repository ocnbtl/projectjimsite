// Require an explicit Markdown media type. A normal browser's */* is not consent
// to replace HTML. Honor quality weights, including an explicit q=0 opt-out.
export function prefersMarkdown(accept: string | null): boolean {
  const ranges = (accept ?? "").toLowerCase().split(",").map((part) => {
    const [type, ...parameters] = part.trim().split(";");
    const quality = parameters.find((value) => value.trim().startsWith("q="));
    const q = quality ? Number(quality.trim().slice(2)) : 1;
    return { type: type.trim(), q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0 };
  });
  const markdown = ranges.filter((range) => range.type === "text/markdown");
  if (!markdown.length) return false;
  const mdQuality = Math.max(...markdown.map((range) => range.q));
  const html = ["text/html", "text/*", "*/*"]
    .map((type) => ranges.filter((range) => range.type === type))
    .find((matches) => matches.length);
  const htmlQuality = html ? Math.max(...html.map((range) => range.q)) : 0;
  return mdQuality > 0 && mdQuality >= htmlQuality;
}
