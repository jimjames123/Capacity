import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, EmptyState, ProgressRing, StatusPill } from "../components/ui";
import { Thumb, ProgressBar } from "../components/learn";
import { entryTypeLabel, formatDate, pointsLabel } from "../lib/format";
import type { CpdEntry, CycleSummary, MemberCourse } from "../lib/types";

interface DashboardData {
  summary: CycleSummary;
  recent: CpdEntry[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myCourses, setMyCourses] = useState<MemberCourse[]>([]);

  useEffect(() => {
    api
      .get<DashboardData>("/cpd/dashboard")
      .then(setData)
      .catch(() => setError("Could not load your dashboard"));
    api.get<{ courses: MemberCourse[] }>("/me/courses").then((r) => setMyCourses(r.courses)).catch(() => {});
  }, []);

  const continueCourse = [...myCourses]
    .filter((c) => c.status !== "COMPLETED")
    .sort((a, b) => +new Date(b.lastAccessedAt ?? b.enrolledAt) - +new Date(a.lastAccessedAt ?? a.enrolledAt))[0];

  if (error) return <EmptyState title={error} />;
  if (!data) return <DashboardSkeleton />;

  const { summary, recent } = data;
  const greeting = timeGreeting();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {user?.professionalBody ?? "Professional"} · Cycle {summary.label}
            {user?.membershipNo ? ` · ${user.membershipNo}` : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/log" className="btn-primary">+ Log a CPD activity</Link>
          <Link to="/app/marketplace" className="btn-ghost">Browse the marketplace</Link>
        </div>
      </div>

      {/* Progress + stats */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="label-caps">Points this cycle</div>
            <Badge tone={summary.onTrack ? "green" : "neutral"}>
              {summary.onTrack ? "On track" : "Get going"}
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <ProgressRing percent={summary.percentComplete}>
              <div>
                <div className="font-serif text-2xl font-bold text-ink">
                  {round(summary.earnedPoints)}
                </div>
                <div className="text-[10px] text-muted">of {summary.requiredPoints} pts</div>
              </div>
            </ProgressRing>
            <div className="space-y-1.5">
              <div className="font-serif text-3xl font-bold text-ink">
                {summary.percentComplete}%
              </div>
              <div className="text-sm text-muted">complete</div>
              <div className="text-[13px] text-muted">
                {round(summary.remainingPoints)} pts remaining
              </div>
            </div>
          </div>
        </div>

        <Stat
          label="Days remaining"
          value={String(summary.daysRemaining)}
          sub={`Cycle closes ${formatDate(summary.endDate)}`}
        />
        <Stat
          label="Entries"
          value={String(
            summary.counts.VERIFIED +
              summary.counts.PENDING +
              summary.counts.NEEDS_PROOF,
          )}
          sub={`${summary.counts.VERIFIED} verified · ${summary.counts.PENDING} pending · ${summary.counts.NEEDS_PROOF} needs proof`}
        />
      </div>

      {/* Continue learning */}
      {myCourses.length > 0 && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-ink">Continue learning</h2>
            <Link to="/app/courses" className="text-sm font-semibold text-teal hover:underline">My courses →</Link>
          </div>
          {continueCourse ? (
            <div className="flex flex-wrap items-center gap-4">
              <Link to={`/app/courses/${continueCourse.course.id}`} className="w-20 shrink-0 overflow-hidden rounded-xl">
                <Thumb thumb={continueCourse.thumb} title={continueCourse.course.title} className="h-16" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/app/courses/${continueCourse.course.id}`} className="font-serif text-lg font-semibold text-ink hover:underline">{continueCourse.course.title}</Link>
                <div className="text-[12.5px] text-muted">{continueCourse.course.provider}</div>
                <div className="mt-2 max-w-md"><ProgressBar progress={continueCourse.progress} /></div>
              </div>
              <Link to={`/app/courses/${continueCourse.course.id}`} className="btn-primary px-4 py-2 text-[13px]">
                {continueCourse.status === "NOT_STARTED" ? "Start" : "Continue"}
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted">You've completed all your enrolled courses. 🎉 <Link to="/app/marketplace" className="font-semibold text-teal hover:underline">Find another →</Link></p>
          )}
        </div>
      )}

      {/* Recent activity */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-ink">Recent activity</h2>
          <Link to="/app/history" className="text-sm font-semibold text-teal hover:underline">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="No activities logged yet"
            hint="Log your first CPD activity and it will appear here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((a) => (
              <EntryRow key={a.id} entry={a} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function EntryRow({ entry }: { entry: CpdEntry }) {
  return (
    <li className="flex items-center gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-ink">{entry.title}</div>
        <div className="mt-0.5 text-[12.5px] text-muted">
          {entryTypeLabel(entry.type)} · {formatDate(entry.activityDate)}
        </div>
      </div>
      <div className="text-sm font-semibold text-ink">{pointsLabel(entry.pointsClaimed)}</div>
      <StatusPill status={entry.status} />
    </li>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-6">
      <div className="label-caps">{label}</div>
      <div className="mt-3 font-serif text-4xl font-bold text-ink">{value}</div>
      <div className="mt-2 text-[13px] text-muted">{sub}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-line" />
      <div className="grid gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-line" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-line" />
    </div>
  );
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function round(n: number): string {
  return String(Math.round(n * 10) / 10);
}
