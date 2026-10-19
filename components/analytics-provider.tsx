"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAnalyticsEvent, captureAnalyticsPageview, getAnalyticsConsentStatus } from "@/lib/analytics";
import { isAnalyticsRuntimeAllowed } from "@/lib/analytics-runtime";

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    captureAnalyticsPageview(pathname);
  }, [pathname]);

  useEffect(() => {
    function trackContactClick(event: MouseEvent) {
      const element = event.target instanceof Element ? event.target.closest("a[href]") : null;
      const href = element?.getAttribute("href") ?? "";
      const source_section = element?.closest("header") ? "header" : element?.closest("footer") ? "footer" : "content";
      if (/^tel:/i.test(href)) captureAnalyticsEvent("phone_link_clicked", { source_section });
      else if (/^mailto:/i.test(href)) captureAnalyticsEvent("email_link_clicked", { source_section });
    }
    document.addEventListener("click", trackContactClick, { capture: true });
    return () => document.removeEventListener("click", trackContactClick, { capture: true });
  }, []);

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
