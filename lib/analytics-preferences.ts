import { hasBrowserPrivacySignal, isAnalyticsBrowserExcluded } from "./analytics-runtime";

export type AnalyticsCategory = "analytics" | "heatmaps" | "replay";
export type PrivacyPreferences = Record<AnalyticsCategory, boolean>;
export const privacyChangedEvent = "mcc:privacy-changed";
export const privacyStorageKey = "mcc_privacy_choices_v3";
const categories: AnalyticsCategory[] = ["analytics", "heatmaps", "replay"];
let defaults: PrivacyPreferences = { analytics: false, heatmaps: false, replay: false };
let eligibilityResolved = false;
let serverPrivacySignal = false;
let storageAvailable = false;
const session: Partial<PrivacyPreferences> = {};
let eligibilityRequest: Promise<void> | undefined;

export function getPrivacyPreferences(): PrivacyPreferences {
  if (typeof window === "undefined" || !eligibilityResolved || !storageAvailable || hasEffectivePrivacySignal() || isAnalyticsBrowserExcluded()) {
    return { analytics: false, heatmaps: false, replay: false };
  }
  try {
    const stored = JSON.parse(window.localStorage.getItem(privacyStorageKey) ?? "{}");
    const legacy = window.localStorage.getItem("mcc_analytics_consent_v2")
      ?? (window.localStorage.getItem("mcc_analytics_consent") === "denied" ? "denied" : null);
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
  if (enabled && (hasEffectivePrivacySignal() || !storageAvailable)) return;
  try {
    const stored = JSON.parse(window.localStorage.getItem(privacyStorageKey) ?? "{}");
    window.localStorage.setItem(privacyStorageKey, JSON.stringify({ ...stored, [category]: enabled }));
  } catch { session[category] = false; storageAvailable = false; }
  window.dispatchEvent(new Event(privacyChangedEvent));
}

export function resolvePrivacyEligibility() {
  if (typeof window === "undefined") return Promise.resolve();
  eligibilityRequest ??= fetch("/api/analytics-eligibility", { cache: "no-store", credentials: "same-origin" })
    .then(async response => {
      if (!response.ok) return;
      const policy = await response.json();
      // Only the exact versioned response may activate a regional default.
      if (policy.version === 2 && typeof policy.privacySignal === "boolean"
        && categories.every(category => typeof policy.defaults?.[category] === "boolean")) {
        defaults = policy.defaults;
        serverPrivacySignal = policy.privacySignal;
        eligibilityResolved = true;
        // A browser that cannot save a withdrawal must not start default-on
        // collection. The temporary first-party preference probe stores no ID.
        if (!serverPrivacySignal && !hasBrowserPrivacySignal()) {
          try {
            const key = "mcc_privacy_storage_probe";
            const previous = window.localStorage.getItem(key);
            window.localStorage.setItem(key, JSON.stringify(defaults));
            if (previous === null) window.localStorage.removeItem(key);
            else window.localStorage.setItem(key, previous);
            storageAvailable = true;
          } catch { storageAvailable = false; }
        }
      }
    }).catch(() => { /* Unknown eligibility keeps optional collection off. */ })
    .then(() => { window.dispatchEvent(new Event(privacyChangedEvent)); });
  return eligibilityRequest;
}

export function hasEffectivePrivacySignal() {
  return hasBrowserPrivacySignal() || serverPrivacySignal;
}

export function isPrivacyEligibilityReady() { return eligibilityResolved; }
export function canSavePrivacyChoices() { return storageAvailable; }
