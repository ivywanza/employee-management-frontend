
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, LoaderCircle } from "lucide-react";
import api from "../lib/api";

export default function AcceptAssetAssignment() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function acceptAssignment() {
    if (!token) {
      setError("This assignment link is invalid.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post(
        "/assets/accept-assignment",
        null,
        { params: { token } }
      );

      setMessage(
        response.data?.message ||
          "Asset assignment accepted successfully."
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "We could not accept this assignment. Please sign in and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
          <CheckCircle size={25} />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">
          Accept asset assignment
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Review and accept the asset assigned to you by HR.
          Once accepted, it will appear under your assigned assets.
        </p>

        {message && (
          <div
            role="status"
            className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-800"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!message && (
          <button
            type="button"
            onClick={acceptAssignment}
            disabled={loading || !token}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-800 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <LoaderCircle size={18} className="animate-spin" />
            )}
            {loading ? "Processing..." : "Accept assignment"}
          </button>
        )}
      </section>
    </main>
  );
}
