import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/ui";
import { ApiError } from "../lib/api";

const PROFESSIONS = ["HR", "Finance", "Engineering", "Marketing", "Cross-industry"];

const BODIES: Record<string, string> = {
  HR: "Human Resource Managers' Association of Uganda",
  Finance: "Institute of Certified Public Accountants of Uganda",
  Engineering: "Uganda Institution of Professional Engineers",
  Marketing: "Public Relations Association of Uganda",
  "Cross-industry": "General professional body",
};

export default function Onboard() {
  const { user, updateProfile, signout } = useAuth();
  const navigate = useNavigate();

  const [profession, setProfession] = useState(user?.profession ?? PROFESSIONS[0]);
  const [membershipNo, setMembershipNo] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/signin" replace />;
  if (user.onboarded) return <Navigate to="/app" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await updateProfile({
        profession,
        membershipNo: membershipNo || null,
        professionalBody: BODIES[profession],
        jobTitle: jobTitle || null,
        organisation: organisation || null,
      });
      navigate("/app");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-[66px] max-w-3xl items-center justify-between px-6">
          <Logo />
          <button
            onClick={() => { signout(); navigate("/"); }}
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-2 label-caps">Step 1 of 1</div>
        <h1 className="font-serif text-3xl font-bold text-ink">
          Complete your CPD profile
        </h1>
        <p className="mt-2 text-muted">
          Tell us your professional body so we can tailor your points requirement
          and show the courses that count for you.
        </p>

        <form onSubmit={submit} className="card mt-8 space-y-5 p-6">
          <div>
            <label className="field-label">Profession</label>
            <select
              className="field"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            >
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <p className="mt-1.5 text-[12.5px] text-muted">
              Professional body: {BODIES[profession]}
            </p>
          </div>

          <div>
            <label className="field-label">Membership number <span className="font-normal text-muted">(optional)</span></label>
            <input
              className="field"
              value={membershipNo}
              onChange={(e) => setMembershipNo(e.target.value)}
              placeholder="e.g. HRM-2024-0417"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label">Job title <span className="font-normal text-muted">(optional)</span></label>
              <input
                className="field"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior HR Business Partner"
              />
            </div>
            <div>
              <label className="field-label">Organisation <span className="font-normal text-muted">(optional)</span></label>
              <input
                className="field"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                placeholder="Where you work"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rust-line bg-rust-soft px-3.5 py-2.5 text-sm text-rust">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? "Saving…" : "Go to my dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
