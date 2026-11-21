// Only categorical website activity belongs in analytics. Never pass form fields,
// filenames, submission IDs, arbitrary link text, or error messages through here.
const publicPaths = new Set(["/", "/services", "/gallery", "/about", "/contact", "/masonry-staining", "/privacy"]);
const publicHosts = new Set(["masonrycolorcorrections.com", "www.masonrycolorcorrections.com"]);
const acquisitionHosts = new Set(["google.com", "www.google.com", "bing.com", "www.bing.com", "facebook.com", "www.facebook.com", "l.facebook.com", "instagram.com", "www.instagram.com", "chatgpt.com", "perplexity.ai", "www.perplexity.ai", "duckduckgo.com", "www.duckduckgo.com"]);
const failureReasons = ["validation_error", "security_check_missing", "security_check_failed", "photos_too_large", "invalid_photo_type", "too_many_photos", "delivery_unavailable", "delivery_error", "invalid_response", "network_or_preparation_error"];

export function cleanAnalyticsUrl(value: unknown, referrer = false): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value, "https://masonrycolorcorrections.com");
    if (!["https:", "http:"].includes(url.protocol)) return "";
    if (referrer) return publicHosts.has(url.hostname) || acquisitionHosts.has(url.hostname) ? `${url.origin}/` : "";
    if (!publicHosts.has(url.hostname)) return "";
    return `${url.origin}${publicPaths.has(url.pathname) ? url.pathname : "/"}`;
  } catch { return ""; }
}

export function sanitizeAnalyticsProperties(properties: Record<string, unknown>, depth = 0): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (/search_?(?:keyword|term|query)/i.test(key)) continue;
    if (/^(?:\$initial_)?(?:\$?title|page_title)$/.test(key)) {
      result[key] = "MCC public page";
      continue;
    }
    if (/referring_domain$/i.test(key)) {
      result[key] = typeof value === "string" && (acquisitionHosts.has(value) || publicHosts.has(value)) ? value : "";
      continue;
    }
    // Ad click identifiers and arbitrary campaign values can contain customer data.
    const campaignKey = key.replace(/^\$initial_/, "");
    if (campaignKey === "utm_source" || campaignKey === "utm_medium") {
      const allowed = campaignKey === "utm_source"
        ? ["google", "bing", "facebook", "instagram", "chatgpt", "chatgpt.com", "perplexity", "perplexity.ai", "duckduckgo", "google_business_profile"]
        : ["organic", "referral", "social", "cpc", "paid_search", "email"];
      if (typeof value === "string" && allowed.includes(value.toLowerCase())) result[key] = value.toLowerCase();
      continue;
    }
    if (/^(?:\$initial_)?(?:gclid|dclid|fbclid|msclkid|gbraid|wbraid|utm_.+)$/.test(key)) continue;
    if (/url$|referrer$|referring_url$/i.test(key)) result[key] = cleanAnalyticsUrl(value, /referr/i.test(key));
    else if ((key === "$set" || key === "$set_once") && value && typeof value === "object" && depth < 2) {
      result[key] = sanitizeAnalyticsProperties(value as Record<string, unknown>, depth + 1);
    } else result[key] = value;
  }
  return result;
}

type Properties = Record<string, string | number | boolean>;
export function safeActivityProperties(event: string, input: Properties = {}): Properties | null {
  const result: Properties = {};
  const choice = (key: string, allowed: string[]) => { if (allowed.includes(String(input[key]))) result[key] = String(input[key]); };
  const number = (key: string, max: number) => { if (typeof input[key] === "number" && Number.isFinite(input[key]) && input[key] >= 0 && input[key] <= max) result[key] = input[key]; };
  choice("source_section", ["header", "footer", "content"]);
  switch (event) {
    case "consultation_form_started": case "phone_link_clicked": case "email_link_clicked": break;
    case "consultation_submit_attempted": case "consultation_request_submitted":
      if (event === "consultation_request_submitted" && input.confirmation !== "email_provider_accepted") return null;
      choice("confirmation", ["email_provider_accepted"]);
      choice("property_type", ["Residential", "Commercial"]);
      number("photo_count", 5);
      break;
    case "consultation_photos_selected": number("photo_count", 5); break;
    case "consultation_request_failed":
      if (!failureReasons.includes(String(input.failure_reason))) return null;
      result.failure_reason = input.failure_reason; break;
    case "page_scroll_depth":
      if (![25, 50, 75].includes(Number(input.percent_scrolled))) return null;
      result.percent_scrolled = Number(input.percent_scrolled); break;
    case "project_comparison_adjusted":
      choice("project_id", ["01", "02", "03", "04", "05"]);
      number("before_visibility_percent", 100); break;
    case "estimate_cta_clicked":
      choice("placement", ["navigation", "hero", "page_intro", "service", "closing"]);
      choice("service_id", ["01", "02", "03", "04", "05"]); break;
    case "service_link_clicked":
      choice("service_id", ["01", "02", "03", "04", "05", "staining", "overview"]); break;
    case "faq_opened":
      choice("question_id", ["brick-match", "request-details", "structural-repairs", "next-steps"]);
      if (!result.question_id) return null;
      break;
    default: return null;
  }
  return result;
}

export function safeCampaignProperties(search: string): Record<string, unknown> {
  const params = new URLSearchParams(search);
  return sanitizeAnalyticsProperties({ utm_source: params.get("utm_source"), utm_medium: params.get("utm_medium") });
}

export function sanitizedBrowserError(error: unknown): Error {
  const safe = new Error("MCC website error; private message omitted");
  safe.name = error instanceof Error && ["Error", "TypeError", "RangeError", "ReferenceError", "SyntaxError", "URIError"].includes(error.name) ? error.name : "Error";
  // Keep only our public JS asset locations and line/column numbers, never input
  // strings or third-party script URLs. This supports grouping without form data.
  const frames = error instanceof Error ? (error.stack ?? "").split("\n").slice(1).flatMap(line => {
    const match = line.match(/https:\/\/(?:www\.)?masonrycolorcorrections\.com\/_next\/static\/[\w./-]+\.js(?::\d+){1,2}/);
    return match ? [`    at ${match[0]}`] : [];
  }).slice(0, 12) : [];
  safe.stack = `${safe.name}: ${safe.message}${frames.length ? "\n" + frames.join("\n") : ""}`;
  return safe;
}
