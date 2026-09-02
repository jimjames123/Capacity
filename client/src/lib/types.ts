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
  city?: string | null;
  country?: string | null;
}

export interface ProviderReport {
  provider: { name: string; type: string };
  generatedAt: string;
  stats: {
    courses: number;
    live: number;
    pending: number;
    totalEnrolments: number;
    cpdPointsDelivered: number;
    bids: number;
    submittedBids: number;
    won: number;
    avgRating: number;
  };
  byStatus: Record<string, number>;
  byProfession: Record<string, number>;
  courses: {
    id: string;
    title: string;
    profession: string;
    format: CourseFormat;
    points: number;
    fee: string;
    status: CourseStatus;
    rating: number;
    city: string | null;
    country: string | null;
    enrolments: number;
  }[];
  enrolments: {
    courseId: string;
    course: string;
    status: CourseStatus;
    learners: { name: string; profession: string | null; membershipNo: string | null; since: string }[];
  }[];
}

export interface MyInquiry {
  id: string;
  message: string;
  waitlist: boolean;
  status: "OPEN" | "ANSWERED";
  response: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface ProviderInquiry {
  id: string;
  courseId: string;
  courseTitle: string;
  fromName: string;
  fromEmail: string | null;
  message: string;
  waitlist: boolean;
  status: "OPEN" | "ANSWERED";
  response: string | null;
  createdAt: string;
  respondedAt: string | null;
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

/** A department with its sectors, used across catalog filters and scheduling. */
export interface OrgDepartment {
  name: string;
  sectors: string[];
}

/** A bookable course in the org catalog (offered by a consultant). */
export interface CatalogSession {
  id: string;
  title: string;
  description: string;
  dept: string;
  sector: string;
  consultant: string;
  date: string;
  location: string;
  format: string;
  points: number;
  fee: string;
  capacity: number;
  booked: number;
}

export type PlannedStatus = "Planned" | "In progress" | "Completed";

/** A planned training session on the annual calendar, with allocated staff. */
export interface PlannedSession {
  id: string;
  course: string;
  description: string;
  dept: string;
  sector: string;
  mode: string;
  venue: string;
  address: string;
  platform: string;
  link: string;
  access: string;
  cost: number;
  costBasis: string;
  provider: string;
  providerType: string;
  date: string;
  month: string;
  time: string;
  capacity: number;
  status: PlannedStatus;
  allocated: { id: string; name: string; dept: string | null }[];
}

/** Rich reporting for the org overview screen. */
export interface OrgOverview {
  totalSessions: number;
  totalAllocated: number;
  completionRate: number;
  totalBudget: string;
  byDepartment: {
    name: string;
    sessions: number;
    staff: number;
    budget: number;
    budgetShort: string;
    share: number;
  }[];
  participation: { label: string; count: number }[];
  audit: { actor: string; action: string; target: string; time: string }[];
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
  qualifications?: string | null;
  website?: string | null;
}

/** The provider's own editable profile. */
export interface ProviderProfileData {
  id: string;
  name: string;
  initials: string;
  type: string;
  verified: boolean;
  rating: number;
  meta: string | null;
  bio: string | null;
  qualifications: string | null;
  website: string | null;
}

/** A tender one consultant recommends to another (e.g. a different sector). */
export interface TenderRecommendation {
  id: string;
  note: string;
  createdAt: string;
  fromName: string;
  tender: {
    id: string;
    title: string;
    category: string;
    budget: string;
    deadline: string;
    organizationName: string;
  };
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
  city?: string | null;
  country?: string | null;
  provider: Provider;
  reviews?: Review[];
}

export interface Enrollment {
  id: string;
  status: string;
  createdAt: string;
  course: Course;
}

export type LearnStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED";

export interface CourseThumb {
  from: string;
  to: string;
}

export interface LearnProgress {
  completed: number;
  total: number;
  pct: number;
}

export interface MemberCourseSummary {
  id: string;
  title: string;
  provider: string;
  profession: string;
  format: CourseFormat;
  fee: string;
  schedule: string;
  city: string | null;
  country: string | null;
  description?: string;
}

export interface MemberCourse {
  enrollmentId: string;
  status: LearnStatus;
  enrolledAt: string;
  lastAccessedAt: string | null;
  timeSpentMin: number;
  lastLessonId: string | null;
  progress: LearnProgress;
  thumb: CourseThumb;
  course: MemberCourseSummary;
}

export interface Lesson {
  id: string;
  title: string;
  done: boolean;
}

export interface CourseModule {
  title: string;
  lessons: Lesson[];
}

export interface CourseLearnDetail {
  status: LearnStatus;
  enrolledAt: string;
  lastAccessedAt: string | null;
  timeSpentMin: number;
  lastLessonId: string | null;
  progress: LearnProgress;
  thumb: CourseThumb;
  course: MemberCourseSummary;
  modules: CourseModule[];
}

export interface LearnerNote {
  id: string;
  title: string;
  tags: string[];
  body: string;
  courseId: string | null;
  courseTitle: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GoalPriority = "LOW" | "MEDIUM" | "HIGH";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetDate: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  courseId: string | null;
  courseTitle: string | null;
  linkedProgress: LearnProgress | null;
  createdAt: string;
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
  qualifications?: string | null;
  website?: string | null;
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
  qualifications?: string | null;
  website?: string | null;
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
