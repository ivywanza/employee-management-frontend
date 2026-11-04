
import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Bell, Check, CheckCheck } from "lucide-react";
import api from "../lib/api";
import { useLive, type LiveEvent } from "../context/live";
import { useAuth } from "../context/auth";

interface PortalNotification {
  id: string;
  title: string;
  message: string;
  target?: string;
  created_at: string | null;
  read: boolean;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { subscribe } = useLive();

  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const storageKey = `portal_notifications_read_${user?.id ?? "guest"}`;

  const getReadIds = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  };

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const response = await api.get("/notifications/pending");
      const readIds = getReadIds();

      const items: PortalNotification[] = response.data.map(
        (item: Omit<PortalNotification, "read">) => ({
          ...item,
          read: readIds.includes(item.id),
        })
      );

      setNotifications(items);
    } catch (error) {
      console.error("Could not load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, storageKey]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    refreshNotifications();

    const interval = window.setInterval(
      refreshNotifications,
      30000
    );

    return () => window.clearInterval(interval);
  }, [user?.id, refreshNotifications]);

  useEffect(() => {
    return subscribe((_event: LiveEvent) => {
      refreshNotifications();
    });
  }, [subscribe, refreshNotifications]);

  const markAsRead = (id: string) => {
    const readIds = getReadIds();

    if (!readIds.includes(id)) {
      localStorage.setItem(
        storageKey,
        JSON.stringify([...readIds, id])
      );
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  const markAllAsRead = () => {
    const ids = notifications.map((item) => item.id);

    localStorage.setItem(
      storageKey,
      JSON.stringify([...new Set([...getReadIds(), ...ids])])
    );

    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true }))
    );
  };

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  const formatTime = (value: string | null) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000)
    );

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          refreshNotifications();
        }}
        aria-label={`Notifications: ${unreadCount} unread`}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-800 dark:text-slate-100 transition hover:bg-slate-200 dark:hover:bg-slate-800"
      >
        <Bell className="h-[23px] w-[23px]" strokeWidth={2.2} />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-slate-100 dark:border-slate-950 bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
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
              {loading && notifications.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
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
                          {formatTime(item.created_at)}
                        </span>

                        <div className="flex items-center gap-3">
                          {item.target && (
                            <NavLink
                              to={item.target}
                              onClick={() => {
                                markAsRead(item.id);
                                setOpen(false);
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
  );
}
