
import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  MessageSquareWarning,
  Send,
  ShieldCheck,
} from "lucide-react";
import api from "../../lib/api";

type GrievanceKind = "comment" | "complaint";

type GrievanceCategory =
  | "workplace"
  | "management"
  | "facilities"
  | "safety"
  | "pay_benefits"
  | "harassment"
  | "other";

const categories: { value: GrievanceCategory; label: string }[] = [
  { value: "workplace", label: "Workplace environment" },
  { value: "management", label: "Management and leadership" },
  { value: "facilities", label: "Facilities and equipment" },
  { value: "safety", label: "Health and safety" },
  { value: "pay_benefits", label: "Pay and benefits" },
  { value: "harassment", label: "Harassment or misconduct" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-red-950";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6";

export default function SubmitGrievance() {
  const [kind, setKind] = useState<GrievanceKind>("complaint");
  const [category, setCategory] =
    useState<GrievanceCategory>("workplace");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanBody = body.trim();
    if (cleanBody.length < 10 || cleanBody.length > 3000) {
      setError("Your message must contain between 10 and 3,000 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/grievances/", {
        kind,
        category,
        subject: subject.trim() || null,
        body: cleanBody,
      });

      setSubject("");
      setBody("");
      setKind("complaint");
      setCategory("workplace");
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "detail" in err.response.data &&
        typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : "We couldn't submit your message. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="mx-auto w-full max-w-2xl py-6 sm:py-10">
        <div className={`${cardClass} text-center`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            Message submitted
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
            Thank you for speaking up. Your message has been received.
            Your name and account are not recorded in the grievance record.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          >
            <Send className="h-4 w-4" />
            Submit another message
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 py-2 sm:py-4">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            <MessageSquareWarning className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Employee voice
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Grievances & feedback
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Share a concern about your workplace or leave constructive feedback.
          Be clear about what happened and what you would like the organisation
          to understand.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/50">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Your grievance record is anonymous
          </p>
          <p className="mt-1 text-sm leading-5 text-emerald-800 dark:text-emerald-300">
            Your name and account are not saved with the message. Please avoid including
            your own name or other identifying details in the message itself.
          </p>
        </div>
        <LockKeyhole className="hidden h-4 w-4 shrink-0 text-emerald-700 sm:block dark:text-emerald-300" />
      </div>

      <form onSubmit={handleSubmit} className={`${cardClass} space-y-5`}>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            What would you like to submit?
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([
              {
                value: "complaint",
                title: "A complaint",
                description: "Raise a concern that needs attention.",
              },
              {
                value: "comment",
                title: "A comment",
                description: "Share feedback, an observation or a suggestion.",
              },
            ] as const).map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  kind === option.value
                    ? "border-red-500 bg-red-50 ring-1 ring-red-200 dark:bg-red-950/40 dark:ring-red-900"
                    : "border-slate-200 hover:border-slate-400 dark:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="kind"
                  value={option.value}
                  checked={kind === option.value}
                  onChange={() => setKind(option.value)}
                  className="mt-1 accent-red-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label
            htmlFor="grievance-category"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            Category
          </label>
          <select
            id="grievance-category"
            className={inputClass}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as GrievanceCategory)
            }
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="grievance-subject"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            Subject <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="grievance-subject"
            className={inputClass}
            value={subject}
            onChange={(event) => setSubject(event.target.value.slice(0, 120))}
            maxLength={120}
            placeholder="A short summary of your concern"
          />
          <p className="text-right text-xs text-slate-500">
            {subject.length}/120
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="grievance-body"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            Your message
          </label>
          <textarea
            id="grievance-body"
            className={`${inputClass} min-h-40 resize-y`}
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, 3000))}
            minLength={10}
            maxLength={3000}
            required
            placeholder="Describe the concern, relevant context and any action you believe would help."
          />
          <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
            <span>Minimum 10 characters</span>
            <span className={body.length > 2900 ? "font-semibold text-amber-600" : ""}>
              {body.length}/3000
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || body.trim().length < 10}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 sm:w-auto"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Submitting securely…" : "Submit anonymously"}
        </button>
      </form>
    </section>
  );
}
