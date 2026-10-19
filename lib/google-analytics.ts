import { isAnalyticsRuntimeAllowed } from "./analytics-runtime";

// Public web-stream identifier, not an API credential. MCC public website only.
export const googleMeasurementId = "G-31N6YVTJ32";
const scriptId = "mcc-google-analytics";
const origin = "https://masonrycolorcorrections.com";
const publicPages: Record<string, string> = {
  "/": "Home", "/services": "Services", "/gallery": "Gallery", "/about": "About",
  "/contact": "Contact", "/masonry-staining": "Masonry staining", "/privacy": "Privacy",
};
type TagWindow = Window & {
  dataLayer?: (IArguments | unknown[])[];
  gtag?: (...args: unknown[]) => void;
  "ga-disable-G-31N6YVTJ32"?: boolean;
};
let configured = false;
let active = false;
let guardInstalled = false;
let lastPage = "";
let hasConsent: () => boolean = () => false;

function mayCollect() {
  return hasConsent() && isAnalyticsRuntimeAllowed() && Object.hasOwn(publicPages, window.location.pathname);
}

function isGoogleCollection(value: string | URL) {
  try {
    const url = new URL(value, window.location.origin);
    return (url.hostname === "google-analytics.com" || url.hostname.endsWith(".google-analytics.com"))
      && /\/(?:g\/)?collect$/.test(url.pathname);
  } catch { return false; }
}

function installCollectionGuard() {
  if (guardInstalled) return;
  guardInstalled = true;
  const beacon = navigator.sendBeacon;
  if (beacon) navigator.sendBeacon = function (url, data) {
    if (isGoogleCollection(url) && !mayCollect()) return false;
    return beacon.call(this, url, data);
  };
  const fetchRequest = window.fetch;
  window.fetch = function (input, init) {
    const url = input instanceof Request ? input.url : input;
    if (isGoogleCollection(url) && !mayCollect()) return Promise.resolve(new Response(null, { status: 204 }));
    return fetchRequest.call(this, input, init);
  };
  const destinations = new WeakMap<XMLHttpRequest, string>();
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
    destinations.set(this, String(url));
    return open.call(this, method, url, async, username, password);
  };
  XMLHttpRequest.prototype.send = function (body) {
    if (isGoogleCollection(destinations.get(this) ?? "") && !mayCollect()) { this.abort(); return; }
    return send.call(this, body);
  };
}

function cleanReferrer() {
  try {
    const url = new URL(document.referrer);
    return ["http:", "https:"].includes(url.protocol) ? `${url.origin}/` : "";
  } catch { return ""; }
}

export function initializeGoogleAnalytics(consent: () => boolean) {
  if (typeof window === "undefined") return false;
  hasConsent = consent;
  if (!mayCollect()) return false;
  const win = window as TagWindow;
  installCollectionGuard();
  win.dataLayer ??= [];
  win.gtag ??= function () {
    // eslint-disable-next-line prefer-rest-params -- Use Google's documented gtag queue format.
    win.dataLayer!.push(arguments);
  };
  win[`ga-disable-${googleMeasurementId}`] = false;
  if (!configured) {
    win.gtag("consent", "default", {
      analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    });
    win.gtag("set", "ads_data_redaction", true);
    win.gtag("set", "url_passthrough", false);
    win.gtag("js", new Date());
  }
  if (!active) win.gtag("consent", "update", {
    analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
  });
  if (!configured) {
    win.gtag("config", googleMeasurementId, {
      send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_prefix: "mcc", cookie_expires: 60 * 60 * 24 * 90, cookie_update: false,
      cookie_flags: "SameSite=Lax;Secure", page_location: `${origin}${window.location.pathname}`,
      page_referrer: cleanReferrer(), page_title: `${publicPages[window.location.pathname]} | MCC`,
      ignore_referrer: false,
    });
    configured = true;
  }
  active = true;
  const existing = document.getElementById(scriptId);
  if (existing?.dataset.state === "blocked") existing.remove();
  else if (existing) return true;
  const script = document.createElement("script");
  script.id = scriptId;
  script.async = true;
  script.referrerPolicy = "origin";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${googleMeasurementId}`;
  script.dataset.state = "loading";
  script.onload = () => { script.dataset.state = "loaded"; };
  script.onerror = () => { script.dataset.state = "blocked"; };
  document.head.appendChild(script);
  return true;
}

export function stopGoogleAnalytics() {
  if (typeof window === "undefined") return;
  const win = window as TagWindow;
  win[`ga-disable-${googleMeasurementId}`] = true;
  active = false;
  lastPage = "";
  // Discard events queued before a slow/blocked tag finished loading.
  if (win.dataLayer) {
    for (let i = win.dataLayer.length - 1; i >= 0; i--) {
      if (win.dataLayer[i]?.[0] === "event") win.dataLayer.splice(i, 1);
    }
  }
  win.gtag?.("consent", "update", {
    analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
  });
  for (const item of document.cookie.split(";")) {
    const name = item.trim().split("=")[0];
    if (!/^mcc_ga(?:_|$)/.test(name)) continue;
    for (const domain of ["", ";domain=masonrycolorcorrections.com", ";domain=.masonrycolorcorrections.com"]) {
      document.cookie = `${name}=;Max-Age=0;path=/${domain};SameSite=Lax;Secure`;
    }
  }
}

export function captureGooglePageview(pathname: string) {
  if (!active || !mayCollect() || !Object.hasOwn(publicPages, pathname) || pathname === lastPage) return;
  const win = window as TagWindow;
  const context = {
    page_location: `${origin}${pathname}`, page_title: `${publicPages[pathname]} | MCC`,
    page_referrer: lastPage ? `${origin}${lastPage}` : cleanReferrer(),
  };
  win.gtag?.("set", context);
  win.gtag?.("event", "page_view", { ...context, send_to: googleMeasurementId });
  lastPage = pathname;
}

// Never forward arbitrary properties, form text, link destinations, or identifiers.
export function captureGoogleEvent(name: string, properties?: Record<string, string | number | boolean>) {
  if (!active || !mayCollect()) return;
  const params: Record<string, string | number> = { send_to: googleMeasurementId };
  let event: string;
  switch (name) {
    case "consultation_form_started": event = "form_start"; params.form_id = "estimate_request"; break;
    case "consultation_request_submitted":
      if (properties?.confirmation !== "email_provider_accepted") return;
      event = "generate_lead";
      params.form_id = "estimate_request";
      params.lead_type = "estimate_request";
      if (["Residential", "Commercial"].includes(String(properties.property_type))) params.property_type = String(properties.property_type).toLowerCase();
      if (Number.isInteger(properties.photo_count) && Number(properties.photo_count) >= 0 && Number(properties.photo_count) <= 5) params.photo_count = Number(properties.photo_count);
      break;
    case "phone_link_clicked": event = "phone_click"; break;
    case "email_link_clicked": event = "email_click"; break;
    case "page_scroll_depth":
      if (![25, 50, 75].includes(Number(properties?.percent_scrolled))) return;
      event = "scroll_depth"; params.percent_scrolled = Number(properties?.percent_scrolled); break;
    case "consultation_request_failed":
      if (!["validation_error", "security_check_missing", "security_check_failed", "photos_too_large", "invalid_photo_type", "too_many_photos", "delivery_unavailable", "delivery_error", "invalid_response", "network_or_preparation_error"].includes(String(properties?.failure_reason))) return;
      event = "estimate_error"; params.failure_reason = String(properties?.failure_reason); break;
    default: return;
  }
  if (["header", "footer", "content"].includes(String(properties?.source_section))) params.source_section = String(properties?.source_section);
  (window as TagWindow).gtag?.("event", event, params);
}
