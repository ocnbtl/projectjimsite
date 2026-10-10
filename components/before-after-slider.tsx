"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Project } from "@/content/projects";
import { captureAnalyticsEvent } from "@/lib/analytics";
import styles from "./before-after-slider.module.css";

type BeforeAfterSliderProps = Pick<
  Project,
  "title" | "before" | "after" | "beforeAlt" | "afterAlt"
> & {
  priority?: boolean;
};

export function BeforeAfterSlider({
  title,
  before,
  after,
  beforeAlt,
  afterAlt,
  priority = false,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const positionRef = useRef(50);
  const activePointerId = useRef<number | null>(null);

  function handleComparisonChange(nextPosition: number) {
    const boundedPosition = Math.min(100, Math.max(0, Math.round(nextPosition * 100) / 100));
    positionRef.current = boundedPosition;
    setPosition(boundedPosition);
  }

  function captureComparisonAdjustment() {
    captureAnalyticsEvent("project_comparison_adjusted", {
      project_title: title,
      before_visibility_percent: positionRef.current,
    });
  }

  function updateFromPointer(event: ReactPointerEvent<HTMLInputElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextPosition = ((event.clientX - bounds.left) / bounds.width) * 100;
    handleComparisonChange(nextPosition);
  }

  function beginPointerDrag(event: ReactPointerEvent<HTMLInputElement>) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    // Native thumb-inset coordinates conflict with our full-image drag coordinates.
    // Suppress native dragging so only this pointer handler controls the position.
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });

    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  }

  function continuePointerDrag(event: ReactPointerEvent<HTMLInputElement>) {
    if (activePointerId.current !== event.pointerId) return;
    event.preventDefault();
    updateFromPointer(event);
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLInputElement>) {
    if (activePointerId.current !== event.pointerId) return;

    if (event.type === "pointerup") updateFromPointer(event);
    activePointerId.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    captureComparisonAdjustment();
  }

  return (
    <figure className={styles.comparison}>
      <div className={styles.viewport}>
        <Image
          className={styles.image}
          src={after}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 900px) 100vw, 58vw"
        />
        <div
          className={styles.beforeLayer}
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          aria-hidden="true"
        >
          <Image
            className={styles.image}
            src={before}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 900px) 100vw, 58vw"
          />
        </div>

        <span className={`${styles.badge} ${styles.beforeBadge}`}>Before</span>
        <span className={`${styles.badge} ${styles.afterBadge}`}>After</span>

        <input
          className={styles.range}
          type="range"
          min="0"
          max="100"
          step="0.01"
          value={position}
          aria-label={`Compare before and after: ${title}`}
          aria-valuetext={`${Math.round(position)}% before visible, ${100 - Math.round(position)}% after visible`}
          onChange={(event) => {
            if (activePointerId.current === null) {
              handleComparisonChange(Number(event.currentTarget.value));
            }
          }}
          onPointerDown={beginPointerDrag}
          onPointerMove={continuePointerDrag}
          onPointerUp={finishPointerDrag}
          onPointerCancel={finishPointerDrag}
          onLostPointerCapture={() => { activePointerId.current = null; }}
          onKeyDown={(event) => {
            const increments: Record<string, number> = {
              ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1,
              PageDown: -10, PageUp: 10,
            };
            if (event.key === "Home" || event.key === "End" || event.key in increments) {
              event.preventDefault();
              handleComparisonChange(event.key === "Home" ? 0 : event.key === "End" ? 100 : positionRef.current + increments[event.key]);
            }
          }}
          onKeyUp={(event) => {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) captureComparisonAdjustment();
          }}
        />

        <span className={styles.divider} style={{ left: `${position}%` }} aria-hidden="true">
          <span className={styles.handle}>
            <svg viewBox="0 0 24 24" role="presentation">
              <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
            </svg>
          </span>
        </span>
      </div>

      <figcaption className="sr-only">
        Interactive before-and-after comparison for {title}. {beforeAlt} {afterAlt}
      </figcaption>
      <p className={styles.instruction}>Drag to compare before and after</p>
    </figure>
  );
}
