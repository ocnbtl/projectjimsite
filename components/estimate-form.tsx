"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import styles from "./estimate-form.module.css";

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotoCount = 5;
const maxUploadBytes = 3_600_000;
const maxPhotoDimension = 1800;

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

  function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    const invalid = files.find((file) => !allowedPhotoTypes.has(file.type));

    if (invalid) {
      event.currentTarget.value = "";
      setSelectedPhotos([]);
      setStatus({
        kind: "error",
        message: "Please choose JPG, PNG, or WebP project photos.",
      });
      return;
    }

    if (files.length > maxPhotoCount) {
      event.currentTarget.value = "";
      setSelectedPhotos([]);
      setStatus({ kind: "error", message: "Please choose no more than five photos." });
      return;
    }

    setSelectedPhotos(files.map((file) => file.name));
    setStatus({ kind: "idle", message: "" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const source = new FormData(formElement);
    const photos = source
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    setStatus({ kind: "sending", message: "Preparing your project details and photos…" });

    try {
      const preparedPhotos = await Promise.all(photos.map(preparePhoto));
      const totalBytes = preparedPhotos.reduce((sum, file) => sum + file.size, 0);

      if (totalBytes > maxUploadBytes) {
        setStatus({
          kind: "error",
          message: "Those photos are still too large to send together. Please choose fewer images.",
        });
        return;
      }

      const payload = new FormData();
      for (const [key, value] of source.entries()) {
        if (key !== "photos") payload.append(key, value);
      }
      for (const photo of preparedPhotos) payload.append("photos", photo, photo.name);
      payload.set("submissionId", crypto.randomUUID());

      const response = await fetch("/api/consultation", { method: "POST", body: payload });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "We could not send the request. Please call us instead.");
      }

      formElement.reset();
      setSelectedPhotos([]);
      setStatus({
        kind: "success",
        message: result?.message || "Your project request has been sent. We’ll be in touch.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not send the request. Please call (513) 612-8421 instead.",
      });
    }
  }

  return (
    <form className="estimate-form" onSubmit={handleSubmit} encType="multipart/form-data">
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
      <label>
        Property type
        <select className={styles.select} name="propertyType" defaultValue="" required>
          <option value="" disabled>
            Select residential or commercial
          </option>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
        </select>
      </label>
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
          Add up to five JPG, PNG, or WebP images. Large photos are resized for reliable delivery.
        </span>
      </label>
      {selectedPhotos.length > 0 ? (
        <p className={styles.selectedFiles} aria-live="polite">
          {selectedPhotos.length} {selectedPhotos.length === 1 ? "photo" : "photos"} ready
        </p>
      ) : null}
      <p className="form-help">
        One wider view and a few close-ups help show how the area relates to the surrounding
        masonry.
      </p>
      <button className="button" type="submit" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending request…" : "Request a project consultation"}
        <span aria-hidden="true">→</span>
      </button>
      <p
        className={`${styles.status} ${styles[status.kind]}`}
        role="status"
        aria-live="polite"
      >
        {status.message}
      </p>
    </form>
  );
}
