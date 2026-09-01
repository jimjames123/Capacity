import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { COURSE_STATUS_META, FORMAT_META, formatDate, pointsLabel } from "../../lib/format";
import type { CourseFormat, ProviderReport } from "../../lib/types";

export default function ProviderReports() {
  const [data, setData] = useState<ProviderReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ProviderReport>("/provider/reports").then(setData).catch(() => setError("Could not load your reports"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-line" />;

  const { stats } = data;
  const professions = Object.entries(data.byProfession).sort((a, b) => b[1] - a[1]);
  const maxProf = Math.max(1, ...professions.map(([, n]) => n));

  function downloadCourseCsv() {
    const header = ["Course", "Profession", "Format", "CPD points", "Enrolments", "Status", "Location"];
    const lines = data!.courses.map((c) =>
      [c.title, c.profession, FORMAT_META[c.format as CourseFormat], c.points, c.enrolments, c.status, [c.city, c.country].filter(Boolean).join(" / ")]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    downloadCsv([header.join(","), ...lines].join("\n"), "capacity-lane-courses.csv");
  }

  function downloadEnrolmentsCsv() {
    const header = ["Course", "Learner", "Profession", "Membership no.", "Enrolled on"];
    const lines = data!.enrolments.flatMap((e) =>
      e.learners.map((l) =>
        [e.course, l.name, l.profession ?? "", l.membershipNo ?? "", formatDate(l.since)]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      ),
    );
    downloadCsv([header.join(","), ...lines].join("\n"), "capacity-lane-enrolments.csv");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">Reports</h1>
          <p className="mt-2 text-muted">
            A snapshot of your trainings, enrolments and tender activity. Export it or
            print to PDF for your records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className="btn-ghost px-4 py-2">Print / save PDF</button>
          <button onClick={downloadCourseCsv} className="btn-primary px-4 py-2">Download CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Courses" value={String(stats.courses)} sub={`${stats.live} live · ${stats.pending} pending`} dark />
        <Tile label="Total enrolments" value={String(stats.totalEnrolments)} sub="across all courses" />
        <Tile label="CPD points delivered" value={String(stats.cpdPointsDelivered)} sub="points × enrolments" />
        <Tile label="Avg rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} sub={`${stats.won} tender${stats.won === 1 ? "" : "s"} won`} />
      </div>

      {/* Training catalogue performance */}
      <div className="card p-6">
        <h2 className="font-serif text-lg font-semibold text-ink">Trainings delivered</h2>
        {data.courses.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No courses listed yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="label-caps border-b border-line text-left text-muted">
                  <th className="pb-2 font-semibold">Course</th>
                  <th className="pb-2 font-semibold">Format</th>
                  <th className="pb-2 text-right font-semibold">Points</th>
                  <th className="pb-2 text-right font-semibold">Enrolled</th>
                  <th className="pb-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((c) => {
                  const meta = COURSE_STATUS_META[c.status];
                  return (
                    <tr key={c.id} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-ink">{c.title}</div>
                        <div className="text-[12px] text-muted">{c.profession}{(c.city || c.country) ? ` · ${[c.city, c.country].filter(Boolean).join(", ")}` : ""}</div>
                      </td>
                      <td className="py-2.5 text-muted">{FORMAT_META[c.format as CourseFormat]}</td>
                      <td className="py-2.5 text-right text-ink">{pointsLabel(c.points)}</td>
                      <td className="py-2.5 text-right font-semibold text-ink">{c.enrolments}</td>
                      <td className="py-2.5 text-right">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta?.className ?? ""}`}>{meta?.label ?? c.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Currently enrolled learners */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-ink">People currently enrolled</h2>
          {data.enrolments.length > 0 && (
            <button onClick={downloadEnrolmentsCsv} className="text-[13px] font-semibold text-teal hover:underline">Download enrolments CSV</button>
          )}
        </div>
        {data.enrolments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No active enrolments yet.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {data.enrolments.map((e) => (
              <div key={e.courseId}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium text-ink">{e.course}</div>
                  <div className="text-[12.5px] text-muted">{e.learners.length} enrolled</div>
                </div>
                <div className="card divide-y divide-line">
                  {e.learners.map((l, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3 p-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#EDF1F1] text-[12px] font-semibold text-muted">
                        {l.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{l.name}</div>
                        <div className="text-[12px] text-muted">{l.profession ?? "—"}{l.membershipNo ? ` · ${l.membershipNo}` : ""}</div>
                      </div>
                      <div className="text-[12px] text-muted">Enrolled {formatDate(l.since)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrolments by profession */}
      <div className="card p-6">
        <h2 className="font-serif text-lg font-semibold text-ink">Enrolments by profession</h2>
        {professions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No enrolments yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {professions.map(([prof, n]) => (
              <li key={prof}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-ink">{prof}</span>
                  <span className="text-muted">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#EDF1F1]">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${(n / maxProf) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[12px] text-faint">Generated {formatDate(data.generatedAt)} · {data.provider.name}</p>
    </div>
  );
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Tile({ label, value, sub, dark }: { label: string; value: string; sub: string; dark?: boolean }) {
  return (
    <div className={`card p-5 ${dark ? "bg-ink text-white" : ""}`}>
      <div className={`label-caps ${dark ? "text-[#B9C6C6]" : ""}`}>{label}</div>
      <div className={`mt-2 font-serif text-3xl font-bold ${dark ? "text-white" : "text-ink"}`}>{value}</div>
      <div className={`mt-1 text-[12.5px] ${dark ? "text-[#9FB2B2]" : "text-muted"}`}>{sub}</div>
    </div>
  );
}
