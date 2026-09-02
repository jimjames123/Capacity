import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "./ui";

const NAV = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/courses", label: "My Courses", end: false },
  { to: "/app/notes", label: "My Notes", end: false },
  { to: "/app/goals", label: "My Goals", end: false },
  { to: "/app/marketplace", label: "Marketplace", end: false },
  { to: "/app/history", label: "History", end: false },
  { to: "/app/record", label: "My record", end: false },
];

export function MemberLayout() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[66px] max-w-6xl items-center gap-4 px-6">
          <NavLink to="/app" className="mr-auto">
            <Logo />
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#EDF1F1] text-ink"
                      : "text-muted hover:text-ink"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold text-ink">{user?.name}</div>
              <div className="text-[11px] text-muted">
                {user?.membershipNo ?? user?.profession ?? "Professional"}
              </div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-teal text-sm font-semibold text-white">
              {initials(user?.name)}
            </div>
          </div>
          <button
            onClick={() => {
              signout();
              navigate("/");
            }}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm font-semibold text-ink transition hover:bg-[#EEF2F2]"
          >
            Sign out
          </button>
        </div>
        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive ? "bg-[#EDF1F1] text-ink" : "text-muted"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function initials(name?: string): string {
  if (!name) return "•";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
