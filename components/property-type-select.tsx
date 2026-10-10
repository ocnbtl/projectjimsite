"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import styles from "./property-type-select.module.css";

const options = ["Residential", "Commercial"] as const;
type PropertyType = "" | (typeof options)[number];

function PropertyIcon({ commercial = false }: { commercial?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {commercial ? <><path d="M5 21V3h14v18M3 21h18M10 21v-5h4v5" /><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01" /></> : <><path d="m3 10 9-7 9 7M5 9v12h14V9" /><path d="M9 21v-8h6v8" /></>}
    </svg>
  );
}

export function PropertyTypeSelect({ disabled, onValueChange }: { disabled: boolean; onValueChange: () => void }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const nativeSelect = useRef<HTMLSelectElement>(null);
  const [value, setValue] = useState<PropertyType>("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const form = nativeSelect.current?.form;
    function reset() {
      setValue("");
      setOpen(false);
      setActive(0);
      setInvalid(false);
    }
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function choose(index: number) {
    setValue(options[index]);
    setActive(index);
    setInvalid(false);
    setOpen(false);
    onValueChange();
  }

  function selectedIndex() {
    return Math.max(0, options.findIndex((option) => option === value));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(open ? Math.max(0, Math.min(options.length - 1, active + (event.key === "ArrowDown" ? 1 : -1))) : selectedIndex());
      setOpen(true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : options.length - 1);
      setOpen(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(active);
      else { setActive(selectedIndex()); setOpen(true); }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Tab") {
      if (open) choose(active);
    } else if (!event.ctrlKey && !event.metaKey && !event.altKey && /^[rc]$/i.test(event.key)) {
      event.preventDefault();
      setActive(event.key.toLowerCase() === "r" ? 0 : 1);
      setOpen(true);
    }
  }

  return (
    <div className={styles.field} ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <span id={`${id}-label`} className={styles.label}>Property type</span>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-controls={`${id}-options`}
        aria-expanded={open && !disabled}
        aria-haspopup="listbox"
        aria-required="true"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        aria-activedescendant={open && !disabled ? `${id}-option-${active}` : undefined}
        className={styles.trigger}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onClick={() => { setActive(selectedIndex()); setOpen(!open); }}
      >
        {value ? <span className={styles.icon}><PropertyIcon commercial={value === "Commercial"} /></span> : null}
        <span id={`${id}-value`} className={value ? styles.value : styles.placeholder}>{value || "Select residential or commercial"}</span>
        <svg className={styles.chevron} data-open={open && !disabled} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      {/* Keep browser validation and the existing FormData contract without a second tab stop. */}
      <select
        ref={nativeSelect}
        className={styles.nativeSelect}
        name="propertyType"
        value={value}
        required
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => { setValue(event.target.value as PropertyType); setInvalid(false); onValueChange(); }}
        onInvalid={(event) => {
          event.preventDefault();
          setInvalid(true);
          trigger.current?.focus();
        }}
      >
        <option value="" disabled>Select residential or commercial</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {open && !disabled ? (
        <div id={`${id}-options`} role="listbox" aria-labelledby={`${id}-label`} className={styles.menu}>
          {options.map((option, index) => (
            <button
              key={option}
              id={`${id}-option-${index}`}
              type="button"
              role="option"
              aria-selected={value === option}
              tabIndex={-1}
              className={styles.option}
              data-active={active === index}
              onPointerMove={() => setActive(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => { choose(index); trigger.current?.focus(); }}
            >
              <span className={styles.icon}><PropertyIcon commercial={option === "Commercial"} /></span>
              <span>{option}</span>
              {value === option ? <svg className={styles.check} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg> : null}
            </button>
          ))}
        </div>
      ) : null}
      {invalid ? <p id={`${id}-error`} className={styles.error}>Please choose residential or commercial.</p> : null}
    </div>
  );
}
