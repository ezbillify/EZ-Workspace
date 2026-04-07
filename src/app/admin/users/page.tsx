"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/layout/AuthProvider";
import { formatDate } from "@/lib/utils";
import axios from "axios";

interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  department: string;
  designation: string;
  joiningDate: string;
  isActive: boolean;
}

const roleColors: Record<string, string> = {
  employee: "default",
  hr: "info",
  lead: "success",
  super_admin: "purple",
};

export default function AdminUsersPage() {
  
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "employee",
    employeeId: "", department: "", designation: "", joiningDate: "",
  });

  async function load(q?: string) {
    setLoading(true);
    try {
      const url = `/api/users?${q ? `search=${q}` : ""}`;
      const res = await axios.get(url);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/users", form);
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "employee", employeeId: "", department: "", designation: "", joiningDate: "" });
      await load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(userId: string, current: boolean) {
    await axios.patch(`/api/users/${userId}`, { isActive: !current });
    await load();
  }

  return (
    <DashboardShell title="Employees">
      <div className="mb-4 flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="Search name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Employee"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New Employee</CardTitle></CardHeader>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "name", label: "Full Name", type: "text" },
              { key: "email", label: "Email", type: "email" },
              { key: "password", label: "Password", type: "password" },
              { key: "employeeId", label: "Employee ID", type: "text" },
              { key: "department", label: "Department", type: "text" },
              { key: "designation", label: "Designation", type: "text" },
              { key: "joiningDate", label: "Joining Date", type: "date" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
                <input
                  type={type}
                  required
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="lead">Lead</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <Button type="submit" loading={submitting}>Create Employee</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Employees ({total})</CardTitle>
        </CardHeader>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left text-xs text-gray-500">
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Department</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Joined</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">{u.employeeId}</td>
                    <td className="py-3 pr-4 text-gray-500">{u.department}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={(roleColors[u.role] as "default" | "info" | "purple" | "success") ?? "default"}>
                        {u.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(u.joiningDate)}</td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleActive(u._id, u.isActive)}
                        className={`text-xs font-medium ${u.isActive ? "text-emerald-600 hover:text-red-500" : "text-red-500 hover:text-emerald-600"}`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
