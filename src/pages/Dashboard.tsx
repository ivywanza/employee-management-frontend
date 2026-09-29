import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarPlus,
  FileUp,
  FolderOpen,
  ClipboardList,
  UserPlus,
  Users,
  Folders,
  ClipboardCheck,
  FileCheck,
  LogOut,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/auth";
import { useTheme } from "../lib/theme";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export default function DashboardLayout() {
  const { user, profile, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const canReview = user?.role === "superadmin" || profile?.isHr === true;

  const everyone: NavItem[] = [
    { to: "/", label: "Home", icon: LayoutDashboard },
    { to: "/leave", label: "Apply for Leave", icon: CalendarPlus },
    { to: "/onboarding", label: "Onboarding Documents", icon: FileUp },
    { to: "/documents", label: "Document Hub", icon: FolderOpen },
    { to: "/my-submissions", label: "My Submissions", icon: ClipboardList },
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

  const renderLinks = (items: NavItem[]) =>
    items.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/"}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
            isActive
              ? "bg-red-600 text-white shadow"
              : "text-blue-100/90 hover:bg-white/10"
          }`
        }
      >
        <Icon className="h-4 w-4" />
        {label}
      </NavLink>
    ));

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950">
      <aside className="w-64 shrink-0 bg-gradient-to-b from-blue-950 to-blue-900 text-white flex flex-col">
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-extrabold shadow">
            RA
          </div>
          <span className="font-bold text-white">RedAnt Portal</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {renderLinks(everyone)}

          {isAdmin && (
            <>
              <p className="px-4 pt-5 pb-1 text-xs uppercase tracking-wide text-blue-300/80">Admin</p>
              {renderLinks(adminItems)}
            </>
          )}

          {canReview && (
            <>
              <p className="px-4 pt-5 pb-1 text-xs uppercase tracking-wide text-blue-300/80">Review</p>
              {renderLinks(reviewItems)}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-blue-100/90 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-end gap-4 px-8 py-4">
          <button
            onClick={toggle}
            aria-label="Toggle light and dark mode"
            className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow flex items-center justify-center text-slate-600 dark:text-red-400 hover:scale-105 transition"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {profile?.full_name ?? "..."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-800 to-red-600 text-white font-bold flex items-center justify-center shadow">
              {initial}
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 pb-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}