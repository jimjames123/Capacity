import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
  type AuthedRequest,
} from "../lib/auth.js";
import { publicUser } from "../lib/serialize.js";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  accountType: z.enum(["individual", "organization", "consultant"]).optional(),
  profession: z.string().optional(),
  consultantType: z.enum(["institution", "individual"]).optional(),
  sector: z.string().optional(),
  location: z.string().optional(),
  expertise: z.string().optional(),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Creates the first (current) CPD cycle for a brand new member. */
async function seedFirstCycle(userId: string) {
  const now = new Date();
  const year = now.getFullYear();
  await prisma.cycle.create({
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

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid details", issues: parsed.error.issues });
    return;
  }
  const { name, email, password, profession, consultantType, sector, location, expertise } = parsed.data;
  const accountType = parsed.data.accountType ?? "individual";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }
  const passwordHash = await hashPassword(password);

  if (accountType === "organization") {
    const org = await prisma.organization.create({
      data: { name, sector: sector ?? null, contactEmail: email },
    });
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "ORG", organizationId: org.id, onboarded: true },
    });
    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
    return;
  }

  if (accountType === "consultant") {
    const initials = (name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("") || "?").toUpperCase();
    const type = consultantType === "institution" ? "Institution" : "Individual consultant";
    const provider = await prisma.provider.create({
      data: {
        name, initials, type, verified: false, rating: 0,
        meta: location ? `${location} · new applicant` : "New applicant",
        bio: expertise ?? null,
      },
    });
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "PROVIDER", providerId: provider.id, onboarded: true },
    });
    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
    return;
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash, profession: profession ?? null, role: "MEMBER" },
  });
  await seedFirstCycle(user.id);
  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

authRouter.post("/signin", async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid details" });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Incorrect email or password" });
    return;
  }
  res.json({ token: signToken(user.id), user: publicUser(user) });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json({ user: publicUser(user) });
});

const onboardSchema = z.object({
  profession: z.string().min(1),
  membershipNo: z.string().optional(),
  professionalBody: z.string().optional(),
  jobTitle: z.string().optional(),
  organisation: z.string().optional(),
});

authRouter.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = onboardSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid details" });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { ...parsed.data, onboarded: true },
  });
  res.json({ user: publicUser(user) });
});
