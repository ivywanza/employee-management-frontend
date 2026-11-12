
import { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus } from "lucide-react";
import api from "../lib/api";

// Department information returned by the backend.
interface Department {
  id: string;
  name: string;
}

// Feedback displayed after attempting to register an employee.
type Notice = {
  type: "success" | "warning" | "error";
  text: string;
};

// Initial values used when opening or resetting the registration form.
const emptyForm = {
  full_name: "",
  email: "",
  role: "employee",
  department_id: "",
  organisation: "red_ant",
  start_date: "",
};

// Shared styling for all form inputs.
const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600";

// Shared styling for form labels.
const labelClass =
  "block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1";

// Styling for success, warning and error messages.
const noticeClass: Record<Notice["type"], string> = {
  success:
    "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  warning:
    "text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  error:
    "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
};

export default function Register() {
  // Stores the departments retrieved from the backend.
  const [departments, setDepartments] = useState<Department[]>([]);

  // Stores the employee registration form values.
  const [form, setForm] = useState(emptyForm);

  // Stores registration feedback.
  const [notice, setNotice] = useState<Notice | null>(null);

  // Prevents multiple submissions while registration is processing.
  const [loading, setLoading] = useState(false);

  // Load available departments when the registration page opens.
  useEffect(() => {
    let cancelled = false;

    api
      .get<Department[]>("/departments/")
      .then((res) => {
        if (!cancelled) {
          setDepartments(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotice({
            type: "error",
            text: "Unable to load departments. Please refresh the page.",
          });
        }
      });

    // Prevent state updates if the component has been removed.
    return () => {
      cancelled = true;
    };
  }, []);

  // Update the appropriate form field whenever an input changes.
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  // Submit the employee registration details to the backend.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setNotice(null);
    setLoading(true);

    try {
      const res = await api.post<{ email_sent: boolean }>("/users/", {
        ...form,

        // Store an empty department selection as null.
        department_id: form.department_id || null,
      });

      // Display the appropriate message depending on email delivery.
      setNotice(
        res.data.email_sent
          ? {
              type: "success",
              text: `Employee added. A welcome email with a temporary password was sent to ${form.email}.`,
            }
          : {
              type: "warning",
              text: "Employee added, but the welcome email could not be sent. Open Employee List and use Resend welcome email once the email settings are fixed.",
            }
      );

      // Reset the form after successful employee creation.
      setForm(emptyForm);
    } catch (err: unknown) {
      let errorText = "Failed to add employee.";

      // Extract validation or server errors returned by FastAPI.
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") {
          errorText = detail;
        } else if (Array.isArray(detail)) {
          errorText = detail
            .map((d: { msg?: string }) => d.msg ?? "Invalid input")
            .join(", ");
        }
      }

      setNotice({
        type: "error",
        text: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Page heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0">
          <UserPlus className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Add New Employee
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            A temporary password is created and emailed to them automatically.
          </p>
        </div>
      </div>

      {/* Employee registration form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5"
      >
        {/* Employee full name */}
        <div>
          <label className={labelClass}>Full Name</label>

          <input
            name="full_name"
            required
            value={form.full_name}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Employee email address */}
        <div>
          <label className={labelClass}>Email</label>

          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Organisation determines the employee's business entity */}
        <div>
          <label className={labelClass}>Organisation</label>

          <select
            name="organisation"
            required
            value={form.organisation}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="red_ant">Red Ant</option>
            <option value="bella_organics">Bella Organics</option>
            <option value="juakali">Juakali</option>
          </select>
        </div>

        {/* Employee role and department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Role</label>

            <select
              name="role"
              required
              value={form.role}
              onChange={handleChange}
              className={inputClass}
            >
              {/* Standard employee access */}
              <option value="employee">Employee</option>

              {/* HR access, excluding requisition approvals and self-approval of leave */}
              <option value="hr">HR</option>

              {/* Administrative access */}
              <option value="admin">Admin</option>

              {/* Full system access */}
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Department</label>

            <select
              name="department_id"
              required
              value={form.department_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select a department</option>

              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee starting date */}
        <div>
          <label className={labelClass}>Start Date</label>

          <input
            type="date"
            name="start_date"
            required
            value={form.start_date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Registration success, warning or error message */}
        {notice && (
          <p
            className={`text-sm rounded-lg px-3 py-2 border ${
              noticeClass[notice.type]
            }`}
          >
            {notice.text}
          </p>
        )}

        {/* Submit registration */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
        >
          {loading ? "Adding and sending email..." : "Add Employee"}
        </button>
      </form>
    </div>
  );
}
