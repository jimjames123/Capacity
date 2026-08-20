import type { ReactNode } from "react";
import { STATUS_META } from "../lib/format";
import type { EntryStatus } from "../lib/types";

/** The CapacitySpot wordmark / logo lockup. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-[9px] bg-ink font-serif text-[15px] font-bold text-white">
        CS
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-serif text-[17px] font-semibold text-ink">
            CAPACITYSPOT
          </div>
          <div className="text-[10.5px] tracking-[0.4px] text-muted">
            CPD RAIL
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusPill({ status }: { status: EntryStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "teal" | "green";
}) {
  const tones = {
    neutral: "bg-[#EEF2F2] text-muted border-line",
    teal: "bg-white text-ink border-teal-soft",
    green: "bg-green-soft text-green border-green-line",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Circular progress ring used for the CPD cycle. */
export function ProgressRing({
  percent,
  size = 108,
  stroke = 12,
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#D6E4E3"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#00897B"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="text-amber-strong" aria-label={`${value} out of 5`}>
      {"★".repeat(full)}
      <span className="text-line-strong">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-panel px-6 py-12 text-center">
      <div className="font-serif text-lg font-semibold text-ink">{title}</div>
      {hint && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{hint}</p>}
    </div>
  );
}
