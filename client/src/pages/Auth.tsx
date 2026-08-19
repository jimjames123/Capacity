import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/ui";
import { ApiError } from "../lib/api";

const PROFESSIONS = ["HR", "Finance", "Engineering", "Marketing", "Cross-industry"];

export default function Auth({ mode }: { mode: "signin" | "signup" }) {
  const { user, signin, signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profession, setProfession] = useState(PROFESSIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.onboarded ? "/app" : "/onboard"} replace />;

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isSignup) {
        const u = await signup({ name, email, password, profession });
        navigate(u.onboarded ? "/app" : "/onboard");
      } else {
        const u = await signin(email, password);
        navigate(u.onboarded ? "/app" : "/onboard");
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
            <div className="grid h-9 w-9 place-items-center rounded-[9px] bg-white font-serif text-[15px] font-bold text-ink">
              CS
            </div>
            <div className="leading-tight">
              <div className="font-serif text-[17px] font-semibold">CAPACITYSPOT</div>
              <div className="text-[10.5px] tracking-[0.4px] text-[#9FB2B2]">CPD RAIL</div>
            </div>
          </div>
        </Link>
        <div>
          <h2 className="max-w-md font-serif text-3xl font-bold leading-tight">
            Your continuing professional development, verified and in one place.
          </h2>
          <p className="mt-4 max-w-sm text-[#B9C6C6]">
            Join 2,400+ professionals across Uganda who track their CPD and share
            a trusted, verified record.
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
              ? "Start tracking your CPD in under a minute."
              : "Log in to your CPD dashboard."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {isSignup && (
              <div>
                <label className="field-label">Full name</label>
                <input
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aisha Nakato"
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
            {isSignup && (
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

            {error && (
              <div className="rounded-lg border border-rust-line bg-rust-soft px-3.5 py-2.5 text-sm text-rust">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          {!isSignup && (
            <button
              onClick={fillDemo}
              className="mt-3 w-full text-center text-[13px] text-muted hover:text-ink"
            >
              Use the demo account →
            </button>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            {isSignup ? "Already have an account? " : "New to CapacitySpot? "}
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
