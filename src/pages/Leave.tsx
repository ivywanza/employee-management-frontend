
import { useEffect, useState } from "react";
import axios from "axios";
import { CalendarPlus, Sun } from "lucide-react";
import api from "../lib/api";

const LEAVE_TYPES = [
  { value: "sick", label: "Sick Leave" },
  { value: "annual", label: "Annual Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "personal", label: "Personal Leave" },
  { value: "menstrual", label: "Menstrual Leave" },
  { value: "bereavement", label: "Bereavement Leave" },
  { value: "other", label: "Other" },
];

interface Balance {
  year: number;
  annual_allowance: number;
  days_used: number;
  days_remaining: number;
  menstrual_month: string;
  menstrual_days_used: number;
  menstrual_days_remaining: number;
}

// Accepts Kenyan and Rwandan mobile numbers.
const isValidMobilePhone = (phone: string): boolean => {
  const normalized = phone.replace(/[\s\-()]/g, "");

  const kenyaPattern = /^(?:0|\+254)(?:7|1)\d{8}$/;
  const rwandaPattern = /^(?:0|\+250)7[2389]\d{7}$/;

  return (
    kenyaPattern.test(normalized) ||
    rwandaPattern.test(normalized)
  );
};

export default function Leave() {
  const [form, setForm] = useState({
    leave_type: "sick",
    start_date: "",
    end_date: "",
    reason: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const [balance, setBalance] = useState<Balance | null>(null);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const loadBalance = async () => {
    try {
      const res = await api.get<Balance>("/leave-requests/balance");
      setBalance(res.data);
    } catch {
      setMessage({
        type: "error",
        text: "Unable to load your leave balance.",
      });
    }
  };

  useEffect(() => {
  let cancelled = false;

  const fetchBalance = async () => {
    try {
      const res = await api.get<Balance>("/leave-requests/balance");

      if (!cancelled) {
        setBalance(res.data);
      }
    } catch {
      if (!cancelled) {
        setMessage({
          type: "error",
          text: "Unable to load your leave balance.",
        });
      }
    }
  };

  fetchBalance();

  return () => {
    cancelled = true;
  };
}, []);


  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.start_date || !form.end_date) {
      setMessage({
        type: "error",
        text: "Please select both the start date and end date.",
      });
      return;
    }

    if (form.end_date < form.start_date) {
      setMessage({
        type: "error",
        text: "End date can't be before the start date.",
      });
      return;
    }

    if (!form.emergency_contact_name.trim()) {
      setMessage({
        type: "error",
        text: "Emergency contact name is required.",
      });
      return;
    }

    if (!isValidMobilePhone(form.emergency_contact_phone)) {
      setMessage({
        type: "error",
        text: "Enter a valid Kenyan or Rwandan mobile number, e.g. 0712345678 or +250788123456.",
      });
      return;
    }

    setLoading(true);

    try {
      await api.post("/leave-requests/", {
        ...form,
        emergency_contact_name: form.emergency_contact_name.trim(),
        emergency_contact_phone: form.emergency_contact_phone.replace(
          /[\s\-()]/g,
          "",
        ),
      });

      setMessage({
        type: "success",
        text: "Your leave request has been submitted.",
      });

      setForm({
        leave_type: "sick",
        start_date: "",
        end_date: "",
        reason: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
      });

      await loadBalance();
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;

      setMessage({
        type: "error",
        text:
          typeof detail === "string"
            ? detail
            : "Failed to submit leave request.",
      });
    } finally {
      setLoading(false);
    }
  };

  const annualPercent = balance
    ? Math.min(
        100,
        balance.annual_allowance > 0
          ? (balance.days_used / balance.annual_allowance) * 100
          : 0,
      )
    : 0;

  const requestedDays =
    form.start_date &&
    form.end_date &&
    form.end_date >= form.start_date
      ? Math.round(
          (new Date(form.end_date).getTime() -
            new Date(form.start_date).getTime()) /
            86400000,
        ) + 1
      : 0;

  return (
    <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-5">
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-5 h-fit"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center">
            <CalendarPlus className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Apply for Leave
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Submit a request for HR to review.
            </p>
          </div>
        </div>

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

        {requestedDays > 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You are requesting{" "}
            <span className="font-semibold">{requestedDays}</span> day
            {requestedDays === 1 ? "" : "s"} of leave.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Emergency Contact (Name)
            </label>

            <input
              type="text"
              name="emergency_contact_name"
              value={form.emergency_contact_name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Emergency Contact (Phone)
            </label>

            <input
              type="tel"
              name="emergency_contact_phone"
              required
              value={form.emergency_contact_phone}
              onChange={handleChange}
              placeholder="0712345678 or +250788123456"
              autoComplete="tel"
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
          className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      <div className="lg:col-span-2 space-y-4 my-10">
        <div className="bg-gradient-to-br from-emerald-700 to-green-600 text-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-200 text-xs uppercase tracking-wide">
            <Sun className="h-3.5 w-3.5" />
            Annual Leave {balance?.year ?? ""}
          </div>

          <p className="text-4xl font-extrabold mt-2">
            {balance ? balance.days_remaining : "--"}
            <span className="text-base font-medium text-blue-200">
              {" "}
              / {balance?.annual_allowance ?? 22} days left
            </span>
          </p>

          <div className="mt-4 h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${annualPercent}%` }}
            />
          </div>

          <p className="text-xs text-blue-200 mt-2">
            {balance?.days_used ?? 0} days used this year
          </p>
        </div>

        {/* Menstrual leave balance card can be restored here when needed. */}
      </div>
    </div>
  );
}
