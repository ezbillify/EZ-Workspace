"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, statusBadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/layout/AuthProvider";
import axios from "axios";
import { formatCurrency, getYearRange } from "@/lib/utils";
import { calculateCompanyScore, calculateFinalIncentive, getCompanyMultiplier, getEmployeeMultiplier } from "@/lib/incentiveMath";

interface User { _id: string; name: string; employeeId: string; department: string; }
interface Incentive {
  _id: string;
  amount: number;
  base_amount: number;
  fixed_amount?: number;
  variable_amount?: number;
  employee_score?: number;
  employee_multiplier?: number;
  company_score?: number;
  company_multiplier?: number;
  status: string;
  month: number;
  year: number;
  createdAt?: string;
  employee: { name: string; employeeId: string };
}

interface ConfigState {
  revenue_achievement_percentage: number;
  collections_percentage: number;
  delivery_health_percentage: number;
}

interface KpiScore {
  final_score: number;
}

export default function AdminIncentivesPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [vestingLoading, setVestingLoading] = useState(false);
  const [savingPerformance, setSavingPerformance] = useState(false);
  const [employeeScore, setEmployeeScore] = useState<number | null>(null);
  const [config, setConfig] = useState<ConfigState>({
    revenue_achievement_percentage: 84,
    collections_percentage: 87,
    delivery_health_percentage: 75,
  });
  const [form, setForm] = useState({
    fixed_amount: "",
    variable_amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("/api/users?limit=100")
      .then((res) => setUsers(res.data.users ?? []));
    axios.get("/api/config").then((res) => {
      const cfg = res.data.config ?? {};
      setConfig({
        revenue_achievement_percentage: cfg.revenue_achievement_percentage ?? 84,
        collections_percentage: cfg.collections_percentage ?? 87,
        delivery_health_percentage: cfg.delivery_health_percentage ?? 75,
      });
    });
  }, []);

  async function loadIncentives(empId?: string) {
    setLoading(true);
    try {
      const url = empId ? `/api/incentives?employeeId=${empId}` : "/api/incentives";
      const res = await axios.get(url);
      setIncentives(res.data.incentives ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedUser) return;
    loadIncentives(selectedUser);
    axios
      .get(`/api/kpi?employeeId=${selectedUser}`)
      .then((res) => {
        const scores = (res.data.scores ?? []) as KpiScore[];
        setEmployeeScore(scores[0]?.final_score ?? null);
      })
      .catch(() => setEmployeeScore(null));
  }, [selectedUser]);

  async function handleAward(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return alert("Select employee");
    setSubmitting(true);
    try {
      const fixedAmount = parseFloat(form.fixed_amount || "0");
      const variableAmount = parseFloat(form.variable_amount || "0");
      if (fixedAmount + variableAmount <= 0) {
        alert("Enter fixed or variable amount");
        return;
      }
      await axios.post(
        "/api/incentives",
        {
          employee: selectedUser,
          fixed_amount: fixedAmount,
          variable_amount: variableAmount,
          month: form.month,
          year: form.year,
          notes: form.notes,
        }
      );
      setForm({
        fixed_amount: "",
        variable_amount: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        notes: "",
      });
      await loadIncentives(selectedUser);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function processVesting() {
    setVestingLoading(true);
    try {
      const res = await axios.post(
        "/api/incentives",
        { action: "process_vesting" }
      );
      alert(res.data.message);
      if (selectedUser) await loadIncentives(selectedUser);
    } finally {
      setVestingLoading(false);
    }
  }

  async function saveCompanyPerformance() {
    setSavingPerformance(true);
    try {
      await axios.patch("/api/config", config);
      alert("Company performance updated");
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error");
    } finally {
      setSavingPerformance(false);
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i).toLocaleString("en-IN", { month: "long" }) }));
  const fixedAmount = parseFloat(form.fixed_amount || "0") || 0;
  const variableAmount = parseFloat(form.variable_amount || "0") || 0;
  const companyScore = calculateCompanyScore(
    config.revenue_achievement_percentage,
    config.collections_percentage,
    config.delivery_health_percentage
  );
  const companyMultiplier = getCompanyMultiplier(companyScore);
  const employeeMultiplier = getEmployeeMultiplier(employeeScore);
  const totalAmount = calculateFinalIncentive(
    fixedAmount,
    variableAmount,
    employeeMultiplier,
    companyMultiplier
  );
  const selectedEmployeeName = users.find((u) => u._id === selectedUser)?.name;
  const canEditCompanyPerformance = user?.role === "super_admin";

  return (
    <DashboardShell title="Incentive Management">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Company Performance</CardTitle>
          <div className="flex gap-2">
            {canEditCompanyPerformance && (
              <Button size="sm" loading={savingPerformance} onClick={saveCompanyPerformance}>
                Save Performance
              </Button>
            )}
            <Button variant="secondary" loading={vestingLoading} onClick={processVesting}>
              Process Vesting (Run Manually)
            </Button>
          </div>
        </CardHeader>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.65fr]">
          <div className="rounded-2xl border border-gray-200 bg-white/40 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <div className="space-y-5">
              {[
                { key: "revenue_achievement_percentage", label: "Revenue Achievement" },
                { key: "collections_percentage", label: "Collections" },
                { key: "delivery_health_percentage", label: "Delivery Health" },
              ].map(({ key, label }) => {
                const value = config[key as keyof ConfigState];
                return (
                  <div key={key} className="grid gap-3 md:grid-cols-[200px_1fr_60px] md:items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    <input
                      type="range"
                      min={0}
                      max={120}
                      value={value}
                      disabled={!canEditCompanyPerformance}
                      onChange={(e) => setConfig({ ...config, [key]: parseInt(e.target.value) })}
                      className="w-full accent-sky-500 disabled:opacity-70"
                    />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white/40 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">Company Score</p>
            <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-white">{companyScore}%</p>
            <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <p>Poor: &lt;60% → 0.5x</p>
              <p>Weak: 60–79% → 0.7x</p>
              <p>Average: 80–99% → 1.0x</p>
              <p>Good: 100–109% → 1.1x</p>
              <p>Excellent: 110%+ → 1.2x</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white/40 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">Company Multiplier</p>
            <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-white">{companyMultiplier.toFixed(1)}x</p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              This multiplier affects the variable incentive component for everyone.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Award Form */}
        <Card>
          <CardHeader><CardTitle>Award Incentive</CardTitle></CardHeader>
          <form onSubmit={handleAward} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Employee</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                required
              >
                <option value="">-- Select --</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.employeeId})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Month</label>
                <select value={form.month} onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
                  {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Year</label>
                <select value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
                  {getYearRange().map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Fixed (₹)</label>
                <input type="number" min="0" value={form.fixed_amount} onChange={(e) => setForm({ ...form, fixed_amount: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Variable (₹)</label>
                <input type="number" min="0" value={form.variable_amount} onChange={(e) => setForm({ ...form, variable_amount: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
              </div>
            </div>
            <div className="rounded-xl bg-sky-50/80 p-4 text-sm text-sky-900 dark:bg-sky-900/20 dark:text-sky-100">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span>Base Incentive</span>
                  <span className="font-semibold">{formatCurrency(fixedAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Variable Incentive</span>
                  <span className="font-semibold">{formatCurrency(variableAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Employee Multiplier</span>
                  <span className="font-semibold">{employeeMultiplier.toFixed(1)}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Company Multiplier</span>
                  <span className="font-semibold">{companyMultiplier.toFixed(1)}x</span>
                </div>
                <div className="border-t border-sky-200 pt-2 dark:border-sky-800">
                  <div className="flex items-center justify-between text-base font-bold">
                    <span>Final Incentive</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" />
            </div>
            <Button type="submit" loading={submitting} className="w-full">Award Incentive</Button>
          </form>
        </Card>

        {/* Incentive List */}
        <Card>
          <CardHeader><CardTitle>Incentives {selectedUser ? `— ${selectedEmployeeName}` : ""}</CardTitle></CardHeader>
          {!selectedUser ? (
            <p className="py-12 text-center text-sm text-gray-400">Select an employee to view</p>
          ) : loading ? (
            <p className="py-12 text-center text-sm text-gray-400">Loading...</p>
          ) : incentives.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No incentives</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Month</th>
                    <th className="pb-3 pr-4">Fixed (₹)</th>
                    <th className="pb-3 pr-4">Variable (₹)</th>
                    <th className="pb-3 pr-4">Total Payout (₹)</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {incentives.map((i) => (
                    <tr key={i._id}>
                      <td className="py-3 pr-4 text-gray-500">{i.createdAt ? new Date(i.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="py-3 pr-4 font-medium">{new Date(i.year, i.month - 1).toLocaleString("en-IN", { month: "long" })}</td>
                      <td className="py-3 pr-4">{formatCurrency(i.fixed_amount ?? i.base_amount)}</td>
                      <td className="py-3 pr-4">{formatCurrency(i.variable_amount ?? 0)}</td>
                      <td className="py-3 pr-4 font-semibold">{formatCurrency(i.amount)}</td>
                      <td className="py-3">
                        <Badge variant={statusBadgeVariant(i.status)}>
                          {i.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
