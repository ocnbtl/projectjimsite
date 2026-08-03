"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAnalyticsPageview } from "@/lib/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    captureAnalyticsPageview(pathname);
  }, [pathname]);

  return null;
}
