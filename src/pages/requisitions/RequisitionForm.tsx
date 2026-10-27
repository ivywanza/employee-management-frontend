import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, FileText, Printer } from "lucide-react";
import { useAuth } from "../../context/auth";
import {
  PAYMENT_METHODS,
  createRequisition,
  kes,
  listMyRequisitions,
  type PaymentMethod,
  type Requisition,
} from "../../api/requisitions";
import { errorMessage } from "../../api/grievances";
import RequisitionPrintModal from "../../components/RequisitionPrintModal";
import { requisitionToSheet, type SheetData } from "../../components/RequisitionSheet";

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none " +
  "focus:border-[#0B2447] focus:ring-2 focus:ring-[#0B2447]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
const label = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200";

export const StatusBadge = ({ status }: { status: Requisition["status"] }) => {
  const styles = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
  }[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}>{status}</span>;
};

export default function RequisitionForm() {
  const { user } = useAuth() as any; // ADAPT the field names below to your user object

  const [form, setForm] = useState({
    name: user?.full_name ?? "",
    email: user?.email ?? "",
    contact_number: user?.phone ?? "",
    department: user?.department?.name ?? user?.department ?? "",
    purpose: "",
    payment_method: "M-Pesa" as PaymentMethod,
    account_number: "",
    amount: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Requisition | null>(null);
  const [mine, setMine] = useState<Requisition[]>([]);
  const [printing, setPrinting] = useState<{ title: string; data?: SheetData } | null>(null);

  const refresh = () => listMyRequisitions().then(setMine).catch(() => {});
  useEffect(() => {
    refresh();
  }, []);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return setError("Enter an amount greater than zero.");

    setSaving(true);
    try {
      const r = await createRequisition({
        ...form,
        amount,
        account_number: form.payment_method === "Cash" ? null : form.account_number.trim() || null,
      });
      setCreated(r);
      setForm((f) => ({ ...f, purpose: "", account_number: "", amount: "" }));
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Requisition</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Request funds for a work expense. An admin reviews it, and you can print the approved form.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPrinting({ title: "Blank requisition form" })}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Printer size={16} /> Print blank form
        </button>
      </header>

      {created && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <CheckCircle2 className="text-emerald-600" />
          <p className="flex-1 text-sm text-emerald-900 dark:text-emerald-100">
            Requisition <strong>{created.number}</strong> submitted. It is waiting for admin approval.
          </p>
          <button
            onClick={() => setPrinting({ title: created.number, data: requisitionToSheet(created) })}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B2447] px-3 py-2 text-sm font-semibold text-white hover:bg-[#12346b]"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
      >
        <fieldset className="space-y-4">
          <legend className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Requester information</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="r-name">Name</label>
              <input id="r-name" className={input} required value={form.name} onChange={set("name")} />
            </div>
            <div>
              <label className={label} htmlFor="r-contact">Contact number</label>
              <input id="r-contact" className={input} required inputMode="tel" value={form.contact_number} onChange={set("contact_number")} />
            </div>
            <div>
              <label className={label} htmlFor="r-email">Email</label>
              <input id="r-email" type="email" className={input} required value={form.email} onChange={set("email")} />
            </div>
            <div>
              <label className={label} htmlFor="r-dept">Department / team</label>
              <input id="r-dept" className={input} required value={form.department} onChange={set("department")} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Purpose of funds</legend>
          <div>
            <label className={label} htmlFor="r-purpose">Purpose / description</label>
            <textarea
              id="r-purpose"
              className={input}
              rows={3}
              required
              minLength={5}
              maxLength={200}
              value={form.purpose}
              onChange={set("purpose")}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {form.purpose.length}/200. Keep it short so it fits the printed form.
            </p>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Payment details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="r-method">Payment method</label>
              <select id="r-method" className={input} value={form.payment_method} onChange={set("payment_method")}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="r-account">Account number (if applicable)</label>
              <input
                id="r-account"
                className={`${input} disabled:opacity-50`}
                disabled={form.payment_method === "Cash"}
                placeholder={form.payment_method === "M-Pesa" ? "Phone number" : ""}
                value={form.payment_method === "Cash" ? "" : form.account_number}
                onChange={set("account_number")}
              />
            </div>
            <div>
              <label className={label} htmlFor="r-amount">Amount requested (KES)</label>
              <input id="r-amount" className={input} required inputMode="decimal" value={form.amount} onChange={set("amount")} />
            </div>
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[#D62828] px-4 py-3 text-sm font-semibold text-white hover:bg-[#b81f1f] disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Submitting…" : "Submit requisition"}
        </button>
      </form>

      <section aria-labelledby="mine-h">
        <h2 id="mine-h" className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">My requisitions</h2>
        {mine.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
            Nothing here yet. Submit a requisition above and it will show up here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
            {mine.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                <FileText size={18} className="text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {r.number} <span className="font-normal text-slate-500">· {kes(r.amount)}</span>
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{r.purpose}</p>
                </div>
                <StatusBadge status={r.status} />
                <button
                  onClick={() => setPrinting({ title: r.number, data: requisitionToSheet(r) })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Printer size={14} /> Print
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {printing && <RequisitionPrintModal title={printing.title} data={printing.data} onClose={() => setPrinting(null)} />}
    </div>
  );
}