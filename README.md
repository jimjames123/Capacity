# Capacity Lane — CPD Platform

Capacity Lane is Uganda's public **Continuing Professional Development (CPD)**
platform. Professionals track their CPD points across cycles, discover
accredited courses from verified providers, and share a verified compliance
record with whichever professional body they belong to.

This repository contains a full-stack implementation built from the product
design:

- **`client/`** — React + Vite + TypeScript + Tailwind CSS single-page app
- **`server/`** — Express + TypeScript + Prisma (SQLite) REST API with JWT auth

## Current scope

The foundation and the complete **Member journey** are implemented:

| Screen | What it does |
| --- | --- |
| Landing | Marketing site: hero, courses preview, audiences, how it works |
| Auth | Sign up / sign in (tabbed), member onboarding |
| Dashboard | CPD cycle ring, points progress, entry counts, recent activity |
| Log CPD | Submit a CPD activity (title, type, date, points, proof) for verification |
| History | Every logged entry across the current and past cycles |
| Marketplace | CPD-eligible courses from verified providers, filterable |
| Course detail | Full course info, provider profile, reviews, enrol |
| CPD record | Verified certificate of CPD compliance, shareable |

The **Admin** shell (the professional body's registrar console) is also
implemented:

| Screen | What it does |
| --- | --- |
| Overview | Verification stats, certificates issued, register size |
| Verification queue | Approve / reject submitted CPD across all members |
| Members | Register with each member's current-cycle progress |
| Member detail | A member's full history; verify/reject entries inline |

Approving an entry counts it toward the member's cycle, and completing a
cycle issues its certificate automatically.

The remaining role shells from the design — **Provider** and
**Organization** (tenders & bids) — are planned follow-ups.

## Live demo (GitHub Pages)

A static build is deployed to GitHub Pages:

**https://jimjames123.github.io/Capacity/**

GitHub Pages serves static files only, so the deployed site runs against an
**in-browser data layer** (`client/src/lib/staticStore.ts`, backed by
localStorage and seeded with the same demo data) instead of the Node/SQLite
backend. Every flow still works — sign in, log CPD, browse and enrol, view the
certificate — and data persists per browser. The Express + Prisma backend in
`server/` remains the source of truth for local development and real hosting.

Sign in with the demo account below, or register a new one.

## Getting started

```bash
# 1. Install dependencies for both packages
npm install
npm --prefix server install
npm --prefix client install

# 2. Set up the database (SQLite) and seed demo data
npm --prefix server run db:setup

# 3. Run both the API (:4000) and the client (:5173)
npm run dev
```

Then open http://localhost:5173.

### Demo account

The seed creates demo accounts so you can explore immediately:

- **Member** — `aisha@example.com` / `password123`
- **Registrar (admin)** — `registrar@example.com` / `password123`

You can also register a fresh member account from the sign-up screen.

## Project layout

```
Capacity/
├── client/        React SPA (screens, components, design system)
├── server/        Express API, Prisma schema, seed script
└── package.json   Workspace root (runs client + server together)
```

## Design system

- **Fonts:** Spectral (serif headings), IBM Plex Sans (body), IBM Plex Mono (labels)
- **Ink:** `#263238`  **Teal:** `#00897B` / `#2F7A55`  **Surface:** `#F5F7F7`
