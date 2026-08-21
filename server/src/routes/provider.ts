import { Router } from "express";
import type { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const providerRouter = Router();
providerRouter.use(requireAuth);

interface ProviderRequest extends AuthedRequest {
  providerId?: string;
}

/** Requires a PROVIDER account linked to a provider profile. */
async function requireProvider(
  req: ProviderRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== "PROVIDER" || !user.providerId) {
    res.status(403).json({ error: "Provider access required" });
    return;
  }
  req.providerId = user.providerId;
  next();
}
providerRouter.use(requireProvider);

/** GET /api/provider/home — profile + headline stats + recent bids. */
providerRouter.get("/home", async (req: ProviderRequest, res) => {
  const pid = req.providerId!;
  const [provider, courses, bids, openTenders] = await Promise.all([
    prisma.provider.findUnique({ where: { id: pid } }),
    prisma.course.findMany({
      where: { providerId: pid },
      include: { _count: { select: { enrollments: true } } },
    }),
    prisma.bid.findMany({
      where: { providerId: pid },
      orderBy: { createdAt: "desc" },
      include: { tender: { include: { organization: true } } },
    }),
    prisma.tender.count({ where: { status: "OPEN" } }),
  ]);

  const enrolments = courses.reduce((s, c) => s + c._count.enrollments, 0);
  res.json({
    provider,
    stats: {
      courses: courses.length,
      approved: courses.filter((c) => c.status === "APPROVED").length,
      pending: courses.filter((c) => c.status === "PENDING").length,
      enrolments,
      openTenders,
      bids: bids.length,
      submittedBids: bids.filter((b) => b.status === "SUBMITTED").length,
    },
    recentBids: bids.slice(0, 4).map(serializeBid),
  });
});

// ---- My courses ------------------------------------------------------------

providerRouter.get("/courses", async (req: ProviderRequest, res) => {
  const courses = await prisma.course.findMany({
    where: { providerId: req.providerId! },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { enrollments: true } } },
  });
  res.json({
    courses: courses.map((c) => ({
      id: c.id, title: c.title, description: c.description, profession: c.profession,
      format: c.format, points: c.points, fee: c.fee, schedule: c.schedule,
      seats: c.seats, status: c.status, enrolments: c._count.enrollments,
    })),
  });
});

const courseSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  profession: z.string().min(1),
  format: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
  points: z.number().min(0).max(100),
  fee: z.string().min(1),
  schedule: z.string().min(1),
  seats: z.number().int().min(1).max(1000),
});

providerRouter.post("/courses", async (req: ProviderRequest, res) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid course details", issues: parsed.error.issues });
    return;
  }
  const c = await prisma.course.create({
    data: {
      ...parsed.data,
      providerId: req.providerId!,
      verified: false,
      status: "PENDING",
      rating: 0,
      reviewsCount: 0,
    },
  });
  res.status(201).json({ id: c.id });
});

async function ownedCourse(req: ProviderRequest) {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  return course && course.providerId === req.providerId ? course : null;
}

providerRouter.patch("/courses/:id", async (req: ProviderRequest, res) => {
  if (!(await ownedCourse(req))) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  const parsed = courseSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid course details" });
    return;
  }
  await prisma.course.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ ok: true });
});

providerRouter.delete("/courses/:id", async (req: ProviderRequest, res) => {
  if (!(await ownedCourse(req))) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  await prisma.course.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---- Tender board ----------------------------------------------------------

providerRouter.get("/tenders", async (req: ProviderRequest, res) => {
  const pid = req.providerId!;
  const tenders = await prisma.tender.findMany({
    where: { status: "OPEN" },
    orderBy: { deadline: "asc" },
    include: {
      organization: true,
      bids: { where: { providerId: pid } },
      _count: { select: { bids: true } },
    },
  });
  res.json({
    tenders: tenders.map((t) => ({
      ...serializeTender(t),
      bidCount: t._count.bids,
      myBidStatus: t.bids[0]?.status ?? null,
    })),
  });
});

providerRouter.get("/tenders/:id", async (req: ProviderRequest, res) => {
  const pid = req.providerId!;
  const tender = await prisma.tender.findUnique({
    where: { id: req.params.id },
    include: { organization: true, bids: { where: { providerId: pid } } },
  });
  if (!tender) {
    res.status(404).json({ error: "Tender not found" });
    return;
  }
  res.json({
    tender: serializeTender(tender),
    myBid: tender.bids[0] ? serializeBid({ ...tender.bids[0], tender }) : null,
  });
});

const bidSchema = z.object({
  amount: z.string().min(1),
  proposal: z.string().min(2),
  docFileName: z.string().optional(),
  submit: z.boolean().optional(),
});

/** POST /api/provider/tenders/:id/bids — create or replace this provider's bid. */
providerRouter.post("/tenders/:id/bids", async (req: ProviderRequest, res) => {
  const pid = req.providerId!;
  const parsed = bidSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid bid", issues: parsed.error.issues });
    return;
  }
  const tender = await prisma.tender.findUnique({ where: { id: req.params.id } });
  if (!tender || tender.status !== "OPEN") {
    res.status(404).json({ error: "Tender not open" });
    return;
  }
  const status = parsed.data.submit === false ? "DRAFT" : "SUBMITTED";
  const bid = await prisma.bid.upsert({
    where: { tenderId_providerId: { tenderId: tender.id, providerId: pid } },
    create: {
      tenderId: tender.id, providerId: pid,
      amount: parsed.data.amount, proposal: parsed.data.proposal,
      docFileName: parsed.data.docFileName ?? null, status,
    },
    update: {
      amount: parsed.data.amount, proposal: parsed.data.proposal,
      docFileName: parsed.data.docFileName ?? null, status,
    },
  });
  res.status(201).json({ id: bid.id, status: bid.status });
});

providerRouter.get("/bids", async (req: ProviderRequest, res) => {
  const bids = await prisma.bid.findMany({
    where: { providerId: req.providerId! },
    orderBy: { createdAt: "desc" },
    include: { tender: { include: { organization: true } } },
  });
  res.json({ bids: bids.map(serializeBid) });
});

providerRouter.delete("/bids/:id", async (req: ProviderRequest, res) => {
  const bid = await prisma.bid.findUnique({ where: { id: req.params.id } });
  if (!bid || bid.providerId !== req.providerId) {
    res.status(404).json({ error: "Bid not found" });
    return;
  }
  await prisma.bid.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---- serializers -----------------------------------------------------------

function serializeTender(t: {
  id: string; title: string; description: string; category: string;
  deliveryMode: string; budget: string; seats: number; deadline: Date;
  status: string; organization: { id: string; name: string; sector: string | null; district: string | null };
}) {
  return {
    id: t.id, title: t.title, description: t.description, category: t.category,
    deliveryMode: t.deliveryMode, budget: t.budget, seats: t.seats,
    deadline: t.deadline, status: t.status,
    organization: { id: t.organization.id, name: t.organization.name, sector: t.organization.sector, district: t.organization.district },
  };
}

function serializeBid(b: {
  id: string; amount: string; proposal: string; docFileName: string | null;
  status: string; createdAt: Date;
  tender: { id: string; title: string; budget: string; deadline: Date; category: string; organization: { name: string } };
}) {
  return {
    id: b.id, amount: b.amount, proposal: b.proposal, docFileName: b.docFileName,
    status: b.status, createdAt: b.createdAt,
    tender: {
      id: b.tender.id, title: b.tender.title, budget: b.tender.budget,
      deadline: b.tender.deadline, category: b.tender.category,
      organizationName: b.tender.organization.name,
    },
  };
}
