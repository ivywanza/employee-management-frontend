import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarPlus,
  FileUp,
  FolderOpen,
  MessageSquare,
  UserPlus,
  Users,
  Folders,
  ClipboardCheck,
  FileCheck,
  LogOut,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/auth";
import { useTheme } from "../lib/theme";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const COLLAPSE_KEY = "sidebar_collapsed";

// The tabs shown at the bottom of a phone screen. Everything else lives under "More".
const tabs: NavItem[] = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/leave", label: "Leave", icon: CalendarPlus },
  { to: "/documents", label: "Documents", icon: FolderOpen },
];

const tabClass = (active: boolean) =>
  `w-full flex flex-col items-center justify-center gap-0.5 py-2 transition ${
    active ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
  }`;

export default function DashboardLayout() {
  const { user, profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [moreOpen, setMoreOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const canReview = user?.role === "superadmin" || profile?.isHr === true;

  const everyone: NavItem[] = [
    { to: "/", label: "Home", icon: LayoutDashboard },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/leave", label: "Apply for Leave", icon: CalendarPlus },
    { to: "/documents", label: "Document Hub", icon: FolderOpen },
    { to: "/my-submissions", label: "Onboarding Documents", icon: FileUp },
  ];

  const adminItems: NavItem[] = [
    { to: "/add-employee", label: "Add Employee", icon: UserPlus },
    { to: "/employees", label: "Employee List", icon: Users },
    { to: "/manage-documents", label: "Manage Documents", icon: Folders },
  ];

  const reviewItems: NavItem[] = [
    { to: "/review-leave", label: "Review Leave", icon: ClipboardCheck },
    { to: "/review-onboarding", label: "Review Onboarding", icon: FileCheck },
  ];

  const toggleCollapsed = () => {
    const next = !collapsed;
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    setCollapsed(next);
  };

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? "?";
  const moreActive = !tabs.some((t) => (t.to === "/" ? pathname === "/" : pathname.startsWith(t.to)));

  const sidebarLinks = (items: NavItem[]) =>
    items.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/"}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl text-sm font-medium transition ${
            collapsed ? "justify-center py-3" : "px-4 py-2.5"
          } ${isActive ? "bg-white text-emerald-950 shadow border-2 border-blue-800" : "text-blue-100/90 hover:bg-white/10"}`
        }
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </NavLink>
    ));

  const sectionHeading = (label: string) =>
    collapsed ? (
      <div className="my-3 border-t border-white/10" />
    ) : (
      <p className="px-4 pt-5 pb-1 text-xs uppercase tracking-wide text-blue-300/80">{label}</p>
    );

  const sheetLinks = (items: NavItem[]) => (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setMoreOpen(false)}
          className={({ isActive }) =>
            `flex flex-col items-center gap-2 rounded-2xl p-3 text-center text-xs font-medium ${
              isActive
                ? "bg-red-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </div>
  );

  const sheetHeading = (label: string) => (
    <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
  );

  const footerButton =
    "w-full flex items-center gap-3 rounded-xl text-sm text-blue-100/90 hover:text-white hover:bg-white/10 transition";

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950">
      {/* Sidebar: desktop only */}
      <aside
        className={`hidden lg:flex ${
          collapsed ? "w-[4.5rem]" : "w-64"
        } shrink-0 sticky top-0 h-screen flex-col bg-gradient-to-b from-red-700 via-red-700 to-red-600 text-white transition-[width] duration-200`}
      >
        <div
          className={`flex items-center gap-3 border-b border-white/10 py-6 ${
            collapsed ? "justify-center" : "px-5"
          }`}
        >
          <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center text-red-700 font-extrabold text-lg shrink-0 shadow-md">
              <img src="/RedantLogo.webp" alt="Redant International"/>
            </div>
          {!collapsed && <span className="font-bold text-white">RedAnt Portal</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {sidebarLinks(everyone)}

          {isAdmin && (
            <>
              {sectionHeading("Admin")}
              {sidebarLinks(adminItems)}
            </>
          )}

          {canReview && (
            <>
              {sectionHeading("Review")}
              {sidebarLinks(reviewItems)}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          <button
            onClick={logout}
            title={collapsed ? "Log out" : undefined}
            className={`${footerButton} ${collapsed ? "justify-center py-3" : "px-4 py-2.5"}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Log out"}
          </button>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expand menu" : "Collapse menu"}
            className={`${footerButton} ${collapsed ? "justify-center py-3" : "px-4 py-2.5"}`}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 shrink-0" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center text-white text-sm font-extrabold shadow">
              <img src="/RedantLogo.webp" alt="Redant International"/>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100">RedAnt Portal</span>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggle}
              aria-label="Toggle light and dark mode"
              className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow flex items-center justify-center text-slate-600 dark:text-red-400 hover:scale-105 transition"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {profile?.full_name ?? "..."}
              </p>
              
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-800 to-red-600 text-white font-bold flex items-center justify-center shadow">
              {initial}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-2 pb-24 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar: phones and tablets */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} end={to === "/"} className={({ isActive }) => tabClass(isActive)}>
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium">{label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button onClick={() => setMoreOpen(true)} className={tabClass(moreActive)}>
              <Menu className="h-5 w-5" />
              <span className="text-[11px] font-medium">More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* "More" panel: phones and tablets */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 p-5 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">{profile?.full_name ?? "Menu"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sheetHeading("Menu")}
            {sheetLinks(everyone)}

            {isAdmin && (
              <>
                {sheetHeading("Admin")}
                {sheetLinks(adminItems)}
              </>
            )}

            {canReview && (
              <>
                {sheetHeading("Review")}
                {sheetLinks(reviewItems)}
              </>
            )}

            {sheetHeading("Account")}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={toggle}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 p-3 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 p-3 text-sm font-medium text-white"
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