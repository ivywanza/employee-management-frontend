
import { useCallback, useEffect, useState } from "react";
import { FileText, Printer, RefreshCw } from "lucide-react";
import {
  kes,
  listMyRequisitions,
  type Requisition,
} from "../../api/requisitions";
import { errorMessage } from "../../api/grievances";
import RequisitionPrintModal from "../../components/RequisitionPrintModal";
import { requisitionToSheet } from "../../components/RequisitionSheet";
import { StatusBadge } from "./RequisitionForm";

export default function MyRequisitions() {
  const [items, setItems] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState<Requisition | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const rows = await listMyRequisitions();
      setItems(rows);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  let cancelled = false;

  async function fetchRequisitions() {
    try {
      const rows = await listMyRequisitions();

      if (!cancelled) {
        setItems(rows);
        setError("");
      }
    } catch (err) {
      if (!cancelled) {
        setError(errorMessage(err));
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void fetchRequisitions();

  return () => {
    cancelled = true;
  };
}, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Requisitions
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Track your requests, check approval decisions, and print your forms.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: items.length },
          { label: "Pending", value: items.filter((r) => r.status === "pending").length },
          { label: "Approved", value: items.filter((r) => r.status === "approved").length },
          { label: "Rejected", value: items.filter((r) => r.status === "rejected").length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
          <button onClick={() => void load()} className="ml-2 font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <p className="p-8 text-center text-sm text-slate-500">
          Loading your requisitions…
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-600">
          <FileText className="mx-auto mb-3 text-slate-400" size={30} />
          <h2 className="font-semibold text-slate-900 dark:text-white">
            No requisitions yet
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Requisitions you submit will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3">Requisition</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-medium text-slate-900 dark:text-white">
                    {r.number}
                  </td>
                  <td className="max-w-xs p-3 text-slate-600 dark:text-slate-300">
                    {r.purpose}
                  </td>
                  <td className="whitespace-nowrap p-3 text-slate-900 dark:text-white">
                    {kes(r.amount)}
                  </td>
                  <td className="whitespace-nowrap p-3 text-slate-600 dark:text-slate-300">
                    {new Date(r.created_at).toLocaleDateString("en-KE")}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setPrinting(r)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Printer size={14} />
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {printing && (
        <RequisitionPrintModal
          title={printing.number}
          data={requisitionToSheet(printing)}
          onClose={() => setPrinting(null)}
        />
      )}
    </div>
  );
}
