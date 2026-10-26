import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, KeyRound, FileUp, Upload, Eye, EyeOff } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/auth";


const DOCS = [
  { type: "National ID", required: true },
  { type: "KRA PIN Certificate", required: true },
  { type: "CV", required: true },
  { type: "Police Clearance Certificate", required: false },
  { type: "CRB Compliance Certificate", required: true },
];

interface UploadedDoc {
  id: string;
  document_type: string | null;
  reviewed: boolean;
}

function errorText(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg ?? "Invalid input").join(", ");
    }
  }
  return fallback;
}

const inputClass =
  "w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1";

export default function Setup() {
  const { profile, refreshProfile, skipWizard, logout } = useAuth();
  const passwordStep = profile?.must_change_password === true;
  const firstName = profile?.full_name.split(" ")[0] ?? "";
  const [showPassword, setShowPassword] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<UploadedDoc[]>("/onboarding-documents/mine")
      .then((res) => {
        if (!cancelled) setDocs(res.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const uploaded = new Set(docs.map((d) => d.document_type));
  const required = DOCS.filter((d) => d.required);
  const requiredDone = required.filter((d) => uploaded.has(d.type)).length;
  const allRequiredDone = requiredDone === required.length;

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/users/me/password", { new_password: password });
      setPassword("");
      setConfirm("");
      await refreshProfile(); // this moves the wizard on to the documents step
    } catch (err) {
      setError(errorText(err, "Could not save your password."));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (type: string, file: File) => {
    setUploadingType(type);
    setError("");
    const form = new FormData();
    form.append("document_type", type);
    form.append("file", file);
    try {
      await api.post("/onboarding-documents/", form);
      const res = await api.get<UploadedDoc[]>("/onboarding-documents/mine");
      setDocs(res.data);
    } catch (err) {
      setError(errorText(err, "Upload failed. Please try again."));
    } finally {
      setUploadingType(null);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await refreshProfile(); // the server now sees every required document, so the wizard ends
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-950 to-blue-800 px-6 sm:px-8 py-7">
          <p className="text-xs uppercase tracking-widest text-red-400 font-semibold">Redant International</p>
          <h1 className="text-2xl font-bold text-white mt-1">Welcome{firstName ? `, ${firstName}` : ""}</h1>
          <p className="text-blue-100 text-sm mt-1">Two quick steps and you're in.</p>

          <div className="mt-5 flex items-center gap-3 text-sm">
            <div className={`flex items-center gap-2 ${passwordStep ? "text-white" : "text-blue-200"}`}>
              {passwordStep ? (
                <span className="h-6 w-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              )}
              Password
            </div>
            <div className="h-px flex-1 bg-white/25" />
            <div className={`flex items-center gap-2 ${passwordStep ? "text-blue-300" : "text-white"}`}>
              <span
                className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  passwordStep ? "bg-white/20 text-blue-200" : "bg-red-600 text-white"
                }`}
              >
                2
              </span>
              Documents
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-7">
          {passwordStep ? (
            <form onSubmit={submitPassword} className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <p className="text-sm text-slate-600">
                  You signed in with a temporary password. Choose your own now. It must be at least 8 characters and
                  different from the temporary one.
                </p>
              </div>

              <div>
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div>
                <label className={labelClass}>Confirm new password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
              >
                {saving ? "Saving..." : "Save password and continue"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <FileUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    Upload your onboarding documents as PDF, JPG or PNG. You can skip this and finish later, and
                    we'll remind you the next time you sign in.
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {requiredDone} of {required.length} required documents uploaded
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
                {DOCS.map(({ type, required: isRequired }) => {
                  const done = uploaded.has(type);
                  return (
                    <div key={type} className="flex items-center justify-between gap-3 px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">
                        {type}
                        {!isRequired && <span className="text-xs text-slate-400 font-normal ml-2">(optional)</span>}
                      </p>
                      {done ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Uploaded
                        </span>
                      ) : (
                        <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white cursor-pointer transition shrink-0">
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
                            disabled={uploadingType !== null}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void upload(type, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  onClick={skipWizard}
                  className="sm:flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl transition"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => void finish()}
                  disabled={!allRequiredDone || saving}
                  className="sm:flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition"
                >
                  {saving ? "One moment..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          <p className="text-center mt-6">
            <button onClick={logout} className="text-xs text-slate-400 hover:text-slate-600">
              Sign out
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}