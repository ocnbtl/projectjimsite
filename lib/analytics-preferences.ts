import { hasBrowserPrivacySignal, isAnalyticsBrowserExcluded } from "./analytics-runtime";

export type AnalyticsCategory = "analytics" | "heatmaps" | "replay";
export type PrivacyPreferences = Record<AnalyticsCategory, boolean>;
export const privacyChangedEvent = "mcc:privacy-changed";
export const privacyStorageKey = "mcc_privacy_choices_v3";
const categories: AnalyticsCategory[] = ["analytics", "heatmaps", "replay"];
let defaults: PrivacyPreferences = { analytics: false, heatmaps: false, replay: false };
const session: Partial<PrivacyPreferences> = {};
let eligibilityRequest: Promise<void> | undefined;

export function getPrivacyPreferences(): PrivacyPreferences {
  if (typeof window === "undefined" || hasBrowserPrivacySignal() || isAnalyticsBrowserExcluded()) {
    return { analytics: false, heatmaps: false, replay: false };
  }
  try {
    const stored = JSON.parse(window.localStorage.getItem(privacyStorageKey) ?? "{}");
    const legacy = window.localStorage.getItem("mcc_analytics_consent_v2") ?? window.localStorage.getItem("mcc_analytics_consent");
    const result = { ...defaults };
    for (const category of categories) {
      if (typeof session[category] === "boolean") result[category] = session[category]!;
      else if (typeof stored[category] === "boolean") result[category] = stored[category];
      else if (legacy === "denied") result[category] = false;
      else if (legacy === "granted") result[category] = true;
    }
    return result;
  } catch {
    return { analytics: session.analytics ?? false, heatmaps: session.heatmaps ?? false, replay: session.replay ?? false };
  }
}

export function setPrivacyPreference(category: AnalyticsCategory, enabled: boolean) {
  if (typeof window === "undefined") return;
  // Save an explicit opt-out even while GPC/DNT is active.
  if (enabled && hasBrowserPrivacySignal()) return;
  try {
    const stored = JSON.parse(window.localStorage.getItem(privacyStorageKey) ?? "{}");
    window.localStorage.setItem(privacyStorageKey, JSON.stringify({ ...stored, [category]: enabled }));
  } catch { session[category] = enabled; }
  window.dispatchEvent(new Event(privacyChangedEvent));
}

export function resolvePrivacyEligibility() {
  if (typeof window === "undefined") return Promise.resolve();
  eligibilityRequest ??= fetch("/api/analytics-eligibility", { cache: "no-store", credentials: "same-origin" })
    .then(async response => {
      if (!response.ok) return;
      const policy = await response.json();
      // Only the exact versioned response may activate a regional default.
      if (policy.version === 1 && policy.defaultOn === true) {
        defaults = { analytics: true, heatmaps: true, replay: true };
      }
    }).catch(() => { /* Unknown eligibility keeps optional collection off. */ })
    .then(() => { window.dispatchEvent(new Event(privacyChangedEvent)); });
  return eligibilityRequest;
}
