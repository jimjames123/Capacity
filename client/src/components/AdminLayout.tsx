import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "./ui";

const NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/queue", label: "Verification queue", end: false },
  { to: "/admin/members", label: "Members", end: false },
  { to: "/admin/organizations", label: "Organizations", end: false },
  { to: "/admin/consultants", label: "Consultants", end: false },
];

export function AdminLayout() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[66px] max-w-6xl items-center gap-4 px-6">
          <NavLink to="/admin" className="mr-2">
            <Logo />
          </NavLink>
          <span className="hidden rounded-full border border-line-strong bg-[#EEF2F2] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted sm:inline">
            Registrar console
          </span>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-[#EDF1F1] text-ink" : "text-muted hover:text-ink"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-semibold text-ink">{user?.name}</div>
              <div className="text-[11px] text-muted">Registrar</div>
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
        </div>
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
