import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean slate (respect FK order).
  await prisma.enrollment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cpdEntry.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.course.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();

  // ---- Demo member: Aisha Nakato -------------------------------------------
  const aisha = await prisma.user.create({
    data: {
      name: "Aisha Nakato",
      email: "aisha@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "MEMBER",
      profession: "HR",
      membershipNo: "HRM-2024-0417",
      professionalBody: "Human Resource Managers' Association of Uganda",
      jobTitle: "Senior HR Business Partner",
      organisation: "National Water & Sewerage Corporation",
      onboarded: true,
    },
  });

  // Current cycle 2026 — 8.5 of 12 pts, 4 verified · 1 pending · 1 needs proof
  const cycle2026 = await prisma.cycle.create({
    data: {
      userId: aisha.id,
      label: "Jan 2026 – Dec 2026",
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-12-31T23:59:59Z"),
      requiredPoints: 12,
      isCurrent: true,
    },
  });

  await prisma.cpdEntry.createMany({
    data: [
      {
        userId: aisha.id,
        cycleId: cycle2026.id,
        title: "Employment Act 2024 — what changed for HR",
        type: "WEBINAR",
        activityDate: new Date("2026-02-11"),
        pointsClaimed: 2,
        status: "VERIFIED",
        proofFileName: "employment-act-webinar.pdf",
      },
      {
        userId: aisha.id,
        cycleId: cycle2026.id,
        title: "Strategic Workforce Planning workshop",
        type: "WORKSHOP",
        activityDate: new Date("2026-03-06"),
        pointsClaimed: 3,
        status: "VERIFIED",
        proofFileName: "workforce-planning-cert.pdf",
      },
      {
        userId: aisha.id,
        cycleId: cycle2026.id,
        title: "Mentoring two graduate trainees (Q1)",
        type: "MENTORING",
        activityDate: new Date("2026-03-28"),
        pointsClaimed: 1.5,
        status: "VERIFIED",
        proofFileName: "mentoring-log-q1.pdf",
      },
      {
        userId: aisha.id,
        cycleId: cycle2026.id,
        title: "HR Analytics self-study module",
        type: "SELF_STUDY",
        activityDate: new Date("2026-04-14"),
        pointsClaimed: 2,
        status: "VERIFIED",
        proofFileName: "analytics-completion.pdf",
      },
      {
        userId: aisha.id,
        cycleId: cycle2026.id,
        title: "Annual HR Leaders Conference — Kampala",
        type: "CONFERENCE",
        activityDate: new Date("2026-05-09"),
        pointsClaimed: 3,
        status: "PENDING",
        proofFileName: "conference-badge.jpg",
      },
      {
        userId: aisha.id,
        cycleId: cycle2026.id,
        title: "Payroll compliance refresher",
        type: "COURSE",
        activityDate: new Date("2026-05-20"),
        pointsClaimed: 1.5,
        status: "NEEDS_PROOF",
      },
    ],
  });

  // Past cycle 2025 — completed 12/12, 7 activities verified, certificate issued
  const cycle2025 = await prisma.cycle.create({
    data: {
      userId: aisha.id,
      label: "Jan 2025 – Dec 2025",
      startDate: new Date("2025-01-01T00:00:00Z"),
      endDate: new Date("2025-12-31T23:59:59Z"),
      requiredPoints: 12,
      isCurrent: false,
      certRef: "CPD-2025-HRM-0417",
      registrarName: "R. Namutebi",
      issuedAt: new Date("2026-01-12"),
    },
  });

  const past = [
    ["Labour law update seminar", "WORKSHOP", "2025-02-18", 2],
    ["Diversity & inclusion masterclass", "COURSE", "2025-03-22", 2],
    ["Performance management certification", "COURSE", "2025-05-10", 3],
    ["Regional HR symposium", "CONFERENCE", "2025-07-04", 2],
    ["Coaching for managers workshop", "WORKSHOP", "2025-09-12", 1],
    ["Data protection for HR webinar", "WEBINAR", "2025-10-01", 1],
    ["Mentoring graduate cohort 2025", "MENTORING", "2025-11-20", 1],
  ] as const;

  await prisma.cpdEntry.createMany({
    data: past.map(([title, type, date, pts]) => ({
      userId: aisha.id,
      cycleId: cycle2025.id,
      title,
      type,
      activityDate: new Date(date),
      pointsClaimed: pts,
      status: "VERIFIED",
      proofFileName: "certificate.pdf",
    })),
  });

  // ---- Admin (professional body registrar) ---------------------------------
  await prisma.user.create({
    data: {
      name: "R. Namutebi",
      email: "registrar@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "ADMIN",
      profession: "HR",
      professionalBody: "Human Resource Managers' Association of Uganda",
      jobTitle: "Registrar",
      onboarded: true,
    },
  });

  // ---- Providers -----------------------------------------------------------
  const [makerere, deloitte, uiap, brandhouse, think] = await Promise.all([
    prisma.provider.create({
      data: {
        name: "Makerere Executive Institute",
        initials: "ME",
        type: "Institution",
        verified: true,
        rating: 4.9,
        meta: "Kampala · 22 courses",
        bio: "The executive education arm of Makerere University, delivering accredited professional programmes across disciplines since 2009.",
      },
    }),
    prisma.provider.create({
      data: {
        name: "Deloitte Uganda Academy",
        initials: "DA",
        type: "Training company",
        verified: true,
        rating: 4.8,
        meta: "Kampala · 15 courses",
        bio: "Professional training from Deloitte's East Africa practice, covering finance, risk, and governance.",
      },
    }),
    prisma.provider.create({
      data: {
        name: "Uganda Institute of Applied Professionals",
        initials: "UI",
        type: "Institution",
        verified: true,
        rating: 4.7,
        meta: "Jinja · 9 courses",
        bio: "Hands-on technical and engineering CPD delivered by practising professionals.",
      },
    }),
    prisma.provider.create({
      data: {
        name: "BrandHouse East Africa",
        initials: "BH",
        type: "Training company",
        verified: true,
        rating: 4.6,
        meta: "Kampala · 7 courses",
        bio: "Marketing, communications, and brand strategy training for the region.",
      },
    }),
    prisma.provider.create({
      data: {
        name: "Dr. Grace Ssembatya",
        initials: "GS",
        type: "Individual consultant",
        verified: true,
        rating: 4.9,
        meta: "Independent · 5 courses",
        bio: "Organisational development consultant with 18 years across public-sector reform programmes.",
      },
    }),
  ]);

  // ---- Courses -------------------------------------------------------------
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        providerId: uiap.id,
        title: "Structural Integrity & Safety Auditing",
        description:
          "A practical, three-day programme on inspecting and certifying structural safety for buildings and civil works, aligned to Ugandan engineering practice standards. Includes a supervised field audit.",
        profession: "Engineering",
        format: "IN_PERSON",
        points: 4,
        rating: 4.8,
        reviewsCount: 3,
        schedule: "Starts 4 Mar · 3 days",
        fee: "UGX 620,000",
        seats: 12,
      },
    }),
    prisma.course.create({
      data: {
        providerId: deloitte.id,
        title: "IFRS Update & Practical Application 2026",
        description:
          "Stay current with the latest International Financial Reporting Standards. This course walks through the 2026 amendments with worked examples drawn from East African filings.",
        profession: "Finance",
        format: "HYBRID",
        points: 3,
        rating: 4.9,
        reviewsCount: 4,
        schedule: "Starts 18 Mar · 2 days",
        fee: "UGX 480,000",
        seats: 25,
      },
    }),
    prisma.course.create({
      data: {
        providerId: makerere.id,
        title: "Strategic Workforce Planning",
        description:
          "Build the analytical toolkit to forecast talent needs, model scenarios, and align people strategy with organisational goals. Designed for senior HR practitioners.",
        profession: "HR",
        format: "ONLINE",
        points: 3,
        rating: 4.7,
        reviewsCount: 5,
        schedule: "Self-paced · 6 weeks",
        fee: "UGX 350,000",
        seats: 60,
      },
    }),
    prisma.course.create({
      data: {
        providerId: makerere.id,
        title: "Employment Law for HR Professionals",
        description:
          "A thorough grounding in the Employment Act 2024 and its practical implications for hiring, discipline, and termination. Certificate counts toward HR CPD.",
        profession: "HR",
        format: "IN_PERSON",
        points: 2,
        rating: 4.8,
        reviewsCount: 2,
        schedule: "Starts 11 Mar · 1 day",
        fee: "UGX 260,000",
        seats: 30,
      },
    }),
    prisma.course.create({
      data: {
        providerId: brandhouse.id,
        title: "Digital Marketing Analytics",
        description:
          "Turn campaign data into decisions. Covers attribution, dashboards, and measuring ROI across paid and organic channels, with hands-on labs.",
        profession: "Marketing",
        format: "ONLINE",
        points: 2,
        rating: 4.6,
        reviewsCount: 3,
        schedule: "Self-paced · 4 weeks",
        fee: "UGX 300,000",
        seats: 80,
      },
    }),
    prisma.course.create({
      data: {
        providerId: think.id,
        title: "Leading Change in Public Institutions",
        description:
          "A cross-industry programme on driving reform and managing change in public-sector and regulated organisations. Blends theory with Ugandan case studies.",
        profession: "Cross-industry",
        format: "HYBRID",
        points: 3,
        rating: 4.9,
        reviewsCount: 4,
        schedule: "Starts 25 Mar · 2 days + coaching",
        fee: "UGX 540,000",
        seats: 20,
      },
    }),
    prisma.course.create({
      data: {
        providerId: deloitte.id,
        title: "Risk & Internal Controls Essentials",
        description:
          "Design and evaluate internal control frameworks. Ideal for finance and audit professionals seeking verifiable CPD on governance and risk.",
        profession: "Finance",
        format: "ONLINE",
        points: 2,
        rating: 4.7,
        reviewsCount: 2,
        schedule: "Self-paced · 3 weeks",
        fee: "UGX 320,000",
        seats: 100,
      },
    }),
    prisma.course.create({
      data: {
        providerId: uiap.id,
        title: "Project Management for Engineers (PMP-aligned)",
        description:
          "Plan, schedule, and deliver engineering projects on time and budget. Aligned to PMP principles with templates you can use immediately.",
        profession: "Engineering",
        format: "HYBRID",
        points: 4,
        rating: 4.8,
        reviewsCount: 3,
        schedule: "Starts 8 Apr · 4 evenings",
        fee: "UGX 700,000",
        seats: 18,
      },
    }),
  ]);

  // ---- A few reviews -------------------------------------------------------
  const reviewData = [
    [0, "Okello D.", 5, "The field audit was the highlight — genuinely changed how I inspect sites."],
    [0, "Nabirye R.", 5, "Rigorous and practical. Worth every point."],
    [0, "Mugisha T.", 4, "Excellent content, though the venue was a little cramped."],
    [1, "Auma P.", 5, "Clear explanations of the 2026 amendments. Immediately useful."],
    [1, "Ssali J.", 5, "Best IFRS course I've taken in the region."],
    [2, "Namusoke L.", 5, "The scenario modelling toolkit is gold."],
    [2, "Kato B.", 4, "Solid, self-paced format worked well around my job."],
    [5, "Byaruhanga E.", 5, "Dr. Ssembatya's public-sector cases really landed."],
  ] as const;

  await prisma.review.createMany({
    data: reviewData.map(([idx, name, stars, text]) => ({
      courseId: courses[idx].id,
      name,
      stars,
      text,
    })),
  });

  // Aisha already enrolled in one course for demo purposes.
  await prisma.enrollment.create({
    data: { userId: aisha.id, courseId: courses[2].id },
  });

  // ---- Organizations & staff ----------------------------------------------
  const nwsc = await prisma.organization.create({
    data: {
      name: "National Water & Sewerage Corporation",
      sector: "Public sector",
      district: "Kampala",
      contactName: "Sarah Nakimuli",
      contactEmail: "hr@nwsc.example.ug",
      contactPhone: "+256 414 315 000",
    },
  });
  const stanbic = await prisma.organization.create({
    data: {
      name: "Stanbic Bank Uganda",
      sector: "Financial services",
      district: "Kampala",
      contactName: "David Ochieng",
      contactEmail: "people@stanbic.example.ug",
      contactPhone: "+256 312 224 600",
    },
  });
  const ura = await prisma.organization.create({
    data: {
      name: "Uganda Revenue Authority",
      sector: "Public sector",
      district: "Kampala",
      contactName: "Grace Atim",
      contactEmail: "training@ura.example.ug",
      contactPhone: "+256 417 442 097",
    },
  });

  await prisma.staff.createMany({
    data: [
      { organizationId: nwsc.id, name: "Aisha Nakato", email: "aisha@example.com", jobTitle: "Senior HR Business Partner", profession: "HR", membershipNo: "HRM-2024-0417" },
      { organizationId: nwsc.id, name: "Peter Okot", email: "peter.okot@nwsc.example.ug", jobTitle: "Finance Officer", profession: "Finance", membershipNo: "ICP-2023-1180" },
      { organizationId: nwsc.id, name: "Joan Akello", email: "joan.akello@nwsc.example.ug", jobTitle: "Civil Engineer", profession: "Engineering", membershipNo: "UIPE-2022-0455" },
      { organizationId: stanbic.id, name: "Brian Mugume", email: "brian.mugume@stanbic.example.ug", jobTitle: "Risk Analyst", profession: "Finance", membershipNo: "ICP-2024-2210" },
      { organizationId: stanbic.id, name: "Linda Nabukenya", email: "linda.n@stanbic.example.ug", jobTitle: "HR Manager", profession: "HR", membershipNo: "HRM-2021-0902" },
      { organizationId: ura.id, name: "Samuel Wanyama", email: "samuel.w@ura.example.ug", jobTitle: "Tax Officer", profession: "Finance", membershipNo: "ICP-2020-0771" },
    ],
  });

  // ---- Provider login (BrandHouse East Africa) ----------------------------
  await prisma.user.create({
    data: {
      name: "BrandHouse East Africa",
      email: "provider@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "PROVIDER",
      providerId: brandhouse.id,
      onboarded: true,
    },
  });
  // A pending listing submitted by the provider (awaiting admin approval).
  await prisma.course.create({
    data: {
      providerId: brandhouse.id,
      title: "Crisis Communications for Public Bodies",
      description:
        "A practical workshop on managing communications during incidents and public scrutiny, with media-handling drills.",
      profession: "Marketing",
      format: "IN_PERSON",
      points: 2,
      rating: 0,
      reviewsCount: 0,
      schedule: "Starts 6 May · 1 day",
      fee: "UGX 340,000",
      seats: 25,
      verified: false,
      status: "PENDING",
    },
  });

  // ---- Tenders (posted by organizations) ----------------------------------
  const t1 = await prisma.tender.create({
    data: {
      organizationId: nwsc.id,
      title: "Leadership development programme for 40 managers",
      description:
        "We are seeking an accredited provider to design and deliver a leadership development programme for 40 mid-level managers across our regional offices. CPD points required.",
      category: "HR",
      deliveryMode: "Hybrid",
      budget: "UGX 48,000,000",
      seats: 40,
      deadline: new Date("2026-06-15"),
      status: "OPEN",
    },
  });
  const t2 = await prisma.tender.create({
    data: {
      organizationId: stanbic.id,
      title: "IFRS & risk refresher for finance team",
      description:
        "Two-day in-house refresher on IFRS 2026 amendments and internal controls for a finance team of 22. Must carry CPD accreditation.",
      category: "Finance",
      deliveryMode: "In-person",
      budget: "UGX 22,000,000",
      seats: 22,
      deadline: new Date("2026-05-30"),
      status: "OPEN",
    },
  });
  await prisma.tender.create({
    data: {
      organizationId: ura.id,
      title: "Digital marketing upskilling for comms unit",
      description:
        "Online, self-paced digital marketing analytics training for our 12-person communications unit, with a live workshop to close.",
      category: "Marketing",
      deliveryMode: "Online",
      budget: "UGX 9,000,000",
      seats: 12,
      deadline: new Date("2026-06-05"),
      status: "OPEN",
    },
  });

  // A submitted bid + a draft from the demo provider.
  await prisma.bid.create({
    data: {
      tenderId: t2.id,
      providerId: brandhouse.id,
      amount: "UGX 20,500,000",
      proposal:
        "We propose a tailored two-day programme combining IFRS 2026 updates with hands-on controls case studies drawn from banking. Includes pre-reading and a post-course assessment.",
      docFileName: "brandhouse-ifrs-proposal.pdf",
      status: "SUBMITTED",
    },
  });
  await prisma.bid.create({
    data: {
      tenderId: t1.id,
      providerId: brandhouse.id,
      amount: "UGX 44,000,000",
      proposal: "Draft outline — leadership tracks by seniority with coaching pods.",
      status: "DRAFT",
    },
  });

  console.log("Seed complete: member aisha@example.com, provider provider@example.com, registrar registrar@example.com (all password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
