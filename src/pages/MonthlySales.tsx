
import { useEffect, useState } from "react";
import axios from "axios";
import { PlusCircle, ShoppingBag, TrendingUp } from "lucide-react";
import api from "../lib/api";

interface Sale {
  id: string;
  user_id: string;
  item: string;
  amount: number | string;
  month: string;
  created_at: string;
  updated_at: string;
}

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (month: string) =>
  new Date(`${month.slice(0, 7)}-01T00:00:00`).toLocaleDateString(
    "en-KE",
    { month: "long", year: "numeric" }
  );

const formatAmount = (amount: number | string) =>
  Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function MonthlySales() {
  const [form, setForm] = useState({
    item: "",
    amount: "",
    month: currentMonth(),
  });

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadSales = async () => {
    try {
      const response = await api.get<Sale[]>("/sales/");
      setSales(response.data);
    } catch {
      setMessage({
        type: "error",
        text: "Unable to load your sales records.",
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const amount = Number(form.amount);

    if (!form.item.trim()) {
      setMessage({ type: "error", text: "Enter the sales item." });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage({ type: "error", text: "Enter a valid amount greater than zero." });
      return;
    }

    if (!form.month) {
      setMessage({ type: "error", text: "Select the reporting month." });
      return;
    }

    setLoading(true);

    try {
      await api.post("/sales/", {
        item: form.item.trim(),
        amount,
        month: `${form.month}-01`,
      });

      setMessage({
        type: "success",
        text: "Sales record submitted successfully.",
      });

      setForm({
        item: "",
        amount: "",
        month: currentMonth(),
      });

      await loadSales();
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;

      setMessage({
        type: "error",
        text:
          typeof detail === "string"
            ? detail
            : "Failed to submit the sales record.",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalSales = sales.reduce(
    (total, sale) => total + Number(sale.amount),
    0
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Monthly Sales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit and track your sales records.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gradient-to-br from-emerald-700 to-green-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-emerald-100 text-xs uppercase tracking-wide">
            <TrendingUp className="h-4 w-4" />
            Total submitted sales
          </div>
          <p className="text-3xl font-extrabold mt-3">
            KSh {formatAmount(totalSales)}
          </p>
          <p className="text-xs text-emerald-100 mt-2">
            Across all your submitted records
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">
            Sales entries
          </p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-3">
            {sales.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Total records submitted
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Record a Sale
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Sales Item
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.item}
              onChange={(e) =>
                setForm((current) => ({ ...current, item: e.target.value }))
              }
              placeholder="e.g. Organic body butter"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Amount (KSh)
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) =>
                setForm((current) => ({ ...current, amount: e.target.value }))
              }
              placeholder="Enter amount"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Reporting Month
            </label>
            <input
              type="month"
              required
              value={form.month}
              onChange={(e) =>
                setForm((current) => ({ ...current, month: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
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
          className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition"
        >
          {loading ? "Submitting..." : "Submit Sales Record"}
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            My Sales Records
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your previously submitted sales items.
          </p>
        </div>

        {fetching ? (
          <p className="p-6 text-sm text-slate-500">Loading sales records...</p>
        ) : sales.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
            You have not submitted any sales records yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Sales Item</th>
                  <th className="px-5 py-3">Reporting Month</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-100">
                      {sale.item}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {formatMonth(sale.month)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-800 dark:text-slate-100">
                      KSh {formatAmount(sale.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
