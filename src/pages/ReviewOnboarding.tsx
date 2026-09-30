import { useEffect, useState } from "react";
import { FileCheck, Eye } from "lucide-react";
import api from "../lib/api";

interface OnboardingItem {
  id: string;
  document_type: string | null;
  reviewed: boolean;
  uploaded_at: string;
}

export default function ReviewOnboarding() {
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<OnboardingItem[]>("/onboarding-documents/").then((res) => {
      if (!cancelled) {
        setItems(res.data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const viewDocument = async (id: string) => {
    const res = await api.get<{ url: string }>(`/onboarding-documents/${id}/url`);
    window.open(res.data.url, "_blank");
  };

  const markReviewed = async (id: string) => {
    setBusyId(id);
    try {
      await api.patch(`/onboarding-documents/${id}/review`);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, reviewed: true } : i)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center">
          <FileCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Review Onboarding Documents</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Documents submitted by employees.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No documents submitted yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">{item.document_type ?? "Document"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uploaded {new Date(item.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => viewDocument(item.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
                {item.reviewed ? (
                  <span className="text-xs font-semibold px-3 py-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Reviewed
                  </span>
                ) : (
                  <button
                    onClick={() => markReviewed(item.id)}
                    disabled={busyId === item.id}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white transition"
                  >
                    {busyId === item.id ? "Marking..." : "Mark Reviewed"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}