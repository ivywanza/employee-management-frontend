import { useEffect, useState } from "react";
import axios from "axios";
import { Folders, Upload } from "lucide-react";
import api from "../lib/api";

interface DocItem {
  id: string;
  title: string;
  category: string | null;
}

export default function ManageDocuments() {
  const [items, setItems] = useState<DocItem[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => api.get<DocItem[]>("/documents/").then((res) => setItems(res.data));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("title", title);
    if (category) formData.append("category", category);
    formData.append("file", file);
    try {
      await api.post("/documents/", formData);
      setMessage({ type: "success", text: "Document uploaded." });
      setTitle("");
      setCategory("");
      setFile(null);
      load();
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setMessage({ type: "error", text: typeof detail === "string" ? detail : "Upload failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center">
          <Folders className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manage Documents</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Upload documents for the Document Hub.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-4">
        <input
          required
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
        />
        <input
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
        />
        <input
          type="file"
          required
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-600 dark:text-slate-300"
        />
        {message && (
          <p className={`text-sm rounded-lg px-3 py-2 border ${message.type === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition"
        >
          <Upload className="h-4 w-4" />
          {loading ? "Uploading..." : "Upload Document"}
        </button>
      </form>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          Existing documents
        </h2>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((doc) => (
            <div key={doc.id} className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
              {doc.title} {doc.category && <span className="text-slate-400">· {doc.category}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}