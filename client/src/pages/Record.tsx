import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { BrandIcon, EmptyState } from "../components/ui";
import { formatDate } from "../lib/format";
import type { ComplianceRecord } from "../lib/types";

interface RecordData {
  holder: {
    name: string;
    membershipNo: string | null;
    professionalBody: string | null;
  } | null;
  records: ComplianceRecord[];
}

export default function Record() {
  const [data, setData] = useState<RecordData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get<RecordData>("/record")
      .then(setData)
      .catch(() => setError("Could not load your record"));
  }, []);

  if (error) return <EmptyState title={error} />;
  if (!data) return <div className="h-96 animate-pulse rounded-2xl bg-line" />;

  const completed = data.records.filter((r) => r.complete);
  const cert = completed[0];

  function share(ref: string | null) {
    const url = `${window.location.origin}/verify/${ref ?? "pending"}`;
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">My CPD record</h1>
        <p className="mt-2 text-muted">
          Verified continuing professional development you can share with any
          employer or regulator.
        </p>
      </div>

      {!cert ? (
        <EmptyState
          title="No completed cycle yet"
          hint="Once you reach your required points and your body verifies them, your certificate of compliance appears here."
        />
      ) : (
        <>
          {/* Certificate */}
          <div id="certificate" className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line bg-[#FCFDFD] px-8 py-5">
              <div className="flex items-center gap-2.5">
                <BrandIcon className="h-10 w-auto" />
                <div className="leading-tight">
                  <div className="font-serif text-[15px] font-semibold text-ink">CAPACITY LANE · CPD Record</div>
                  <div className="text-[10.5px] text-muted">Verified continuing professional development</div>
                </div>
              </div>
              <span className="rounded-full border border-green-line bg-green-soft px-3 py-1 text-[12px] font-semibold text-green">
                ✓ Verified record
              </span>
            </div>

            <div className="px-8 py-10 text-center">
              <div className="label-caps">Certificate of CPD Compliance</div>
              <h2 className="mt-4 font-serif text-3xl font-bold text-ink">
                {data.holder?.name}
              </h2>
              {data.holder?.membershipNo && (
                <div className="mt-1 text-sm text-muted">
                  Membership {data.holder.membershipNo}
                </div>
              )}
              <p className="mx-auto mt-5 max-w-lg leading-relaxed text-[#2E3B3F]">
                has completed the continuing professional development requirement
                for the cycle{" "}
                <strong className="text-ink">
                  {formatDate(cert.startDate)} – {formatDate(cert.endDate)}
                </strong>
                , earning {cert.earnedPoints} of {cert.requiredPoints} required
                points across verified activities.
              </p>

              <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-4">
                <CertStat top={`${cert.earnedPoints} / ${cert.requiredPoints}`} label="Points earned" />
                <CertStat top={String(cert.activitiesVerified)} label="Activities verified" />
                <CertStat top={`${cert.compliancePct}%`} label="Compliance" />
              </div>

              <div className="mx-auto mt-9 flex max-w-lg items-end justify-between border-t border-line pt-6 text-left">
                <div>
                  <div className="font-serif text-lg font-semibold text-ink">
                    {cert.registrarName ?? "The Registrar"}
                  </div>
                  <div className="text-[12.5px] text-muted">
                    Registrar, {data.holder?.professionalBody ?? "issuing professional body"}
                  </div>
                </div>
                <div className="text-right text-[12.5px] text-muted">
                  <div>Ref {cert.certRef ?? "—"}</div>
                  <div>Issued {cert.issuedAt ? formatDate(cert.issuedAt) : "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 print:hidden">
            <button onClick={() => window.print()} className="btn-primary">
              Download PDF
            </button>
            <button onClick={() => share(cert.certRef)} className="btn-ghost">
              {copied ? "✓ Link copied" : "Share verification link"}
            </button>
          </div>

          {/* Other cycles */}
          {data.records.length > 1 && (
            <div className="card p-6 print:hidden">
              <h3 className="font-serif text-lg font-semibold text-ink">All cycles</h3>
              <ul className="mt-3 divide-y divide-line">
                {data.records.map((r) => (
                  <li key={r.cycleId} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-ink">{r.label}</div>
                      <div className="text-[12.5px] text-muted">
                        {r.earnedPoints} / {r.requiredPoints} points · {r.activitiesVerified} verified
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                        r.complete
                          ? "border border-green-line bg-green-soft text-green"
                          : "border border-amber-line bg-amber-soft text-amber"
                      }`}
                    >
                      {r.complete ? "Compliant" : "In progress"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CertStat({ top, label }: { top: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-4">
      <div className="font-serif text-2xl font-bold text-ink">{top}</div>
      <div className="mt-1 text-[12px] text-muted">{label}</div>
    </div>
  );
}
