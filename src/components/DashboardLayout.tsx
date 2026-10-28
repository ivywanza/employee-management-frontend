import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useLive, type LiveEvent } from "../context/live";
import {
  LogOut,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  FileText,
  FolderOpen,
  UserPlus,
  Users,
  ClipboardCheck,
  Building2,
  MessageSquareWarning,
  Package,
  ShoppingCart,
  ListTodo,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/auth";
import { useTheme } from "../lib/theme";

type Role = "employee" | "admin" | "superadmin";

interface NavItem {
  to: string;
  label: string;
  icon?: LucideIcon;
  roles?: Role[];
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  roles?: Role[];
}

const COLLAPSE_KEY = "sidebar_collapsed";

const ALL_ROLES: Role[] = ["employee", "admin", "superadmin"];
const ADMIN_ROLES: Role[] = ["admin", "superadmin"];
const MANAGEMENT_ROLES: Role[] = ["superadmin"];
const REVIEW_ROLES: Role[] = ["admin", "superadmin"];

const tabs: NavItem[] = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/leave", label: "Leave", icon: CalendarDays },
  { to: "/documents", label: "Documents", icon: FolderOpen },
];

const tabClass = (active: boolean) =>
  `w-full flex flex-col items-center justify-center gap-0.5 py-2 transition ${
    active
      ? "text-red-600 dark:text-red-400"
      : "text-slate-500 dark:text-slate-400"
  }`;

export default function DashboardLayout() {
  const { user, profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "1",
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const role = user?.role as Role | undefined;
  const isAdmin = role === "admin" || role === "superadmin";
  const canReview = role === "superadmin" || profile?.isHr === true;

  const everyone: NavItem[] = [
    { to: "/", label: "Home", icon: LayoutDashboard },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/leave", label: "Apply for Leave", icon: CalendarDays },
    { to: "/documents", label: "Document Hub", icon: FolderOpen },
    { to: "/onboarding", label: "Onboarding Documents", icon: FileText },
    { to: "/my-submissions", label: "My Submissions", icon: ClipboardCheck },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ];

  const adminItems: NavItem[] = [
    { to: "/add-associate", label: "Add Associate", icon: UserPlus },
    { to: "/associates", label: "Associates List", icon: Users },
    { to: "/manage-documents", label: "Manage Documents", icon: FolderOpen },
  ];

  const reviewItems: NavItem[] = [
    { to: "/review-leave", label: "Review Leave", icon: ClipboardCheck },
    {
      to: "/review-onboarding",
      label: "Review Onboarding",
      icon: FileText,
    },
  ];

  // New dropdown groups. Change roles here to match your final access rules.
  const groups: NavGroup[] = [
    {
      label: "Departments",
      icon: Building2,
      roles: ADMIN_ROLES,
      items: [
        {
          to: "/departments",
          label: "View Departments",
          icon: Building2,
          roles: ADMIN_ROLES,
        },
        
      ],
    },

    {
      label: "Grievances",
      icon: MessageSquareWarning,
      items: [
        {
          to: "/grievances/submit",
          label: "Submit Grievance",
          icon: MessageSquareWarning,
          roles: ALL_ROLES,
        },
        {
          to: "/grievances/inbox",
          label: "Grievance Inbox",
          icon: ClipboardCheck,
          roles: MANAGEMENT_ROLES,
        },
      ],
    },

    {
      label: "Assets",
      icon: Package,
      items: [
        {
          to: "/assets/operations",
          label: "Manage Assets",
          icon: Package,
          roles: ALL_ROLES,
        },
      ],
    },

    {
      label: "Requisitions",
      icon: ShoppingCart,
      items: [
        {
          to: "/requisitions/submit",
          label: "Submit Requisition",
          icon: ShoppingCart,
          roles: ALL_ROLES,
        },
        {
          to: "/requisitions/mine",
          label: "My Requisitions",
          icon: FileText,
          roles: ALL_ROLES,
        },
        {
          to: "/requisitions",
          label: "View Requisitions",
          icon: FolderOpen,
          roles: REVIEW_ROLES,
        },
        {
          to: "/requisitions/review",
          label: "Review Requisitions",
          icon: ClipboardCheck,
          roles: REVIEW_ROLES,
        },
        {
          to: "/requisitions/manage",
          label: "Manage Requisitions",
          icon: Users,
          roles: MANAGEMENT_ROLES,
        },
      ],
    },
    // {
    //   label: "Tasks & Timesheets",
    //   icon: ListTodo,
    //   items: [
    //     {
    //       to: "/tasks/mine",
    //       label: "My Tasks",
    //       icon: ListTodo,
    //       roles: ALL_ROLES,
    //     },
    //     {
    //       to: "/timesheets/mine",
    //       label: "My Timesheets",
    //       icon: CalendarDays,
    //       roles: ALL_ROLES,
    //     },
    //     {
    //       to: "/tasks",
    //       label: "Manage Tasks",
    //       icon: ClipboardCheck,
    //       roles: REVIEW_ROLES,
    //     },
    //     {
    //       to: "/timesheets/review",
    //       label: "Review Timesheets",
    //       icon: ClipboardCheck,
    //       roles: REVIEW_ROLES,
    //     },
    //   ],
    // },
  ];

  const toggleCollapsed = () => {
    const next = !collapsed;
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    setCollapsed(next);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  };

  const { subscribe } = useLive();

  const [liveNotice, setLiveNotice] = useState<{
    title: string;
    message: string;
    target?: string;
  } | null>(null);

  useEffect(() => {
    return subscribe((event: LiveEvent) => {
      if (event.type === "notification") {
        setLiveNotice({
          title: event.title,
          message: event.message,
          target: event.target,
        });
      }
    });
  }, [subscribe]);

  const visibleItems = (items: NavItem[]) =>
    items.filter((item) => !item.roles || (role && item.roles.includes(role)));

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: visibleItems(group.items),
    }))
    .filter(
      (group) =>
        group.items.length > 0 &&
        (!group.roles || (role && group.roles.includes(role))),
    );

  const isPathActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  const groupIsActive = (group: NavGroup) =>
    group.items.some((item) => isPathActive(item.to));

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? "?";

  const moreActive = !tabs.some((tab) => isPathActive(tab.to));

  const sidebarLinks = (items: NavItem[]) =>
    visibleItems(items).map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/"}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl text-sm font-medium transition ${
            collapsed ? "justify-center py-3" : "px-4 py-2.5"
          } ${
            isActive
              ? "bg-white text-emerald-950 shadow border-2 border-blue-800"
              : "text-blue-100/90 hover:bg-white/10"
          }`
        }
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {!collapsed && <span className="truncate">{label}</span>}
      </NavLink>
    ));

  const sidebarGroups = (items: NavGroup[]) =>
    items.map((group) => {
      const Icon = group.icon;
      const open = expandedGroups.includes(group.label) || groupIsActive(group);

      return (
        <div key={group.label} className="space-y-1">
          <button
            type="button"
            title={collapsed ? group.label : undefined}
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                localStorage.setItem(COLLAPSE_KEY, "0");
                setExpandedGroups((current) =>
                  current.includes(group.label)
                    ? current
                    : [...current, group.label],
                );
              } else {
                toggleGroup(group.label);
              }
            }}
            aria-expanded={open}
            className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-blue-100/90 hover:bg-white/10 transition ${
              collapsed ? "justify-center py-3" : "px-4 py-2.5"
            } ${groupIsActive(group) ? "bg-white/10 text-white" : ""}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">{group.label}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </button>

          {!collapsed && open && (
            <div className="ml-4 border-l border-white/20 pl-2 space-y-1">
              {group.items.map(({ to, label, icon: ItemIcon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-white text-emerald-950 shadow"
                        : "text-blue-100/90 hover:bg-white/10"
                    }`
                  }
                >
                  {ItemIcon && <ItemIcon className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    });

  const sectionHeading = (label: string) =>
    collapsed ? (
      <div className="my-3 border-t border-white/10" />
    ) : (
      <p className="px-4 pt-5 pb-1 text-xs uppercase tracking-wide text-blue-300/80">
        {label}
      </p>
    );

  const sheetLinks = (items: NavItem[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {visibleItems(items).map(({ to, label, icon: Icon }) => (
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
          {Icon && <Icon className="h-5 w-5" />}
          {label}
        </NavLink>
      ))}
    </div>
  );

  const sheetGroups = (items: NavGroup[]) => (
    <div className="space-y-3">
      {items.map((group) => {
        const Icon = group.icon;
        const open =
          expandedGroups.includes(group.label) || groupIsActive(group);

        return (
          <div
            key={group.label}
            className="rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={open}
              className="w-full flex items-center gap-3 p-3 text-left font-medium text-slate-800 dark:text-slate-100"
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{group.label}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {open && (
              <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map(({ to, label, icon: ItemIcon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl p-3 text-sm ${
                        isActive
                          ? "bg-red-600 text-white"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                      }`
                    }
                  >
                    {ItemIcon && <ItemIcon className="h-4 w-4 shrink-0" />}
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const sheetHeading = (label: string) => (
    <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </p>
  );

  const footerButton =
    "w-full flex items-center gap-3 rounded-xl text-sm text-blue-100/90 hover:text-white hover:bg-white/10 transition";

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950">
      {/* Sidebar: original desktop layout retained */}
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
            <img
              src="/RedantLogo.webp"
              alt="Redant International"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          {!collapsed && (
            <span className="font-bold text-white">RedAnt Portal</span>
          )}
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

          {sectionHeading("Workspace")}
          {sidebarGroups(visibleGroups)}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          <button
            onClick={logout}
            title={collapsed ? "Log out" : undefined}
            className={`${footerButton} ${
              collapsed ? "justify-center py-3" : "px-4 py-2.5"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Log out"}
          </button>

          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expand menu" : "Collapse menu"}
            className={`${footerButton} ${
              collapsed ? "justify-center py-3" : "px-4 py-2.5"
            }`}
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

      {/* Content and existing header retained */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center text-white text-sm font-extrabold shadow">
              <img
                src="/RedantLogo.webp"
                alt="Redant International"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              RedAnt Portal
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggle}
              aria-label="Toggle light and dark mode"
              className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow flex items-center justify-center text-slate-600 dark:text-red-400 hover:scale-105 transition"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
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

      {/* Existing mobile bottom navigation retained */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) => tabClass(isActive)}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span className="text-[11px] font-medium">{label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button
              onClick={() => setMoreOpen(true)}
              className={tabClass(moreActive)}
            >
              <Menu className="h-5 w-5" />
              <span className="text-[11px] font-medium">More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Existing More panel extended with the new dropdown groups */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />

          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 p-5 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {profile?.full_name ?? "Menu"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {user?.role}
                </p>
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

            {sheetHeading("Workspace")}
            {sheetGroups(visibleGroups)}

            {sheetHeading("Account")}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={toggle}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 p-3 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
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

          {liveNotice && (
            <div
              role="status"
              className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {liveNotice.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {liveNotice.message}
                  </p>

                  {liveNotice.target && (
                    <NavLink
                      to={liveNotice.target}
                      onClick={() => setLiveNotice(null)}
                      className="mt-3 inline-flex text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Open grievance inbox
                    </NavLink>
                  )}
                </div>

                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => setLiveNotice(null)}
                  className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
