/**
 * In-browser data layer for the static (GitHub Pages) build.
 *
 * GitHub Pages can only serve static files, so there is no Express/SQLite
 * backend running. This module reimplements the same API surface against
 * localStorage, seeded with the same demo data, so the deployed site stays
 * fully interactive (sign in, log CPD, marketplace, enrol, certificate).
 *
 * The real backend in `server/` remains the source of truth for local dev
 * and any proper hosting; `api.ts` only routes here when VITE_STATIC=true.
 */
import type {
  Course,
  CourseStatus,
  CpdEntry,
  Cycle,
  EntryStatus,
  Organization,
  Provider,
  Review,
  Staff,
  User,
} from "./types";

// Bump when the seed shape changes so returning visitors get fresh demo data.
const LS_KEY = "cs_static_db_v7";

interface StoredUser extends User {
  password: string;
}

interface DB {
  users: StoredUser[];
  cycles: Cycle[];
  entries: (CpdEntry & { userId: string; cycleId: string })[];
  enrollments: { id: string; userId: string; courseId: string; status: string; createdAt: string }[];
  organizations: Omit<Organization, "staffCount" | "staff">[];
  staff: Staff[];
  providers: Provider[];
  courses: RawCourse[];
  tenders: DbTender[];
  bids: DbBid[];
  bookings: DbBooking[];
  catalog: DbCatalog[];
  plannedSessions: DbPlanned[];
  referrals?: DbReferral[];
}

interface DbReferral {
  id: string;
  organizationId: string;
  catalogId: string;
  courseTitle: string;
  peerName: string;
  peerEmail: string;
  message: string;
  createdAt: string;
}

/** Departments and their sectors, shared across catalog filters and scheduling. */
const ORG_DEPARTMENTS = [
  { name: "Finance", sectors: ["Financial Reporting", "Audit & Assurance", "Tax & Compliance"] },
  { name: "Human Resources", sectors: ["Talent & Recruitment", "Learning & Development", "HR Operations"] },
  { name: "Engineering", sectors: ["Civil & Structural", "Mechanical", "Project Delivery"] },
  { name: "Marketing", sectors: ["Brand & Communications", "Digital Marketing"] },
  { name: "Operations", sectors: ["Logistics", "Procurement", "Quality Assurance"] },
];

interface DbCatalog {
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

interface DbPlanned {
  id: string;
  organizationId: string;
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
  status: string;
  allocated: string[];
}

// ---- Static catalogue (providers, courses, reviews) ------------------------
// Providers and courses are seeded into the DB so the admin can manage them;
// reviews stay constant (they aren't edited from the admin console).

type RawCourse = Omit<Course, "provider"> & { providerId: string; status: CourseStatus };

interface DbTender {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  category: string;
  deliveryMode: string;
  budget: string;
  seats: number;
  deadline: string;
  status: string;
}

interface DbBid {
  id: string;
  tenderId: string;
  providerId: string;
  amount: string;
  proposal: string;
  docFileName: string | null;
  status: string;
  createdAt: string;
}

interface DbBooking {
  id: string;
  organizationId: string;
  title: string;
  providerName: string | null;
  category: string | null;
  staffCount: number;
  date: string;
  cost: string;
  paid: boolean;
  status: string;
  attendance: number | null;
  certificateIssued: boolean;
  outcome: string | null;
  createdAt: string;
}

const PROVIDER_SEED: Provider[] = [
  { id: "p1", name: "Makerere Executive Institute", initials: "ME", type: "Institution", verified: true, rating: 4.9, meta: "Kampala · 22 courses", bio: "The executive education arm of Makerere University, delivering accredited professional programmes across disciplines since 2009." },
  { id: "p2", name: "Deloitte Uganda Academy", initials: "DA", type: "Training company", verified: true, rating: 4.8, meta: "Kampala · 15 courses", bio: "Professional training from Deloitte's East Africa practice, covering finance, risk, and governance." },
  { id: "p3", name: "Uganda Institute of Applied Professionals", initials: "UI", type: "Institution", verified: true, rating: 4.7, meta: "Jinja · 9 courses", bio: "Hands-on technical and engineering CPD delivered by practising professionals." },
  { id: "p4", name: "BrandHouse East Africa", initials: "BH", type: "Training company", verified: true, rating: 4.6, meta: "Kampala · 7 courses", bio: "Marketing, communications, and brand strategy training for the region." },
  { id: "p5", name: "Dr. Grace Ssembatya", initials: "GS", type: "Individual consultant", verified: true, rating: 4.9, meta: "Independent · 5 courses", bio: "Organisational development consultant with 18 years across public-sector reform programmes." },
  { id: "p6", name: "Pearl Leadership Partners", initials: "PL", type: "Individual consultant", verified: false, rating: 0, meta: "Entebbe · new applicant", bio: "Leadership and governance consultancy applying to join the CPD provider rail." },
];

const reviewsByCourse: Record<string, Review[]> = {
  c1: [
    { id: "r1", name: "Okello D.", stars: 5, text: "The field audit was the highlight — genuinely changed how I inspect sites.", createdAt: iso("2026-03-20") },
    { id: "r2", name: "Nabirye R.", stars: 5, text: "Rigorous and practical. Worth every point.", createdAt: iso("2026-03-18") },
    { id: "r3", name: "Mugisha T.", stars: 4, text: "Excellent content, though the venue was a little cramped.", createdAt: iso("2026-03-15") },
  ],
  c2: [
    { id: "r4", name: "Auma P.", stars: 5, text: "Clear explanations of the 2026 amendments. Immediately useful.", createdAt: iso("2026-03-22") },
    { id: "r5", name: "Ssali J.", stars: 5, text: "Best IFRS course I've taken in the region.", createdAt: iso("2026-03-19") },
  ],
  c3: [
    { id: "r6", name: "Namusoke L.", stars: 5, text: "The scenario modelling toolkit is gold.", createdAt: iso("2026-02-28") },
    { id: "r7", name: "Kato B.", stars: 4, text: "Solid, self-paced format worked well around my job.", createdAt: iso("2026-02-25") },
  ],
  c6: [
    { id: "r8", name: "Byaruhanga E.", stars: 5, text: "Dr. Ssembatya's public-sector cases really landed.", createdAt: iso("2026-03-30") },
  ],
};

const COURSE_SEED: RawCourse[] = [
  mkCourse("c1", "p3", "Structural Integrity & Safety Auditing", "A practical, three-day programme on inspecting and certifying structural safety for buildings and civil works, aligned to Ugandan engineering practice standards. Includes a supervised field audit.", "Engineering", "IN_PERSON", 4, 4.8, 3, "Starts 4 Mar · 3 days", "UGX 620,000", 12),
  mkCourse("c2", "p2", "IFRS Update & Practical Application 2026", "Stay current with the latest International Financial Reporting Standards. This course walks through the 2026 amendments with worked examples drawn from East African filings.", "Finance", "HYBRID", 3, 4.9, 4, "Starts 18 Mar · 2 days", "UGX 480,000", 25),
  mkCourse("c3", "p1", "Strategic Workforce Planning", "Build the analytical toolkit to forecast talent needs, model scenarios, and align people strategy with organisational goals. Designed for senior HR practitioners.", "HR", "ONLINE", 3, 4.7, 5, "Self-paced · 6 weeks", "UGX 350,000", 60),
  mkCourse("c4", "p1", "Employment Law for HR Professionals", "A thorough grounding in the Employment Act 2024 and its practical implications for hiring, discipline, and termination. Certificate counts toward HR CPD.", "HR", "IN_PERSON", 2, 4.8, 2, "Starts 11 Mar · 1 day", "UGX 260,000", 30),
  mkCourse("c5", "p4", "Digital Marketing Analytics", "Turn campaign data into decisions. Covers attribution, dashboards, and measuring ROI across paid and organic channels, with hands-on labs.", "Marketing", "ONLINE", 2, 4.6, 3, "Self-paced · 4 weeks", "UGX 300,000", 80),
  mkCourse("c6", "p5", "Leading Change in Public Institutions", "A cross-industry programme on driving reform and managing change in public-sector and regulated organisations. Blends theory with Ugandan case studies.", "Cross-industry", "HYBRID", 3, 4.9, 4, "Starts 25 Mar · 2 days + coaching", "UGX 540,000", 20),
  mkCourse("c7", "p2", "Risk & Internal Controls Essentials", "Design and evaluate internal control frameworks. Ideal for finance and audit professionals seeking verifiable CPD on governance and risk.", "Finance", "ONLINE", 2, 4.7, 2, "Self-paced · 3 weeks", "UGX 320,000", 100),
  mkCourse("c8", "p3", "Project Management for Engineers (PMP-aligned)", "Plan, schedule, and deliver engineering projects on time and budget. Aligned to PMP principles with templates you can use immediately.", "Engineering", "HYBRID", 4, 4.8, 3, "Starts 8 Apr · 4 evenings", "UGX 700,000", 18),
];

function mkCourse(
  id: string, providerId: string, title: string, description: string,
  profession: string, format: Course["format"], points: number, rating: number,
  reviewsCount: number, schedule: string, fee: string, seats: number,
): RawCourse {
  return { id, providerId, title, description, profession, format, points, rating, reviewsCount, schedule, fee, seats, verified: true, status: "APPROVED" };
}

function iso(d: string): string {
  return new Date(d).toISOString();
}

/** Attaches the live provider record to a stored course. */
function resolveCourse(db: DB, raw: RawCourse): Course {
  const { providerId, ...rest } = raw;
  const provider = db.providers.find((p) => p.id === providerId) ?? PROVIDER_SEED[0];
  return { ...rest, provider };
}

// ---- Seed ------------------------------------------------------------------

function seed(): DB {
  const aishaId = "u_aisha";
  const users: StoredUser[] = [
    {
      id: aishaId,
      email: "aisha@example.com",
      password: "password123",
      name: "Aisha Nakato",
      role: "MEMBER",
      profession: "HR",
      membershipNo: "HRM-2024-0417",
      professionalBody: "Human Resource Managers' Association of Uganda",
      jobTitle: "Senior HR Business Partner",
      organisation: "National Water & Sewerage Corporation",
      onboarded: true,
      createdAt: iso("2025-11-01"),
    },
    {
      id: "u_admin",
      email: "registrar@example.com",
      password: "password123",
      name: "R. Namutebi",
      role: "ADMIN",
      profession: "HR",
      membershipNo: null,
      professionalBody: "Human Resource Managers' Association of Uganda",
      jobTitle: "Registrar",
      organisation: null,
      onboarded: true,
      createdAt: iso("2025-10-01"),
    },
    {
      id: "u_provider",
      email: "provider@example.com",
      password: "password123",
      name: "BrandHouse East Africa",
      role: "PROVIDER",
      profession: null,
      membershipNo: null,
      professionalBody: null,
      jobTitle: null,
      organisation: null,
      onboarded: true,
      providerId: "p4",
      createdAt: iso("2025-10-01"),
    },
    {
      id: "u_org",
      email: "org@example.com",
      password: "password123",
      name: "National Water & Sewerage Corporation",
      role: "ORG",
      profession: null,
      membershipNo: null,
      professionalBody: null,
      jobTitle: "People & Culture",
      organisation: null,
      onboarded: true,
      organizationId: "org_nwsc",
      createdAt: iso("2025-10-01"),
    },
  ];

  const cycles: Cycle[] = [
    { id: "cy2026", userId: aishaId, label: "Jan 2026 – Dec 2026", startDate: iso("2026-01-01"), endDate: iso("2026-12-31"), requiredPoints: 12, isCurrent: true, certRef: null, registrarName: null, issuedAt: null } as unknown as Cycle,
    { id: "cy2025", userId: aishaId, label: "Jan 2025 – Dec 2025", startDate: iso("2025-01-01"), endDate: iso("2025-12-31"), requiredPoints: 12, isCurrent: false, certRef: "CPD-2025-HRM-0417", registrarName: "R. Namutebi", issuedAt: iso("2026-01-12") } as unknown as Cycle,
  ];

  const e = (id: string, cycleId: string, title: string, type: string, date: string, pts: number, status: EntryStatus, proof?: string) =>
    ({ id, userId: aishaId, cycleId, title, type, activityDate: iso(date), pointsClaimed: pts, status, proofFileName: proof ?? null, note: null, createdAt: iso(date) } as DB["entries"][number]);

  const entries: DB["entries"] = [
    e("e1", "cy2026", "Employment Act 2024 — what changed for HR", "WEBINAR", "2026-02-11", 2, "VERIFIED", "employment-act-webinar.pdf"),
    e("e2", "cy2026", "Strategic Workforce Planning workshop", "WORKSHOP", "2026-03-06", 3, "VERIFIED", "workforce-planning-cert.pdf"),
    e("e3", "cy2026", "Mentoring two graduate trainees (Q1)", "MENTORING", "2026-03-28", 1.5, "VERIFIED", "mentoring-log-q1.pdf"),
    e("e4", "cy2026", "HR Analytics self-study module", "SELF_STUDY", "2026-04-14", 2, "VERIFIED", "analytics-completion.pdf"),
    e("e5", "cy2026", "Annual HR Leaders Conference — Kampala", "CONFERENCE", "2026-05-09", 3, "PENDING", "conference-badge.jpg"),
    e("e6", "cy2026", "Payroll compliance refresher", "COURSE", "2026-05-20", 1.5, "NEEDS_PROOF"),
    ...([
      ["Labour law update seminar", "WORKSHOP", "2025-02-18", 2],
      ["Diversity & inclusion masterclass", "COURSE", "2025-03-22", 2],
      ["Performance management certification", "COURSE", "2025-05-10", 3],
      ["Regional HR symposium", "CONFERENCE", "2025-07-04", 2],
      ["Coaching for managers workshop", "WORKSHOP", "2025-09-12", 1],
      ["Data protection for HR webinar", "WEBINAR", "2025-10-01", 1],
      ["Mentoring graduate cohort 2025", "MENTORING", "2025-11-20", 1],
    ] as const).map(([t, ty, d, p], i) => e(`p${i}`, "cy2025", t, ty, d, p, "VERIFIED", "certificate.pdf")),
  ];

  const organizations: DB["organizations"] = [
    { id: "org_nwsc", name: "National Water & Sewerage Corporation", sector: "Public sector", district: "Kampala", contactName: "Sarah Nakimuli", contactEmail: "hr@nwsc.example.ug", contactPhone: "+256 414 315 000" },
    { id: "org_stanbic", name: "Stanbic Bank Uganda", sector: "Financial services", district: "Kampala", contactName: "David Ochieng", contactEmail: "people@stanbic.example.ug", contactPhone: "+256 312 224 600" },
    { id: "org_ura", name: "Uganda Revenue Authority", sector: "Public sector", district: "Kampala", contactName: "Grace Atim", contactEmail: "training@ura.example.ug", contactPhone: "+256 417 442 097" },
  ];

  const mkStaff = (id: string, organizationId: string, name: string, email: string, jobTitle: string, profession: string, membershipNo: string): Staff =>
    ({ id, organizationId, name, email, jobTitle, profession, membershipNo, createdAt: iso("2025-11-01") });

  const staff: Staff[] = [
    mkStaff("n1", "org_nwsc", "Aisha Nakato", "aisha@example.com", "HR Manager", "Human Resources", "HRM-2024-0417"),
    mkStaff("n2", "org_nwsc", "Brian Okello", "brian.okello@nwsc.example.ug", "Senior Accountant", "Finance", "ICP-2019-0233"),
    mkStaff("n3", "org_nwsc", "Sarah Namuli", "sarah.namuli@nwsc.example.ug", "Finance Analyst", "Finance", "ICP-2021-0508"),
    mkStaff("n4", "org_nwsc", "Joseph Ssekandi", "joseph.s@nwsc.example.ug", "Site Engineer", "Engineering", "UIPE-2018-0091"),
    mkStaff("n5", "org_nwsc", "Grace Achieng", "grace.achieng@nwsc.example.ug", "Brand Lead", "Marketing", "MSU-2022-0674"),
    mkStaff("n6", "org_nwsc", "Peter Mugisha", "peter.mugisha@nwsc.example.ug", "Operations Officer", "Operations", "OPS-2020-0345"),
    mkStaff("n7", "org_nwsc", "Rehema Nabirye", "rehema.n@nwsc.example.ug", "HR Officer", "Human Resources", "HRM-2023-0712"),
    mkStaff("n8", "org_nwsc", "Daniel Tumusiime", "daniel.t@nwsc.example.ug", "Internal Auditor", "Finance", "ICP-2017-0056"),
    mkStaff("st4", "org_stanbic", "Brian Mugume", "brian.mugume@stanbic.example.ug", "Risk Analyst", "Finance", "ICP-2024-2210"),
    mkStaff("st5", "org_stanbic", "Linda Nabukenya", "linda.n@stanbic.example.ug", "HR Manager", "Human Resources", "HRM-2021-0902"),
    mkStaff("st6", "org_ura", "Samuel Wanyama", "samuel.w@ura.example.ug", "Tax Officer", "Finance", "ICP-2020-0771"),
  ];

  // Provider (p4 / BrandHouse) has a pending listing awaiting approval.
  const providerCourses: RawCourse[] = [
    {
      id: "pc1", providerId: "p4", title: "Crisis Communications for Public Bodies",
      description: "A practical workshop on managing communications during incidents and public scrutiny, with media-handling drills.",
      profession: "Marketing", format: "IN_PERSON", points: 2, rating: 0, reviewsCount: 0,
      schedule: "Starts 6 May · 1 day", fee: "UGX 340,000", seats: 25, verified: false, status: "PENDING",
    },
  ];

  const tenders: DbTender[] = [
    { id: "tn1", organizationId: "org_nwsc", title: "Leadership development programme for 40 managers", description: "We are seeking an accredited provider to design and deliver a leadership development programme for 40 mid-level managers across our regional offices. CPD points required.", category: "HR", deliveryMode: "Hybrid", budget: "UGX 48,000,000", seats: 40, deadline: iso("2026-06-15"), status: "OPEN" },
    { id: "tn2", organizationId: "org_stanbic", title: "IFRS & risk refresher for finance team", description: "Two-day in-house refresher on IFRS 2026 amendments and internal controls for a finance team of 22. Must carry CPD accreditation.", category: "Finance", deliveryMode: "In-person", budget: "UGX 22,000,000", seats: 22, deadline: iso("2026-05-30"), status: "OPEN" },
    { id: "tn3", organizationId: "org_ura", title: "Digital marketing upskilling for comms unit", description: "Online, self-paced digital marketing analytics training for our 12-person communications unit, with a live workshop to close.", category: "Marketing", deliveryMode: "Online", budget: "UGX 9,000,000", seats: 12, deadline: iso("2026-06-05"), status: "OPEN" },
  ];

  const bids: DbBid[] = [
    { id: "bd1", tenderId: "tn2", providerId: "p4", amount: "UGX 20,500,000", proposal: "We propose a tailored two-day programme combining IFRS 2026 updates with hands-on controls case studies drawn from banking. Includes pre-reading and a post-course assessment.", docFileName: "brandhouse-ifrs-proposal.pdf", status: "SUBMITTED", createdAt: iso("2026-04-10") },
    { id: "bd2", tenderId: "tn1", providerId: "p4", amount: "UGX 44,000,000", proposal: "Draft outline — leadership tracks by seniority with coaching pods.", docFileName: null, status: "DRAFT", createdAt: iso("2026-04-12") },
    { id: "bd3", tenderId: "tn1", providerId: "p1", amount: "UGX 46,500,000", proposal: "A six-month blended leadership programme with residential intensives, 360° assessments, and executive coaching pods of six. Delivered by our senior faculty with public-sector experience.", docFileName: "makerere-leadership-proposal.pdf", status: "SUBMITTED", createdAt: iso("2026-04-14") },
    { id: "bd4", tenderId: "tn1", providerId: "p5", amount: "UGX 41,200,000", proposal: "Change-focused leadership track built around your regional structure, with a strong emphasis on public-sector reform case studies and on-the-job application projects.", docFileName: "ssembatya-leadership-proposal.pdf", status: "SUBMITTED", createdAt: iso("2026-04-15") },
  ];

  return {
    users,
    cycles,
    entries,
    enrollments: [{ id: "en1", userId: aishaId, courseId: "c3", status: "ENROLLED", createdAt: iso("2026-02-01") }],
    organizations,
    staff,
    providers: PROVIDER_SEED.map((p) => ({ ...p })),
    courses: [...COURSE_SEED.map((c) => ({ ...c })), ...providerCourses],
    tenders,
    bids,
    bookings: [
      { id: "bk1", organizationId: "org_nwsc", title: "Strategic Workforce Planning", providerName: "Makerere Executive Institute", category: "HR", staffCount: 8, date: iso("2026-03-12"), cost: "UGX 2,800,000", paid: true, status: "COMPLETED", attendance: 8, certificateIssued: true, outcome: "All participants completed; 3 CPD points awarded each.", createdAt: iso("2026-02-20") },
      { id: "bk2", organizationId: "org_nwsc", title: "IFRS Update & Practical Application 2026", providerName: "Deloitte Uganda Academy", category: "Finance", staffCount: 5, date: iso("2026-04-18"), cost: "UGX 2,400,000", paid: true, status: "COMPLETED", attendance: 4, certificateIssued: true, outcome: "One deferral; certificates issued to attendees.", createdAt: iso("2026-03-25") },
      { id: "bk3", organizationId: "org_nwsc", title: "Structural Integrity & Safety Auditing", providerName: "Uganda Institute of Applied Professionals", category: "Engineering", staffCount: 6, date: iso("2026-06-04"), cost: "UGX 3,720,000", paid: false, status: "SCHEDULED", attendance: null, certificateIssued: false, outcome: null, createdAt: iso("2026-04-30") },
      { id: "bk4", organizationId: "org_nwsc", title: "Leading Change in Public Institutions", providerName: "Dr. Grace Ssembatya", category: "Cross-industry", staffCount: 12, date: iso("2026-07-22"), cost: "UGX 6,480,000", paid: false, status: "SCHEDULED", attendance: null, certificateIssued: false, outcome: null, createdAt: iso("2026-05-10") },
      { id: "bk5", organizationId: "org_nwsc", title: "Employment Law for HR Professionals", providerName: "Makerere Executive Institute", category: "HR", staffCount: 4, date: iso("2026-09-09"), cost: "UGX 1,040,000", paid: false, status: "SCHEDULED", attendance: null, certificateIssued: false, outcome: null, createdAt: iso("2026-06-01") },
    ],
    catalog: [
      { id: "cat1", title: "Strategic Workforce Planning", description: "Align headcount, capability and succession with business strategy.", dept: "Human Resources", sector: "Learning & Development", consultant: "Grace Nabbanja", date: "12 Sep 2026", location: "Kampala", format: "In-person", points: 3.0, fee: "UGX 450,000", capacity: 25, booked: 21 },
      { id: "cat2", title: "Financial Modelling & Valuation", description: "Build robust three-statement models and value businesses.", dept: "Finance", sector: "Financial Reporting", consultant: "David Mukasa, CFA", date: "Self-paced", location: "Online", format: "Online", points: 2.0, fee: "UGX 300,000", capacity: 40, booked: 40 },
      { id: "cat3", title: "Occupational Safety & Health Essentials", description: "Workplace safety, hazard control and regulatory compliance.", dept: "Operations", sector: "Quality Assurance", consultant: "Dr. Sarah Kembabazi", date: "03 Oct 2026", location: "Entebbe", format: "In-person", points: 1.5, fee: "UGX 200,000", capacity: 30, booked: 12 },
      { id: "cat4", title: "Leadership Masterclass", description: "Executive presence, coaching and leading through change.", dept: "Human Resources", sector: "Learning & Development", consultant: "Grace Nabbanja", date: "21 Nov 2026", location: "Kampala", format: "Hybrid", points: 2.5, fee: "UGX 500,000", capacity: 20, booked: 18 },
      { id: "cat5", title: "Digital Marketing Strategy", description: "Analytics, paid media and brand growth for East African markets.", dept: "Marketing", sector: "Digital Marketing", consultant: "Brenda Atim", date: "15 Oct 2026", location: "Kampala", format: "In-person", points: 2.0, fee: "UGX 380,000", capacity: 25, booked: 9 },
      { id: "cat6", title: "Structural Design with Eurocodes", description: "Applied structural analysis to Eurocode standards.", dept: "Engineering", sector: "Civil & Structural", consultant: "Eng. Robert Ssali", date: "28 Nov 2026", location: "Jinja", format: "In-person", points: 2.5, fee: "UGX 560,000", capacity: 18, booked: 4 },
    ],
    plannedSessions: [
      { id: "ps1", organizationId: "org_nwsc", course: "IFRS Update 2026", description: "Annual refresher on new IFRS standards for the finance team.", dept: "Finance", sector: "Financial Reporting", mode: "Physical", venue: "Serena Conference Centre", address: "Kintu Road, Kampala", platform: "", link: "", access: "", cost: 620000, costBasis: "Per participant", provider: "Kampala School of Accountancy", providerType: "External", date: "18 Mar 2026", month: "Mar", time: "09:00–16:00", capacity: 6, status: "Completed", allocated: ["n2", "n3", "n8"] },
      { id: "ps2", organizationId: "org_nwsc", course: "Talent Acquisition Bootcamp", description: "Modern sourcing, interviewing and employer-branding practices.", dept: "Human Resources", sector: "Talent & Recruitment", mode: "Physical", venue: "Head Office Training Room", address: "Plot 5, Nakasero, Kampala", platform: "", link: "", access: "", cost: 400000, costBasis: "Per participant", provider: "Kampala Leadership Institute", providerType: "External", date: "11 Jun 2026", month: "Jun", time: "09:30–15:30", capacity: 4, status: "In progress", allocated: ["n1", "n7"] },
      { id: "ps3", organizationId: "org_nwsc", course: "Project Management for Engineers", description: "PMBOK-aligned delivery for infrastructure projects.", dept: "Engineering", sector: "Project Delivery", mode: "Online", venue: "", address: "", platform: "Zoom", link: "zoom.us/j/cpd-eng-2026", access: "Link sent 24h before start.", cost: 350000, costBasis: "Per participant", provider: "Nakawa Technical Consult", providerType: "External", date: "15 Sep 2026", month: "Sep", time: "14:00–17:00", capacity: 3, status: "Planned", allocated: ["n4"] },
      { id: "ps4", organizationId: "org_nwsc", course: "Digital Marketing Strategy", description: "Analytics, paid media and brand growth for East African markets.", dept: "Marketing", sector: "Digital Marketing", mode: "Physical", venue: "BrandForge Studio", address: "Bugolobi, Kampala", platform: "", link: "", access: "", cost: 380000, costBasis: "Per participant", provider: "BrandForge Consulting", providerType: "External", date: "15 Oct 2026", month: "Oct", time: "10:00–16:00", capacity: 3, status: "Planned", allocated: ["n5"] },
      { id: "ps5", organizationId: "org_nwsc", course: "Internal Controls & Fraud Risk", description: "Building a controls culture and detecting fraud early.", dept: "Finance", sector: "Audit & Assurance", mode: "Online", venue: "", address: "", platform: "Microsoft Teams", link: "teams.microsoft.com/l/cpd-fin", access: "Join via calendar invite.", cost: 0, costBasis: "Internal (no cost)", provider: "Internal Audit Team", providerType: "Internal", date: "20 Nov 2026", month: "Nov", time: "09:00–12:00", capacity: 5, status: "Planned", allocated: ["n2", "n3"] },
    ],
  };
}

// ---- Persistence -----------------------------------------------------------

function load(): DB {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as DB;
    } catch {
      /* fall through to reseed */
    }
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(db: DB) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

function uid(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}

// ---- Summary helpers (ported from server/src/lib/summary.ts) ----------------

function buildSummary(cycle: Cycle, entries: CpdEntry[]) {
  const earned = entries.filter((e) => e.status === "VERIFIED").reduce((s, e) => s + e.pointsClaimed, 0);
  const required = cycle.requiredPoints;
  const pct = required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;
  const counts = { VERIFIED: 0, PENDING: 0, NEEDS_PROOF: 0, REJECTED: 0 };
  for (const e of entries) counts[e.status] += 1;
  const daysRemaining = Math.max(0, Math.ceil((new Date(cycle.endDate).getTime() - Date.now()) / 86400000));
  return {
    cycleId: cycle.id, label: cycle.label, startDate: cycle.startDate, endDate: cycle.endDate,
    requiredPoints: required, earnedPoints: earned, remainingPoints: Math.max(0, required - earned),
    percentComplete: pct, daysRemaining, isCurrent: cycle.isCurrent, counts,
    onTrack: pct >= 100 || earned >= required * 0.5,
  };
}

// ---- Auth ------------------------------------------------------------------

const TOKEN_PREFIX = "static:";

function currentUserId(): string | null {
  const t = localStorage.getItem("cs_token");
  return t && t.startsWith(TOKEN_PREFIX) ? t.slice(TOKEN_PREFIX.length) : null;
}

function requireUser(db: DB): StoredUser {
  const id = currentUserId();
  const u = id ? db.users.find((x) => x.id === id) : null;
  if (!u) throw { status: 401, error: "Authentication required" };
  return u;
}

function requireAdmin(db: DB): StoredUser {
  const u = requireUser(db);
  if (u.role !== "ADMIN") throw { status: 403, error: "Admin access required" };
  return u;
}

function requireProvider(db: DB): string {
  const u = requireUser(db);
  if (u.role !== "PROVIDER" || !u.providerId) throw { status: 403, error: "Provider access required" };
  return u.providerId;
}

function requireOrg(db: DB): string {
  const u = requireUser(db);
  if (u.role !== "ORG" || !u.organizationId) throw { status: 403, error: "Organization access required" };
  return u.organizationId;
}

const VISIBLE_BID = ["SUBMITTED", "SHORTLISTED", "ACCEPTED", "REJECTED"];

function orgLite(db: DB, id: string) {
  const o = db.organizations.find((x) => x.id === id);
  return { id, name: o?.name ?? "Organization", sector: o?.sector ?? null, district: o?.district ?? null };
}

function tenderView(db: DB, t: DbTender) {
  return {
    id: t.id, title: t.title, description: t.description, category: t.category,
    deliveryMode: t.deliveryMode, budget: t.budget, seats: t.seats,
    deadline: t.deadline, status: t.status, organization: orgLite(db, t.organizationId),
  };
}

function bidView(db: DB, b: DbBid) {
  const t = db.tenders.find((x) => x.id === b.tenderId);
  const org = t ? orgLite(db, t.organizationId) : null;
  return {
    id: b.id, amount: b.amount, proposal: b.proposal, docFileName: b.docFileName,
    status: b.status, createdAt: b.createdAt,
    tender: {
      id: t?.id ?? b.tenderId, title: t?.title ?? "Tender", budget: t?.budget ?? "",
      deadline: t?.deadline ?? "", category: t?.category ?? "",
      organizationName: org?.name ?? "Organization",
    },
  };
}

/** Issues a certificate for a completed cycle if one hasn't been issued. */
function maybeIssueCert(db: DB, cycle: Cycle, member: StoredUser, registrar: string) {
  if (cycle.certRef) return;
  const entries = db.entries.filter((e) => e.cycleId === cycle.id);
  const earned = entries.filter((e) => e.status === "VERIFIED").reduce((s, e) => s + e.pointsClaimed, 0);
  if (earned < cycle.requiredPoints) return;
  const year = new Date(cycle.startDate).getFullYear();
  const suffix = (member.membershipNo ?? member.id.slice(-4)).replace(/[^A-Za-z0-9]/g, "").slice(-4).toUpperCase();
  const prefix = (member.profession ?? "CPD").slice(0, 3).toUpperCase();
  cycle.certRef = `CPD-${year}-${prefix}-${suffix}`;
  cycle.registrarName = registrar;
  cycle.issuedAt = new Date().toISOString();
}

function ensureCurrentCycle(db: DB, userId: string): Cycle {
  let cycle = db.cycles.find((c) => c.userId === userId && c.isCurrent);
  if (!cycle) {
    const year = new Date().getFullYear();
    cycle = { id: uid("cy"), userId, label: `Jan ${year} – Dec ${year}`, startDate: iso(`${year}-01-01`), endDate: iso(`${year}-12-31`), requiredPoints: 12, isCurrent: true, certRef: null, registrarName: null, issuedAt: null } as unknown as Cycle;
    db.cycles.push(cycle);
    save(db);
  }
  return cycle;
}

function publicUser(u: StoredUser): User {
  const { password, ...rest } = u;
  return rest;
}

// ---- Annual plan & reporting helpers ---------------------------------------

function fmtUGX(n: number): string {
  return `UGX ${Math.round(n).toLocaleString("en-US")}`;
}

/** Budget attributable to a planned session, per its cost basis. */
function sessionBudget(p: DbPlanned): number {
  if (p.costBasis.startsWith("Internal")) return 0;
  if (p.costBasis === "Per participant") return p.cost * p.capacity;
  return p.cost; // Total for session
}

function plannedView(db: DB, p: DbPlanned) {
  const allocated = p.allocated
    .map((sid) => db.staff.find((s) => s.id === sid))
    .filter((s): s is Staff => !!s)
    .map((s) => ({ id: s.id, name: s.name, dept: s.profession }));
  return {
    id: p.id, course: p.course, description: p.description, dept: p.dept, sector: p.sector,
    mode: p.mode, venue: p.venue, address: p.address, platform: p.platform, link: p.link, access: p.access,
    cost: p.cost, costBasis: p.costBasis, provider: p.provider, providerType: p.providerType,
    date: p.date, month: p.month, time: p.time, capacity: p.capacity, status: p.status, allocated,
  };
}

function buildOverview(db: DB, oid: string) {
  const sessions = db.plannedSessions.filter((p) => p.organizationId === oid);
  const totalSessions = sessions.length;
  const totalAllocated = sessions.reduce((s, p) => s + p.allocated.length, 0);
  const completed = sessions.filter((p) => p.status === "Completed").length;
  const completionRate = totalSessions ? Math.round((completed / totalSessions) * 100) : 0;
  const totalBudget = sessions.reduce((s, p) => s + sessionBudget(p), 0);

  const deptMap: Record<string, { sessions: number; staff: number; budget: number }> = {};
  for (const p of sessions) {
    const d = (deptMap[p.dept] = deptMap[p.dept] ?? { sessions: 0, staff: 0, budget: 0 });
    d.sessions += 1;
    d.staff += p.allocated.length;
    d.budget += sessionBudget(p);
  }
  const byDepartment = Object.entries(deptMap)
    .map(([name, v]) => ({
      name, sessions: v.sessions, staff: v.staff, budget: v.budget,
      budgetShort: v.budget.toLocaleString("en-US"),
      share: totalBudget ? Math.round((v.budget / totalBudget) * 100) : 0,
    }))
    .sort((a, b) => b.budget - a.budget);

  const participation = [
    { label: "Completed", count: sessions.filter((p) => p.status === "Completed").length },
    { label: "In progress", count: sessions.filter((p) => p.status === "In progress").length },
    { label: "Planned", count: sessions.filter((p) => p.status === "Planned").length },
  ];

  const org = db.organizations.find((o) => o.id === oid);
  const contact = org?.contactName ?? "People & Culture";
  const audit = sessions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6)
    .map((p) => ({
      actor: contact,
      action: p.status === "Completed" ? "Completed session" : p.allocated.length ? "Allocated staff to" : "Scheduled",
      target: p.course,
      time: p.date,
    }));

  return { totalSessions, totalAllocated, completionRate, totalBudget: fmtUGX(totalBudget), byDepartment, participation, audit };
}

// ---- Router ----------------------------------------------------------------

export async function handle(method: string, path: string, body: unknown): Promise<unknown> {
  const db = load();
  const b = (body ?? {}) as Record<string, any>;
  const [rawPath] = path.split("?");
  const query = new URLSearchParams(path.includes("?") ? path.slice(path.indexOf("?") + 1) : "");

  // --- Auth ---
  if (method === "POST" && rawPath === "/auth/signup") {
    if (db.users.some((u) => u.email === b.email)) throw { status: 409, error: "An account with that email already exists" };
    const accountType = (b.accountType ?? "individual") as string;
    const base = { id: uid("u_"), email: b.email, password: b.password, name: b.name, membershipNo: null, professionalBody: null, jobTitle: null, organisation: null, createdAt: new Date().toISOString() };

    if (accountType === "organization") {
      const org = { id: uid("org_"), name: b.name, sector: b.sector ?? null, district: b.district ?? null, contactName: b.contactName ?? null, contactEmail: b.email, contactPhone: null };
      db.organizations.push(org);
      const user: StoredUser = { ...base, role: "ORG", profession: null, onboarded: true, organizationId: org.id };
      db.users.push(user);
      save(db);
      return { token: TOKEN_PREFIX + user.id, user: publicUser(user) };
    }

    if (accountType === "consultant") {
      const name: string = b.name ?? "";
      const initials = (name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("") || "?").toUpperCase();
      const type = b.consultantType === "institution" ? "Institution" : "Individual consultant";
      const provider: Provider = { id: uid("prov_"), name, initials, type, verified: false, rating: 0, meta: b.location ? `${b.location} · new applicant` : "New applicant", bio: b.expertise ?? null };
      db.providers.push(provider);
      const user: StoredUser = { ...base, role: "PROVIDER", profession: null, onboarded: true, providerId: provider.id };
      db.users.push(user);
      save(db);
      return { token: TOKEN_PREFIX + user.id, user: publicUser(user) };
    }

    const user: StoredUser = { ...base, role: "MEMBER", profession: b.profession ?? null, onboarded: false };
    db.users.push(user);
    const year = new Date().getFullYear();
    db.cycles.push({ id: uid("cy"), userId: user.id, label: `Jan ${year} – Dec ${year}`, startDate: iso(`${year}-01-01`), endDate: iso(`${year}-12-31`), requiredPoints: 12, isCurrent: true, certRef: null, registrarName: null, issuedAt: null } as unknown as Cycle);
    save(db);
    return { token: TOKEN_PREFIX + user.id, user: publicUser(user) };
  }

  if (method === "POST" && rawPath === "/auth/signin") {
    const user = db.users.find((u) => u.email === b.email);
    if (!user || user.password !== b.password) throw { status: 401, error: "Incorrect email or password" };
    return { token: TOKEN_PREFIX + user.id, user: publicUser(user) };
  }

  if (method === "GET" && rawPath === "/auth/me") {
    return { user: publicUser(requireUser(db)) };
  }

  if (method === "PATCH" && rawPath === "/auth/me") {
    const user = requireUser(db);
    Object.assign(user, {
      profession: b.profession ?? user.profession,
      membershipNo: b.membershipNo ?? user.membershipNo,
      professionalBody: b.professionalBody ?? user.professionalBody,
      jobTitle: b.jobTitle ?? user.jobTitle,
      organisation: b.organisation ?? user.organisation,
      onboarded: true,
    });
    save(db);
    return { user: publicUser(user) };
  }

  // --- CPD ---
  if (method === "GET" && rawPath === "/cpd/dashboard") {
    const user = requireUser(db);
    const cycle = ensureCurrentCycle(db, user.id);
    const entries = db.entries.filter((e) => e.cycleId === cycle.id).sort(byDateDesc);
    return { summary: buildSummary(cycle, entries), recent: entries.slice(0, 5) };
  }

  if (method === "GET" && rawPath === "/cpd/entries") {
    const user = requireUser(db);
    ensureCurrentCycle(db, user.id);
    const cycles = db.cycles.filter((c) => c.userId === user.id).sort((a, b2) => +new Date(b2.startDate) - +new Date(a.startDate));
    return {
      cycles: cycles.map((c) => {
        const entries = db.entries.filter((e) => e.cycleId === c.id).sort(byDateDesc);
        return { ...buildSummary(c, entries), entries };
      }),
    };
  }

  if (method === "POST" && rawPath === "/cpd/entries") {
    const user = requireUser(db);
    const cycle = ensureCurrentCycle(db, user.id);
    const entry = { id: uid("e_"), userId: user.id, cycleId: cycle.id, title: b.title, type: b.type, activityDate: iso(b.activityDate), pointsClaimed: Number(b.pointsClaimed), status: (b.proofFileName ? "PENDING" : "NEEDS_PROOF") as EntryStatus, proofFileName: b.proofFileName ?? null, note: b.note ?? null, createdAt: new Date().toISOString() };
    db.entries.push(entry);
    save(db);
    return { entry };
  }

  // --- Courses ---
  if (method === "GET" && rawPath === "/courses") {
    const prof = query.get("profession");
    const fmt = query.get("format");
    let list = db.courses.filter((c) => c.status === "APPROVED").map((c) => resolveCourse(db, c));
    if (prof && prof !== "All") list = list.filter((c) => c.profession === prof);
    if (fmt && fmt !== "All") list = list.filter((c) => c.format === fmt);
    list.sort((a, b2) => b2.rating - a.rating);
    return { courses: list, count: list.length };
  }

  if (method === "GET" && rawPath.startsWith("/courses/") && !rawPath.includes("enroll") && !rawPath.includes("me/")) {
    const id = rawPath.split("/")[2];
    const raw = db.courses.find((c) => c.id === id);
    if (!raw) throw { status: 404, error: "Course not found" };
    return { course: { ...resolveCourse(db, raw), reviews: reviewsByCourse[id] ?? [] } };
  }

  if (method === "POST" && /^\/courses\/[^/]+\/enroll$/.test(rawPath)) {
    const user = requireUser(db);
    const courseId = rawPath.split("/")[2];
    if (!db.courses.find((c) => c.id === courseId)) throw { status: 404, error: "Course not found" };
    const existing = db.enrollments.find((e) => e.userId === user.id && e.courseId === courseId);
    if (existing) return { enrollment: existing, alreadyEnrolled: true };
    const enrollment = { id: uid("en_"), userId: user.id, courseId, status: "ENROLLED", createdAt: new Date().toISOString() };
    db.enrollments.push(enrollment);
    save(db);
    return { enrollment };
  }

  // --- Record ---
  if (method === "GET" && rawPath === "/record") {
    const user = requireUser(db);
    const cycles = db.cycles.filter((c) => c.userId === user.id).sort((a, b2) => +new Date(b2.startDate) - +new Date(a.startDate));
    const records = cycles.map((c) => {
      const entries = db.entries.filter((e) => e.cycleId === c.id);
      const s = buildSummary(c, entries);
      const anyC = c as unknown as { certRef: string | null; registrarName: string | null; issuedAt: string | null };
      return {
        cycleId: c.id, label: c.label, startDate: c.startDate, endDate: c.endDate,
        requiredPoints: c.requiredPoints, earnedPoints: s.earnedPoints,
        activitiesVerified: entries.filter((e) => e.status === "VERIFIED").length,
        compliancePct: s.percentComplete, complete: s.earnedPoints >= c.requiredPoints,
        certRef: anyC.certRef, registrarName: anyC.registrarName, issuedAt: anyC.issuedAt,
      };
    });
    return { holder: { name: user.name, membershipNo: user.membershipNo, professionalBody: user.professionalBody }, records };
  }

  // --- Admin ---
  if (method === "GET" && rawPath === "/admin/overview") {
    requireAdmin(db);
    const byStatus = { VERIFIED: 0, PENDING: 0, NEEDS_PROOF: 0, REJECTED: 0 };
    for (const e of db.entries) byStatus[e.status] += 1;
    return {
      stats: {
        members: db.users.filter((u) => u.role === "MEMBER").length,
        providers: db.providers.length,
        courses: db.courses.length,
        certificatesIssued: db.cycles.filter((c) => (c as unknown as { certRef: string | null }).certRef).length,
        awaitingReview: byStatus.PENDING,
        needsProof: byStatus.NEEDS_PROOF,
        verified: byStatus.VERIFIED,
        rejected: byStatus.REJECTED,
      },
    };
  }

  if (method === "GET" && rawPath === "/admin/members") {
    requireAdmin(db);
    const members = db.users.filter((u) => u.role === "MEMBER");
    return {
      members: members.map((m) => {
        const cycle = db.cycles.find((c) => c.userId === m.id && c.isCurrent);
        const entries = cycle ? db.entries.filter((e) => e.cycleId === cycle.id) : [];
        const summary = cycle ? buildSummary(cycle, entries) : null;
        return {
          id: m.id,
          name: m.name,
          email: m.email,
          profession: m.profession,
          membershipNo: m.membershipNo,
          professionalBody: m.professionalBody,
          cycleLabel: cycle?.label ?? null,
          earnedPoints: summary?.earnedPoints ?? 0,
          requiredPoints: summary?.requiredPoints ?? 0,
          percentComplete: summary?.percentComplete ?? 0,
          pendingCount: entries.filter((e) => e.status === "PENDING" || e.status === "NEEDS_PROOF").length,
        };
      }),
    };
  }

  if (method === "GET" && rawPath.startsWith("/admin/members/")) {
    requireAdmin(db);
    const mid = rawPath.split("/")[3];
    const member = db.users.find((u) => u.id === mid && u.role === "MEMBER");
    if (!member) throw { status: 404, error: "Member not found" };
    const cycles = db.cycles
      .filter((c) => c.userId === mid)
      .sort((a, b2) => +new Date(b2.startDate) - +new Date(a.startDate));
    return {
      member: {
        id: member.id, name: member.name, email: member.email,
        profession: member.profession, membershipNo: member.membershipNo,
        professionalBody: member.professionalBody, jobTitle: member.jobTitle,
        organisation: member.organisation,
      },
      cycles: cycles.map((c) => {
        const entries = db.entries.filter((e) => e.cycleId === c.id).sort(byDateDesc);
        const anyC = c as unknown as { certRef: string | null; registrarName: string | null; issuedAt: string | null };
        return { ...buildSummary(c, entries), certRef: anyC.certRef, registrarName: anyC.registrarName, issuedAt: anyC.issuedAt, entries };
      }),
    };
  }

  if (method === "GET" && rawPath === "/admin/queue") {
    requireAdmin(db);
    const items = db.entries
      .filter((e) => e.status === "PENDING" || e.status === "NEEDS_PROOF")
      .sort((a, b2) => +new Date(a.createdAt) - +new Date(b2.createdAt));
    return {
      queue: items.map((e) => {
        const m = db.users.find((u) => u.id === e.userId)!;
        return {
          id: e.id, title: e.title, type: e.type, activityDate: e.activityDate,
          pointsClaimed: e.pointsClaimed, status: e.status, proofFileName: e.proofFileName, note: e.note,
          member: { id: m.id, name: m.name, membershipNo: m.membershipNo },
        };
      }),
    };
  }

  if (method === "POST" && /^\/admin\/entries\/[^/]+\/(verify|reject)$/.test(rawPath)) {
    const admin = requireAdmin(db);
    const parts = rawPath.split("/");
    const eid = parts[3];
    const action = parts[4];
    const entry = db.entries.find((e) => e.id === eid);
    if (!entry) throw { status: 404, error: "Entry not found" };
    if (action === "verify" && entry.status === "NEEDS_PROOF" && !entry.proofFileName) {
      throw { status: 400, error: "Cannot verify an entry without proof" };
    }
    entry.status = action === "verify" ? "VERIFIED" : "REJECTED";
    if (action === "verify") {
      const cycle = db.cycles.find((c) => c.id === entry.cycleId);
      const member = db.users.find((u) => u.id === entry.userId);
      if (cycle && member) maybeIssueCert(db, cycle, member, admin.name);
    }
    save(db);
    return { entry };
  }

  // --- Admin: verification ---
  if (method === "GET" && rawPath === "/admin/overview") {
    requireAdmin(db);
    const counts = { VERIFIED: 0, PENDING: 0, NEEDS_PROOF: 0, REJECTED: 0 };
    for (const e of db.entries) counts[e.status] += 1;
    return {
      stats: {
        members: db.users.filter((u) => u.role === "MEMBER").length,
        providers: db.providers.length,
        courses: db.courses.length,
        certificatesIssued: db.cycles.filter((c) => c.certRef).length,
        awaitingReview: counts.PENDING,
        needsProof: counts.NEEDS_PROOF,
        verified: counts.VERIFIED,
        rejected: counts.REJECTED,
      },
    };
  }

  if (method === "GET" && rawPath === "/admin/members") {
    requireAdmin(db);
    const rows = db.users
      .filter((u) => u.role === "MEMBER")
      .sort((a, b2) => a.name.localeCompare(b2.name))
      .map((m) => {
        const cycle = db.cycles.find((c) => c.userId === m.id && c.isCurrent);
        const entries = cycle ? db.entries.filter((e) => e.cycleId === cycle.id) : [];
        const s = cycle ? buildSummary(cycle, entries) : null;
        return {
          id: m.id, name: m.name, email: m.email, profession: m.profession,
          membershipNo: m.membershipNo, professionalBody: m.professionalBody,
          cycleLabel: cycle?.label ?? null,
          earnedPoints: s?.earnedPoints ?? 0, requiredPoints: s?.requiredPoints ?? 0,
          percentComplete: s?.percentComplete ?? 0,
          pendingCount: entries.filter((e) => e.status === "PENDING" || e.status === "NEEDS_PROOF").length,
        };
      });
    return { members: rows };
  }

  if (method === "GET" && /^\/admin\/members\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const m = db.users.find((u) => u.id === id && u.role === "MEMBER");
    if (!m) throw { status: 404, error: "Member not found" };
    const cycles = db.cycles
      .filter((c) => c.userId === id)
      .sort((a, b2) => +new Date(b2.startDate) - +new Date(a.startDate))
      .map((c) => {
        const entries = db.entries.filter((e) => e.cycleId === c.id).sort(byDateDesc);
        return { ...buildSummary(c, entries), certRef: c.certRef, registrarName: c.registrarName, issuedAt: c.issuedAt, entries };
      });
    return {
      member: { id: m.id, name: m.name, email: m.email, profession: m.profession, membershipNo: m.membershipNo, professionalBody: m.professionalBody, jobTitle: m.jobTitle, organisation: m.organisation },
      cycles,
    };
  }

  if (method === "GET" && rawPath === "/admin/queue") {
    requireAdmin(db);
    const items = db.entries
      .filter((e) => e.status === "PENDING" || e.status === "NEEDS_PROOF")
      .sort((a, b2) => +new Date(a.createdAt) - +new Date(b2.createdAt))
      .map((e) => {
        const member = db.users.find((u) => u.id === e.userId)!;
        return { id: e.id, title: e.title, type: e.type, activityDate: e.activityDate, pointsClaimed: e.pointsClaimed, status: e.status, proofFileName: e.proofFileName, note: e.note, member: { id: member.id, name: member.name, membershipNo: member.membershipNo } };
      });
    return { queue: items };
  }

  if (method === "POST" && /^\/admin\/entries\/[^/]+\/(verify|reject)$/.test(rawPath)) {
    const admin = requireAdmin(db);
    const parts = rawPath.split("/");
    const entryId = parts[3];
    const action = parts[4];
    const entry = db.entries.find((e) => e.id === entryId);
    if (!entry) throw { status: 404, error: "Entry not found" };
    if (action === "verify" && entry.status === "NEEDS_PROOF" && !entry.proofFileName) {
      throw { status: 400, error: "Cannot verify an entry without proof" };
    }
    entry.status = action === "verify" ? "VERIFIED" : "REJECTED";
    if (action === "verify") {
      const cycle = db.cycles.find((c) => c.id === entry.cycleId);
      const member = db.users.find((u) => u.id === entry.userId);
      if (cycle && member) maybeIssueCert(db, cycle, member, admin.name);
    }
    save(db);
    return { entry };
  }

  // --- Admin: members CRUD ---
  if (method === "POST" && rawPath === "/admin/members") {
    requireAdmin(db);
    if (db.users.some((u) => u.email === b.email)) throw { status: 409, error: "A user with that email already exists" };
    const user: StoredUser = { id: uid("u_"), email: b.email, password: b.password || "password123", name: b.name, role: "MEMBER", profession: b.profession ?? null, membershipNo: b.membershipNo ?? null, professionalBody: b.professionalBody ?? null, jobTitle: b.jobTitle ?? null, organisation: b.organisation ?? null, onboarded: true, createdAt: new Date().toISOString() };
    db.users.push(user);
    const year = new Date().getFullYear();
    db.cycles.push({ id: uid("cy"), userId: user.id, label: `Jan ${year} – Dec ${year}`, startDate: iso(`${year}-01-01`), endDate: iso(`${year}-12-31`), requiredPoints: 12, isCurrent: true, certRef: null, registrarName: null, issuedAt: null } as unknown as Cycle);
    save(db);
    return { id: user.id };
  }

  if (method === "PATCH" && /^\/admin\/members\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const m = db.users.find((u) => u.id === id && u.role === "MEMBER");
    if (!m) throw { status: 404, error: "Member not found" };
    for (const k of ["name", "email", "profession", "membershipNo", "professionalBody", "jobTitle", "organisation"] as const) {
      if (b[k] !== undefined) (m as any)[k] = b[k];
    }
    if (b.password) m.password = b.password;
    save(db);
    return { ok: true };
  }

  if (method === "DELETE" && /^\/admin\/members\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const m = db.users.find((u) => u.id === id && u.role === "MEMBER");
    if (!m) throw { status: 404, error: "Member not found" };
    const cycleIds = db.cycles.filter((c) => c.userId === id).map((c) => c.id);
    db.entries = db.entries.filter((e) => e.userId !== id);
    db.cycles = db.cycles.filter((c) => c.userId !== id);
    db.enrollments = db.enrollments.filter((e) => e.userId !== id);
    void cycleIds;
    db.users = db.users.filter((u) => u.id !== id);
    save(db);
    return { ok: true };
  }

  // --- Admin: organizations CRUD ---
  if (method === "GET" && rawPath === "/admin/organizations") {
    requireAdmin(db);
    const orgs = db.organizations
      .slice()
      .sort((a, b2) => a.name.localeCompare(b2.name))
      .map((o) => ({ ...o, staffCount: db.staff.filter((s) => s.organizationId === o.id).length }));
    return { organizations: orgs };
  }

  if (method === "GET" && /^\/admin\/organizations\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const org = db.organizations.find((o) => o.id === id);
    if (!org) throw { status: 404, error: "Organization not found" };
    const staff = db.staff.filter((s) => s.organizationId === id).sort((a, b2) => a.name.localeCompare(b2.name));
    return { organization: { ...org, staff } };
  }

  if (method === "POST" && rawPath === "/admin/organizations") {
    requireAdmin(db);
    const org = { id: uid("org_"), name: b.name, sector: b.sector ?? null, district: b.district ?? null, contactName: b.contactName ?? null, contactEmail: b.contactEmail ?? null, contactPhone: b.contactPhone ?? null };
    db.organizations.push(org);
    save(db);
    return { id: org.id };
  }

  if (method === "PATCH" && /^\/admin\/organizations\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const org = db.organizations.find((o) => o.id === id);
    if (!org) throw { status: 404, error: "Organization not found" };
    for (const k of ["name", "sector", "district", "contactName", "contactEmail", "contactPhone"] as const) {
      if (b[k] !== undefined) (org as any)[k] = b[k];
    }
    save(db);
    return { ok: true };
  }

  if (method === "DELETE" && /^\/admin\/organizations\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    if (!db.organizations.some((o) => o.id === id)) throw { status: 404, error: "Organization not found" };
    db.staff = db.staff.filter((s) => s.organizationId !== id);
    db.organizations = db.organizations.filter((o) => o.id !== id);
    save(db);
    return { ok: true };
  }

  // --- Admin: staff CRUD ---
  if (method === "POST" && /^\/admin\/organizations\/[^/]+\/staff$/.test(rawPath)) {
    requireAdmin(db);
    const orgId = rawPath.split("/")[3];
    if (!db.organizations.some((o) => o.id === orgId)) throw { status: 404, error: "Organization not found" };
    const s: Staff = { id: uid("st_"), organizationId: orgId, name: b.name, email: b.email ?? null, jobTitle: b.jobTitle ?? null, profession: b.profession ?? null, membershipNo: b.membershipNo ?? null, createdAt: new Date().toISOString() };
    db.staff.push(s);
    save(db);
    return { id: s.id };
  }

  if (method === "PATCH" && /^\/admin\/staff\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const s = db.staff.find((x) => x.id === id);
    if (!s) throw { status: 404, error: "Staff member not found" };
    for (const k of ["name", "email", "jobTitle", "profession", "membershipNo"] as const) {
      if (b[k] !== undefined) (s as any)[k] = b[k];
    }
    save(db);
    return { ok: true };
  }

  if (method === "DELETE" && /^\/admin\/staff\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    if (!db.staff.some((x) => x.id === id)) throw { status: 404, error: "Staff member not found" };
    db.staff = db.staff.filter((x) => x.id !== id);
    save(db);
    return { ok: true };
  }

  // --- Admin: consultants (providers) ---
  if (method === "GET" && rawPath === "/admin/consultants") {
    requireAdmin(db);
    const list = db.providers
      .slice()
      .sort((a, b2) => a.name.localeCompare(b2.name))
      .map((p) => ({
        id: p.id, name: p.name, initials: p.initials, type: p.type,
        verified: p.verified, rating: p.rating, meta: p.meta, bio: p.bio,
        courseCount: db.courses.filter((c) => c.providerId === p.id).length,
      }));
    return { consultants: list };
  }

  if (method === "GET" && /^\/admin\/consultants\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const p = db.providers.find((x) => x.id === id);
    if (!p) throw { status: 404, error: "Consultant not found" };
    const provCourses = db.courses
      .filter((c) => c.providerId === id)
      .map((c) => ({
        id: c.id, title: c.title, profession: c.profession, format: c.format,
        points: c.points, rating: c.rating, fee: c.fee, schedule: c.schedule,
        enrollments: db.enrollments.filter((e) => e.courseId === c.id).length,
      }));
    return {
      consultant: {
        id: p.id, name: p.name, initials: p.initials, type: p.type,
        verified: p.verified, rating: p.rating, meta: p.meta, bio: p.bio,
        courses: provCourses,
      },
    };
  }

  if (method === "POST" && rawPath === "/admin/consultants") {
    requireAdmin(db);
    const name: string = b.name ?? "";
    const initials = (b.initials || name.split(" ").slice(0, 2).map((w: string) => w[0]).join("") || "?").toUpperCase();
    const p: Provider = {
      id: uid("prov_"), name, initials,
      type: b.type ?? "Training company",
      verified: b.verified ?? false,
      rating: b.rating !== undefined ? Number(b.rating) : 0,
      meta: b.meta ?? null, bio: b.bio ?? null,
    };
    db.providers.push(p);
    save(db);
    return { id: p.id };
  }

  if (method === "PATCH" && /^\/admin\/consultants\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const p = db.providers.find((x) => x.id === id);
    if (!p) throw { status: 404, error: "Consultant not found" };
    for (const k of ["name", "initials", "type", "meta", "bio"] as const) {
      if (b[k] !== undefined) (p as any)[k] = b[k];
    }
    if (b.verified !== undefined) p.verified = !!b.verified;
    if (b.rating !== undefined) p.rating = Number(b.rating);
    save(db);
    return { ok: true };
  }

  if (method === "DELETE" && /^\/admin\/consultants\/[^/]+$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    if (!db.providers.some((x) => x.id === id)) throw { status: 404, error: "Consultant not found" };
    const courseIds = db.courses.filter((c) => c.providerId === id).map((c) => c.id);
    db.enrollments = db.enrollments.filter((e) => !courseIds.includes(e.courseId));
    db.courses = db.courses.filter((c) => c.providerId !== id);
    db.providers = db.providers.filter((x) => x.id !== id);
    save(db);
    return { ok: true };
  }

  // --- Provider ---
  if (method === "GET" && rawPath === "/provider/home") {
    const pid = requireProvider(db);
    const provider = db.providers.find((p) => p.id === pid) ?? null;
    const myCourses = db.courses.filter((c) => c.providerId === pid);
    const myBids = db.bids
      .filter((b) => b.providerId === pid)
      .sort((a, b2) => +new Date(b2.createdAt) - +new Date(a.createdAt));
    const enrolments = myCourses.reduce(
      (s, c) => s + db.enrollments.filter((e) => e.courseId === c.id).length,
      0,
    );
    return {
      provider,
      stats: {
        courses: myCourses.length,
        approved: myCourses.filter((c) => c.status === "APPROVED").length,
        pending: myCourses.filter((c) => c.status === "PENDING").length,
        enrolments,
        openTenders: db.tenders.filter((t) => t.status === "OPEN").length,
        bids: myBids.length,
        submittedBids: myBids.filter((b) => b.status === "SUBMITTED").length,
      },
      recentBids: myBids.slice(0, 4).map((b) => bidView(db, b)),
    };
  }

  if (method === "GET" && rawPath === "/provider/courses") {
    const pid = requireProvider(db);
    const list = db.courses
      .filter((c) => c.providerId === pid)
      .map((c) => ({
        id: c.id, title: c.title, description: c.description, profession: c.profession,
        format: c.format, points: c.points, fee: c.fee, schedule: c.schedule,
        seats: c.seats, status: c.status,
        enrolments: db.enrollments.filter((e) => e.courseId === c.id).length,
      }));
    return { courses: list };
  }

  if (method === "POST" && rawPath === "/provider/courses") {
    const pid = requireProvider(db);
    const c: RawCourse = {
      id: uid("pc_"), providerId: pid, title: b.title, description: b.description,
      profession: b.profession, format: b.format, points: Number(b.points),
      rating: 0, reviewsCount: 0, schedule: b.schedule, fee: b.fee,
      seats: Number(b.seats), verified: false, status: "PENDING",
    };
    db.courses.push(c);
    save(db);
    return { id: c.id };
  }

  if (method === "PATCH" && /^\/provider\/courses\/[^/]+$/.test(rawPath)) {
    const pid = requireProvider(db);
    const id = rawPath.split("/")[3];
    const c = db.courses.find((x) => x.id === id && x.providerId === pid);
    if (!c) throw { status: 404, error: "Course not found" };
    for (const k of ["title", "description", "profession", "format", "schedule", "fee"] as const) {
      if (b[k] !== undefined) (c as any)[k] = b[k];
    }
    if (b.points !== undefined) c.points = Number(b.points);
    if (b.seats !== undefined) c.seats = Number(b.seats);
    save(db);
    return { ok: true };
  }

  if (method === "DELETE" && /^\/provider\/courses\/[^/]+$/.test(rawPath)) {
    const pid = requireProvider(db);
    const id = rawPath.split("/")[3];
    if (!db.courses.some((x) => x.id === id && x.providerId === pid)) throw { status: 404, error: "Course not found" };
    db.enrollments = db.enrollments.filter((e) => e.courseId !== id);
    db.courses = db.courses.filter((x) => x.id !== id);
    save(db);
    return { ok: true };
  }

  if (method === "GET" && rawPath === "/provider/tenders") {
    const pid = requireProvider(db);
    const list = db.tenders
      .filter((t) => t.status === "OPEN")
      .sort((a, b2) => +new Date(a.deadline) - +new Date(b2.deadline))
      .map((t) => {
        const mine = db.bids.find((x) => x.tenderId === t.id && x.providerId === pid);
        return {
          ...tenderView(db, t),
          bidCount: db.bids.filter((x) => x.tenderId === t.id).length,
          myBidStatus: mine?.status ?? null,
        };
      });
    return { tenders: list };
  }

  if (method === "GET" && /^\/provider\/tenders\/[^/]+$/.test(rawPath)) {
    const pid = requireProvider(db);
    const id = rawPath.split("/")[3];
    const t = db.tenders.find((x) => x.id === id);
    if (!t) throw { status: 404, error: "Tender not found" };
    const mine = db.bids.find((x) => x.tenderId === id && x.providerId === pid);
    return { tender: tenderView(db, t), myBid: mine ? bidView(db, mine) : null };
  }

  if (method === "POST" && /^\/provider\/tenders\/[^/]+\/bids$/.test(rawPath)) {
    const pid = requireProvider(db);
    const id = rawPath.split("/")[3];
    const t = db.tenders.find((x) => x.id === id);
    if (!t || t.status !== "OPEN") throw { status: 404, error: "Tender not open" };
    const status = b.submit === false ? "DRAFT" : "SUBMITTED";
    let bid = db.bids.find((x) => x.tenderId === id && x.providerId === pid);
    if (bid) {
      bid.amount = b.amount; bid.proposal = b.proposal;
      bid.docFileName = b.docFileName ?? null; bid.status = status;
    } else {
      bid = { id: uid("bd_"), tenderId: id, providerId: pid, amount: b.amount, proposal: b.proposal, docFileName: b.docFileName ?? null, status, createdAt: new Date().toISOString() };
      db.bids.push(bid);
    }
    save(db);
    return { id: bid.id, status: bid.status };
  }

  if (method === "GET" && rawPath === "/provider/bids") {
    const pid = requireProvider(db);
    const list = db.bids
      .filter((b2) => b2.providerId === pid)
      .sort((a, b2) => +new Date(b2.createdAt) - +new Date(a.createdAt))
      .map((b2) => bidView(db, b2));
    return { bids: list };
  }

  if (method === "DELETE" && /^\/provider\/bids\/[^/]+$/.test(rawPath)) {
    const pid = requireProvider(db);
    const id = rawPath.split("/")[3];
    if (!db.bids.some((x) => x.id === id && x.providerId === pid)) throw { status: 404, error: "Bid not found" };
    db.bids = db.bids.filter((x) => x.id !== id);
    save(db);
    return { ok: true };
  }

  // --- Organization ---
  if (method === "GET" && rawPath === "/organization/home") {
    const oid = requireOrg(db);
    const org = db.organizations.find((o) => o.id === oid) ?? null;
    const myTenders = db.tenders.filter((t) => t.organizationId === oid);
    const tenderIds = myTenders.map((t) => t.id);
    const received = db.bids.filter((b) => tenderIds.includes(b.tenderId) && VISIBLE_BID.includes(b.status));
    return {
      organization: org,
      stats: {
        staff: db.staff.filter((s) => s.organizationId === oid).length,
        tenders: myTenders.length,
        openTenders: myTenders.filter((t) => t.status === "OPEN").length,
        awarded: myTenders.filter((t) => t.status === "AWARDED").length,
        receivedBids: received.length,
      },
    };
  }

  if (method === "GET" && rawPath === "/organization/staff") {
    const oid = requireOrg(db);
    return { staff: db.staff.filter((s) => s.organizationId === oid).sort((a, b2) => a.name.localeCompare(b2.name)) };
  }

  if (method === "POST" && rawPath === "/organization/staff") {
    const oid = requireOrg(db);
    const s: Staff = { id: uid("st_"), organizationId: oid, name: b.name, email: b.email ?? null, jobTitle: b.jobTitle ?? null, profession: b.profession ?? null, membershipNo: b.membershipNo ?? null, createdAt: new Date().toISOString() };
    db.staff.push(s);
    save(db);
    return { id: s.id };
  }

  if (method === "PATCH" && /^\/organization\/staff\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    const s = db.staff.find((x) => x.id === id && x.organizationId === oid);
    if (!s) throw { status: 404, error: "Staff member not found" };
    for (const k of ["name", "email", "jobTitle", "profession", "membershipNo"] as const) {
      if (b[k] !== undefined) (s as any)[k] = b[k];
    }
    save(db);
    return { ok: true };
  }

  if (method === "DELETE" && /^\/organization\/staff\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    if (!db.staff.some((x) => x.id === id && x.organizationId === oid)) throw { status: 404, error: "Staff member not found" };
    db.staff = db.staff.filter((x) => x.id !== id);
    save(db);
    return { ok: true };
  }

  if (method === "GET" && rawPath === "/organization/tenders") {
    const oid = requireOrg(db);
    const list = db.tenders
      .filter((t) => t.organizationId === oid)
      .sort((a, b2) => a.id < b2.id ? 1 : -1)
      .map((t) => ({
        id: t.id, title: t.title, category: t.category, deliveryMode: t.deliveryMode,
        budget: t.budget, seats: t.seats, deadline: t.deadline, status: t.status,
        bidCount: db.bids.filter((x) => x.tenderId === t.id && VISIBLE_BID.includes(x.status)).length,
      }));
    return { tenders: list };
  }

  if (method === "POST" && rawPath === "/organization/tenders") {
    const oid = requireOrg(db);
    const t: DbTender = {
      id: uid("tn_"), organizationId: oid, title: b.title, description: b.description,
      category: b.category, deliveryMode: b.deliveryMode ?? "Flexible", budget: b.budget,
      seats: Number(b.seats), deadline: iso(b.deadline), status: "OPEN",
    };
    db.tenders.push(t);
    save(db);
    return { id: t.id };
  }

  if (method === "GET" && /^\/organization\/tenders\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    const t = db.tenders.find((x) => x.id === id && x.organizationId === oid);
    if (!t) throw { status: 404, error: "Tender not found" };
    const bids = db.bids
      .filter((x) => x.tenderId === id && VISIBLE_BID.includes(x.status))
      .sort((a, b2) => +new Date(a.createdAt) - +new Date(b2.createdAt))
      .map((x) => {
        const p = db.providers.find((pp) => pp.id === x.providerId);
        return {
          id: x.id, amount: x.amount, proposal: x.proposal, docFileName: x.docFileName,
          status: x.status, createdAt: x.createdAt,
          provider: { id: x.providerId, name: p?.name ?? "Provider", initials: p?.initials ?? "?", type: p?.type ?? "", rating: p?.rating ?? 0, verified: p?.verified ?? false },
        };
      });
    return {
      tender: { id: t.id, title: t.title, description: t.description, category: t.category, deliveryMode: t.deliveryMode, budget: t.budget, seats: t.seats, deadline: t.deadline, status: t.status },
      bids,
    };
  }

  if (method === "PATCH" && /^\/organization\/tenders\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    const t = db.tenders.find((x) => x.id === id && x.organizationId === oid);
    if (!t) throw { status: 404, error: "Tender not found" };
    for (const k of ["title", "description", "category", "deliveryMode", "budget", "status"] as const) {
      if (b[k] !== undefined) (t as any)[k] = b[k];
    }
    if (b.seats !== undefined) t.seats = Number(b.seats);
    if (b.deadline !== undefined) t.deadline = iso(b.deadline);
    save(db);
    return { ok: true };
  }

  if (method === "DELETE" && /^\/organization\/tenders\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    if (!db.tenders.some((x) => x.id === id && x.organizationId === oid)) throw { status: 404, error: "Tender not found" };
    db.bids = db.bids.filter((x) => x.tenderId !== id);
    db.tenders = db.tenders.filter((x) => x.id !== id);
    save(db);
    return { ok: true };
  }

  if (method === "PATCH" && /^\/organization\/bids\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    const bid = db.bids.find((x) => x.id === id);
    const tender = bid ? db.tenders.find((t) => t.id === bid.tenderId) : null;
    if (!bid || !tender || tender.organizationId !== oid) throw { status: 404, error: "Bid not found" };
    bid.status = b.status;
    if (b.status === "ACCEPTED") {
      tender.status = "AWARDED";
      for (const other of db.bids) {
        if (other.tenderId === tender.id && other.id !== bid.id && (other.status === "SUBMITTED" || other.status === "SHORTLISTED")) {
          other.status = "REJECTED";
        }
      }
    }
    save(db);
    return { ok: true };
  }

  if (method === "GET" && rawPath === "/organization/reports") {
    const oid = requireOrg(db);
    const staff = db.staff.filter((s) => s.organizationId === oid);
    const myTenders = db.tenders.filter((t) => t.organizationId === oid);
    const tenderIds = myTenders.map((t) => t.id);
    const byProfession: Record<string, number> = {};
    for (const s of staff) {
      const key = s.profession ?? "Other";
      byProfession[key] = (byProfession[key] ?? 0) + 1;
    }
    return {
      staffTotal: staff.length,
      byProfession,
      tendersByStatus: {
        OPEN: myTenders.filter((t) => t.status === "OPEN").length,
        AWARDED: myTenders.filter((t) => t.status === "AWARDED").length,
        CLOSED: myTenders.filter((t) => t.status === "CLOSED").length,
      },
      bidsReceived: db.bids.filter((b2) => tenderIds.includes(b2.tenderId) && VISIBLE_BID.includes(b2.status)).length,
    };
  }

  // --- Organization: profile ---
  if (method === "GET" && rawPath === "/organization/profile") {
    const oid = requireOrg(db);
    return { organization: db.organizations.find((o) => o.id === oid) ?? null };
  }
  if (method === "PATCH" && rawPath === "/organization/profile") {
    const oid = requireOrg(db);
    const org = db.organizations.find((o) => o.id === oid);
    if (!org) throw { status: 404, error: "Organization not found" };
    for (const k of ["name", "sector", "district", "contactName", "contactEmail", "contactPhone"] as const) {
      if (b[k] !== undefined) (org as any)[k] = b[k];
    }
    save(db);
    return { ok: true };
  }

  // --- Organization: consultant directory ---
  if (method === "GET" && rawPath === "/organization/consultants") {
    requireOrg(db);
    const list = db.providers
      .slice()
      .sort((a, b2) => (a.verified === b2.verified ? b2.rating - a.rating : a.verified ? -1 : 1))
      .map((p) => ({
        id: p.id, name: p.name, initials: p.initials, type: p.type,
        verified: p.verified, rating: p.rating, meta: p.meta, bio: p.bio,
        courseCount: db.courses.filter((c) => c.providerId === p.id).length,
      }));
    return { consultants: list };
  }
  if (method === "GET" && /^\/organization\/consultants\/[^/]+$/.test(rawPath)) {
    requireOrg(db);
    const id = rawPath.split("/")[3];
    const p = db.providers.find((x) => x.id === id);
    if (!p) throw { status: 404, error: "Consultant not found" };
    return {
      consultant: {
        id: p.id, name: p.name, initials: p.initials, type: p.type,
        verified: p.verified, rating: p.rating, meta: p.meta, bio: p.bio,
        courses: db.courses.filter((c) => c.providerId === id && c.status === "APPROVED").map((c) => ({ id: c.id, title: c.title, profession: c.profession, format: c.format, points: c.points, fee: c.fee, schedule: c.schedule })),
      },
    };
  }

  // --- Organization: bookings ---
  if (method === "GET" && rawPath === "/organization/bookings") {
    const oid = requireOrg(db);
    return { bookings: db.bookings.filter((bk) => bk.organizationId === oid).sort((a, b2) => +new Date(a.date) - +new Date(b2.date)) };
  }
  if (method === "POST" && rawPath === "/organization/bookings") {
    const oid = requireOrg(db);
    const bk: DbBooking = {
      id: uid("bk_"), organizationId: oid, title: b.title, providerName: b.providerName ?? null,
      category: b.category ?? null, staffCount: Number(b.staffCount), date: iso(b.date),
      cost: b.cost, paid: false, status: "SCHEDULED", attendance: null, certificateIssued: false,
      outcome: null, createdAt: new Date().toISOString(),
    };
    db.bookings.push(bk);
    save(db);
    return { id: bk.id };
  }
  if (method === "PATCH" && /^\/organization\/bookings\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    const bk = db.bookings.find((x) => x.id === id && x.organizationId === oid);
    if (!bk) throw { status: 404, error: "Booking not found" };
    for (const k of ["title", "providerName", "category", "cost", "status", "outcome"] as const) {
      if (b[k] !== undefined) (bk as any)[k] = b[k];
    }
    if (b.staffCount !== undefined) bk.staffCount = Number(b.staffCount);
    if (b.date !== undefined) bk.date = iso(b.date);
    if (b.paid !== undefined) bk.paid = !!b.paid;
    if (b.attendance !== undefined) bk.attendance = Number(b.attendance);
    if (b.certificateIssued !== undefined) bk.certificateIssued = !!b.certificateIssued;
    save(db);
    return { ok: true };
  }
  if (method === "DELETE" && /^\/organization\/bookings\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    if (!db.bookings.some((x) => x.id === id && x.organizationId === oid)) throw { status: 404, error: "Booking not found" };
    db.bookings = db.bookings.filter((x) => x.id !== id);
    save(db);
    return { ok: true };
  }

  // --- Organization: departments ---
  if (method === "GET" && rawPath === "/organization/departments") {
    requireOrg(db);
    return { departments: ORG_DEPARTMENTS };
  }

  // --- Organization: course catalog (global, bookable) ---
  if (method === "GET" && rawPath === "/organization/catalog") {
    requireOrg(db);
    return { sessions: db.catalog.map((c) => ({ ...c, spotsLeft: Math.max(0, c.capacity - c.booked) })) };
  }
  if (method === "POST" && /^\/organization\/catalog\/[^/]+\/book$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    const c = db.catalog.find((x) => x.id === id);
    if (!c) throw { status: 404, error: "Course not found" };
    const want = Math.max(1, Number(b.count) || 1);
    const spotsLeft = Math.max(0, c.capacity - c.booked);
    if (spotsLeft <= 0) throw { status: 400, error: "This course is fully booked" };
    const taken = Math.min(want, spotsLeft);
    c.booked += taken;
    // Record the booking so it also appears under Bookings.
    const parsed = new Date(c.date);
    const when = isNaN(+parsed) ? new Date().toISOString() : parsed.toISOString();
    db.bookings.push({ id: uid("bk_"), organizationId: oid, title: c.title, providerName: c.consultant, category: c.dept, staffCount: taken, date: when, cost: c.fee, paid: false, status: "SCHEDULED", attendance: null, certificateIssued: false, outcome: null, createdAt: new Date().toISOString() });
    save(db);
    return { ok: true, booked: taken, spotsLeft: Math.max(0, c.capacity - c.booked) };
  }

  if (method === "POST" && /^\/organization\/catalog\/[^/]+\/refer$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    const c = db.catalog.find((x) => x.id === id);
    if (!c) throw { status: 404, error: "Course not found" };
    if (!b.peerEmail || !String(b.peerEmail).includes("@")) throw { status: 400, error: "A valid peer email is required" };
    const list = (db.referrals ??= []);
    const ref: DbReferral = { id: uid("ref_"), organizationId: oid, catalogId: id, courseTitle: c.title, peerName: b.peerName ?? "", peerEmail: b.peerEmail, message: b.message ?? "", createdAt: new Date().toISOString() };
    list.push(ref);
    save(db);
    return { ok: true, id: ref.id };
  }

  // --- Organization: annual plan (planned sessions) ---
  if (method === "GET" && rawPath === "/organization/planned-sessions") {
    const oid = requireOrg(db);
    const sessions = db.plannedSessions
      .filter((p) => p.organizationId === oid)
      .map((p) => plannedView(db, p));
    return { sessions };
  }
  if (method === "POST" && rawPath === "/organization/planned-sessions") {
    const oid = requireOrg(db);
    const d = new Date(b.date);
    const month = isNaN(+d) ? "" : d.toLocaleString("en-GB", { month: "short" });
    const dateLabel = isNaN(+d) ? String(b.date ?? "") : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const p: DbPlanned = {
      id: uid("ps_"), organizationId: oid, course: b.course, description: b.description ?? "",
      dept: b.dept, sector: b.sector, mode: b.mode ?? "Physical",
      venue: b.venue ?? "", address: b.address ?? "", platform: b.platform ?? "", link: b.link ?? "", access: b.access ?? "",
      cost: Number(b.cost) || 0, costBasis: b.costBasis ?? "Per participant",
      provider: b.provider ?? "", providerType: b.providerType ?? "External",
      date: dateLabel, month, time: b.time ?? "", capacity: Number(b.capacity) || 0,
      status: "Planned", allocated: [],
    };
    db.plannedSessions.push(p);
    save(db);
    return { id: p.id };
  }
  if (method === "PATCH" && /^\/organization\/planned-sessions\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    const p = db.plannedSessions.find((x) => x.id === id && x.organizationId === oid);
    if (!p) throw { status: 404, error: "Session not found" };
    if (b.toggleStaff !== undefined) {
      const sid = String(b.toggleStaff);
      if (p.allocated.includes(sid)) p.allocated = p.allocated.filter((x) => x !== sid);
      else if (p.allocated.length < p.capacity) p.allocated.push(sid);
      else throw { status: 400, error: "Session is at capacity" };
    }
    if (b.advanceStatus) {
      const order = ["Planned", "In progress", "Completed"];
      const i = order.indexOf(p.status);
      p.status = order[Math.min(order.length - 1, i + 1)];
    }
    if (b.status !== undefined) p.status = b.status;
    save(db);
    return { ok: true };
  }
  if (method === "DELETE" && /^\/organization\/planned-sessions\/[^/]+$/.test(rawPath)) {
    const oid = requireOrg(db);
    const id = rawPath.split("/")[3];
    if (!db.plannedSessions.some((x) => x.id === id && x.organizationId === oid)) throw { status: 404, error: "Session not found" };
    db.plannedSessions = db.plannedSessions.filter((x) => x.id !== id);
    save(db);
    return { ok: true };
  }

  // --- Organization: rich reports overview ---
  if (method === "GET" && rawPath === "/organization/overview") {
    const oid = requireOrg(db);
    return buildOverview(db, oid);
  }

  // --- Admin: course & trainer approval queues ---
  if (method === "GET" && rawPath === "/admin/course-queue") {
    requireAdmin(db);
    const q = db.courses.filter((c) => c.status === "PENDING").map((c) => {
      const p = db.providers.find((pp) => pp.id === c.providerId);
      return { id: c.id, title: c.title, description: c.description, profession: c.profession, format: c.format, points: c.points, fee: c.fee, schedule: c.schedule, seats: c.seats, provider: { id: c.providerId, name: p?.name ?? "Provider", initials: p?.initials ?? "?", verified: p?.verified ?? false } };
    });
    return { queue: q };
  }
  if (method === "POST" && /^\/admin\/courses\/[^/]+\/approve$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const c = db.courses.find((x) => x.id === id);
    if (!c) throw { status: 404, error: "Course not found" };
    c.status = "APPROVED"; c.verified = true;
    if (typeof b.points === "number") c.points = b.points;
    save(db);
    return { ok: true };
  }
  if (method === "POST" && /^\/admin\/courses\/[^/]+\/reject$/.test(rawPath)) {
    requireAdmin(db);
    const id = rawPath.split("/")[3];
    const c = db.courses.find((x) => x.id === id);
    if (!c) throw { status: 404, error: "Course not found" };
    c.status = "REJECTED";
    save(db);
    return { ok: true };
  }
  if (method === "GET" && rawPath === "/admin/trainer-queue") {
    requireAdmin(db);
    const q = db.providers.filter((p) => !p.verified).map((p) => ({
      id: p.id, name: p.name, initials: p.initials, type: p.type,
      meta: p.meta, bio: p.bio, courseCount: db.courses.filter((c) => c.providerId === p.id).length,
    }));
    return { queue: q };
  }

  throw { status: 404, error: "Not found" };
}

function byDateDesc(a: { activityDate: string }, b: { activityDate: string }): number {
  return +new Date(b.activityDate) - +new Date(a.activityDate);
}
