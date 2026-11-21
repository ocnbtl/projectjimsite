export const analyticsNavigationEvent = "mcc:analytics-navigation";
let installed = false;

// Stop capture before History changes the URL, not after React's next effect.
// This prevents a blocked URL from entering a replay buffer that might later
// flush when the visitor returns to a public page.
export function installAnalyticsNavigationGuard(pause: () => void) {
  if (installed || typeof window === "undefined" || !window.history) return;
  installed = true;
  const stop = () => { try { pause(); } catch { /* Never break navigation. */ } };
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method];
    window.history[method] = function (...args: Parameters<History[typeof method]>) {
      const changed = args[2] != null && new URL(String(args[2]), window.location.href).href !== window.location.href;
      if (changed) stop();
      const result = original.apply(this, args);
      if (changed) window.dispatchEvent(new Event(analyticsNavigationEvent));
      return result;
    };
  }
  const onBrowserNavigation = () => {
    stop();
    window.dispatchEvent(new Event(analyticsNavigationEvent));
  };
  window.addEventListener("popstate", onBrowserNavigation, true);
  window.addEventListener("hashchange", onBrowserNavigation, true);
}
