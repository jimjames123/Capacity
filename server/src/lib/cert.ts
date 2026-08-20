import type { Cycle, User } from "@prisma/client";
import { prisma } from "./prisma.js";
import { verifiedPoints } from "./summary.js";

/**
 * Issues a certificate for a cycle once its verified points meet the
 * requirement (and one hasn't been issued yet). Called after an admin
 * verifies an entry, so completing a cycle immediately mints its record.
 *
 * `registrarName` is the verifying admin; the reference is derived from the
 * cycle year and the member's membership number.
 */
export async function maybeIssueCertificate(
  cycle: Cycle,
  member: User,
  registrarName: string,
): Promise<Cycle> {
  if (cycle.certRef) return cycle; // already issued

  const entries = await prisma.cpdEntry.findMany({
    where: { cycleId: cycle.id },
  });
  if (verifiedPoints(entries) < cycle.requiredPoints) return cycle;

  const year = new Date(cycle.startDate).getFullYear();
  const suffix = (member.membershipNo ?? member.id.slice(-4))
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(-4)
    .toUpperCase();
  const prefix = (member.profession ?? "CPD").slice(0, 3).toUpperCase();

  return prisma.cycle.update({
    where: { id: cycle.id },
    data: {
      certRef: `CPD-${year}-${prefix}-${suffix}`,
      registrarName,
      issuedAt: new Date(),
    },
  });
}
