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
  CpdEntry,
  Cycle,
  EntryStatus,
  Provider,
  Review,
  User,
} from "./types";

const LS_KEY = "cs_static_db_v1";

interface StoredUser extends User {
  password: string;
}

interface DB {
  users: StoredUser[];
  cycles: Cycle[];
  entries: (CpdEntry & { userId: string; cycleId: string })[];
  enrollments: { id: string; userId: string; courseId: string; status: string; createdAt: string }[];
}

// ---- Static catalogue (providers, courses, reviews) ------------------------
// These never change, so they live as constants rather than in localStorage.

const providers: Provider[] = [
  { id: "p1", name: "Makerere Executive Institute", initials: "ME", type: "Institution", verified: true, rating: 4.9, meta: "Kampala · 22 courses", bio: "The executive education arm of Makerere University, delivering accredited professional programmes across disciplines since 2009." },
  { id: "p2", name: "Deloitte Uganda Academy", initials: "DA", type: "Training company", verified: true, rating: 4.8, meta: "Kampala · 15 courses", bio: "Professional training from Deloitte's East Africa practice, covering finance, risk, and governance." },
  { id: "p3", name: "Uganda Institute of Applied Professionals", initials: "UI", type: "Institution", verified: true, rating: 4.7, meta: "Jinja · 9 courses", bio: "Hands-on technical and engineering CPD delivered by practising professionals." },
  { id: "p4", name: "BrandHouse East Africa", initials: "BH", type: "Training company", verified: true, rating: 4.6, meta: "Kampala · 7 courses", bio: "Marketing, communications, and brand strategy training for the region." },
  { id: "p5", name: "Dr. Grace Ssembatya", initials: "GS", type: "Individual consultant", verified: true, rating: 4.9, meta: "Independent · 5 courses", bio: "Organisational development consultant with 18 years across public-sector reform programmes." },
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

const courses: Course[] = [
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
): Course {
  const provider = providers.find((p) => p.id === providerId)!;
  return { id, title, description, profession, format, points, rating, reviewsCount, schedule, fee, seats, verified: true, provider };
}

function iso(d: string): string {
  return new Date(d).toISOString();
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

  return { users, cycles, entries, enrollments: [{ id: "en1", userId: aishaId, courseId: "c3", status: "ENROLLED", createdAt: iso("2026-02-01") }] };
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

// ---- Router ----------------------------------------------------------------

export async function handle(method: string, path: string, body: unknown): Promise<unknown> {
  const db = load();
  const b = (body ?? {}) as Record<string, any>;
  const [rawPath] = path.split("?");
  const query = new URLSearchParams(path.includes("?") ? path.slice(path.indexOf("?") + 1) : "");

  // --- Auth ---
  if (method === "POST" && rawPath === "/auth/signup") {
    if (db.users.some((u) => u.email === b.email)) throw { status: 409, error: "An account with that email already exists" };
    const user: StoredUser = { id: uid("u_"), email: b.email, password: b.password, name: b.name, role: "MEMBER", profession: b.profession ?? null, membershipNo: null, professionalBody: null, jobTitle: null, organisation: null, onboarded: false, createdAt: new Date().toISOString() };
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
    let list = courses.slice();
    if (prof && prof !== "All") list = list.filter((c) => c.profession === prof);
    if (fmt && fmt !== "All") list = list.filter((c) => c.format === fmt);
    list.sort((a, b2) => b2.rating - a.rating);
    return { courses: list, count: list.length };
  }

  if (method === "GET" && rawPath.startsWith("/courses/") && !rawPath.includes("enroll") && !rawPath.includes("me/")) {
    const id = rawPath.split("/")[2];
    const course = courses.find((c) => c.id === id);
    if (!course) throw { status: 404, error: "Course not found" };
    return { course: { ...course, reviews: reviewsByCourse[id] ?? [] } };
  }

  if (method === "POST" && /^\/courses\/[^/]+\/enroll$/.test(rawPath)) {
    const user = requireUser(db);
    const courseId = rawPath.split("/")[2];
    if (!courses.find((c) => c.id === courseId)) throw { status: 404, error: "Course not found" };
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

  throw { status: 404, error: "Not found" };
}

function byDateDesc(a: { activityDate: string }, b: { activityDate: string }): number {
  return +new Date(b.activityDate) - +new Date(a.activityDate);
}
