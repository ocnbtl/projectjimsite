"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { business } from "@/content/site";
import { captureAnalyticsEvent } from "@/lib/analytics";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { PropertyTypeSelect } from "@/components/property-type-select";
import styles from "./estimate-form.module.css";

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotoCount = 5;
const maxUploadBytes = 3_600_000;
const maxPhotoDimension = 1800;
const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

type FormStatus = {
  kind: "idle" | "sending" | "success" | "error";
  message: string;
};

async function preparePhoto(file: File) {
  if (file.size <= 700_000) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxPhotoDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");

    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

export function EstimateForm() {
  const [status, setStatus] = useState<FormStatus>({ kind: "idle", message: "" });
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const formStarted = useRef(false);
  const submitting = useRef(false);
  const submissionId = useRef<string | null>(null);
  const validationReported = useRef(false);
  const confirmationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (status.kind === "success") confirmationRef.current?.focus();
  }, [status.kind]);

  function reportFailure(reason: string, message?: string) {
    if (message) setStatus({ kind: "error", message });
    captureAnalyticsEvent("consultation_request_failed", { failure_reason: reason });
  }

  function handleFormStart() {
    if (formStarted.current) return;
    formStarted.current = true;
    captureAnalyticsEvent("consultation_form_started");
  }

  function handleFormChange() {
    submissionId.current = null;
    validationReported.current = false;
    handleFormStart();
  }

  function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    const invalid = files.find((file) => !allowedPhotoTypes.has(file.type));

    if (invalid) {
      event.currentTarget.value = "";
      setSelectedPhotos([]);
      reportFailure("invalid_photo_type", "Please choose JPG, PNG, or WebP project photos.");
      return;
    }

    if (files.length > maxPhotoCount) {
      event.currentTarget.value = "";
      setSelectedPhotos([]);
      reportFailure("too_many_photos", "Please choose no more than five photos.");
      return;
    }

    setSelectedPhotos(files.map((file) => file.name));
    setStatus({ kind: "idle", message: "" });
    captureAnalyticsEvent("consultation_photos_selected", { photo_count: files.length });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    handleFormStart();
    const formElement = event.currentTarget;
    const source = new FormData(formElement);
    const photos = source
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (turnstileEnabled && !source.get("cf-turnstile-response")) {
      reportFailure("security_check_missing", "Please complete the security check before sending your request.");
      return;
    }

    submitting.current = true;
    let requestAttempted = false;
    setStatus({ kind: "sending", message: "Preparing your project details and photos…" });

    try {
      const preparedPhotos = await Promise.all(photos.map(preparePhoto));
      const totalBytes = preparedPhotos.reduce((sum, file) => sum + file.size, 0);

      if (totalBytes > maxUploadBytes) {
        setStatus({
          kind: "error",
          message: "Those photos are still too large to send together. Please choose fewer images.",
        });
        captureAnalyticsEvent("consultation_request_failed", {
          failure_reason: "photos_too_large",
        });
        return;
      }

      const payload = new FormData();
      for (const [key, value] of source.entries()) {
        if (key !== "photos") payload.append(key, value);
      }
      for (const photo of preparedPhotos) payload.append("photos", photo, photo.name);
      submissionId.current ??= crypto.randomUUID();
      payload.set("submissionId", submissionId.current);

      requestAttempted = true;
      const response = await fetch("/api/consultation", { method: "POST", body: payload });
      const result = (await response.json().catch(() => null)) as {
        accepted?: boolean;
        code?: string;
        message?: string;
      } | null;

      if (!response.ok || result?.accepted !== true) {
        const reason = result?.code === "turnstile_verification_failed"
          ? "security_check_failed"
          : response.status === 400 ? "validation_error"
          : response.status === 413 ? "photos_too_large"
          : response.status === 415 ? "invalid_photo_type"
          : response.status === 503 ? "delivery_unavailable"
          : response.ok ? "invalid_response" : "delivery_error";
        reportFailure(reason, response.ok
          ? "We could not confirm your request. Please call us before trying again."
          : result?.message || "We could not send the request. Please call us instead.");
        return;
      }

      formElement.reset();
      setSelectedPhotos([]);
      setStatus({
        kind: "success",
        message: result?.message || "Your project request has been sent. We’ll be in touch.",
      });
      captureAnalyticsEvent("consultation_request_submitted", {
        photo_count: preparedPhotos.length,
        property_type: String(source.get("propertyType") ?? ""),
        confirmation: "email_provider_accepted",
      });
    } catch {
      setStatus({
        kind: "error",
        message:
          "We could not confirm whether your request was sent. Please call (513) 612-8421 before trying again.",
      });
      captureAnalyticsEvent("consultation_request_failed", {
        failure_reason: "network_or_preparation_error",
      });
    } finally {
      // Verification tokens are single-use, including when email delivery later fails.
      if (requestAttempted) setTurnstileResetKey((current) => current + 1);
      submitting.current = false;
    }
  }

  if (status.kind === "success") {
    return (
      <section
        ref={confirmationRef}
        className={styles.confirmation}
        tabIndex={-1}
        aria-labelledby="estimate-confirmation-title"
      >
        <span className={styles.confirmationMark} aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" focusable="false">
            <path d="M8 16L14 22L24 10" pathLength="1" />
          </svg>
        </span>
        <span className="sr-only">Request sent.</span>
        <h3 id="estimate-confirmation-title">Thanks for telling us about your project.</h3>
        <div className={styles.nextSteps}>
          <h4>What happens next?</h4>
          <p>We’ll review your details and get in touch by phone or email, usually <strong>within two business days.</strong></p>
        </div>
        <p className={styles.confirmationHelp}>Haven’t heard from us by then?<br />Call <a href={business.phoneHref}>{business.phoneDisplay}</a>.</p>
        <div className={styles.confirmationActions}>
          <Link className="button" href="/gallery">See completed projects <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    );
  }

  return (
    <form
      className="estimate-form"
      aria-label="Estimate request"
      aria-busy={status.kind === "sending"}
      onChangeCapture={handleFormChange}
      onInvalidCapture={() => {
        if (validationReported.current) return;
        validationReported.current = true;
        reportFailure("validation_error", "Please check the required fields and enter a valid email address.");
      }}
      onSubmit={handleSubmit}
      encType="multipart/form-data"
    >
      <fieldset className={styles.fields} disabled={status.kind === "sending"}>
        <legend className="sr-only">Your project details</legend>
      <label className={styles.honeypot} aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="field-grid">
        <label>
          Full name
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" autoComplete="tel" required />
        </label>
      </div>
      <div className="field-grid">
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          City or ZIP
          <input name="location" autoComplete="postal-code" required />
        </label>
      </div>
      <PropertyTypeSelect disabled={status.kind === "sending"} onValueChange={handleFormChange} />
      <label>
        Description
        <textarea
          name="description"
          rows={5}
          placeholder="Tell us what was repaired, added, replaced, or needs a closer color match."
          required
        />
      </label>
      <label className={styles.photoField}>
        Project photos
        <input
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotos}
        />
        <span className={styles.photoHint}>
          Add up to five JPG, PNG, or WebP images.
        </span>
      </label>
      {selectedPhotos.length > 0 ? (
        <p className={styles.selectedFiles} aria-live="polite">
          {selectedPhotos.length} {selectedPhotos.length === 1 ? "photo" : "photos"} ready
        </p>
      ) : null}
      <TurnstileWidget className={styles.turnstile} key={turnstileResetKey} />
      <button className="button" type="submit" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending request…" : "Request Your Estimate"}
        <span aria-hidden="true">→</span>
      </button>
      </fieldset>
      <p
        className={`${styles.status} ${styles[status.kind]}`}
        role="status"
        aria-live="polite"
      >
        {status.message}
      </p>
      {status.kind === "error" ? (
        <p className={styles.help}>Need a hand? Call <a href={business.phoneHref}>{business.phoneDisplay}</a>. Your details are still here if you want to try again.</p>
      ) : null}
    </form>
  );
}
