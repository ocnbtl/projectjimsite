import countryCodes from "@/content/iso-country-codes.json";

export const dynamic = "force-dynamic";

const knownCountries = new Set(countryCodes);
// EEA/EU areas, UK/CH vendor scope, Türkiye, mainland China and Brazil.
// Exact jurisdiction/vendor reasons are recorded in docs/PRIVACY_RELEASE.md.
const priorChoiceCountries = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO AX GF GP MF MQ RE YT GB CH TR CN BR".split(" "));
const usStates = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));
const replayConsentStates = new Set(["CA", "FL", "IL", "MD", "MT", "NH", "NV", "PA", "WA"]);

export async function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  const region = request.headers.get("x-vercel-ip-country-region");
  const privacySignal = request.headers.get("sec-gpc") === "1"
    || ["1", "yes"].includes(request.headers.get("dnt") ?? "");
  // Vercel overwrites these headers at its trusted edge. A valid country can
  // support ordinary measurement while a missing US state still holds replay.
  const knownCountry = process.env.VERCEL === "1" && knownCountries.has(country ?? "");
  const knownUsState = country === "US" && usStates.has(region ?? "");
  const defaultOn = knownCountry && !privacySignal && !priorChoiceCountries.has(country!);
  const defaults = {
    analytics: defaultOn,
    heatmaps: defaultOn,
    replay: defaultOn && (country !== "US" || (knownUsState && !replayConsentStates.has(region!))),
  };
  return Response.json({ version: 2, defaults, privacySignal, policy: "public-geography-v3", jurisdiction: knownCountry ? country === "US" ? knownUsState ? `US-${region}` : "US-unknown" : country : "unknown" }, {
    headers: { "Cache-Control": "private, no-store", "Vary": "x-vercel-ip-country, x-vercel-ip-country-region, Sec-GPC, DNT", "X-Robots-Tag": "noindex, nofollow" },
  });
}
