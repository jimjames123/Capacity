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
  providerId?: string | null;
  organizationId?: string | null;
  createdAt: string;
}

export type CourseStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface ProviderCourse {
  id: string;
  title: string;
  description: string;
  profession: string;
  format: CourseFormat;
  points: number;
  fee: string;
  schedule: string;
  seats: number;
  status: CourseStatus;
  enrolments: number;
}

export interface ProviderStats {
  courses: number;
  approved: number;
  pending: number;
  enrolments: number;
  openTenders: number;
  bids: number;
  submittedBids: number;
}

export type BidStatus = "DRAFT" | "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";

export interface TenderOrg {
  id: string;
  name: string;
  sector: string | null;
  district: string | null;
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  category: string;
  deliveryMode: string;
  budget: string;
  seats: number;
  deadline: string;
  status: string;
  organization: TenderOrg;
}

export interface TenderBoardItem extends Tender {
  bidCount: number;
  myBidStatus: BidStatus | null;
}

export interface Bid {
  id: string;
  amount: string;
  proposal: string;
  docFileName: string | null;
  status: BidStatus;
  createdAt: string;
  tender: {
    id: string;
    title: string;
    budget: string;
    deadline: string;
    category: string;
    organizationName: string;
  };
}

export interface OrgStats {
  staff: number;
  tenders: number;
  openTenders: number;
  awarded: number;
  receivedBids: number;
}

export interface OrgTenderRow {
  id: string;
  title: string;
  category: string;
  deliveryMode: string;
  budget: string;
  seats: number;
  deadline: string;
  status: string;
  bidCount: number;
}

export interface OrgTenderDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  deliveryMode: string;
  budget: string;
  seats: number;
  deadline: string;
  status: string;
}

export interface ReceivedBid {
  id: string;
  amount: string;
  proposal: string;
  docFileName: string | null;
  status: BidStatus;
  createdAt: string;
  provider: {
    id: string;
    name: string;
    initials: string;
    type: string;
    rating: number;
    verified: boolean;
  };
}

export interface OrgReport {
  staffTotal: number;
  byProfession: Record<string, number>;
  tendersByStatus: { OPEN: number; AWARDED: number; CLOSED: number };
  bidsReceived: number;
}

export interface Booking {
  id: string;
  title: string;
  providerName: string | null;
  category: string | null;
  staffCount: number;
  date: string;
  cost: string;
  paid: boolean;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  attendance: number | null;
  certificateIssued: boolean;
  outcome: string | null;
}

export interface CourseQueueItem {
  id: string;
  title: string;
  description: string;
  profession: string;
  format: CourseFormat;
  points: number;
  fee: string;
  schedule: string;
  seats: number;
  provider: { id: string; name: string; initials: string; verified: boolean };
}

export interface TrainerQueueItem {
  id: string;
  name: string;
  initials: string;
  type: string;
  meta: string | null;
  bio: string | null;
  courseCount: number;
}

export interface ProviderProfile {
  id: string;
  name: string;
  initials: string;
  type: string;
  verified: boolean;
  rating: number;
  meta: string | null;
  bio: string | null;
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

export interface Staff {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
  profession: string | null;
  membershipNo: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  sector: string | null;
  district: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  staffCount?: number;
  staff?: Staff[];
}

export interface ConsultantRow {
  id: string;
  name: string;
  initials: string;
  type: string;
  verified: boolean;
  rating: number;
  meta: string | null;
  bio: string | null;
  courseCount: number;
}

export interface ConsultantCourse {
  id: string;
  title: string;
  profession: string;
  format: CourseFormat;
  points: number;
  rating: number;
  fee: string;
  schedule: string;
  enrollments: number;
}

export interface ConsultantDetail {
  id: string;
  name: string;
  initials: string;
  type: string;
  verified: boolean;
  rating: number;
  meta: string | null;
  bio: string | null;
  courses: ConsultantCourse[];
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
