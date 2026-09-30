import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { BrandIcon } from "./ui";

const NAV = [
  { to: "/provider", label: "Home", end: true },
  { to: "/provider/courses", label: "My courses", end: false },
  { to: "/provider/tenders", label: "Tender board", end: false },
  { to: "/provider/bids", label: "My bids", end: false },
  { to: "/provider/notifications", label: "Notifications", end: false },
  { to: "/provider/inquiries", label: "Inquiries", end: false },
  { to: "/provider/venues", label: "Venues", end: false },
  { to: "/provider/reports", label: "Reports", end: false },
  { to: "/provider/profile", label: "Profile", end: false },
];

export function ProviderLayout() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const doSignout = () => {
    signout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="sticky top-0 hidden h-screen w-[232px] flex-shrink-0 flex-col bg-ink p-4 text-white md:flex">
        <div className="flex flex-shrink-0 items-center gap-2.5 px-1.5 py-1">
          <div className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-white p-1">
            <BrandIcon className="max-h-full w-auto" />
          </div>
          <div className="leading-tight">
            <div className="whitespace-nowrap font-serif text-[17px] font-semibold">Capacity Lane</div>
            <div className="text-[11px] text-[#D6E4E3]">Provider</div>
          </div>
        </div>

        <nav className="my-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
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

        <div className="flex-shrink-0 border-t border-white/10 pt-3">
          <div className="px-1.5 pb-2.5 leading-tight">
            <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
            <div className="text-[11px] text-[#9FB2B2]">Provider account</div>
          </div>
          <button
            onClick={doSignout}
            className="flex w-full items-center justify-center gap-2 rounded-[9px] border border-white/[0.28] bg-white/[0.08] px-3 py-2 text-[13px] font-medium text-white transition hover:bg-white/[0.18]"
          >
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop top utility bar */}
        <div className="sticky top-0 z-20 hidden items-center justify-between border-b border-line bg-white/95 px-8 py-3 backdrop-blur md:flex">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-teal" />
            Signed in as <span className="font-semibold text-ink">{user?.name}</span> ({user?.email})
          </div>
          <button
            onClick={doSignout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-[#EEF2F2] hover:text-rust"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
        <header className="sticky top-0 z-30 border-b border-line bg-ink text-white md:hidden">
          <div className="flex h-[58px] items-center gap-3 px-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white p-1"><BrandIcon className="max-h-full w-auto" /></div>
            <div className="mr-auto leading-tight">
              <div className="font-serif text-[15px] font-semibold">Capacity Lane</div>
              <div className="text-[10px] text-[#D6E4E3]">Provider</div>
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
