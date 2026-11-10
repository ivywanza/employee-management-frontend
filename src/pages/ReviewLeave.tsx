
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

function formatDate(value: string, includeTime = false) {
  if (!value) return "—";

  // Date-only values should not be shifted by timezone conversion.
  if (!includeTime && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  });
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  const styles: Record<LeaveStatus, string> = {
    pending:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    "under-review":
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    approved:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    rejected:
      "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };

  const labels: Record<LeaveStatus, string> = {
    pending: "Pending",
    "under-review": "Under Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
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

  const reviewLeave = async (
    id: string,
    status: Exclude<LeaveStatus, "pending">
  ) => {
    setBusyId(id);

    try {
      await api.patch(`/leave-requests/${id}/review`, null, {
        params: { status },
      });

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Page heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0">
          <ClipboardCheck className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Review Leave Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Requests submitted by associates.
          </p>
        </div>
      </div>

      {/* Table container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              Leave Requests
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review and manage associate leave applications.
            </p>
          </div>

          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {items.length} {items.length === 1 ? "Request" : "Requests"}
          </span>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
            Loading leave requests...
          </p>
        ) : items.length === 0 ? (
          <p className="p-8 text-sm text-center text-slate-500 dark:text-slate-400">
            No leave requests yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-4 font-semibold w-14">S/No.</th>
                  <th className="px-4 py-4 font-semibold">Employee</th>
                  <th className="px-4 py-4 font-semibold">Department</th>
                  <th className="px-4 py-4 font-semibold">Leave Type</th>
                  <th className="px-4 py-4 font-semibold">Days</th>
                  <th className="px-4 py-4 font-semibold">Start Date</th>
                  <th className="px-4 py-4 font-semibold">End Date</th>
                  <th className="px-4 py-4 font-semibold">Date Submitted</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-4 font-medium text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {item.applicant_name || "Name unavailable"}
                      </p>
                      {item.reason && (
                        <p
                          className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[180px] truncate"
                          title={item.reason}
                        >
                          {item.reason}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {item.department || "Not specified"}
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200 capitalize whitespace-nowrap">
                      {item.leave_type}
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {item.days} {item.days === 1 ? "Day" : "Days"}
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(item.start_date)}
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(item.end_date)}
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(item.submitted_at, true)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-4 py-4">
                      {item.status === "pending" ||
                      item.status === "under-review" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              reviewLeave(item.id, "under-review")
                            }
                            disabled={
                              busyId === item.id ||
                              item.status === "under-review"
                            }
                            title="Mark as under review"
                            className="text-xs font-semibold px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white transition whitespace-nowrap"
                          >
                            {busyId === item.id
                              ? "Saving..."
                              : "Under Review"}
                          </button>

                          <button
                            onClick={() => reviewLeave(item.id, "approved")}
                            disabled={busyId === item.id}
                            title="Approve leave request"
                            className="text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white transition"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => reviewLeave(item.id, "rejected")}
                            disabled={busyId === item.id}
                            title="Reject leave request"
                            className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="block text-center text-xs text-slate-400 dark:text-slate-500">
                          No actions
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {items.length} leave{" "}
              {items.length === 1 ? "request" : "requests"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
