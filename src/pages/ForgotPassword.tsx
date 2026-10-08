import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { KeyRound, CheckCircle2 } from "lucide-react";
import api from "../lib/api";

type Stage = "request" | "reset" | "done";

const inputClass =
  "w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1";

function errorText(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Cannot reach the server. Is the backend running?";
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg ?? "Invalid input").join(", ");
    }
  }
  return fallback;
}

export default function ForgotPassword() {
  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStage("reset");
      setInfo("If that email has an account, a 6-digit code is on its way. It expires in 10 minutes.");
    } catch (err) {
      setError(errorText(err, "Could not send the code."));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, code, new_password: password });
      setStage("done");
    } catch (err) {
      setError(errorText(err, "Could not reset the password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-700 via-red-600 to-red-700 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-800 to-red-700 px-8 py-8 flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center text-red-700 shrink-0 shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Reset password</h1>
            <p className="text-blue-100 text-sm mt-0.5">
              {stage === "request" && "We'll email you a 6-digit code"}
              {stage === "reset" && "Enter the code and a new password"}
              {stage === "done" && "All set"}
            </p>
          </div>
        </div>

        <div className="px-8 py-8">
          {stage === "request" && (
            <form onSubmit={requestCode} className="space-y-5">
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className={inputClass}
                />
              </div>
              {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-blue-950 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
              >
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          )}

          {stage === "reset" && (
            <form onSubmit={resetPassword} className="space-y-5">
              {info && <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">{info}</p>}
              <div>
                <label className={labelClass}>6-digit code</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  pattern="\d{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`${inputClass} tracking-[0.4em] text-center text-lg`}
                />
              </div>
              <div>
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm new password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
              </div>
              {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-blue-950 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
              <button
                type="button"
                onClick={() => requestCode()}
                disabled={loading}
                className="w-full text-sm text-red-700 hover:text-red-700 font-medium"
              >
                Send a new code
              </button>
            </form>
          )}

          {stage === "done" && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <p className="text-slate-700">Your password has been updated.</p>
              <Link
                to="/login"
                className="inline-block w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 rounded-xl transition"
              >
                Back to sign in
              </Link>
            </div>
          )}

          {stage !== "done" && (
            <p className="text-center mt-6">
              <Link to="/login" className="text-sm text-blue-800 hover:text-red-700 font-medium">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}