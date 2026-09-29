import { useEffect, useState } from "react";
import { ClipboardList, Upload, CheckCircle2, Clock } from "lucide-react";
import api from "../lib/api";

const REQUIRED_DOCS = [
  "National ID",
  "KRA PIN Certificate",
  "CV",
  "Police Clearance Certificate",
  "CRB Compliance Certificate",
];
const OPTIONAL_DOCS = new Set(["Police Clearance Certificate"]);

interface OnboardingItem {
  id: string;
  document_type: string | null;
  reviewed: boolean;
  uploaded_at: string;
}

interface LeaveItem {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reviewed: boolean;
  submitted_at: string;
}

export default function MySubmissions() {
  const [docs, setDocs] = useState<OnboardingItem[]>([]);
  const [leave, setLeave] = useState<LeaveItem[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const loadDocs = async () => {
    const res = await api.get<OnboardingItem[]>("/onboarding-documents/mine");
    setDocs(res.data);
  };

  useEffect(() => {
  let cancelled = false;

  (async () => {
    const [docsRes, leaveRes] = await Promise.all([
      api.get<OnboardingItem[]>("/onboarding-documents/mine"),
      api.get<LeaveItem[]>("/leave-requests/mine"),
    ]);
    if (!cancelled) {
      setDocs(docsRes.data);
      setLeave(leaveRes.data);
    }
  })();

  return () => {
    cancelled = true;
  };
}, []);
  const handleUpload = async (documentType: string, file: File) => {
    setUploadingType(documentType);
    const formData = new FormData();
    formData.append("document_type", documentType);
    formData.append("file", file);
    try {
      await api.post("/onboarding-documents/", formData);
      await loadDocs();
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingType(null);
    }
  };

  const submittedFor = (type: string) => docs.find((d) => d.document_type === type);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Submissions</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Required onboarding documents and your leave history.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {REQUIRED_DOCS.map((type) => {
            const existing = submittedFor(type);
            return (
              <div key={type} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {type}
                    {OPTIONAL_DOCS.has(type) && (
                      <span className="text-xs text-slate-400 font-normal ml-2">(optional)</span>
                    )}
                  </p>
                  {existing && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Uploaded {new Date(existing.uploaded_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {existing ? (
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                      existing.reviewed
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300"
                    }`}
                  >
                    {existing.reviewed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    {existing.reviewed ? "Reviewed" : "Pending"}
                  </span>
                ) : (
                  <label className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 text-white cursor-pointer transition">
                    {uploadingType === type ? (
                      "Uploading..."
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={uploadingType === type}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(type, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          My leave requests
        </h2>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {leave.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No leave requests yet.</p>
          ) : (
            leave.map((l) => (
              <div key={l.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 capitalize">
                    {l.leave_type} leave
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {l.start_date} → {l.end_date}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    l.reviewed
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300"
                  }`}
                >
                  {l.reviewed ? "Reviewed" : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}