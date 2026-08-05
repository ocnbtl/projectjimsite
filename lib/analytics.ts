import posthog from "posthog-js";

let initialized = false;

export type AnalyticsConsentStatus = "granted" | "denied" | "pending";

export const analyticsPreferencesEvent = "mcc:open-analytics-preferences";

const analyticsConsentKey = "mcc_analytics_consent";

function stripUrlDetails(value: unknown) {
  if (typeof value !== "string") return value;

  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

function sanitizeAnalyticsProperties(properties: Record<string, unknown>) {
  const sanitized = { ...properties };

  for (const key of ["$current_url", "$referrer"]) {
    if (key in sanitized) sanitized[key] = stripUrlDetails(sanitized[key]);
  }

  return sanitized;
}

export function getAnalyticsConsentStatus(): AnalyticsConsentStatus {
  if (typeof window === "undefined") return "pending";

  try {
    const stored = window.localStorage.getItem(analyticsConsentKey);
    return stored === "granted" || stored === "denied" ? stored : "pending";
  } catch {
    return "pending";
  }
}

function saveAnalyticsConsent(status: Exclude<AnalyticsConsentStatus, "pending">) {
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
  if (getAnalyticsConsentStatus() !== "granted") return null;
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
    sanitize_properties: sanitizeAnalyticsProperties,
    session_recording: {
      blockClass: "ph-no-capture",
      blockSelector: ".ph-no-capture, [data-ph-no-capture]",
      captureCanvas: { recordCanvas: false },
      collectFonts: false,
      maskAllInputs: true,
      recordBody: false,
      recordCrossOriginIframes: false,
      recordHeaders: false,
    },
  });

  initialized = true;
  posthog.opt_in_capturing({ captureEventName: false });
  posthog.startSessionRecording(true);
  return posthog;
}

export function grantAnalyticsConsent() {
  if (typeof window === "undefined") return null;

  saveAnalyticsConsent("granted");
  const analytics = initializeAnalytics();
  if (!analytics) return null;

  analytics.opt_in_capturing({ captureEventName: false });
  analytics.startSessionRecording(true);
  captureAnalyticsPageview(window.location.pathname);
  return analytics;
}

export function denyAnalyticsConsent() {
  if (typeof window === "undefined") return;

  saveAnalyticsConsent("denied");
  if (!initialized) return;

  posthog.stopSessionRecording();
  posthog.opt_out_capturing();
}

export function openAnalyticsPreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(analyticsPreferencesEvent));
}

export function captureAnalyticsPageview(pathname: string) {
  initializeAnalytics()?.capture("$pageview", {
    $current_url: `${window.location.origin}${pathname}`,
  });
}

export function captureAnalyticsEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>,
) {
  initializeAnalytics()?.capture(eventName, properties);
}

export function captureAnalyticsException(error: Error) {
  initializeAnalytics()?.captureException(error);
}
