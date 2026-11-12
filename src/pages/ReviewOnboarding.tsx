import { useEffect, useState } from "react";
import { FileCheck, Eye } from "lucide-react";
import api from "../lib/api";

interface OnboardingItem {
  id: string;
  document_type: string | null;
  reviewed: boolean;
  uploaded_at: string;
  organisation: string | null;
  applicant_name: string | null;
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  });
}

export default function ReviewOnboarding() {
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get<OnboardingItem[]>("/onboarding-documents/");
        if (!cancelled) setItems(res.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const viewDocument = async (id: string) => {
    const res = await api.get<{ url: string }>(
      `/onboarding-documents/${id}/url`,
    );
    window.open(res.data.url, "_blank", "noopener,noreferrer");
  };

  const markReviewed = async (id: string) => {
    setBusyId(id);

    try {
      await api.patch(`/onboarding-documents/${id}/review`);

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, reviewed: true } : item,
        ),
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
          <FileCheck className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Review Onboarding Documents
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Documents submitted by employees.
          </p>
        </div>
      </div>

      {/* Table container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              Submitted Documents
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              View and verify employee onboarding documents.
            </p>
          </div>

          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {items.length} {items.length === 1 ? "Document" : "Documents"}
          </span>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
            Loading documents...
          </p>
        ) : items.length === 0 ? (
          <p className="p-8 text-sm text-center text-slate-500 dark:text-slate-400">
            No documents submitted yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold w-16">S/No.</th>
                  <th className="px-5 py-4 font-semibold">Associate name</th>
                  <th className="px-5 py-4 font-semibold">Document Type</th>
                  <th className="px-5 py-4 font-semibold">Organisation</th>
                  <th className="px-5 py-4 font-semibold">Date Uploaded</th>
                  <th className="px-5 py-4 font-semibold">Review Status</th>
                  <th className="px-5 py-4 font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.applicant_name || "Unknown employee"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.document_type || "Document"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {item.organisation === "red_ant"
                          ? "Red Ant"
                          : item.organisation === "bella_organics"
                            ? "Bella Organics"
                            : item.organisation === "juakali"
                              ? "Juakali"
                              : "Unknown"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(item.uploaded_at)}
                    </td>

                    <td className="px-5 py-4">
                      {item.reviewed ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Reviewed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          Pending Review
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => viewDocument(item.id)}
                          title="View document"
                          aria-label="View document"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>

                        {item.reviewed ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500 px-3 py-2">
                            Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => markReviewed(item.id)}
                            disabled={busyId === item.id}
                            title="Mark document as reviewed"
                            className="text-xs font-semibold px-3 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white transition whitespace-nowrap"
                          >
                            {busyId === item.id
                              ? "Marking..."
                              : "Mark Reviewed"}
                          </button>
                        )}
                      </div>
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
              Showing {items.length}{" "}
              {items.length === 1 ? "document" : "documents"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
