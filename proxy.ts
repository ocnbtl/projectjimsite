import { NextRequest, NextResponse } from "next/server";
import { agentPages, markdownNotFound, pageMarkdown } from "@/content/agent-content";
import { prefersMarkdown } from "@/lib/markdown-negotiation";
import { siteUrl } from "@/content/site-url";

export function proxy(request: NextRequest) {
  // Never intercept submissions, server actions, framework navigation, or APIs.
  if (!["GET", "HEAD"].includes(request.method) || request.headers.has("rsc")) {
    return NextResponse.next();
  }
  const path = request.nextUrl.pathname;
  const explicitMarkdown = path.endsWith(".md");
  const sourcePath = path === "/index.md" ? "/" : explicitMarkdown ? path.slice(0, -3) : path;
  const canonical = Object.hasOwn(agentPages, sourcePath) ? new URL(sourcePath, siteUrl).toString() : undefined;

  if (explicitMarkdown || prefersMarkdown(request.headers.get("accept"))) {
    const markdown = pageMarkdown(sourcePath);
    return new NextResponse(request.method === "HEAD" ? null : markdown ?? markdownNotFound, {
      status: markdown ? 200 : 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept",
        // Negotiated content must not poison the shared HTML cache.
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(canonical ? { Link: `<${canonical}>; rel="canonical"` } : {}),
        ...(explicitMarkdown || !markdown ? { "X-Robots-Tag": "noindex, follow" } : {}),
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Vary", "Accept");
  if (canonical) {
    const alternate = new URL(path === "/" ? "/index.md" : `${path}.md`, siteUrl).toString();
    response.headers.set("Link", `<${alternate}>; rel="alternate"; type="text/markdown", <${siteUrl}/llms.txt>; rel="describedby"; type="text/plain"`);
  }
  return response;
}

export const config = {
  matcher: [{
    source: "/((?!api(?:/|$)|mcc-route(?:/|$)|_next(?:/|$)|images(?:/|$)|office(?:/|$)|admin(?:/|$)|dashboard(?:/|$)|llms(?:-full)?\\.txt$|robots\\.txt$|sitemap\\.xml$|favicon\\.ico$|icon\\.png$).*)",
    // Next strips Flight headers inside Proxy; exclude these before that step.
    missing: [{ type: "header", key: "rsc" }],
  }],
};
