import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import api from "../lib/api";
import axios from "axios";

const LEAVE_TYPES = [
  { value: "sick", label: "Sick Leave" },
  { value: "annual", label: "Annual Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "other", label: "Other" },
];

export default function Leave() {
  const [form, setForm] = useState({
    leave_type: "sick",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (form.end_date < form.start_date) {
      setMessage({ type: "error", text: "End date can't be before the start date." });
      return;
    }

    setLoading(true);
    try {
      await api.post("/leave-requests/", form);
      setMessage({ type: "success", text: "Your leave request has been submitted." });
      setForm({ leave_type: "sick", start_date: "", end_date: "", reason: "" });
    } catch (err: unknown) {
  const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
  setMessage({
    type: "error",
    text: typeof detail === "string" ? detail : "Failed to submit leave request.",
  });
} finally {
  setLoading(false);
}
  }
  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center">
          <CalendarPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Apply for Leave</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Submit a request for HR to review.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-5"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
            Leave Type
          </label>
          <select
            name="leave_type"
            required
            value={form.leave_type}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Start Date
            </label>
            <input
  type="date"
  name="start_date"
  required
  value={form.start_date}
  onChange={handleChange}
  min={new Date().toISOString().split("T")[0]}
  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
/>

          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              required
              value={form.end_date}
              onChange={handleChange}
              min={form.start_date || undefined}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
            Reason (optional)
          </label>
          <textarea
            name="reason"
            rows={4}
            value={form.reason}
            onChange={handleChange}
            placeholder="Briefly explain the reason for this leave"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
          />
        </div>

        {message && (
          <p
            className={`text-sm rounded-lg px-3 py-2 border ${
              message.type === "success"
                ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                : "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}