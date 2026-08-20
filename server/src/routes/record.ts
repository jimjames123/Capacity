import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";
import { buildCycleSummary, verifiedPoints } from "../lib/summary.js";

export const recordRouter = Router();
recordRouter.use(requireAuth);

/**
 * GET /api/record — the member's completed CPD compliance records
 * (one per cycle where the required points were met). Powers the
 * "Certificate of CPD Compliance" screen.
 */
recordRouter.get("/", async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const cycles = await prisma.cycle.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    include: { entries: true },
  });

  const records = cycles.map((c) => {
    const summary = buildCycleSummary(c, c.entries);
    const verified = c.entries.filter((e) => e.status === "VERIFIED");
    return {
      cycleId: c.id,
      label: c.label,
      startDate: c.startDate,
      endDate: c.endDate,
      requiredPoints: c.requiredPoints,
      earnedPoints: verifiedPoints(c.entries),
      activitiesVerified: verified.length,
      compliancePct: summary.percentComplete,
      complete: summary.earnedPoints >= c.requiredPoints,
      certRef: c.certRef,
      registrarName: c.registrarName,
      issuedAt: c.issuedAt,
    };
  });

  res.json({
    holder: user
      ? {
          name: user.name,
          membershipNo: user.membershipNo,
          professionalBody: user.professionalBody,
        }
      : null,
    records,
  });
});
