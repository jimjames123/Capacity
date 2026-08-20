import { Router } from "express";
import type { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, hashPassword, type AuthedRequest } from "../lib/auth.js";
import { buildCycleSummary } from "../lib/summary.js";
import { maybeIssueCertificate } from "../lib/cert.js";

export const adminRouter = Router();
adminRouter.use(requireAuth);

/** Requires the authenticated user to have the ADMIN role. */
async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  (req as AuthedRequest & { admin?: typeof user }).admin = user;
  next();
}
adminRouter.use(requireAdmin);

/** GET /api/admin/overview — platform-wide verification stats. */
adminRouter.get("/overview", async (_req, res) => {
  const [members, providers, courses, entries, cycles] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.provider.count(),
    prisma.course.count(),
    prisma.cpdEntry.findMany(),
    prisma.cycle.findMany(),
  ]);

  const byStatus = { VERIFIED: 0, PENDING: 0, NEEDS_PROOF: 0, REJECTED: 0 };
  for (const e of entries) {
    if (e.status in byStatus) byStatus[e.status as keyof typeof byStatus] += 1;
  }
  const certificatesIssued = cycles.filter((c) => c.certRef).length;

  res.json({
    stats: {
      members,
      providers,
      courses,
      certificatesIssued,
      awaitingReview: byStatus.PENDING,
      needsProof: byStatus.NEEDS_PROOF,
      verified: byStatus.VERIFIED,
      rejected: byStatus.REJECTED,
    },
  });
});

/** GET /api/admin/members — every member with current-cycle progress. */
adminRouter.get("/members", async (_req, res) => {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { name: "asc" },
    include: {
      cycles: { where: { isCurrent: true }, include: { entries: true } },
    },
  });

  const rows = members.map((m) => {
    const cycle = m.cycles[0];
    const summary = cycle ? buildCycleSummary(cycle, cycle.entries) : null;
    const pending = cycle
      ? cycle.entries.filter(
          (e) => e.status === "PENDING" || e.status === "NEEDS_PROOF",
        ).length
      : 0;
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
      pendingCount: pending,
    };
  });
  res.json({ members: rows });
});

/** GET /api/admin/members/:id — full member profile with cycles + entries. */
adminRouter.get("/members/:id", async (req, res) => {
  const member = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      cycles: {
        orderBy: { startDate: "desc" },
        include: { entries: { orderBy: { activityDate: "desc" } } },
      },
    },
  });
  if (!member || member.role !== "MEMBER") {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json({
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      profession: member.profession,
      membershipNo: member.membershipNo,
      professionalBody: member.professionalBody,
      jobTitle: member.jobTitle,
      organisation: member.organisation,
    },
    cycles: member.cycles.map((c) => ({
      ...buildCycleSummary(c, c.entries),
      certRef: c.certRef,
      registrarName: c.registrarName,
      issuedAt: c.issuedAt,
      entries: c.entries,
    })),
  });
});

/** GET /api/admin/queue — entries awaiting review across all members. */
adminRouter.get("/queue", async (_req, res) => {
  const entries = await prisma.cpdEntry.findMany({
    where: { status: { in: ["PENDING", "NEEDS_PROOF"] } },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
  res.json({
    queue: entries.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      activityDate: e.activityDate,
      pointsClaimed: e.pointsClaimed,
      status: e.status,
      proofFileName: e.proofFileName,
      note: e.note,
      member: { id: e.user.id, name: e.user.name, membershipNo: e.user.membershipNo },
    })),
  });
});

/** Shared verify/reject handler. */
async function decideEntry(
  req: AuthedRequest,
  res: Response,
  status: "VERIFIED" | "REJECTED",
) {
  const admin = (req as AuthedRequest & { admin?: { name: string } }).admin;
  const entry = await prisma.cpdEntry.findUnique({
    where: { id: req.params.id },
    include: { cycle: true, user: true },
  });
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  if (status === "VERIFIED" && entry.status === "NEEDS_PROOF" && !entry.proofFileName) {
    res.status(400).json({ error: "Cannot verify an entry without proof" });
    return;
  }

  const updated = await prisma.cpdEntry.update({
    where: { id: entry.id },
    data: { status },
  });

  // Verifying may complete the cycle → issue its certificate.
  if (status === "VERIFIED") {
    await maybeIssueCertificate(entry.cycle, entry.user, admin?.name ?? "The Registrar");
  }
  res.json({ entry: updated });
}

/** POST /api/admin/entries/:id/verify */
adminRouter.post("/entries/:id/verify", (req: AuthedRequest, res) =>
  decideEntry(req, res, "VERIFIED"),
);

/** POST /api/admin/entries/:id/reject */
adminRouter.post("/entries/:id/reject", (req: AuthedRequest, res) =>
  decideEntry(req, res, "REJECTED"),
);

// ---------------------------------------------------------------------------
// Members CRUD
// ---------------------------------------------------------------------------

const memberCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  profession: z.string().optional(),
  membershipNo: z.string().optional(),
  professionalBody: z.string().optional(),
  jobTitle: z.string().optional(),
  organisation: z.string().optional(),
});

/** POST /api/admin/members — register a new member (with a starting cycle). */
adminRouter.post("/members", async (req, res) => {
  const parsed = memberCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid member details", issues: parsed.error.issues });
    return;
  }
  const d = parsed.data;
  if (await prisma.user.findUnique({ where: { email: d.email } })) {
    res.status(409).json({ error: "A user with that email already exists" });
    return;
  }
  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email,
      passwordHash: await hashPassword(d.password ?? "password123"),
      role: "MEMBER",
      profession: d.profession ?? null,
      membershipNo: d.membershipNo ?? null,
      professionalBody: d.professionalBody ?? null,
      jobTitle: d.jobTitle ?? null,
      organisation: d.organisation ?? null,
      onboarded: true,
    },
  });
  const year = new Date().getFullYear();
  await prisma.cycle.create({
    data: {
      userId: user.id,
      label: `Jan ${year} – Dec ${year}`,
      startDate: new Date(`${year}-01-01T00:00:00Z`),
      endDate: new Date(`${year}-12-31T23:59:59Z`),
      requiredPoints: 12,
      isCurrent: true,
    },
  });
  res.status(201).json({ id: user.id });
});

/** PATCH /api/admin/members/:id — update a member's profile. */
adminRouter.patch("/members/:id", async (req, res) => {
  const parsed = memberCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid member details" });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.role !== "MEMBER") {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  const { password, ...fields } = parsed.data;
  await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...fields,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });
  res.json({ ok: true });
});

/** DELETE /api/admin/members/:id — remove a member and their CPD data. */
adminRouter.delete("/members/:id", async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.role !== "MEMBER") {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Organizations CRUD
// ---------------------------------------------------------------------------

const orgSchema = z.object({
  name: z.string().min(2),
  sector: z.string().optional(),
  district: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
});

/** GET /api/admin/organizations — all organizations with staff counts. */
adminRouter.get("/organizations", async (_req, res) => {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { staff: true } } },
  });
  res.json({
    organizations: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      sector: o.sector,
      district: o.district,
      contactName: o.contactName,
      contactEmail: o.contactEmail,
      contactPhone: o.contactPhone,
      staffCount: o._count.staff,
    })),
  });
});

/** GET /api/admin/organizations/:id — organization with its staff. */
adminRouter.get("/organizations/:id", async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.params.id },
    include: { staff: { orderBy: { name: "asc" } } },
  });
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json({ organization: org });
});

adminRouter.post("/organizations", async (req, res) => {
  const parsed = orgSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid organization details" });
    return;
  }
  const org = await prisma.organization.create({ data: parsed.data });
  res.status(201).json({ id: org.id });
});

adminRouter.patch("/organizations/:id", async (req, res) => {
  const parsed = orgSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid organization details" });
    return;
  }
  const existing = await prisma.organization.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  await prisma.organization.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ ok: true });
});

adminRouter.delete("/organizations/:id", async (req, res) => {
  const existing = await prisma.organization.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  await prisma.organization.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Staff CRUD
// ---------------------------------------------------------------------------

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().optional(),
  jobTitle: z.string().optional(),
  profession: z.string().optional(),
  membershipNo: z.string().optional(),
});

adminRouter.post("/organizations/:id/staff", async (req, res) => {
  const parsed = staffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid staff details" });
    return;
  }
  const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const staff = await prisma.staff.create({
    data: { ...parsed.data, organizationId: org.id },
  });
  res.status(201).json({ id: staff.id });
});

adminRouter.patch("/staff/:id", async (req, res) => {
  const parsed = staffSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid staff details" });
    return;
  }
  const existing = await prisma.staff.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }
  await prisma.staff.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ ok: true });
});

adminRouter.delete("/staff/:id", async (req, res) => {
  const existing = await prisma.staff.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }
  await prisma.staff.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
