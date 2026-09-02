import type { CourseThumb, LearnProgress } from "../lib/types";

/** A generated course "thumbnail": a brand-toned gradient with the initials. */
export function Thumb({ thumb, title, className = "h-24" }: { thumb: CourseThumb; title: string; className?: string }) {
  const initials = title.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      className={`relative grid w-full place-items-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${thumb.from}, ${thumb.to})` }}
    >
      <span className="font-serif text-2xl font-bold text-white/95">{initials}</span>
      <span className="pointer-events-none absolute -right-4 -top-5 h-16 w-16 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-6 -left-3 h-14 w-14 rounded-full bg-white/10" />
    </div>
  );
}

/** A labelled progress bar. */
export function ProgressBar({ progress, tone = "teal" }: { progress: LearnProgress; tone?: "teal" | "green" }) {
  const bar = tone === "green" ? "bg-green" : "bg-teal";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12.5px]">
        <span className="text-muted">{progress.completed} of {progress.total} lessons</span>
        <span className="font-semibold text-ink">{progress.pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EDF1F1]">
        <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${progress.pct}%` }} />
      </div>
    </div>
  );
}
