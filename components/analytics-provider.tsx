"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initializeAnalytics } from "@/lib/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const analytics = initializeAnalytics();
    if (!analytics) return;

    analytics.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}`,
    });
  }, [pathname]);

  return null;
}
