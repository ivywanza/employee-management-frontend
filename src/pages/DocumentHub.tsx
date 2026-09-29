import { useEffect, useState } from "react";
import { FolderOpen, FileText } from "lucide-react";
import api from "../lib/api";

interface DocItem {
  id: string;
  title: string;
  category: string | null;
  created_at: string;
}

export default function DocumentHub() {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api.get<DocItem[]>("/documents/").then((res) => {
      if (!cancelled) {
        setItems(res.data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const openDocument = async (id: string) => {
    setOpeningId(id);
    try {
      const res = await api.get<{ url: string }>(`/documents/${id}/url`);
      window.open(res.data.url, "_blank");
    } catch {
      alert("Could not open this document.");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center">
          <FolderOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Document Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Company documents shared by RedAnt.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No documents have been uploaded yet.</p>
        ) : (
          items.map((doc) => (
            <button
              key={doc.id}
              onClick={() => openDocument(doc.id)}
              disabled={openingId === doc.id}
              className="text-left bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-60"
            >
              <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <p className="mt-4 font-semibold text-slate-800 dark:text-slate-100">{doc.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {doc.category ?? "Uncategorized"}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}