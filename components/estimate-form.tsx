"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { business } from "@/content/site";
import styles from "./estimate-form.module.css";

export function EstimateForm() {
  const [status, setStatus] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    setSelectedPhotos(files.map((file) => file.name));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = `Estimate request from ${form.get("name") || "website visitor"}`;
    const body = [
      `Name: ${form.get("name") || ""}`,
      `Phone: ${form.get("phone") || ""}`,
      `Email: ${form.get("email") || ""}`,
      `City or ZIP: ${form.get("location") || ""}`,
      `Property type: ${form.get("propertyType") || ""}`,
      "",
      "Project description:",
      String(form.get("description") || ""),
      "",
      selectedPhotos.length
        ? `Selected photo files to attach: ${selectedPhotos.join(", ")}`
        : "No photo files selected on the website.",
      "Please attach the project photos before sending this email.",
    ].join("\n");
    setStatus(
      "Opening your email application. Until the business inbox is connected, add the selected photos before sending.",
    );
    window.location.href = `${business.emailHref}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form className="estimate-form" onSubmit={handleSubmit}>
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
        What does not match?
        <textarea name="description" rows={5} required />
      </label>
      <label className={styles.photoField}>
        Project photos
        <input name="photos" type="file" accept="image/*" multiple onChange={handlePhotos} />
        <span className={styles.photoHint}>
          Choose wide views and close-ups of the mismatched area.
        </span>
      </label>
      {selectedPhotos.length > 0 ? (
        <p className={styles.selectedFiles} aria-live="polite">
          {selectedPhotos.length} {selectedPhotos.length === 1 ? "photo" : "photos"} selected
        </p>
      ) : null}
      <p className="form-help">
        Preview behavior: your email app opens with the project details. Direct photo delivery will
        activate when the MCC Google Workspace inbox and secure form endpoint are connected.
      </p>
      <button className="button" type="submit">
        Request a project consultation
        <span aria-hidden="true">→</span>
      </button>
      <p className="form-status" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
