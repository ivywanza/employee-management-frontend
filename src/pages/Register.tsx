import { useState, useEffect } from "react";
import api from "../lib/api";
import axios from "axios";

interface Department {
  id: string;
  name: string;
}

export default function Register() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "employee",
    department_id: "",
    start_date: "",
  });

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/departments/").then((response) => {
      setDepartments(response.data);
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      await api.post("/users/", {
        ...form,
        department_id: form.department_id || null,
      });
      setMessage({ type: "success", text: "Employee added successfully." });
      setForm({
        full_name: "",
        email: "",
        password: "",
        role: "employee",
        department_id: "",
        start_date: "",
      });
    } catch (err: unknown) {
      let errorText = "Failed to add employee.";

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

      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-700 to-lime-600 px-4 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5"></div>
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-8 py-8 flex items-center gap-4">
            <div className="h-14 w-14 rounded-lg bg-amber-400 flex items-center justify-center text-emerald-900 font-extrabold text-lg shrink-0 shadow-md">
              RA
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-300">
                Add New Employee
              </h1>
              <p className="text-emerald-100 text-sm mt-0.5">
                Superadmin access only
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Full Name
              </label>
              <input
                name="full_name"
                required
                value={form.full_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-emerald-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-emerald-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Temporary Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-emerald-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Role
              </label>
              <select
                name="role"
                required
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-emerald-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Department
              </label>
              <select
                name="department_id"
                required
                value={form.department_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-emerald-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                required
                value={form.start_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-emerald-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {message && (
              <p
                className={`text-sm rounded-lg px-3 py-2 border ${
                  message.type === "success"
                    ? "text-green-700 bg-green-50 border-green-200"
                    : "text-red-600 bg-red-50 border-red-200"
                }`}
              >
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? "Adding..." : "Add Employee"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
