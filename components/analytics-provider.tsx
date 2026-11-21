"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAnalyticsEvent, captureAnalyticsPageview, getAnalyticsConsentStatus, syncAnalyticsPreferences } from "@/lib/analytics";
import { privacyChangedEvent, resolvePrivacyEligibility } from "@/lib/analytics-preferences";
import { analyticsNavigationEvent } from "@/lib/analytics-navigation";
import { isAnalyticsRuntimeAllowed } from "@/lib/analytics-runtime";

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    captureAnalyticsPageview(pathname);
  }, [pathname]);

  useEffect(() => {
    const sync = () => { syncAnalyticsPreferences(); captureAnalyticsPageview(window.location.pathname); };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener(privacyChangedEvent, sync);
    window.addEventListener("popstate", sync);
    window.addEventListener(analyticsNavigationEvent, sync);
    void resolvePrivacyEligibility();
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener(privacyChangedEvent, sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener(analyticsNavigationEvent, sync);
    };
  }, []);

  useEffect(() => {
    function trackContactClick(event: MouseEvent) {
      const element = event.target instanceof Element ? event.target.closest("a[href]") : null;
      const href = element?.getAttribute("href") ?? "";
      const source_section = element?.closest("header") ? "header" : element?.closest("footer") ? "footer" : "content";
      if (/^tel:/i.test(href)) captureAnalyticsEvent("phone_link_clicked", { source_section });
      else if (/^mailto:/i.test(href)) captureAnalyticsEvent("email_link_clicked", { source_section });
      else if (element?.getAttribute("data-analytics-cta")) captureAnalyticsEvent("estimate_cta_clicked", {
        source_section, placement: element.getAttribute("data-analytics-cta") ?? "",
        service_id: element.getAttribute("data-analytics-service") ?? "",
      });
      else if (element?.getAttribute("data-analytics-service")) captureAnalyticsEvent("service_link_clicked", {
        source_section, service_id: element.getAttribute("data-analytics-service") ?? "",
      });
    }
    document.addEventListener("click", trackContactClick, { capture: true });
    return () => document.removeEventListener("click", trackContactClick, { capture: true });
  }, []);

  useEffect(() => {
    const opened = new Set<string>();
    function trackQuestion(event: Event) {
      if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
      const id = event.target.getAttribute("data-analytics-question");
      if (!id || opened.has(id)) return;
      if (captureAnalyticsEvent("faq_opened", { question_id: id })) opened.add(id);
    }
    document.addEventListener("toggle", trackQuestion, true);
    return () => document.removeEventListener("toggle", trackQuestion, true);
  }, [pathname]);

  useEffect(() => {
    const reached = new Set<number>();
    let frame = 0;
    function measureScroll() {
      frame = 0;
      if (getAnalyticsConsentStatus() !== "granted" || !isAnalyticsRuntimeAllowed()) return;
      const height = document.documentElement.scrollHeight;
      if (height <= window.innerHeight) return;
      const percent = ((window.scrollY + window.innerHeight) / height) * 100;
      for (const threshold of [25, 50, 75]) {
        if (percent < threshold || reached.has(threshold)) continue;
        reached.add(threshold);
        captureAnalyticsEvent("page_scroll_depth", { percent_scrolled: threshold });
      }
    }
    function onScroll() { if (!frame) frame = window.requestAnimationFrame(measureScroll); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
