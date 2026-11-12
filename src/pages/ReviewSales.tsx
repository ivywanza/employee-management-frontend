import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart3, Users, Wallet } from "lucide-react";
import api from "../lib/api";

interface Sale {
  id: string;
  user_id: string;
  item: string;
  amount: number | string;
  month: string;
  created_at: string;
  updated_at: string;
  associate_name: string;
  associate_email: string;
}

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (month: string) =>
  new Date(`${month.slice(0, 7)}-01T00:00:00`).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });

const formatAmount = (amount: number | string) =>
  Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ReviewSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState<string | null>(null);

  const loadSales = async (selectedMonth: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.get<Sale[]>("/sales/review", {
        params: {
          month: selectedMonth ? `${selectedMonth}-01` : undefined,
        },
      });

      setSales(response.data);
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;

      setMessage(
        typeof detail === "string" ? detail : "Unable to load sales records.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales(month);
  }, [month]);

  const totalSales = sales.reduce(
    (total, sale) => total + Number(sale.amount),
    0,
  );

  const associates = new Set(sales.map((sale) => sale.user_id)).size;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
          <BarChart3 className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Sales Review
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review Bella Organics sales submissions.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
          Filter by Reporting Month
        </label>

        <div className="flex flex-wrap gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />

          <button
            type="button"
            onClick={() => setMonth("")}
            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            All Months
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-green-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-emerald-100 text-xs uppercase tracking-wide">
            <Wallet className="h-4 w-4" />
            Total Sales
          </div>
          <p className="text-2xl font-extrabold mt-3">
            KSh {formatAmount(totalSales)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            <Users className="h-4 w-4" />
            Associates
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-3">
            {associates}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">
            Sales Entries
          </p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-3">
            {sales.length}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Associate Sales Records
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {month ? formatMonth(`${month}-01`) : "All reporting months"}
          </p>
        </div>

        {message && (
          <p className="m-5 text-sm rounded-lg px-3 py-2 border text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
            {message}
          </p>
        )}

        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading sales records...</p>
        ) : !message && sales.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
            No sales records found for this reporting period.
          </p>
        ) : !message ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 w-16">No.</th>
                  <th className="px-5 py-3">Associate</th>
                  <th className="px-5 py-3">Sales Item</th>
                  <th className="px-5 py-3">Reporting Month</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map((sale, index) => (
                  <tr key={sale.id}>
                    <td className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400">
                      {index + 1}.
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {sale.associate_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {sale.associate_email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
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

              <tfoot className="bg-emerald-50 dark:bg-emerald-900/20">
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-4 font-bold text-slate-800 dark:text-slate-100"
                  >
                    Total Sales
                  </td>
                  <td className="px-5 py-4 text-right font-extrabold text-emerald-700 dark:text-emerald-300">
                    KSh {formatAmount(totalSales)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
