import posthog from "posthog-js";

let initialized = false;

export function initializeAnalytics() {
  if (typeof window === "undefined") return null;
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
    api_host: host,
    defaults: "2026-01-30",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_persistence: true,
    disable_session_recording: true,
    disable_surveys: true,
    disable_surveys_automatic_display: true,
    mask_all_element_attributes: true,
    mask_all_text: true,
    person_profiles: "identified_only",
  });

  initialized = true;
  return posthog;
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
