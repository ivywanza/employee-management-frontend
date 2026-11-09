
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  X,
  Save,
  Loader2,
} from "lucide-react";
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

interface EditForm {
  full_name: string;
  email: string;
  role: string;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ActionButton({
  title,
  onClick,
  disabled,
  children,
  color = "slate",
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  color?: "blue" | "red" | "amber" | "emerald";
}) {
  const colors = {
    blue: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30",
    red: "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30",
    amber: "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30",
    emerald:
      "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30",
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${colors[color]}`}
    >
      {children}
    </button>
  );
}

export default function EmployeeList() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: "",
    email: "",
    role: "employee",
  });

  const [savingEdit, setSavingEdit] = useState(false);

  const canManage =
    user?.role === "admin" || user?.role === "superadmin";

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");

    try {
      const [empRes, deptRes] = await Promise.all([
        api.get<Employee[]>("/users/"),
        api.get<Department[]>("/departments/"),
      ]);

      setEmployees(empRes.data);
      setDepartments(deptRes.data);
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail
        : undefined;

      setError(
        typeof detail === "string"
          ? detail
          : "Could not load the employee list.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEmployees();
  }, []);

  const departmentName = (id: string | null) =>
    departments.find((d) => d.id === id)?.name ?? "—";

  const startDate = (value: string) => {
    if (!value) return "—";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString();
  };

  const getErrorMessage = (err: unknown, fallback: string) => {
    const detail = axios.isAxiosError(err)
      ? err.response?.data?.detail
      : undefined;

    return typeof detail === "string" ? detail : fallback;
  };

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      full_name: employee.full_name,
      email: employee.email,
      role: employee.role,
    });
    setError("");
    setNotice("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEmployee) return;

    if (!editForm.full_name.trim() || !editForm.email.trim()) {
      setError("Employee name and email are required.");
      return;
    }

    setSavingEdit(true);
    setError("");
    setNotice("");

    try {
      const res = await api.patch<Employee>(
        `/users/${editingEmployee.id}`,
        {
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
        },
      );

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmployee.id ? res.data : emp,
        ),
      );

      setEditingEmployee(null);
      setNotice("Employee details updated successfully.");
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Could not update employee details."),
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    const nextStatus = !employee.is_active;
    const verb = nextStatus ? "reactivate" : "deactivate";

    if (
      !confirm(
        `Are you sure you want to ${verb} ${employee.full_name}?`,
      )
    ) {
      return;
    }

    setBusyId(employee.id);
    setError("");
    setNotice("");

    try {
      const res = await api.patch<Employee>(
        `/users/${employee.id}/status`,
        null,
        {
          params: { is_active: nextStatus },
        },
      );

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employee.id ? res.data : emp,
        ),
      );

      setNotice(
        `${employee.full_name} has been ${
          nextStatus ? "reactivated" : "deactivated"
        }.`,
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Failed to update employee status."),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleResend = async (employee: Employee) => {
    if (
      !confirm(
        `Email ${employee.full_name} a new temporary password? Their current password will stop working.`,
      )
    ) {
      return;
    }

    setBusyId(employee.id);
    setError("");
    setNotice("");

    try {
      const res = await api.post<{ email_sent: boolean }>(
        `/users/${employee.id}/resend-welcome`,
      );

      if (res.data.email_sent) {
        setNotice(
          `A new welcome email was sent to ${employee.email}.`,
        );
      } else {
        setError(
          "The password was reset, but the email could not be sent. Check the email settings on the server.",
        );
      }
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Could not resend the welcome email."),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (
      !confirm(
        `Are you sure you want to delete ${employee.full_name}? This action may permanently remove their account.`,
      )
    ) {
      return;
    }

    setBusyId(employee.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/users/${employee.id}`);

      setEmployees((prev) =>
        prev.filter((emp) => emp.id !== employee.id),
      );

      setNotice(`${employee.full_name} was deleted.`);
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Could not delete this employee."),
      );
    } finally {
      setBusyId(null);
    }
  };

  const action = (emp: Employee) => {
    if (emp.id === user?.id || !canManage) {
      return (
        <span className="text-xs text-slate-400">
          {emp.id === user?.id ? "You" : "—"}
        </span>
      );
    }

    const busy = busyId === emp.id;

    return (
      <div className="flex items-center justify-end gap-1">
        <ActionButton
          title="Edit employee"
          onClick={() => openEdit(emp)}
          disabled={busy}
          color="blue"
        >
          <Pencil size={17} />
        </ActionButton>

        <ActionButton
          title="Resend welcome email"
          onClick={() => handleResend(emp)}
          disabled={busy}
          color="blue"
        >
          {busy ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Mail size={17} />
          )}
        </ActionButton>

        <ActionButton
          title={emp.is_active ? "Deactivate employee" : "Reactivate employee"}
          onClick={() => handleToggleActive(emp)}
          disabled={busy}
          color={emp.is_active ? "amber" : "emerald"}
        >
          {emp.is_active ? (
            <UserX size={17} />
          ) : (
            <UserCheck size={17} />
          )}
        </ActionButton>

        <ActionButton
          title="Delete employee"
          onClick={() => handleDelete(emp)}
          disabled={busy}
          color="red"
        >
          <Trash2 size={17} />
        </ActionButton>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Employee List
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All accounts on the portal.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
          {error}
        </p>
      )}

      {notice && (
        <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
          {notice}
        </p>
      )}

      {/* Edit employee modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Edit employee
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update employee account details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {savingEdit ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile employee cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading...
          </p>
        ) : employees.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No employees yet.
          </p>
        ) : (
          employees.map((emp, index) => (
            <div
              key={emp.id}
              className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-800 to-red-600 text-white font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {emp.full_name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 break-all">
                    {emp.email}
                  </p>
                </div>

                <StatusBadge active={emp.is_active} />
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-slate-400">Role</dt>
                  <dd className="font-medium capitalize text-slate-700 dark:text-slate-200">
                    {emp.role}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-400">Department</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-200">
                    {departmentName(emp.department_id)}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-400">Started</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-200">
                    {startDate(emp.start_date)}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Employee #{index + 1}
                </span>
                {action(emp)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop employee table */}
      
{/* Desktop employee table */}
<div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
    <div>
      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
        Employee accounts
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Manage employee information and account access.
      </p>
    </div>

    <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-semibold">
      {employees.length} {employees.length === 1 ? "Account" : "Accounts"}
    </span>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full min-w-[1000px] text-sm border-collapse">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-800/80 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <th className="px-5 py-4 font-bold w-16">S/No.</th>
          <th className="px-5 py-4 font-bold">Employee</th>
          <th className="px-5 py-4 font-bold">Email address</th>
          <th className="px-5 py-4 font-bold">Role</th>
          <th className="px-5 py-4 font-bold">Department</th>
          <th className="px-5 py-4 font-bold">Start date</th>
          <th className="px-5 py-4 font-bold">Account status</th>
          <th className="px-5 py-4 font-bold text-center">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <tr>
            <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
              Loading employee accounts...
            </td>
          </tr>
        ) : employees.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
              No employee accounts found.
            </td>
          </tr>
        ) : (
          employees.map((emp, index) => (
            <tr
              key={emp.id}
              className={`transition-colors hover:bg-red-50/40 dark:hover:bg-slate-800/60 ${
                index % 2 === 0
                  ? "bg-white dark:bg-slate-900"
                  : "bg-slate-50/60 dark:bg-slate-900/50"
              }`}
            >
              {/* Serial number */}
              <td className="px-5 py-4">
                <span className="inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                  {index + 1}
                </span>
              </td>

              {/* Employee name */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {emp.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {emp.full_name}
                  </span>
                </div>
              </td>

              {/* Email */}
              <td className="px-5 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {emp.email}
              </td>

              {/* Role */}
              <td className="px-5 py-4">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold capitalize">
                  {emp.role}
                </span>
              </td>

              {/* Department */}
              <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                {departmentName(emp.department_id)}
              </td>

              {/* Start date */}
              <td className="px-5 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {startDate(emp.start_date)}
              </td>

              {/* Status */}
              <td className="px-5 py-4">
                <StatusBadge active={emp.is_active} />
              </td>

              {/* Actions */}
              <td className="px-5 py-4">
                <div className="flex justify-center">
                  {action(emp)}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
    <p className="text-xs text-slate-500 dark:text-slate-400">
      Showing {employees.length} employee {employees.length === 1 ? "account" : "accounts"}
    </p>
  </div>
</div>

    </div>
  );
}
