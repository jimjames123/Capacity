import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { homePathForUser } from "../lib/nav";
import { Badge, BrandLogo, ProgressRing } from "../components/ui";
import { FORMAT_META, pointsLabel } from "../lib/format";
import type { Course } from "../lib/types";

const BODIES = [
  "IHRPU",
  "ICPAU",
  "UIPE",
  "Uganda Law Society",
];

const AUDIENCES = [
  {
    icon: "🎓",
    title: "Professionals",
    body: "Track every CPD point, log activities in seconds, and hold a verified record you can share with any regulator.",
    cta: "Track your CPD",
  },
  {
    icon: "🏛️",
    title: "Professional bodies",
    body: "Verify member activities, issue compliance certificates, and see cycle progress across your whole membership.",
    cta: "For regulators",
  },
  {
    icon: "📚",
    title: "Trainers & providers",
    body: "List accredited courses, reach professionals across every field, and get discovered on a trusted rail.",
    cta: "Become a provider",
  },
  {
    icon: "🏢",
    title: "Employers",
    body: "Commission in-house training, run tenders for consultants, and keep your teams compliant and current.",
    cta: "For organisations",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Join & set your profession",
    body: "Tell us your professional body and cycle. We tailor the points you need and the courses that count.",
  },
  {
    n: "2",
    title: "Log or discover CPD",
    body: "Record activities as you go, or enrol in accredited courses from verified providers in the marketplace.",
  },
  {
    n: "3",
    title: "Get verified & share",
    body: "Your body verifies each entry. At cycle end, download a certificate and share a verification link.",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api
      .get<{ courses: Course[] }>("/courses")
      .then((r) => setCourses(r.courses.slice(0, 3)))
      .catch(() => setCourses([]));
  }, []);

  const goApp = () => navigate(user ? homePathForUser(user) : "/signup");

  return (
    <div className="bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[66px] max-w-6xl items-center gap-4 px-6">
          <Link to="/"><BrandLogo className="h-12 w-auto" /></Link>
          <nav className="ml-auto mr-2 hidden items-center gap-1 md:flex">
            <a href="#courses" className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-[#EEF2F2]">Courses</a>
            <a href="#audiences" className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-[#EEF2F2]">For you</a>
            <a href="#how" className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-[#EEF2F2]">How it works</a>
          </nav>
          <Link to="/signin" className="btn-ghost ml-auto md:ml-0">Log in</Link>
          <Link to="/signup" className="btn-primary">Join for free</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#E7EFEF] to-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <Badge tone="teal">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              Uganda's public CPD platform
            </Badge>
            <h1 className="mt-5 text-balance font-serif text-4xl font-bold leading-[1.08] tracking-[-1px] text-ink sm:text-5xl">
              Learn the skills that keep your licence — and prove it.
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-[#2E3B3F]">
              Track your CPD, discover accredited courses from trusted trainers,
              and share a verified record — whichever professional body you
              belong to.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={goApp} className="btn-primary px-6 py-3.5 text-[15px]">
                Get started — it's free
              </button>
              <Link to="/signup" className="btn-ghost px-6 py-3.5 text-[15px]">
                Explore courses
              </Link>
            </div>
            <div className="mt-9 flex gap-8">
              {[
                ["4", "professional bodies"],
                ["120+", "accredited courses"],
                ["2,400+", "professionals tracking CPD"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-serif text-[27px] font-bold text-ink">{n}</div>
                  <div className="text-[12.5px] text-muted">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cycle preview card */}
          <div className="card p-6 shadow-lift">
            <div className="mb-4 flex items-center justify-between">
              <div className="label-caps">Your CPD cycle</div>
              <Badge tone="green">On track</Badge>
            </div>
            <div className="flex items-center gap-6">
              <ProgressRing percent={71}>
                <div>
                  <div className="font-serif text-2xl font-bold text-ink">8.5</div>
                  <div className="text-[10px] text-muted">of 12 pts</div>
                </div>
              </ProgressRing>
              <div className="space-y-2.5 text-sm">
                <div className="text-muted">Jan – Dec 2026</div>
                <Row label="4 verified activities" tone="green" />
                <Row label="1 pending review" tone="amber" />
                <Row label="142 days remaining" tone="muted" />
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-[#EDF1F1] px-3.5 py-3 text-[12.5px] text-muted">
              ✓ Verified by IHRPU — shareable with any employer or regulator.
            </div>
          </div>
        </div>
      </section>

      {/* Bodies */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="text-center text-[12.5px] font-medium uppercase tracking-wide text-muted">
            Recognised by professional bodies across Uganda
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {BODIES.map((b) => (
              <div key={b} className="font-serif text-lg font-semibold text-faint">
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl font-bold text-ink">
                Courses that count toward your CPD
              </h2>
              <p className="mt-2 max-w-xl text-muted">
                Every listing is from a verified provider and carries an approved
                points value for your profession.
              </p>
            </div>
            <Link to="/signup" className="hidden whitespace-nowrap text-sm font-semibold text-teal hover:underline sm:block">
              View all courses →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div key={c.id} className="card flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="label-caps">{FORMAT_META[c.format]}</span>
                  <Badge tone="teal">{pointsLabel(c.points)}</Badge>
                </div>
                <div className="mt-3 font-serif text-lg font-semibold leading-snug text-ink">
                  {c.title}
                </div>
                <div className="mt-1 text-sm text-muted">{c.provider.name}</div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-[12px] font-medium text-green">✓ Verified provider</span>
                  <span className="text-sm font-semibold text-ink">{c.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section id="audiences" className="scroll-mt-20 border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-3xl font-bold text-ink">
            One platform, every side of CPD
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Professionals, professional bodies, trainers and employers —
            connected in one trusted place.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="rounded-2xl border border-line bg-surface p-5">
                <div className="text-2xl">{a.icon}</div>
                <div className="mt-3 font-serif text-lg font-semibold text-ink">{a.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{a.body}</p>
                <div className="mt-4 text-sm font-semibold text-teal">{a.cta} →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-3xl font-bold text-ink">How Capacity Lane works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((st) => (
              <div key={st.n} className="relative rounded-2xl border border-line bg-white p-6 shadow-card">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink font-serif text-lg font-bold text-white">
                  {st.n}
                </div>
                <div className="mt-4 font-serif text-lg font-semibold text-ink">{st.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{st.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            Your CPD record, verified and in one place.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[#B9C6C6]">
            No more spreadsheets, no more chasing paper certificates. Join free
            and start tracking today.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <button onClick={goApp} className="btn bg-white px-6 py-3.5 text-[15px] text-ink hover:bg-[#EEF2F2]">
              Join for free
            </button>
            <Link to="/signin" className="btn border border-white/30 px-6 py-3.5 text-[15px] text-white hover:bg-white/10">
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <BrandLogo className="h-14 w-auto" />
          <div className="text-[12.5px] text-muted">
            Kampala, Uganda · Pilot build for validation review
          </div>
        </div>
      </footer>
    </div>
  );
}

function Row({ label, tone }: { label: string; tone: "green" | "amber" | "muted" }) {
  const dot = {
    green: "bg-green",
    amber: "bg-amber-strong",
    muted: "bg-faint",
  }[tone];
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-muted">{label}</span>
    </div>
  );
}
