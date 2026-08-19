import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

export const coursesRouter = Router();

/** GET /api/courses — marketplace listing, filterable by profession & format. */
coursesRouter.get("/", async (req, res) => {
  const { profession, format } = req.query as {
    profession?: string;
    format?: string;
  };
  const where: Record<string, unknown> = {};
  if (profession && profession !== "All") where.profession = profession;
  if (format && format !== "All") where.format = format;

  const courses = await prisma.course.findMany({
    where,
    orderBy: { rating: "desc" },
    include: { provider: true },
  });
  res.json({ courses, count: courses.length });
});

/** GET /api/courses/:id — full detail with provider and reviews. */
coursesRouter.get("/:id", async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: {
      provider: true,
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  res.json({ course });
});

/** POST /api/courses/:id/enroll — enrol the signed-in member. */
coursesRouter.post(
  "/:id/enroll",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const courseId = req.params.id;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      res.status(200).json({ enrollment: existing, alreadyEnrolled: true });
      return;
    }
    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
    });
    res.status(201).json({ enrollment });
  },
);

/** GET /api/courses/me/enrollments — the member's enrolments. */
coursesRouter.get(
  "/me/enrollments",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.userId! },
      include: { course: { include: { provider: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ enrollments });
  },
);
