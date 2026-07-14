import type { CSSProperties } from "react";

const leftTones = ["#725d50", "#80685a", "#66564d", "#8a6e5d", "#5e514b", "#7a6254"];
const rightTones = ["#ad6045", "#b9684a", "#9f523c", "#bd7655", "#a65a41", "#c18462"];

function BrickHalf({ tones }: { tones: string[] }) {
  return (
    <div className="brick-half" aria-hidden="true">
      {Array.from({ length: 7 }, (_, row) => (
        <div className="brick-row" key={row}>
          {Array.from({ length: 4 }, (_, column) => {
            const color = tones[(row * 3 + column) % tones.length];
            return (
              <span
                className="brick"
                key={column}
                style={{ "--brick-tone": color } as CSSProperties}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

type MaterialStudyProps = {
  compact?: boolean;
  labels?: boolean;
  className?: string;
};

export function MaterialStudy({ compact = false, labels = true, className = "" }: MaterialStudyProps) {
  return (
    <div className={`material-study ${compact ? "is-compact" : ""} ${className}`}>
      <BrickHalf tones={leftTones} />
      <BrickHalf tones={rightTones} />
      <span className="correction-seam" aria-hidden="true" />
      {labels ? (
        <div className="study-labels" aria-hidden="true">
          <span>Before</span>
          <span>After</span>
        </div>
      ) : null}
      <span className="sr-only">
        Abstract material study showing a darker mismatched brick field beside a warmer corrected field.
      </span>
    </div>
  );
}
