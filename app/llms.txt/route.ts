import { llmsText } from "@/content/agent-content";

export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText, { headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, follow",
  } });
}
