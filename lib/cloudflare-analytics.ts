// Public, browser-visible Web Analytics identifier, not an account API credential.
const siteToken = "7b41da40b5ea4946ada10b17e324c3de";
const scriptId = "mcc-cloudflare-web-analytics";
let guardInstalled = false;

function isCloudflareBeacon(value: string | URL) {
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === "https://cloudflareinsights.com" && url.pathname === "/cdn-cgi/rum";
  } catch {
    return false;
  }
}

function installConsentGuard(hasConsent: () => boolean) {
  if (guardInstalled) return;

  // The beacon has no teardown API. Guard only its collection endpoint so a
  // revoked choice takes effect immediately, without reloading a filled form.
  const sendBeacon = navigator.sendBeacon;
  if (sendBeacon) {
    navigator.sendBeacon = function (url, data) {
      if (isCloudflareBeacon(url) && !hasConsent()) return false;
      return sendBeacon.call(this, url, data);
    };
  }

  const fetchRequest = window.fetch;
  window.fetch = function (input, init) {
    const url = input instanceof Request ? input.url : input;
    if (isCloudflareBeacon(url) && !hasConsent()) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return fetchRequest.call(this, input, init);
  };

  const destinations = new WeakMap<XMLHttpRequest, string>();
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null,
  ) {
    destinations.set(this, String(url));
    return open.call(this, method, url, async, username, password);
  };
  XMLHttpRequest.prototype.send = function (body) {
    if (isCloudflareBeacon(destinations.get(this) ?? "") && !hasConsent()) {
      this.abort();
      return;
    }
    return send.call(this, body);
  };

  guardInstalled = true;
}

export function initializeCloudflareAnalytics(hasConsent: () => boolean) {
  if (typeof window === "undefined" || !hasConsent()) return;
  // Never pollute production data from local development or Vercel previews.
  if (!["masonrycolorcorrections.com", "www.masonrycolorcorrections.com"].includes(window.location.hostname)) return;

  try {
    installConsentGuard(hasConsent);
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "module";
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.dataset.cfBeacon = JSON.stringify({ token: siteToken, spa: true });
    script.onerror = () => script.remove();
    document.body.appendChild(script);
  } catch {
    // Optional analytics must never interrupt navigation or an estimate request.
  }
}
