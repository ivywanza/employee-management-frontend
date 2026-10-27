
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageSquareWarning,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";
import api from "../../lib/api";

type GrievanceKind = "comment" | "complaint";
type GrievanceStatus = "new" | "in_review" | "resolved" | "dismissed";
type GrievanceCategory =
  | "workplace"
  | "management"
  | "facilities"
  | "safety"
  | "pay_benefits"
  | "harassment"
  | "other";

interface GrievanceItem {
  id: string;
  kind: GrievanceKind;
  category: GrievanceCategory;
  subject: string | null;
  body: string;
  status: GrievanceStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string | null;
}

const statuses: { value: GrievanceStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const categories: { value: GrievanceCategory; label: string }[] = [
  { value: "workplace", label: "Workplace" },
  { value: "management", label: "Management" },
  { value: "facilities", label: "Facilities" },
  { value: "safety", label: "Safety" },
  { value: "pay_benefits", label: "Pay and benefits" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

const panelClass =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5";

const fieldClass =
  "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-red-950";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function categoryLabel(value: GrievanceCategory) {
  return categories.find((item) => item.value === value)?.label ?? value;
}

function statusStyle(status: GrievanceStatus) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
    case "in_review":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
    case "resolved":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
    case "dismissed":
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

export function GrievancesView() {
  const [items, setItems] = useState<GrievanceItem[]>([]);
  const [selected, setSelected] = useState<GrievanceItem | null>(null);
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [draftStatus, setDraftStatus] = useState<GrievanceStatus>("new");
  const [draftNote, setDraftNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadGrievances = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<GrievanceItem[]>("/grievances/", {
        params: {
          ...(kind ? { kind } : {}),
          ...(status ? { status } : {}),
          ...(category ? { category } : {}),
        },
      });

      const data = response.data;
      setItems(data);

      setSelected((previous) => {
        if (!previous) return data[0] ?? null;
        return data.find((item) => item.id === previous.id) ?? data[0] ?? null;
      });
    } catch {
      setError(
        "Could not load grievances. Check your access and connection, then try again."
      );
      setItems([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [kind, status, category]);

  useEffect(() => {
    void loadGrievances();
  }, [loadGrievances]);

  useEffect(() => {
    if (selected) {
      setDraftStatus(selected.status);
      setDraftNote(selected.admin_note ?? "");
    }
  }, [selected]);

  async function saveChanges() {
    if (!selected) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await api.patch<GrievanceItem>(
        `/grievances/${selected.id}`,
        {
          status: draftStatus,
          admin_note: draftNote.trim() || null,
        }
      );

      const updated = response.data;
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setSelected(updated);
      setNotice("Grievance updated.");
    } catch {
      setError("The update failed. Please check your connection and retry.");
    } finally {
      setSaving(false);
    }
  }

  const countFor = (value: GrievanceStatus) =>
    items.filter((item) => item.status === value).length;

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 py-2 sm:py-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Confidential workspace
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Grievance inbox
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadGrievances()}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <p className="text-sm leading-5 text-amber-900 dark:text-amber-200">
          Confidential: grievance records are anonymous. Do not attempt to
          identify a sender or copy grievance details into notifications,
          general messages or external reports.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statuses.map((item) => {
          const count = countFor(item.value);
          const Icon =
            item.value === "new"
              ? MessageSquareWarning
              : item.value === "in_review"
                ? Clock3
                : CheckCircle2;

          return (
            <div key={item.value} className={panelClass}>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium sm:text-sm">
                  {item.label}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {loading ? "—" : count}
              </p>
            </div>
          );
        })}
      </div>

      <div className={`${panelClass} grid grid-cols-1 gap-3 sm:grid-cols-3`}>
        <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          Type
          <select
            className={fieldClass}
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="">All types</option>
            <option value="complaint">Complaint</option>
            <option value="comment">Comment</option>
          </select>
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          Status
          <select
            className={fieldClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          Category
          <select
            className={fieldClass}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {notice}
        </p>
      )}

      {loading ? (
        <div className={`${panelClass} flex items-center justify-center gap-3 py-12 text-sm text-slate-500`}>
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading grievance records…
        </div>
      ) : items.length === 0 ? (
        <div className={`${panelClass} py-12 text-center`}>
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">
            No grievances found
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            There are no records matching these filters.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {items.length} record{items.length === 1 ? "" : "s"} · Select a
              card to review it
            </p>

            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelected(item);
                  setNotice("");
                }}
                className={`block w-full min-w-0 rounded-2xl border p-4 text-left transition ${
                  selected?.id === item.id
                    ? "border-red-500 bg-red-50 ring-1 ring-red-200 dark:bg-red-950/30 dark:ring-red-900"
                    : "border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {item.kind}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(item.status)}`}
                  >
                    {statuses.find((value) => value.value === item.status)?.label}
                  </span>
                </div>
                <h2 className="mt-3 break-words font-semibold text-slate-900 dark:text-white">
                  {item.subject || categoryLabel(item.category)}
                </h2>
                <p className="mt-1 line-clamp-3 break-words text-sm leading-5 text-slate-600 dark:text-slate-300">
                  {item.body}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{categoryLabel(item.category)}</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className={`${panelClass} min-w-0`}>
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                      Selected record
                    </p>
                    <h2 className="mt-1 break-words text-lg font-bold text-slate-900 dark:text-white">
                      {selected.subject || categoryLabel(selected.category)}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Submitted {formatDate(selected.created_at)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {selected.kind}
                  </span>
                </div>

                <div className="space-y-4 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Category
                    </p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                      {categoryLabel(selected.category)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Message
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {selected.body}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="grievance-status"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                    >
                      Update status
                    </label>
                    <select
                      id="grievance-status"
                      className={fieldClass}
                      value={draftStatus}
                      onChange={(event) =>
                        setDraftStatus(event.target.value as GrievanceStatus)
                      }
                    >
                      {statuses.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="grievance-note"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
                    >
                      Internal note
                    </label>
                    <textarea
                      id="grievance-note"
                      className={`${fieldClass} min-h-28 resize-y`}
                      value={draftNote}
                      maxLength={5000}
                      onChange={(event) => setDraftNote(event.target.value)}
                      placeholder="Record follow-up or resolution details. This note is only visible in the superadmin inbox."
                    />
                    <p className="text-right text-xs text-slate-500">
                      {draftNote.length}/5000
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void saveChanges()}
                    disabled={saving}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                Select a grievance to view its details.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// Retained as an alias for the route name already used in App.tsx.
export const GrievancesManage = GrievancesView;
