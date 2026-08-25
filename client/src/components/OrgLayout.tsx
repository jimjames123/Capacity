import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const NAV = [
  { to: "/org", label: "Dashboard", end: true },
  { to: "/org/staff", label: "Staff", end: false },
  { to: "/org/catalog", label: "Catalog", end: false },
  { to: "/org/consultants", label: "Consultants", end: false },
  { to: "/org/tenders", label: "Tender Board", end: false },
  { to: "/org/annual-plan", label: "Annual Plan", end: false },
  { to: "/org/records", label: "Activity Records", end: false },
  { to: "/org/reports", label: "Reports & Audit", end: false },
  { to: "/org/inhouse", label: "In-house", end: false },
  { to: "/org/bookings", label: "Bookings", end: false },
  { to: "/org/profile", label: "Profile", end: false },
];

export function OrgLayout() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const doSignout = () => {
    signout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="sticky top-0 hidden h-screen w-[232px] flex-shrink-0 flex-col bg-ink p-4 text-white md:flex">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <div className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-white/[0.14] font-serif text-[14px] font-bold">
            CS
          </div>
          <div className="leading-tight">
            <div className="whitespace-nowrap font-serif text-[17px] font-semibold">CPD Rail</div>
            <div className="text-[11px] text-[#D6E4E3]">Organization</div>
          </div>
        </div>

        <nav className="mt-7 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-white/[0.14] text-white"
                    : "text-[#D6E4E3] hover:bg-white/[0.08] hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="px-1.5 pb-3 leading-tight">
            <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
            <div className="text-[11px] text-[#9FB2B2]">Organization account</div>
          </div>
          <button
            onClick={doSignout}
            className="w-full rounded-[9px] border border-white/[0.28] px-3 py-2.5 text-[13px] font-medium text-white transition hover:bg-white/[0.08]"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-ink text-white md:hidden">
          <div className="flex h-[58px] items-center gap-3 px-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.14] font-serif text-[13px] font-bold">CS</div>
            <div className="mr-auto leading-tight">
              <div className="font-serif text-[15px] font-semibold">CPD Rail</div>
              <div className="text-[10px] text-[#D6E4E3]">Organization</div>
            </div>
            <button onClick={doSignout} className="rounded-lg border border-white/[0.28] px-3 py-1.5 text-[13px] font-medium">
              Sign out
            </button>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? "bg-white/[0.16] text-white" : "text-[#D6E4E3]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
