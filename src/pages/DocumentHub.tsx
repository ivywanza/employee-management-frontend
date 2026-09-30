import { useEffect, useState } from "react";
import { FolderOpen, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";
import api from "../lib/api";

interface DocItem {
  id: string;
  title: string;
  category: string | null;
  created_at: string;
}

function extensionOf(title: string) {
  const parts = title.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function FileIconFor({ title }: { title: string }) {
  const ext = extensionOf(title);
  if (ext === "pdf") {
    return (
      <div className="h-16 w-14 rounded bg-red-600 text-white flex flex-col items-center justify-center shadow">
        <FileText className="h-6 w-6" />
        <span className="text-[9px] font-bold mt-1">PDF</span>
      </div>
    );
  }
  if (["jpg", "jpeg", "png"].includes(ext)) {
    return (
      <div className="h-16 w-14 rounded bg-blue-600 text-white flex flex-col items-center justify-center shadow">
        <ImageIcon className="h-6 w-6" />
        <span className="text-[9px] font-bold mt-1">{ext.toUpperCase()}</span>
      </div>
    );
  }
  return (
    <div className="h-16 w-14 rounded bg-slate-400 text-white flex items-center justify-center shadow">
      <FileIcon className="h-6 w-6" />
    </div>
  );
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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center">
          <FolderOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Document Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Company documents shared by RedAnt.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No documents have been uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-6">
          {items.map((doc) => (
            <button
              key={doc.id}
              onClick={() => openDocument(doc.id)}
              disabled={openingId === doc.id}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-900 disabled:opacity-60 transition"
            >
              <FileIconFor title={doc.title} />
              <span className="text-xs text-center text-slate-700 dark:text-slate-300 line-clamp-2 w-full">
                {openingId === doc.id ? "Opening..." : doc.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}