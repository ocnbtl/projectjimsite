import type { PostHog } from "posthog-js";
import { cleanAnalyticsUrl, safeActivityProperties, safeCampaignProperties, sanitizeAnalyticsProperties } from "./analytics-privacy";
import { getPrivacyPreferences, setPrivacyPreference } from "./analytics-preferences";
import { maskReplayText, maskReplayAttribute } from "./replay-privacy";
import { installAnalyticsTransportGuard } from "./analytics-transport";
import { installAnalyticsNavigationGuard } from "./analytics-navigation";
import { hasBrowserPrivacySignal, isAnalyticsRuntimeAllowed } from "./analytics-runtime";
import { captureGoogleEvent, captureGooglePageview, initializeGoogleAnalytics, stopGoogleAnalytics } from "./google-analytics";

let initialized = false;
let posthog: PostHog | null = null;
let sdkLoading: Promise<void> | undefined;
let lastPage = "";

export type AnalyticsConsentStatus = "granted" | "denied" | "pending";

export const analyticsPreferencesEvent = "mcc:open-analytics-preferences";

export function getAnalyticsConsentStatus(): AnalyticsConsentStatus {
  return getPrivacyPreferences().analytics ? "granted" : "denied";
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
  const choices = getPrivacyPreferences();
  if (!Object.values(choices).some(Boolean)) return null;
  installAnalyticsTransportGuard();
  installAnalyticsNavigationGuard(() => {
    if (!initialized || !posthog) return;
    posthog.stopSessionRecording();
    posthog.set_config({ capture_heatmaps: false, disable_session_recording: true });
  });
  const mayCollect = () => getPrivacyPreferences().analytics && isAnalyticsRuntimeAllowed();
  if (choices.analytics) {
    try { initializeGoogleAnalytics(mayCollect); } catch { /* Optional measurement must not break the website. */ }
  }
  // The SDK caches transport references at import time. Install the live
  // permission guards first so delayed requests/retries cannot retain an
  // unguarded fetch or beacon reference.
  if (!posthog) {
    sdkLoading ??= import("posthog-js").then(module => {
      posthog = module.default;
      syncAnalyticsPreferences();
      captureAnalyticsPageview(window.location.pathname);
    }).catch(() => { sdkLoading = undefined; });
    return null;
  }
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
    advanced_disable_feature_flags_on_first_load: true,
    request_batching: false,
    disable_compression: true,
    disable_beacon: true,
    logs: { captureConsoleLogs: false },
    capture_pageview: false,
    disable_capture_url_hashes: true,
    save_campaign_params: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: choices.heatmaps,
    capture_performance: false,
    disable_persistence: false,
    disable_session_recording: !choices.replay,
    disable_surveys: true,
    disable_surveys_automatic_display: true,
    enable_recording_console_log: false,
    ip: false,
    mask_all_element_attributes: false,
    mask_all_text: false,
    mask_personal_data_properties: true,
    persistence: "localStorage",
    person_profiles: "identified_only",
    sanitize_properties: (properties) => sanitizeAnalyticsProperties(properties),
    before_send: (event) => {
      if (!isAnalyticsRuntimeAllowed()) return null;
      const permission = getPrivacyPreferences();
      if (event.event === "$snapshot" ? !permission.replay
        : ["$heatmaps", "$$heatmap"].includes(event.event) ? !permission.heatmaps : !permission.analytics) return null;
      event.properties = sanitizeAnalyticsProperties(event.properties);
      return event;
    },
    session_recording: {
      blockClass: "ph-no-capture",
      blockSelector: ".ph-no-capture, [data-ph-no-capture], form, input, textarea, select, [contenteditable], iframe, video, audio, canvas",
      captureCanvas: { recordCanvas: false },
      collectFonts: false,
      inlineStylesheet: false,
      maskAllInputs: true,
      maskTextSelector: "*",
      maskTextFn: maskReplayText,
      maskAllElementAttributes: false,
      maskAttributeFn: maskReplayAttribute,
      captureJsonLd: false,
      recordBody: false,
      recordCrossOriginIframes: false,
      recordHeaders: false,
      maskCapturedNetworkRequestFn: () => null,
      maskNetworkRequestFn: () => null,
    },
  });

  initialized = true;
  posthog.opt_in_capturing({ captureEventName: false });
  if (choices.replay) posthog.startSessionRecording();
  return posthog;
}

export function syncAnalyticsPreferences() {
  const choices = getPrivacyPreferences();
  const allowed = isAnalyticsRuntimeAllowed();
  if (!choices.analytics || !allowed) { stopGoogleAnalytics(); lastPage = ""; }
  if (initialized && posthog) {
    if (!choices.replay || !allowed) posthog.stopSessionRecording();
    posthog.set_config({ capture_heatmaps: allowed && choices.heatmaps, disable_session_recording: !allowed || !choices.replay });
    if (!allowed || !Object.values(choices).some(Boolean)) {
      posthog.opt_out_capturing();
      return;
    }
    posthog.opt_in_capturing({ captureEventName: false });
  }
  const instance = initializeAnalytics();
  if (allowed && choices.replay) instance?.startSessionRecording();
}

export function grantAnalyticsConsent() {
  if (typeof window === "undefined") return null;
  if (hasBrowserPrivacySignal()) return null;

  for (const category of ["analytics", "heatmaps", "replay"] as const) setPrivacyPreference(category, true);
  syncAnalyticsPreferences();
  const analytics = initializeAnalytics();
  captureAnalyticsPageview(window.location.pathname);
  return analytics;
}

export function denyAnalyticsConsent() {
  if (typeof window === "undefined") return;

  for (const category of ["analytics", "heatmaps", "replay"] as const) setPrivacyPreference(category, false);
  syncAnalyticsPreferences();
}

export function openAnalyticsPreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(analyticsPreferencesEvent));
}

export function captureAnalyticsPageview(pathname: string) {
  syncAnalyticsPreferences();
  if (!getPrivacyPreferences().analytics || !isAnalyticsRuntimeAllowed()) return;
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

// Console and exception payloads are excluded from this public-site rollout.
export function captureAnalyticsException(error: unknown) { void error; /* Intentionally not transmitted. */ }
