
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/auth";
import api from "../lib/api";

type Department = {
  id: string;
  name: string;
  employee_count?: number;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900";

export default function Departments() {
  const { user } = useAuth();
  const canManage = user?.role === "superadmin";

  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Department[]>("/departments/");
      setItems(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Could not load departments. Check your access and connection.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setName("");
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEdit(item: Department) {
    setEditing(item);
    setName(item.name);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setSaving(true);
  setError("");
  setNotice("");

  try {
    const successMessage = editing
      ? "Department updated."
      : "Department created.";

    if (editing) {
      await api.patch(`/departments/${editing.id}`, {
        name: name.trim(),
      });
    } else {
      await api.post("/departments/", {
        name: name.trim(),
      });
    }

    setShowForm(false);
    setEditing(null);
    setName("");
    setNotice(successMessage);

    await load();

    window.setTimeout(() => {
      setNotice((current) =>
        current === successMessage ? "" : current,
      );
    }, 4000);
  } catch (err: any) {
    setError(
      err?.response?.data?.detail ??
        "Could not save this department.",
    );
  } finally {
    setSaving(false);
  }
}


  async function remove(item: Department) {
    const confirmed = window.confirm(
      `Delete "${item.name}"? This is only possible when no users are assigned to it.`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/departments/${item.id}`);
      setNotice("Department deleted.");
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Could not delete this department.",
      );
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 py-2 sm:py-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            <Building2 className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Organisation
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Departments
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View departments and their active employee counts.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {canManage && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Add department
            </button>
          )}
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {notice}
        </p>
      )}

      {showForm && canManage && (
        <form onSubmit={submit} className={`${cardClass} space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {editing ? "Edit department" : "Create department"}
            </h2>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="block space-y-1.5 text-sm font-medium">
            Department name
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={120}
              placeholder="e.g. Human Resources"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving && (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              )}
              {saving ? "Saving…" : "Save department"}
            </button>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div
          className={`${cardClass} flex items-center justify-center gap-2 py-12 text-sm text-slate-500`}
        >
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading departments…
        </div>
      ) : items.length === 0 ? (
        <div className={`${cardClass} py-12 text-center`}>
          <Building2 className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 font-semibold">No departments found</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create a department to organise employee records.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <h2 className="break-words font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </h2>
                </div>

                {canManage && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      title="Edit department"
                      className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => void remove(item)}
                      title="Delete department"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Users className="h-4 w-4" />
                {item.employee_count ?? 0} active employee
                {item.employee_count === 1 ? "" : "s"}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
