import { Router } from "express";
import type { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const organizationRouter = Router();
organizationRouter.use(requireAuth);

interface OrgRequest extends AuthedRequest {
  organizationId?: string;
}

async function requireOrg(
  req: OrgRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== "ORG" || !user.organizationId) {
    res.status(403).json({ error: "Organization access required" });
    return;
  }
  req.organizationId = user.organizationId;
  next();
}
organizationRouter.use(requireOrg);

/** Bids the org may see (never other providers' drafts). */
const VISIBLE = ["SUBMITTED", "SHORTLISTED", "ACCEPTED", "REJECTED"];

/** GET /api/organization/home — profile + headline stats. */
organizationRouter.get("/home", async (req: OrgRequest, res) => {
  const oid = req.organizationId!;
  const [org, staffCount, tenders] = await Promise.all([
    prisma.organization.findUnique({ where: { id: oid } }),
    prisma.staff.count({ where: { organizationId: oid } }),
    prisma.tender.findMany({
      where: { organizationId: oid },
      include: { _count: { select: { bids: true } }, bids: true },
    }),
  ]);
  const receivedBids = tenders.reduce(
    (s, t) => s + t.bids.filter((b) => VISIBLE.includes(b.status)).length,
    0,
  );
  res.json({
    organization: org,
    stats: {
      staff: staffCount,
      tenders: tenders.length,
      openTenders: tenders.filter((t) => t.status === "OPEN").length,
      awarded: tenders.filter((t) => t.status === "AWARDED").length,
      receivedBids,
    },
  });
});

// ---- Staff -----------------------------------------------------------------

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().optional(),
  jobTitle: z.string().optional(),
  profession: z.string().optional(),
  membershipNo: z.string().optional(),
});

organizationRouter.get("/staff", async (req: OrgRequest, res) => {
  const staff = await prisma.staff.findMany({
    where: { organizationId: req.organizationId! },
    orderBy: { name: "asc" },
  });
  res.json({ staff });
});

organizationRouter.post("/staff", async (req: OrgRequest, res) => {
  const parsed = staffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid staff details" });
    return;
  }
  const s = await prisma.staff.create({
    data: { ...parsed.data, organizationId: req.organizationId! },
  });
  res.status(201).json({ id: s.id });
});

async function ownedStaff(req: OrgRequest) {
  const s = await prisma.staff.findUnique({ where: { id: req.params.id } });
  return s && s.organizationId === req.organizationId ? s : null;
}

organizationRouter.patch("/staff/:id", async (req: OrgRequest, res) => {
  if (!(await ownedStaff(req))) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }
  const parsed = staffSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid staff details" });
    return;
  }
  await prisma.staff.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ ok: true });
});

organizationRouter.delete("/staff/:id", async (req: OrgRequest, res) => {
  if (!(await ownedStaff(req))) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }
  await prisma.staff.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---- Tenders ---------------------------------------------------------------

const tenderSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  category: z.string().min(1),
  deliveryMode: z.string().optional(),
  budget: z.string().min(1),
  seats: z.number().int().min(1).max(10000),
  deadline: z.string(),
});

organizationRouter.get("/tenders", async (req: OrgRequest, res) => {
  const tenders = await prisma.tender.findMany({
    where: { organizationId: req.organizationId! },
    orderBy: { createdAt: "desc" },
    include: { bids: true },
  });
  res.json({
    tenders: tenders.map((t) => ({
      id: t.id, title: t.title, category: t.category, deliveryMode: t.deliveryMode,
      budget: t.budget, seats: t.seats, deadline: t.deadline, status: t.status,
      bidCount: t.bids.filter((b) => VISIBLE.includes(b.status)).length,
    })),
  });
});

organizationRouter.post("/tenders", async (req: OrgRequest, res) => {
  const parsed = tenderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid tender details", issues: parsed.error.issues });
    return;
  }
  const t = await prisma.tender.create({
    data: {
      ...parsed.data,
      deliveryMode: parsed.data.deliveryMode ?? "Flexible",
      deadline: new Date(parsed.data.deadline),
      organizationId: req.organizationId!,
      status: "OPEN",
    },
  });
  res.status(201).json({ id: t.id });
});

async function ownedTender(req: OrgRequest, id: string) {
  const t = await prisma.tender.findUnique({ where: { id } });
  return t && t.organizationId === req.organizationId ? t : null;
}

/** GET /api/organization/tenders/:id — tender + its visible bids (with provider). */
organizationRouter.get("/tenders/:id", async (req: OrgRequest, res) => {
  const t = await ownedTender(req, req.params.id);
  if (!t) {
    res.status(404).json({ error: "Tender not found" });
    return;
  }
  const bids = await prisma.bid.findMany({
    where: { tenderId: t.id, status: { in: VISIBLE } },
    orderBy: { createdAt: "asc" },
    include: { provider: true },
  });
  res.json({
    tender: {
      id: t.id, title: t.title, description: t.description, category: t.category,
      deliveryMode: t.deliveryMode, budget: t.budget, seats: t.seats,
      deadline: t.deadline, status: t.status,
    },
    bids: bids.map((b) => ({
      id: b.id, amount: b.amount, proposal: b.proposal, docFileName: b.docFileName,
      status: b.status, createdAt: b.createdAt,
      provider: { id: b.provider.id, name: b.provider.name, initials: b.provider.initials, type: b.provider.type, rating: b.provider.rating, verified: b.provider.verified },
    })),
  });
});

organizationRouter.patch("/tenders/:id", async (req: OrgRequest, res) => {
  const t = await ownedTender(req, req.params.id);
  if (!t) {
    res.status(404).json({ error: "Tender not found" });
    return;
  }
  const schema = tenderSchema.partial().extend({ status: z.enum(["OPEN", "CLOSED", "AWARDED"]).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid tender details" });
    return;
  }
  const { deadline, ...rest } = parsed.data;
  await prisma.tender.update({
    where: { id: t.id },
    data: { ...rest, ...(deadline ? { deadline: new Date(deadline) } : {}) },
  });
  res.json({ ok: true });
});

organizationRouter.delete("/tenders/:id", async (req: OrgRequest, res) => {
  const t = await ownedTender(req, req.params.id);
  if (!t) {
    res.status(404).json({ error: "Tender not found" });
    return;
  }
  await prisma.tender.delete({ where: { id: t.id } });
  res.json({ ok: true });
});

/** PATCH /api/organization/bids/:id — decide on a received bid. */
organizationRouter.patch("/bids/:id", async (req: OrgRequest, res) => {
  const decision = z
    .object({ status: z.enum(["SHORTLISTED", "ACCEPTED", "REJECTED", "SUBMITTED"]) })
    .safeParse(req.body);
  if (!decision.success) {
    res.status(400).json({ error: "Invalid decision" });
    return;
  }
  const bid = await prisma.bid.findUnique({ where: { id: req.params.id }, include: { tender: true } });
  if (!bid || bid.tender.organizationId !== req.organizationId) {
    res.status(404).json({ error: "Bid not found" });
    return;
  }
  await prisma.bid.update({ where: { id: bid.id }, data: { status: decision.data.status } });

  // Accepting a bid awards the tender and rejects the other submitted bids.
  if (decision.data.status === "ACCEPTED") {
    await prisma.tender.update({ where: { id: bid.tenderId }, data: { status: "AWARDED" } });
    await prisma.bid.updateMany({
      where: { tenderId: bid.tenderId, id: { not: bid.id }, status: { in: ["SUBMITTED", "SHORTLISTED"] } },
      data: { status: "REJECTED" },
    });
  }
  res.json({ ok: true });
});

// ---- Reports ---------------------------------------------------------------

organizationRouter.get("/reports", async (req: OrgRequest, res) => {
  const oid = req.organizationId!;
  const [staff, tenders] = await Promise.all([
    prisma.staff.findMany({ where: { organizationId: oid } }),
    prisma.tender.findMany({ where: { organizationId: oid }, include: { bids: true } }),
  ]);
  const byProfession: Record<string, number> = {};
  for (const s of staff) {
    const key = s.profession ?? "Other";
    byProfession[key] = (byProfession[key] ?? 0) + 1;
  }
  res.json({
    staffTotal: staff.length,
    byProfession,
    tendersByStatus: {
      OPEN: tenders.filter((t) => t.status === "OPEN").length,
      AWARDED: tenders.filter((t) => t.status === "AWARDED").length,
      CLOSED: tenders.filter((t) => t.status === "CLOSED").length,
    },
    bidsReceived: tenders.reduce(
      (s, t) => s + t.bids.filter((b) => VISIBLE.includes(b.status)).length,
      0,
    ),
  });
});
