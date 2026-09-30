import { useEffect, useState } from "react";
import axios from "axios";
import { Users } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/auth";

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id: string | null;
  start_date: string;
  is_active: boolean;
}

export default function EmployeeList() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [empRes, deptRes] = await Promise.all([
        api.get<Employee[]>("/users/"),
        api.get<Department[]>("/departments/"),
      ]);
      if (!cancelled) {
        setEmployees(empRes.data);
        setDepartments(deptRes.data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const departmentName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? "—";

  const handleToggleActive = async (employee: Employee) => {
    const nextStatus = !employee.is_active;
    const verb = nextStatus ? "reactivate" : "deactivate";
    if (!confirm(`Are you sure you want to ${verb} ${employee.full_name}?`)) return;

    setBusyId(employee.id);
    setError("");
    try {
      const res = await api.patch<Employee>(`/users/${employee.id}/status`, null, {
        params: { is_active: nextStatus },
      });
      setEmployees((prev) => prev.map((e) => (e.id === employee.id ? res.data : e)));
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(typeof detail === "string" ? detail : "Failed to update employee status.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Employee List</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">All accounts on the portal.</p>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
          {error}
        </p>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Email</th>
              <th className="px-6 py-3 font-semibold">Role</th>
              <th className="px-6 py-3 font-semibold">Department</th>
              <th className="px-6 py-3 font-semibold">Start Date</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-slate-500 dark:text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-slate-500 dark:text-slate-400">
                  No employees yet.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="text-slate-700 dark:text-slate-300">
                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">{emp.full_name}</td>
                  <td className="px-6 py-3">{emp.email}</td>
                  <td className="px-6 py-3 capitalize">{emp.role}</td>
                  <td className="px-6 py-3">{departmentName(emp.department_id)}</td>
                  <td className="px-6 py-3">{new Date(emp.start_date).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        emp.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {emp.id === user?.id ? (
                      <span className="text-xs text-slate-400">You</span>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(emp)}
                        disabled={busyId === emp.id}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-60 ${
                          emp.is_active
                            ? "text-red-600 hover:text-red-700"
                            : "text-emerald-600 hover:text-emerald-700"
                        }`}
                      >
                        {busyId === emp.id ? "..." : emp.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}