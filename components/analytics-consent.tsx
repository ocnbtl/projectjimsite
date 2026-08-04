"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  analyticsPreferencesEvent,
  denyAnalyticsConsent,
  getAnalyticsConsentStatus,
  grantAnalyticsConsent,
  openAnalyticsPreferences,
  type AnalyticsConsentStatus,
} from "@/lib/analytics";
import styles from "./analytics-consent.module.css";

type AnalyticsPreferencesButtonProps = {
  className?: string;
};

export function AnalyticsPreferencesButton({ className }: AnalyticsPreferencesButtonProps) {
  return (
    <button className={className} type="button" onClick={openAnalyticsPreferences}>
      Privacy choices
    </button>
  );
}

export function AnalyticsConsent() {
  const [status, setStatus] = useState<AnalyticsConsentStatus>("pending");
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const initialSync = window.setTimeout(() => {
      const currentStatus = getAnalyticsConsentStatus();
      setStatus(currentStatus);
      setIsOpen(currentStatus === "pending");
    }, 0);

    function showPreferences() {
      setStatus(getAnalyticsConsentStatus());
      setIsOpen(true);
    }

    window.addEventListener(analyticsPreferencesEvent, showPreferences);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener(analyticsPreferencesEvent, showPreferences);
    };
  }, []);

  function acceptAnalytics() {
    grantAnalyticsConsent();
    setStatus("granted");
    setAnnouncement("Optional analytics are now on. You can change this in Privacy choices.");
    setIsOpen(false);
  }

  function declineAnalytics() {
    denyAnalyticsConsent();
    setStatus("denied");
    setAnnouncement("Optional analytics are now off. You can change this in Privacy choices.");
    setIsOpen(false);
  }

  const statusMessage =
    status === "granted"
      ? "Optional analytics are currently on."
      : status === "denied"
        ? "Optional analytics are currently off."
        : "Analytics are off until you choose.";

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {isOpen ? (
        <section
          className={`${styles.panel} ph-no-capture`}
          data-ph-no-capture="true"
          aria-labelledby="analytics-consent-title"
          aria-describedby="analytics-consent-description"
        >
          <div className={styles.brandColumn}>
            <Image
              className={styles.logo}
              src="/images/brand/mcc-logo-transparent.png"
              alt="MCC Masonry Color Corrections"
              width={1609}
              height={737}
              sizes="148px"
            />
            <span>(513) 612-8421</span>
          </div>
          <div className={styles.copy}>
            <h2 id="analytics-consent-title">Help MCC improve this website</h2>
            <p id="analytics-consent-description">
              Optional anonymous analytics help us improve the site.
            </p>
            <p className={styles.status}>{statusMessage}</p>
            <Link href="/privacy">Privacy details</Link>
          </div>
          <div className={styles.actions}>
            <button className={styles.decline} type="button" onClick={declineAnalytics}>
              Decline
            </button>
            <button className={styles.accept} type="button" onClick={acceptAnalytics}>
              Accept analytics
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
