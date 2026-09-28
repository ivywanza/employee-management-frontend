import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarPlus,
  FileUp,
  FolderOpen,
  ClipboardList,
  Users,
  Clock,
  FileCheck,
  type LucideIcon,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/auth";

interface LeaveItem {
  id: string;
  leave_type: string;
  submitted_at: string;
  reviewed: boolean;
}

interface OnboardingItem {
  id: string;
  document_type: string | null;
  uploaded_at: string;
  reviewed: boolean;
}

interface Submission {
  key: string;
  title: string;
  date: string;
  reviewed: boolean;
}

interface Stats {
  employees?: number;
  pendingLeave?: number;
  pendingOnboarding?: number;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

const quickActions = [
  { to: "/leave", label: "Apply for Leave", note: "Request time off", icon: CalendarPlus },
  { to: "/onboarding", label: "Upload Documents", note: "Send your onboarding files", icon: FileUp },
  { to: "/documents", label: "Document Hub", note: "Browse company documents", icon: FolderOpen },
  { to: "/my-submissions", label: "My Submissions", note: "Track what you've sent", icon: ClipboardList },
];

export default function Home() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({});

  useEffect(() => {
    if (!profile) return;
    const isAdmin = profile.role === "admin" || profile.role === "superadmin";
    const canReview = profile.role === "superadmin" || profile.isHr;

    (async () => {
      try {
        const [leave, onboarding] = await Promise.all([
          api.get<LeaveItem[]>("/leave-requests/mine"),
          api.get<OnboardingItem[]>("/onboarding-documents/mine"),
        ]);
        const items: Submission[] = [
          ...leave.data.map((l) => ({
            key: `leave-${l.id}`,
            title: `${l.leave_type.charAt(0).toUpperCase()}${l.leave_type.slice(1)} leave`,
            date: l.submitted_at,
            reviewed: l.reviewed,
          })),
          ...onboarding.data.map((o) => ({
            key: `onboarding-${o.id}`,
            title: o.document_type ?? "Onboarding document",
            date: o.uploaded_at,
            reviewed: o.reviewed,
          })),
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        setSubmissions(items);
      } catch {
        setSubmissions([]);
      }

      const next: Stats = {};
      if (isAdmin) {
        try {
          next.employees = (await api.get<unknown[]>("/users/")).data.length;
        } catch {
          /* leave undefined */
        }
      }
      if (canReview) {
        try {
          const leave = await api.get<LeaveItem[]>("/leave-requests/");
          next.pendingLeave = leave.data.filter((l) => !l.reviewed).length;
          const onboarding = await api.get<OnboardingItem[]>("/onboarding-documents/");
          next.pendingOnboarding = onboarding.data.filter((o) => !o.reviewed).length;
        } catch {
          /* leave undefined */
        }
      }
      setStats(next);
    })();
  }, [profile]);

  if (!profile) return <p className="text-slate-500 dark:text-slate-400">Loading...</p>;

  const start = new Date(profile.start_date.slice(0, 10) + "T00:00:00");
  const daysEmployed = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasStats =
    stats.employees !== undefined || stats.pendingLeave !== undefined || stats.pendingOnboarding !== undefined;

  return (
    <div className="max-w-5xl space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-700 to-lime-600 p-8 text-white shadow-lg flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm text-emerald-100">{today}</p>
          <h1 className="text-3xl font-bold mt-1">
            {greeting}, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="text-emerald-100 mt-1 text-sm">
            {profile.department_name ?? "No department yet"} · <span className="capitalize">{profile.role}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white/15 backdrop-blur px-6 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-emerald-50">Days with RedAnt</p>
          <p className="text-5xl font-extrabold text-amber-300 leading-tight">{daysEmployed}</p>
          <p className="text-xs text-emerald-50">
            Since {start.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </section>

      {hasStats && (
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.employees !== undefined && <StatCard label="Total employees" value={stats.employees} icon={Users} />}
          {stats.pendingLeave !== undefined && (
            <StatCard label="Leave awaiting review" value={stats.pendingLeave} icon={Clock} />
          )}
          {stats.pendingOnboarding !== undefined && (
            <StatCard label="Onboarding docs to review" value={stats.pendingOnboarding} icon={FileCheck} />
          )}
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ to, label, note, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-400/20 text-amber-600 dark:text-amber-300 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-emerald-950 transition">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-semibold text-slate-800 dark:text-slate-100">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{note}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          My recent submissions
        </h2>
        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {submissions.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
              Nothing submitted yet. Your leave requests and uploaded documents will show up here.
            </p>
          ) : (
            submissions.map((s) => (
              <div key={s.key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(s.date).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    s.reviewed
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300"
                  }`}
                >
                  {s.reviewed ? "Reviewed" : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}