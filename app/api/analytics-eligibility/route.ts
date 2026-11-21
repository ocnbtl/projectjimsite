export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  const region = request.headers.get("x-vercel-ip-country-region");
  const privacySignal = request.headers.get("sec-gpc") === "1"
    || ["1", "yes"].includes(request.headers.get("dnt") ?? "");
  // Source and feature-specific exceptions are documented in PRIVACY_RELEASE.md.
  // Vercel overwrites the country/region headers at its trusted edge. Missing
  // region is not silently treated as an unrestricted US state.
  const usStates = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));
  const knownUs = process.env.VERCEL === "1" && country === "US" && usStates.has(region ?? "");
  const replayConsentStates = new Set(["CA", "FL", "IL", "MD", "MT", "NH", "NV", "PA", "WA"]);
  const defaults = {
    analytics: knownUs && !privacySignal,
    heatmaps: knownUs && !privacySignal,
    replay: knownUs && !privacySignal && !replayConsentStates.has(region!),
  };
  return Response.json({ version: 2, defaults, privacySignal, policy: "us-public-v2", jurisdiction: knownUs ? `US-${region}` : country ?? "unknown" }, {
    headers: { "Cache-Control": "private, no-store", "Vary": "x-vercel-ip-country, x-vercel-ip-country-region, Sec-GPC, DNT", "X-Robots-Tag": "noindex, nofollow" },
  });
}
