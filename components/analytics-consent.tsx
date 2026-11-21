"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPrivacyPreferences, setPrivacyPreference, resolvePrivacyEligibility, privacyChangedEvent, hasEffectivePrivacySignal, isPrivacyEligibilityReady, canSavePrivacyChoices, type PrivacyPreferences } from "@/lib/analytics-preferences";
import styles from "./analytics-consent.module.css";
import { isAnalyticsBrowserExcluded } from "@/lib/analytics-runtime";

export function AnalyticsPreferencesLink({ className }: { className?: string }) {
  return (
    <Link className={className} href="/privacy#privacy-choices">
      <Image src="/california-privacy-choices.svg" alt="" aria-hidden="true" width={30} height={14} />
      <span>Your Privacy Choices</span>
    </Link>
  );
}

export function AnalyticsTestingStatus() {
  const [excluded, setExcluded] = useState<boolean | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setExcluded(isAnalyticsBrowserExcluded()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <p role="status">{excluded === null ? "Checking this browser's testing preference."
    : excluded ? "This browser is excluded from optional analytics, even if analytics consent is on."
    : "This browser is not excluded from analytics. Your consent choice still applies."}</p>;
}

export function AnalyticsConsentSettings() {
  const [choices, setChoices] = useState<PrivacyPreferences | null>(null);
  const [signal, setSignal] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    const sync = () => { setChoices(getPrivacyPreferences()); setSignal(hasEffectivePrivacySignal()); setReady(isPrivacyEligibilityReady()); setStorageReady(canSavePrivacyChoices()); };
    const timer = window.setTimeout(sync, 0);
    void resolvePrivacyEligibility();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener(privacyChangedEvent, sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener(privacyChangedEvent, sync);
    };
  }, []);
  return <section id="privacy-choices" tabIndex={-1} data-nosnippet className={styles.panel + " ph-no-capture"} data-ph-no-capture="true" aria-labelledby="privacy-choices-title">
    <h2 id="privacy-choices-title">Your Privacy Choices</h2>
    <p>Choose how we measure use of our public pages. Changes apply immediately to this browser and its other open tabs.</p>
    {signal && <p role="status">Your browser’s GPC or Do Not Track signal keeps optional collection off.</p>}
    {([ ["analytics", "Website analytics", "Page visits and selected public-page interactions."], ["heatmaps", "Heatmaps", "Where visitors click and scroll on public pages."], ["replay", "Masked page recordings", "A replay of public-page browsing with private content masked."] ] as const).map(([category, label, description]) => <div className={styles.preference} key={category}>
      <div><h3>{label}</h3><p>{description}</p></div>
      <button type="button" role="switch" aria-checked={choices?.[category] ?? false} aria-label={label} disabled={!ready || !storageReady || signal} onClick={() => setPrivacyPreference(category, !choices?.[category])}>{choices?.[category] ? "On" : "Off"}</button>
    </div>)}
    <p className={styles.status} aria-live="polite">{signal ? "Your browser’s privacy signal is being honored." : ready && !storageReady ? "Your browser cannot save these choices, so optional collection stays off. Allow site storage to use these controls." : ready ? "Your current choices are shown above." : "Optional collection is off while we check availability. If these controls remain unavailable, please reload this page."}</p>
  </section>;
}
