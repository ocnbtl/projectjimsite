const excludedKey = "mcc_analytics_excluded";
let sessionExcluded = false;

export function isAnalyticsBrowserExcluded() {
  if (typeof window === "undefined") return true;
  const instruction = new URLSearchParams(window.location.search).get("mcc_analytics");
  if (instruction === "off" || instruction === "on") {
    sessionExcluded = instruction === "off";
    try {
      window.localStorage.setItem(excludedKey, sessionExcluded ? "true" : "false");
    } catch { /* Keep the exclusion for this page if browser storage is unavailable. */ }
    return sessionExcluded;
  }
  try { return sessionExcluded || window.localStorage.getItem(excludedKey) === "true"; }
  catch { return sessionExcluded; }
}

export function isAnalyticsRuntimeAllowed() {
  if (typeof window === "undefined") return false;
  if (isAnalyticsBrowserExcluded()) return false;
  return process.env.NODE_ENV === "production"
    && window.location.protocol === "https:"
    && ["masonrycolorcorrections.com", "www.masonrycolorcorrections.com"].includes(window.location.hostname)
    && ["/", "/services", "/masonry-staining", "/gallery", "/about", "/contact", "/privacy"].includes(window.location.pathname)
    && !window.navigator.webdriver;
}
