import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth, type AccountType } from "../lib/auth";
import { Logo } from "../components/ui";
import { ApiError } from "../lib/api";
import { homePathForUser } from "../lib/nav";

const PROFESSIONS = ["HR", "Finance", "Engineering", "Marketing", "Cross-industry"];

const ACCOUNT_TYPES: { value: AccountType; label: string; hint: string }[] = [
  { value: "individual", label: "Individual", hint: "Track your own CPD" },
  { value: "organization", label: "Organization", hint: "Train and manage a team" },
  { value: "consultant", label: "Consultant", hint: "Offer accredited training" },
];

export default function Auth({ mode }: { mode: "signin" | "signup" }) {
  const { user, signin, signup } = useAuth();
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [consultantType, setConsultantType] = useState<"institution" | "individual">("individual");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profession, setProfession] = useState(PROFESSIONS[0]);
  const [sector, setSector] = useState("");
  const [expertise, setExpertise] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homePathForUser(user)} replace />;

  const isSignup = mode === "signup";

  const nameLabel =
    accountType === "organization" ? "Organization name"
    : accountType === "consultant" ? (consultantType === "institution" ? "Institution name" : "Your name")
    : "Full name";
  const namePlaceholder =
    accountType === "organization" ? "Nile Insurance Uganda"
    : accountType === "consultant" ? (consultantType === "institution" ? "Kampala Leadership Institute" : "Dr. Sarah Kembabazi")
    : "Aisha Nakato";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isSignup) {
        const u = await signup({
          name, email, password, accountType,
          profession: accountType === "individual" ? profession : undefined,
          consultantType: accountType === "consultant" ? consultantType : undefined,
          sector: accountType === "organization" ? sector : undefined,
          expertise: accountType === "consultant" ? expertise : undefined,
        });
        navigate(homePathForUser(u));
      } else {
        const u = await signin(email, password);
        navigate(homePathForUser(u));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setEmail("aisha@example.com");
    setPassword("password123");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <Link to="/">
          <div className="flex items-center gap-2.5">
            <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[9px] bg-white font-serif text-[15px] font-bold text-ink">
              <span className="relative z-10">CL</span>
              <span className="absolute inset-x-0 bottom-0 h-[28%] bg-teal" />
            </div>
            <div className="leading-tight">
              <div className="font-serif text-[17px] font-semibold">CAPACITY LANE</div>
              <div className="text-[10.5px] tracking-[0.4px] text-[#9FB2B2]">CPD PLATFORM</div>
            </div>
          </div>
        </Link>
        <div>
          <h2 className="max-w-md font-serif text-3xl font-bold leading-tight">
            Your continuing professional development, verified and in one place.
          </h2>
          <p className="mt-4 max-w-sm text-[#B9C6C6]">
            Join 2,400+ professionals, organisations and consultants across Uganda on a
            trusted, verified CPD record.
          </p>
        </div>
        <div className="text-[12.5px] text-[#7E9292]">
          Kampala, Uganda · Pilot build for validation review
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/"><Logo /></Link>
          </div>

          {/* Tabs */}
          <div className="mb-6 inline-flex rounded-xl border border-line bg-white p-1">
            <Link
              to="/signin"
              className={`rounded-lg px-5 py-1.5 text-sm font-semibold transition ${
                !isSignup ? "bg-ink text-white" : "text-muted"
              }`}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className={`rounded-lg px-5 py-1.5 text-sm font-semibold transition ${
                isSignup ? "bg-ink text-white" : "text-muted"
              }`}
            >
              Sign up
            </Link>
          </div>

          <h1 className="font-serif text-2xl font-bold text-ink">
            {isSignup ? "Create your free account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {isSignup
              ? "Choose how you'll use Capacity Lane to get started."
              : "Log in to your CPD dashboard."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {isSignup && (
              <div>
                <label className="field-label">I'm signing up as</label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setAccountType(t.value)}
                      className={`rounded-xl border px-2 py-2.5 text-center transition ${
                        accountType === t.value
                          ? "border-teal bg-teal-soft"
                          : "border-line bg-white hover:border-line-strong"
                      }`}
                    >
                      <div className={`text-[13px] font-semibold ${accountType === t.value ? "text-teal" : "text-ink"}`}>{t.label}</div>
                      <div className="mt-0.5 text-[10.5px] leading-tight text-muted">{t.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSignup && accountType === "consultant" && (
              <div>
                <label className="field-label">Consultant type</label>
                <div className="mt-1.5 inline-flex w-full rounded-xl border border-line bg-white p-1">
                  {([["individual", "Individual Consultant"], ["institution", "Institutional Consultant"]] as const).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setConsultantType(v)}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition ${
                        consultantType === v ? "bg-ink text-white" : "text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSignup && (
              <div>
                <label className="field-label">{nameLabel}</label>
                <input
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={namePlaceholder}
                  required
                />
              </div>
            )}
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 6 characters" : "••••••••"}
                required
              />
            </div>

            {isSignup && accountType === "individual" && (
              <div>
                <label className="field-label">Your profession</label>
                <select
                  className="field"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                >
                  {PROFESSIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {isSignup && accountType === "organization" && (
              <div>
                <label className="field-label">Sector <span className="font-normal text-muted">(optional)</span></label>
                <input
                  className="field"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Financial services"
                />
              </div>
            )}

            {isSignup && accountType === "consultant" && (
              <div>
                <label className="field-label">Area of expertise <span className="font-normal text-muted">(optional)</span></label>
                <input
                  className="field"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="Leadership, governance & compliance"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-rust-line bg-rust-soft px-3.5 py-2.5 text-sm text-rust">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          {isSignup && accountType === "consultant" && (
            <p className="mt-3 text-center text-[12px] text-muted">
              New consultant accounts are reviewed by the professional body before your
              listings go live.
            </p>
          )}

          {!isSignup && (
            <button
              onClick={fillDemo}
              className="mt-3 w-full text-center text-[13px] text-muted hover:text-ink"
            >
              Use the demo account →
            </button>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            {isSignup ? "Already have an account? " : "New to Capacity Lane? "}
            <Link
              to={isSignup ? "/signin" : "/signup"}
              className="font-semibold text-teal hover:underline"
            >
              {isSignup ? "Log in" : "Join for free"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
