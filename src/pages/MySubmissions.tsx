import { useEffect, useState } from "react";
// import { ClipboardList, Upload, CheckCircle2, Clock } from "lucide-react";
import api from "../lib/api";


interface LeaveItem {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
}

export default function MySubmissions() {
  // const [docs, setDocs] = useState<OnboardingItem[]>([]);
  const [leave, setLeave] = useState<LeaveItem[]>([]);


  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [leaveRes] = await Promise.all([
        api.get<LeaveItem[]>("/leave-requests/mine"),
      ]);
      if (!cancelled) {
        setLeave(leaveRes.data);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);



  return (
    <div className="max-w-4xl mx-auto space-y-10">

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          My leave requests
        </h2>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {leave.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
              No leave requests yet.
            </p>
          ) : (
            leave.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 capitalize">
                    {l.leave_type} leave
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {l.start_date} → {l.end_date}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    l.status === "approved"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : l.status === "rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300"
                  }`}
                >
                  {l.status === "approved"
                    ? "Approved"
                    : l.status === "rejected"
                      ? "Rejected"
                      : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
