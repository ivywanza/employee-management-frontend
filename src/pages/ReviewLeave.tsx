import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import api from "../lib/api";

type LeaveStatus = "pending" | "approved" | "rejected" | "under-review";

interface LeaveItem {
  id: string;
  user_id: string;
  applicant_name: string | null;
  department: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  submitted_at: string;
}

export default function ReviewLeave() {
  const [items, setItems] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get<LeaveItem[]>("/leave-requests/");
        if (!cancelled) setItems(res.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const reviewLeave = async (id: string, status: Exclude<LeaveStatus, "pending">) => {
    setBusyId(id);
    try {
      await api.patch(`/leave-requests/${id}/review`, null, { params: { status } });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Review Leave Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Requests submitted by associates.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No leave requests yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-4"
            >
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {item.applicant_name || "Applicant name unavailable"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Department: {item.department || "Not specified"}
                </p>

                <p className="font-medium text-slate-800 dark:text-slate-100 capitalize mt-2">
                  {item.leave_type} leave · {item.days} day{item.days === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {item.start_date} → {item.end_date}
                </p>

                {item.reason && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">{item.reason}</p>
                )}
              </div>

              {item.status === "pending" || item.status === "under-review" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => reviewLeave(item.id, "under-review")}
                    disabled={busyId === item.id || item.status === "under-review"}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white transition"
                  >
                    {item.status === "under-review" ? "Under Review" : "Mark Under Review"}
                  </button>
                  <button
                    onClick={() => reviewLeave(item.id, "approved")}
                    disabled={busyId === item.id}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reviewLeave(item.id, "rejected")}
                    disabled={busyId === item.id}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white transition"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span
                  className={`self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-full ${
                    item.status === "approved"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  }`}
                >
                  {item.status === "approved" ? "Approved" : "Rejected"}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}