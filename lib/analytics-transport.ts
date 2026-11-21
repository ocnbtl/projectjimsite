import { getPrivacyPreferences } from "./analytics-preferences";
import { isAnalyticsRuntimeAllowed } from "./analytics-runtime";

let installed = false;
function isPostHog(value: string | URL) {
  try {
    const url = new URL(value, window.location.origin);
    return url.pathname.startsWith("/mcc-route/") || /^(us|eu)(-assets)?\.i\.posthog\.com$/.test(url.hostname);
  } catch { return false; }
}
function maySend(url: string | URL, body?: unknown) {
  if (!isPostHog(url)) return true;
  if (!isAnalyticsRuntimeAllowed()) return false;
  const choices = getPrivacyPreferences();
  if (!Object.values(choices).some(Boolean)) return false;
  // Only named configuration/asset GETs are bodyless. Event endpoints fail
  // closed if their payload cannot be inspected.
  if (body == null) return /\/(?:array|static)\//.test(new URL(url, window.location.origin).pathname);
  if (typeof body !== "string") return false;
  try {
    let data = body;
    if (!/^[\[{]/.test(data)) data = atob(new URLSearchParams(data).get("data") ?? "");
    const parsed = JSON.parse(data);
    const events = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.batch) ? parsed.batch : [parsed];
    return events.length > 0 && events.every((event: { event?: unknown } | null) => typeof event?.event === "string"
      && (event.event === "$snapshot" ? choices.replay : ["$heatmaps", "$$heatmap"].includes(event.event) ? choices.heatmaps : choices.analytics));
  } catch { return false; }
}

export function installAnalyticsTransportGuard() {
  if (installed) return;
  installed = true;
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = input instanceof Request ? input.url : input;
    if (isPostHog(url) && input instanceof Request && init?.body == null && !["GET", "HEAD"].includes(init?.method ?? input.method)) {
      return input.clone().text().then(body => maySend(url, body)
        ? originalFetch.call(this, input, init) : new Response(null, { status: 204 }));
    }
    if (!maySend(url, init?.body)) return Promise.resolve(new Response(null, { status: 204 }));
    return originalFetch.call(this, input, init);
  };
  const originalBeacon = navigator.sendBeacon;
  if (originalBeacon) navigator.sendBeacon = function(url, body) {
    return maySend(url, body) && originalBeacon.call(this, url, body);
  };
  const destinations = new WeakMap<XMLHttpRequest, string>();
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
    destinations.set(this, String(url));
    return open.call(this, method, url, async, username, password);
  };
  XMLHttpRequest.prototype.send = function(body) {
    if (!maySend(destinations.get(this) ?? "", body)) { this.abort(); return; }
    return send.call(this, body);
  };
}
