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
  Check,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/auth";
import { useTheme } from "../lib/theme";
import api from "../lib/api";

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

interface PortalNotification {
  id: string;
  title: string;
  message: string;
  target?: string;
  read: boolean;
  createdAt: Date;
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
  const { subscribe } = useLive();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "1",
  );

  const [moreOpen, setMoreOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [notifications, setNotifications] = useState<PortalNotification[]>([]);

  const [liveNotice, setLiveNotice] = useState<{
    title: string;
    message: string;
    target?: string;
  } | null>(null);

  const role = user?.role as Role | undefined;
  const isAdmin = role === "admin" || role === "superadmin";
  const canReview = role === "superadmin" || profile?.isHr === true;

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  const everyone: NavItem[] = [
    { to: "/", label: "Home", icon: LayoutDashboard },
    { to: "/leave", label: "Apply for Leave", icon: CalendarDays },
    { to: "/documents", label: "Document Hub", icon: FolderOpen },
    { to: "/onboarding", label: "Onboarding Documents", icon: FileText },
    { to: "/my-submissions", label: "My Submissions", icon: ClipboardCheck },
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
        {
          to: "/departments/manage",
          label: "Manage Departments",
          icon: Users,
          roles: MANAGEMENT_ROLES,
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
          to: "/assets",
          label: "View Assets",
          icon: Package,
          roles: REVIEW_ROLES,
        },
        {
          to: "/assets/mine",
          label: "My Assigned Assets",
          icon: FolderOpen,
          roles: ALL_ROLES,
        },
        {
          to: "/assets/requests",
          label: "Request an Asset",
          icon: ClipboardCheck,
          roles: ALL_ROLES,
        },
        {
          to: "/assets/manage",
          label: "Manage Assets",
          icon: Users,
          roles: MANAGEMENT_ROLES,
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
      ],
    },
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

  // Load existing pending activities from the backend.
  // Refresh every 30 seconds.
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications/pending");
        if (cancelled) return;

        const rows = Array.isArray(response.data) ? response.data : [];
        const readIds: string[] = JSON.parse(
          localStorage.getItem(`portal_notifications_read_${user.id}`) || "[]",
        );

        const loaded: PortalNotification[] = rows.map(
          (item: {
            id: string;
            title: string;
            message: string;
            target?: string;
            created_at?: string | null;
          }) => ({
            id: String(item.id),
            title: item.title,
            message: item.message,
            target: item.target,
            read: readIds.includes(String(item.id)),
            createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          }),
        );

        setNotifications(loaded);
      } catch (error) {
        console.error("Failed to load pending notifications:", error);
      }
    };

    void loadNotifications();

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  // Receive live notification events.
  useEffect(() => {
    return subscribe((event: LiveEvent) => {
      if (event.type === "notification") {
        const notification: PortalNotification = {
          id: `${Date.now()}-${Math.random()}`,
          title: event.title,
          message: event.message,
          target: event.target,
          read: false,
          createdAt: new Date(),
        };

        setNotifications((current) => [notification, ...current]);

        setLiveNotice({
          title: event.title,
          message: event.message,
          target: event.target,
        });
      }
    });
  }, [subscribe]);

  const markAsRead = (id: string) => {
    setNotifications((current) => {
      const updated = current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      );

      const readIds = updated
        .filter((item) => item.read)
        .map((item) => item.id);

      if (user?.id) {
        localStorage.setItem(
          `portal_notifications_read_${user.id}`,
          JSON.stringify(readIds),
        );
      }

      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((current) => {
      const updated = current.map((item) => ({ ...item, read: true }));

      if (user?.id) {
        localStorage.setItem(
          `portal_notifications_read_${user.id}`,
          JSON.stringify(updated.map((item) => item.id)),
        );
      }

      return updated;
    });
  };

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

  const formatNotificationTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;

    return date.toLocaleDateString();
  };

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
      {/* Desktop sidebar */}
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

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur">
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

            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationOpen((current) => !current)}
                aria-label={`Notifications: ${unreadCount} unread`}
                aria-expanded={notificationOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-800 dark:text-slate-100 transition hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <Bell className="h-[23px] w-[23px]" strokeWidth={2.2} />

                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-slate-100 dark:border-slate-950 bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                    {displayCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => setNotificationOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  <div className="absolute right-0 top-12 z-50 w-[340px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-[390px]">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          Notifications
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {unreadCount} unread
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-800 dark:text-red-400"
                        >
                          <CheckCheck size={15} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                          <Bell
                            className="mx-auto text-slate-300 dark:text-slate-600"
                            size={30}
                          />
                          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                            You're all caught up
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            New portal activities will appear here.
                          </p>
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`flex gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 ${
                              !item.read
                                ? "bg-red-50/50 dark:bg-red-950/20"
                                : ""
                            }`}
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                item.read ? "bg-transparent" : "bg-red-600"
                              }`}
                            />

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {item.title}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                {item.message}
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-slate-400">
                                  {formatNotificationTime(item.createdAt)}
                                </span>

                                <div className="flex items-center gap-3">
                                  {item.target && (
                                    <NavLink
                                      to={item.target}
                                      onClick={() => {
                                        markAsRead(item.id);
                                        setNotificationOpen(false);
                                      }}
                                      className="text-xs font-semibold text-red-700 hover:underline dark:text-red-400"
                                    >
                                      View
                                    </NavLink>
                                  )}

                                  {!item.read && (
                                    <button
                                      type="button"
                                      onClick={() => markAsRead(item.id)}
                                      title="Mark as read"
                                      aria-label="Mark notification as read"
                                      className="text-slate-400 hover:text-emerald-600"
                                    >
                                      <Check size={15} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                
                  </div>
                </>
              )}
            </div>

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

      {/* Mobile bottom navigation */}
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

      {/* Mobile More panel */}
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
        </div>
      )}

      {/* Existing live activity toast */}
      {liveNotice && (
        <div
          role="status"
          className="fixed right-4 top-20 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
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
                  Open activity
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
  );
}
