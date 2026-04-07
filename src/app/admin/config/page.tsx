"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/layout/AuthProvider";
import { formatCurrency } from "@/lib/utils";
import axios from "axios";
import { Info, Settings } from "lucide-react";

interface Config {
  company_revenue: number;
  profit_percentage: number;
  expense_percentage: number;
  company_stage: string;
  equity_min_percentage: number;
  equity_max_percentage: number;
  vesting_days: number;
  bonus_percentage_1m: number;
  bonus_percentage_2m: number;
  claim_limit: number;
  payout_pool_amount: number;
  payout_capacity: "HIGH" | "MODERATE" | "LOW";
  current_claim_cycle: number;
  cycle_reset_date: string;
}

export default function AdminConfigPage() {
  const { user } = useAuth();

  if (user && user.role !== "super_admin") {
    return (
      <DashboardShell title="System Configuration">
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-red-500">Access denied. Only Super Admin can view this page.</p>
        </div>
      </DashboardShell>
    );
  }
  const [config, setConfig] = useState<Config | null>(null);
  const [form, setForm] = useState<Partial<Config>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await axios.get("/api/config");
      setConfig(res.data.config);
      setForm(res.data.config);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.patch("/api/config", form);
      setConfig(res.data.config);
      setForm(res.data.config);
      alert("System config saved!");
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  const n = (key: keyof Config) => form[key] as number;
  const profitAmount = ((n("company_revenue") || 0) * (n("profit_percentage") || 0)) / 100;
  const expenseAmount = ((n("company_revenue") || 0) * (n("expense_percentage") || 0)) / 100;

  return (
    <DashboardShell title="System Configuration">
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 dark:border-sky-800 dark:bg-sky-900/20">
        <Info size={18} className="mt-0.5 text-sky-600 shrink-0" />
        <p className="text-sm text-sky-700 dark:text-sky-400">
          All system parameters are controlled here. Changes apply immediately to new incentives and claims.
          <strong className="block mt-1">Only Super Admin can access this page.</strong>
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle><span className="flex items-center gap-2"><Settings size={15} /> Company Snapshot</span></CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_0.9fr]">
                <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900 p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Shared dashboard metric</p>
                  <div className="mt-3">
                    <p className="text-sm text-cyan-100/80">Company Revenue</p>
                    <p className="mt-1 text-3xl font-bold">{formatCurrency(n("company_revenue") || 0)}</p>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-emerald-100">Profit</span>
                        <span className="font-semibold">{n("profit_percentage") || 0}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/15">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${n("profit_percentage") || 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-amber-100">Expense</span>
                        <span className="font-semibold">{n("expense_percentage") || 0}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/15">
                        <div
                          className="h-full rounded-full bg-amber-300"
                          style={{ width: `${n("expense_percentage") || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Revenue Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={n("company_revenue")}
                      onChange={(e) => setForm({ ...form, company_revenue: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Startup Stage
                    </label>
                    <input
                      type="text"
                      value={form.company_stage ?? ""}
                      onChange={(e) => setForm({ ...form, company_stage: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
                      <span>Profit Ratio</span>
                      <span className="font-bold text-emerald-600">{n("profit_percentage") || 0}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={n("profit_percentage")}
                      onChange={(e) => {
                        const profit = parseInt(e.target.value);
                        setForm({ ...form, profit_percentage: profit, expense_percentage: 100 - profit });
                      }}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Equity Min (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={form.equity_min_percentage ?? 0}
                        onChange={(e) => setForm({ ...form, equity_min_percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Equity Max (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={form.equity_max_percentage ?? 0}
                        onChange={(e) => setForm({ ...form, equity_max_percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">Profit</p>
                      <p className="mt-1 font-semibold text-emerald-900 dark:text-emerald-100">{formatCurrency(profitAmount)}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
                      <p className="text-xs text-amber-700 dark:text-amber-400">Expense</p>
                      <p className="mt-1 font-semibold text-amber-900 dark:text-amber-100">{formatCurrency(expenseAmount)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Expense ratio is auto-balanced to keep the total at 100%. Any save here will reflect on employee dashboards, including the startup finance snapshot.
                  </p>
                </div>
              </div>
            </Card>

            {/* Vesting & Bonus */}
            <Card>
              <CardHeader>
                <CardTitle><span className="flex items-center gap-2"><Settings size={15} /> Vesting & Hold Bonus</span></CardTitle>
              </CardHeader>
              <div className="space-y-5">
                <div>
                  <label className="mb-1 flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span>Vesting Period (days)</span>
                    <span className="font-bold text-sky-600">{n("vesting_days")} days</span>
                  </label>
                  <input
                    type="range" min={1} max={365}
                    value={n("vesting_days")}
                    onChange={(e) => setForm({ ...form, vesting_days: parseInt(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Default: 30 days. Incentives lock for this duration after award.</p>
                </div>
                <div>
                  <label className="mb-1 flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span>1-Month Hold Bonus (%)</span>
                    <span className="font-bold text-emerald-600">+{n("bonus_percentage_1m")}%</span>
                  </label>
                  <input
                    type="range" min={0} max={50}
                    value={n("bonus_percentage_1m")}
                    onChange={(e) => setForm({ ...form, bonus_percentage_1m: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span>2-Month Hold Bonus (% max cap)</span>
                    <span className="font-bold text-emerald-600">+{n("bonus_percentage_2m")}%</span>
                  </label>
                  <input
                    type="range" min={0} max={50}
                    value={n("bonus_percentage_2m")}
                    onChange={(e) => setForm({ ...form, bonus_percentage_2m: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </Card>

            {/* Payout Pool */}
            <Card>
              <CardHeader>
                <CardTitle><span className="flex items-center gap-2"><Settings size={15} /> Payout Pool & Claims</span></CardTitle>
              </CardHeader>
              <div className="space-y-5">
                <div>
                  <label className="mb-1 flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span>Claim Limit per Cycle</span>
                    <span className="font-bold text-sky-600">{n("claim_limit")} users</span>
                  </label>
                  <input
                    type="range" min={1} max={200}
                    value={n("claim_limit")}
                    onChange={(e) => setForm({ ...form, claim_limit: parseInt(e.target.value) })}
                    className="w-full accent-sky-500"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Only first {n("claim_limit")} users per cycle get approved.</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Payout Pool Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={n("payout_pool_amount")}
                    onChange={(e) => setForm({ ...form, payout_pool_amount: parseFloat(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Current: {formatCurrency(n("payout_pool_amount"))}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Payout Capacity
                  </label>
                  <select
                    value={form.payout_capacity}
                    onChange={(e) => setForm({ ...form, payout_capacity: e.target.value as Config["payout_capacity"] })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="HIGH">HIGH — Normal operations</option>
                    <option value="MODERATE">MODERATE — Slight delays possible</option>
                    <option value="LOW">LOW — Show delay warning to employees</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Read-only status */}
            {config && (
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Current System State (Read-only)</CardTitle></CardHeader>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
                  {[
                    { label: "Revenue", value: formatCurrency(config.company_revenue) },
                    { label: "Startup Stage", value: config.company_stage },
                    { label: "Equity Range", value: `${config.equity_min_percentage}% - ${config.equity_max_percentage}%` },
                    { label: "Profit Ratio", value: `${config.profit_percentage}%` },
                    { label: "Expense Ratio", value: `${config.expense_percentage}%` },
                    { label: "Claim Cycle", value: `#${config.current_claim_cycle}` },
                    { label: "Pool Remaining", value: formatCurrency(config.payout_pool_amount) },
                    { label: "Payout Capacity", value: config.payout_capacity },
                    { label: "Vesting", value: `${config.vesting_days} days` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="font-bold text-gray-800 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={saving} size="lg">
              Save Configuration
            </Button>
          </div>
        </form>
      )}
    </DashboardShell>
  );
}
