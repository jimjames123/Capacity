import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";
import { buildCycleSummary } from "../lib/summary.js";

export const cpdRouter = Router();
cpdRouter.use(requireAuth);

const ENTRY_TYPES = [
  "COURSE",
  "WORKSHOP",
  "CONFERENCE",
  "SELF_STUDY",
  "MENTORING",
  "WEBINAR",
  "OTHER",
] as const;

/** Ensures the member has a current cycle; creates one for the year if not. */
async function ensureCurrentCycle(userId: string) {
  let cycle = await prisma.cycle.findFirst({
    where: { userId, isCurrent: true },
  });
  if (!cycle) {
    const year = new Date().getFullYear();
    cycle = await prisma.cycle.create({
      data: {
        userId,
        label: `Jan ${year} – Dec ${year}`,
        startDate: new Date(`${year}-01-01T00:00:00Z`),
        endDate: new Date(`${year}-12-31T23:59:59Z`),
        requiredPoints: 12,
        isCurrent: true,
      },
    });
  }
  return cycle;
}

/** GET /api/cpd/dashboard — current-cycle summary + recent activity. */
cpdRouter.get("/dashboard", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const cycle = await ensureCurrentCycle(userId);
  const entries = await prisma.cpdEntry.findMany({
    where: { cycleId: cycle.id },
    orderBy: { activityDate: "desc" },
  });
  const summary = buildCycleSummary(cycle, entries);
  res.json({ summary, recent: entries.slice(0, 5) });
});

/** GET /api/cpd/entries — every entry, grouped by cycle. */
cpdRouter.get("/entries", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  await ensureCurrentCycle(userId);
  const cycles = await prisma.cycle.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    include: { entries: { orderBy: { activityDate: "desc" } } },
  });
  const groups = cycles.map((c) => ({
    ...buildCycleSummary(c, c.entries),
    entries: c.entries,
  }));
  res.json({ cycles: groups });
});

const createEntrySchema = z.object({
  title: z.string().min(2),
  type: z.enum(ENTRY_TYPES),
  activityDate: z.string(),
  pointsClaimed: z.number().min(0).max(100),
  proofFileName: z.string().optional(),
  note: z.string().optional(),
});

/** POST /api/cpd/entries — log a new activity for verification. */
cpdRouter.post("/entries", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const parsed = createEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid activity", issues: parsed.error.issues });
    return;
  }
  const cycle = await ensureCurrentCycle(userId);
  const data = parsed.data;
  const entry = await prisma.cpdEntry.create({
    data: {
      userId,
      cycleId: cycle.id,
      title: data.title,
      type: data.type,
      activityDate: new Date(data.activityDate),
      pointsClaimed: data.pointsClaimed,
      // Entries without attached proof land in NEEDS_PROOF; otherwise PENDING.
      status: data.proofFileName ? "PENDING" : "NEEDS_PROOF",
      proofFileName: data.proofFileName ?? null,
      note: data.note ?? null,
    },
  });
  res.status(201).json({ entry });
});

export { ENTRY_TYPES };
