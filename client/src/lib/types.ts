export type Role = "MEMBER" | "ADMIN" | "PROVIDER" | "ORG";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  profession: string | null;
  membershipNo: string | null;
  professionalBody: string | null;
  jobTitle: string | null;
  organisation: string | null;
  onboarded: boolean;
  createdAt: string;
}

export type EntryStatus = "VERIFIED" | "PENDING" | "NEEDS_PROOF" | "REJECTED";

export type EntryType =
  | "COURSE"
  | "WORKSHOP"
  | "CONFERENCE"
  | "SELF_STUDY"
  | "MENTORING"
  | "WEBINAR"
  | "OTHER";

export interface CpdEntry {
  id: string;
  title: string;
  type: EntryType;
  activityDate: string;
  pointsClaimed: number;
  status: EntryStatus;
  proofFileName: string | null;
  note: string | null;
  createdAt: string;
}

export interface Cycle {
  id: string;
  userId: string;
  label: string;
  startDate: string;
  endDate: string;
  requiredPoints: number;
  isCurrent: boolean;
  certRef: string | null;
  registrarName: string | null;
  issuedAt: string | null;
}

export interface CycleSummary {
  cycleId: string;
  label: string;
  startDate: string;
  endDate: string;
  requiredPoints: number;
  earnedPoints: number;
  remainingPoints: number;
  percentComplete: number;
  daysRemaining: number;
  isCurrent: boolean;
  counts: Record<EntryStatus, number>;
  onTrack: boolean;
}

export interface CycleGroup extends CycleSummary {
  entries: CpdEntry[];
}

export interface Provider {
  id: string;
  name: string;
  initials: string;
  type: string;
  verified: boolean;
  rating: number;
  meta: string | null;
  bio: string | null;
}

export type CourseFormat = "IN_PERSON" | "ONLINE" | "HYBRID";

export interface Review {
  id: string;
  name: string;
  stars: number;
  text: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  profession: string;
  format: CourseFormat;
  points: number;
  rating: number;
  reviewsCount: number;
  schedule: string;
  fee: string;
  seats: number;
  verified: boolean;
  provider: Provider;
  reviews?: Review[];
}

export interface Enrollment {
  id: string;
  status: string;
  createdAt: string;
  course: Course;
}

export interface AdminStats {
  members: number;
  providers: number;
  courses: number;
  certificatesIssued: number;
  awaitingReview: number;
  needsProof: number;
  verified: number;
  rejected: number;
}

export interface AdminMemberRow {
  id: string;
  name: string;
  email: string;
  profession: string | null;
  membershipNo: string | null;
  professionalBody: string | null;
  cycleLabel: string | null;
  earnedPoints: number;
  requiredPoints: number;
  percentComplete: number;
  pendingCount: number;
}

export interface AdminCycle extends CycleSummary {
  certRef: string | null;
  registrarName: string | null;
  issuedAt: string | null;
  entries: CpdEntry[];
}

export interface AdminMemberDetail {
  member: {
    id: string;
    name: string;
    email: string;
    profession: string | null;
    membershipNo: string | null;
    professionalBody: string | null;
    jobTitle: string | null;
    organisation: string | null;
  };
  cycles: AdminCycle[];
}

export interface QueueItem {
  id: string;
  title: string;
  type: EntryType;
  activityDate: string;
  pointsClaimed: number;
  status: EntryStatus;
  proofFileName: string | null;
  note: string | null;
  member: { id: string; name: string; membershipNo: string | null };
}

export interface ComplianceRecord {
  cycleId: string;
  label: string;
  startDate: string;
  endDate: string;
  requiredPoints: number;
  earnedPoints: number;
  activitiesVerified: number;
  compliancePct: number;
  complete: boolean;
  certRef: string | null;
  registrarName: string | null;
  issuedAt: string | null;
}
