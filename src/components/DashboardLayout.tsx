import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Sun, Moon, Menu, X } from "lucide-react";
import { useAuth } from "../context/auth";
import { useTheme } from "../lib/theme";
import { getVisibleNavigation, type NavigationSection } from "../config/navigation";

const COLLAPSE_KEY = "sidebar_collapsed";

const tabClass = (active: boolean) =>
  `w-full flex items-center justify-center py-3 text-xs font-medium transition ${ 
    active ? "text-red-700 dark:text-red-400 font-bold" : "text-slate-500 dark:text-slate-400"
  }`;

export default function DashboardLayout() {
  const { user, profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [moreOpen, setMoreOpen] = useState(false);

  const sections = getVisibleNavigation({
    role: user?.role ?? null,
    isHr: profile?.isHr === true,
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    setCollapsed(next);
  };

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? "?";
  const isActivePath = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  const sectionHeading = (label?: string) =>
    label ? (
      <p className="px-4 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
    ) : null;

  const navLinks = (section: NavigationSection) => (
    <div className="space-y-1">
      {section.items.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setMoreOpen(false)}
          className={({ isActive }) =>
            `block border-l-4 px-4 py-2.5 text-sm transition ${ 
              isActive
                ? "border-red-600 font-bold text-slate-950 dark:text-white"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  );

  const footerButton =
    "w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition";

  const workActive = ["/tasks", "/timesheet", "/insights"].some(isActivePath);
  const documentActive = ["/documents", "/onboarding", "/my-submissions"].some(isActivePath);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {!collapsed && (
        <aside className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
            <img className="h-10 w-10 rounded-lg object-contain" src="/RedantLogo.webp" alt="Redant International" />
            <span className="font-bold text-slate-900 dark:text-white">RedAnt Portal</span>
          </div>

          <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 pb-4">
            {sections.map((section, index) => (
              <section key={section.label ?? `main-${index}`}>
                {sectionHeading(section.label)}
                {navLinks(section)}
              </section>
            ))}
          </nav>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6 lg:px-8">
          {collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Open navigation menu"
              className="hidden lg:inline-flex h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Menu
            </button>
          )}
          <div className="flex items-center gap-3 lg:hidden">
            <img className="h-9 w-9 rounded-lg object-contain" src="/RedantLogo.webp" alt="Redant International" />
            <span className="font-bold text-slate-900 dark:text-white">RedAnt Portal</span>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle light and dark mode"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-slate-700"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {profile?.full_name ?? "..."}
              </p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
            </div>
            <div aria-label={profile?.full_name ?? "User"} className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-950 font-bold text-white">
              {initial}
            </div>
            {!collapsed && (
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Collapse navigation menu"
                className="hidden lg:inline-flex h-10 items-center rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Collapse
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        <ul className="grid grid-cols-5">
          <li>
            <NavLink to="/" end className={({ isActive }) => tabClass(isActive)}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/messages" className={({ isActive }) => tabClass(isActive)}>
              Messages
            </NavLink>
          </li>
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} className={tabClass(workActive)}>
              Work
            </button>
          </li>
          <li>
            <NavLink to="/documents" className={() => tabClass(documentActive)}>
              Documents
            </NavLink>
          </li>
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} className={tabClass(false)}>
              More
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="More navigation options">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{profile?.full_name ?? "Menu"}</p>
                <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sections.map((section, index) => (
              <section key={section.label ?? `main-${index}`}>
                {sectionHeading(section.label)}
                <div className="grid grid-cols-2 gap-2">
                  {section.items.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/"}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        `rounded-lg border px-3 py-3 text-sm transition ${ 
                          isActive
                            ? "border-red-600 font-semibold text-red-700 dark:text-red-400"
                            : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </section>
            ))}

            <p className="mt-5 mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Account
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggle}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 p-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-700 p-3 text-sm font-medium text-white"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
