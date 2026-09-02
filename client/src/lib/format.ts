import type { CourseFormat, EntryStatus, EntryType } from "./types";

export const ENTRY_TYPE_OPTIONS: { value: EntryType; label: string }[] = [
  { value: "COURSE", label: "Course" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "SELF_STUDY", label: "Self-study" },
  { value: "MENTORING", label: "Mentoring" },
  { value: "WEBINAR", label: "Webinar" },
  { value: "OTHER", label: "Other" },
];

export function entryTypeLabel(type: EntryType): string {
  return ENTRY_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export const STATUS_META: Record<
  EntryStatus,
  { label: string; className: string }
> = {
  VERIFIED: {
    label: "Verified",
    className: "bg-green-soft text-green border border-green-line",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-soft text-amber border border-amber-line",
  },
  NEEDS_PROOF: {
    label: "Needs proof",
    className: "bg-rust-soft text-rust border border-rust-line",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rust-soft text-rust border border-rust-line",
  },
};

export const FORMAT_META: Record<CourseFormat, string> = {
  IN_PERSON: "In-person",
  ONLINE: "Online",
  HYBRID: "Hybrid",
};

export const BID_STATUS_META: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-[#EEF2F2] text-muted border border-line" },
  SUBMITTED: { label: "Submitted", className: "bg-amber-soft text-amber border border-amber-line" },
  SHORTLISTED: { label: "Shortlisted", className: "bg-green-soft text-green border border-green-line" },
  ACCEPTED: { label: "Accepted", className: "bg-green-soft text-green border border-green-line" },
  REJECTED: { label: "Rejected", className: "bg-rust-soft text-rust border border-rust-line" },
};

export const COURSE_STATUS_META: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Approved", className: "bg-green-soft text-green border border-green-line" },
  PENDING: { label: "Pending approval", className: "bg-amber-soft text-amber border border-amber-line" },
  REJECTED: { label: "Rejected", className: "bg-rust-soft text-rust border border-rust-line" },
};

export const LEARN_STATUS_META: Record<string, { label: string; className: string }> = {
  NOT_STARTED: { label: "Not started", className: "bg-[#EEF2F2] text-muted border border-line" },
  IN_PROGRESS: { label: "In progress", className: "bg-amber-soft text-amber border border-amber-line" },
  COMPLETED: { label: "Completed", className: "bg-green-soft text-green border border-green-line" },
  PAUSED: { label: "Paused", className: "bg-[#ECE6D8] text-[#8A6D3B] border border-[#DDCEA6]" },
};

export const GOAL_PRIORITY_META: Record<string, { label: string; className: string }> = {
  HIGH: { label: "High", className: "bg-rust-soft text-rust border border-rust-line" },
  MEDIUM: { label: "Medium", className: "bg-amber-soft text-amber border border-amber-line" },
  LOW: { label: "Low", className: "bg-[#EEF2F2] text-muted border border-line" },
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function pointsLabel(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return `${rounded} ${rounded === 1 ? "pt" : "pts"}`;
}
