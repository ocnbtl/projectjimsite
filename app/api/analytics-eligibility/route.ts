export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  const region = request.headers.get("x-vercel-ip-country-region");
  // A deployment must explicitly designate reviewed regions. Never infer consent
  // from language, browser time zone, a missing location, or client input.
  const reviewedRegions = (process.env.MCC_ANALYTICS_DEFAULT_ON_REGIONS ?? "").split(",").map(value => value.trim()).filter(Boolean);
  const defaultOn = process.env.VERCEL === "1" && !!country && !!region
    && reviewedRegions.includes(country + "-" + region);
  return Response.json({ version: 1, defaultOn }, {
    headers: { "Cache-Control": "private, no-store", "Vary": "x-vercel-ip-country, x-vercel-ip-country-region", "X-Robots-Tag": "noindex, nofollow" },
  });
}
