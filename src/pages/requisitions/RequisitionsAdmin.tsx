import { useCallback, useEffect, useState } from "react";
import { Check, Printer, X } from "lucide-react";
import {
  getRequisitionSummary,
  kes,
  listRequisitions,
  reviewRequisition,
  type Requisition,
  type RequisitionStatus,
  type RequisitionSummary,
} from "../../api/requisitions";
import { errorMessage } from "../../api/grievances";
import RequisitionPrintModal from "../../components/RequisitionPrintModal";
import { requisitionToSheet } from "../../components/RequisitionSheet";
import { StatusBadge } from "./RequisitionForm";

const TABS: { value: RequisitionStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function RequisitionsAdmin() {
  const [tab, setTab] = useState<RequisitionStatus | "all">("pending");
  const [items, setItems] = useState<Requisition[]>([]);
  const [summary, setSummary] = useState<RequisitionSummary | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState<Requisition | null>(null);

  const load = useCallback(async () => {
    try {
      const [rows, sum] = await Promise.all([listRequisitions(tab === "all" ? undefined : tab), getRequisitionSummary()]);
      setItems(rows);
      setSummary(sum);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id: number, status: "approved" | "rejected") {
    setBusyId(id);
    try {
      await reviewRequisition(id, status);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const stat = "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Requisitions</h1>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={stat}>
            <p className="text-sm text-slate-500 dark:text-slate-400">Waiting for approval</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{summary.pending}</p>
          </div>
          <div className={stat}>
            <p className="text-sm text-slate-500 dark:text-slate-400">Approved so far</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{kes(summary.approved_total)}</p>
          </div>
          <div className={stat}>
            <p className="text-sm text-slate-500 dark:text-slate-400">Rejected</p>
            <p className="mt-1 text-2xl font-bold text-[#D62828]">{summary.rejected}</p>
          </div>
        </div>
      )}

      <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.value
                ? "bg-white text-[#0B2447] shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          No {tab === "all" ? "" : tab} requisitions.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
          {items.map((r) => (
            <li key={r.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {r.number} <span className="font-normal text-slate-500">· {kes(r.amount)}</span>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {r.name}, {r.department} · {r.payment_method}
                    {r.account_number ? ` (${r.account_number})` : ""}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200">{r.purpose}</p>
              <div className="flex flex-wrap gap-2">
                {r.status === "pending" && (
                  <>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, "approved")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, "rejected")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPrinting(r)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Printer size={14} /> Print
                </button>
                {r.reviewed_by && (
                  <span className="self-center text-xs text-slate-500">
                    {r.status === "approved" ? "Approved" : "Rejected"} by {r.reviewed_by}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {printing && (
        <RequisitionPrintModal title={printing.number} data={requisitionToSheet(printing)} onClose={() => setPrinting(null)} />
      )}
    </div>
  );
}