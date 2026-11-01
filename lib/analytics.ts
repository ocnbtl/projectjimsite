import posthog from "posthog-js";
import { cleanAnalyticsUrl, safeActivityProperties, safeCampaignProperties, sanitizeAnalyticsProperties, sanitizedBrowserError } from "./analytics-privacy";
import { initializeCloudflareAnalytics } from "./cloudflare-analytics";
import { isAnalyticsRuntimeAllowed } from "./analytics-runtime";
import { captureGoogleEvent, captureGooglePageview, initializeGoogleAnalytics, stopGoogleAnalytics } from "./google-analytics";

let initialized = false;
let lastPage = "";
const reportedErrors = new Set<string>();

export type AnalyticsConsentStatus = "granted" | "denied" | "pending";

export const analyticsPreferencesEvent = "mcc:open-analytics-preferences";

// Ask previous opt-ins again when adding Google as a new analytics provider.
const analyticsConsentKey = "mcc_analytics_consent_v2";
let sessionConsent: AnalyticsConsentStatus = "pending";

export function getAnalyticsConsentStatus(): AnalyticsConsentStatus {
  if (typeof window === "undefined") return "pending";

  try {
    const stored = window.localStorage.getItem(analyticsConsentKey)
      ?? (window.localStorage.getItem("mcc_analytics_consent") === "denied" ? "denied" : null);
    return stored === "granted" || stored === "denied" ? stored : "pending";
  } catch {
    return sessionConsent;
  }
}

function saveAnalyticsConsent(status: Exclude<AnalyticsConsentStatus, "pending">) {
  sessionConsent = status;
  try {
    window.localStorage.setItem(analyticsConsentKey, status);
  } catch {
    // If storage is unavailable, the choice applies only to this page view.
  }
}

function getPostHogUiHost(ingestionHost: string) {
  try {
    const url = new URL(ingestionHost);
    url.hostname = url.hostname.replace(".i.posthog.com", ".posthog.com");
    return url.origin;
  } catch {
    return "https://us.posthog.com";
  }
}

export function initializeAnalytics() {
  if (typeof window === "undefined") return null;
  if (!isAnalyticsRuntimeAllowed()) return null;
  if (getAnalyticsConsentStatus() !== "granted") return null;
  const mayCollect = () => getAnalyticsConsentStatus() === "granted" && isAnalyticsRuntimeAllowed();
  try { initializeGoogleAnalytics(mayCollect); } catch { /* Optional measurement must not break the website. */ }
  try { initializeCloudflareAnalytics(mayCollect); } catch { /* Keep other providers independent. */ }
  if (initialized) return posthog;

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!projectToken || !host) {
    if (process.env.NODE_ENV === "development") {
      console.warn("PostHog analytics is disabled because its public environment is incomplete.");
    }
    return null;
  }

  posthog.init(projectToken, {
    api_host: "/mcc-route",
    ui_host: getPostHogUiHost(host),
    defaults: "2026-01-30",
    autocapture: false,
    capture_pageview: false,
    disable_capture_url_hashes: true,
    save_campaign_params: false,
    capture_pageleave: true,
    capture_dead_clicks: true,
    capture_exceptions: false,
    capture_heatmaps: true,
    capture_performance: {
      network_timing: false,
      web_vitals: true,
    },
    disable_persistence: false,
    disable_session_recording: false,
    disable_surveys: true,
    disable_surveys_automatic_display: true,
    enable_recording_console_log: false,
    ip: false,
    mask_all_element_attributes: true,
    mask_all_text: false,
    mask_personal_data_properties: true,
    persistence: "localStorage",
    person_profiles: "identified_only",
    sanitize_properties: (properties) => sanitizeAnalyticsProperties(properties),
    before_send: (event) => {
      if (!mayCollect()) return null;
      event.properties = sanitizeAnalyticsProperties(event.properties);
      return event;
    },
    session_recording: {
      blockClass: "ph-no-capture",
      blockSelector: ".ph-no-capture, [data-ph-no-capture]",
      captureCanvas: { recordCanvas: false },
      collectFonts: false,
      maskAllInputs: true,
      maskTextSelector: ".ph-mask",
      recordBody: false,
      recordCrossOriginIframes: false,
      recordHeaders: false,
      maskCapturedNetworkRequestFn: (request) => ({ ...request, name: cleanAnalyticsUrl(request.name) }),
    },
  });

  initialized = true;
  posthog.opt_in_capturing({ captureEventName: false });
  posthog.startSessionRecording();
  return posthog;
}

export function grantAnalyticsConsent() {
  if (typeof window === "undefined") return null;

  saveAnalyticsConsent("granted");
  const analytics = initializeAnalytics();
  analytics?.opt_in_capturing({ captureEventName: false });
  analytics?.startSessionRecording();
  captureAnalyticsPageview(window.location.pathname);
  return analytics;
}

export function denyAnalyticsConsent() {
  if (typeof window === "undefined") return;

  saveAnalyticsConsent("denied");
  lastPage = "";
  reportedErrors.clear();
  stopGoogleAnalytics();
  if (!initialized) return;

  posthog.stopSessionRecording();
  posthog.opt_out_capturing();
}

export function openAnalyticsPreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(analyticsPreferencesEvent));
}

export function captureAnalyticsPageview(pathname: string) {
  try {
    const analytics = initializeAnalytics();
    if (analytics && pathname === window.location.pathname && lastPage !== pathname) {
      analytics.capture("$pageview", { $current_url: cleanAnalyticsUrl(window.location.href), ...safeCampaignProperties(window.location.search) });
      lastPage = pathname;
    }
  } catch { /* Measurement must not break navigation. */ }
  try { captureGooglePageview(pathname); } catch { /* Providers remain independent. */ }
}

export function captureAnalyticsEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>,
) {
  const safeProperties = safeActivityProperties(eventName, properties);
  if (!safeProperties || typeof window === "undefined" || getAnalyticsConsentStatus() !== "granted" || !isAnalyticsRuntimeAllowed()) return false;
  try {
    initializeAnalytics()?.capture(eventName, safeProperties);
  } catch {
    // Optional analytics must never interrupt an estimate request or its confirmation.
  }
  try { captureGoogleEvent(eventName, safeProperties); } catch { /* Never interrupt a consultation. */ }
  return true;
}

export function captureAnalyticsException(error: unknown) {
  try {
    const analytics = initializeAnalytics();
    if (!analytics) return;
    const safe = sanitizedBrowserError(error);
    const signature = safe.stack ?? safe.name;
    if (reportedErrors.has(signature) || reportedErrors.size >= 10) return;
    analytics.captureException(safe);
    reportedErrors.add(signature);
  } catch { /* Never recursively report a measurement failure. */ }
}
