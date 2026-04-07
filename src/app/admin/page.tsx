"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/components/layout/AuthProvider";
import { formatCurrency } from "@/lib/utils";
import { calculateCompanyScore, calculateFinalIncentive, getCompanyMultiplier, getEmployeeMultiplier } from "@/lib/incentiveMath";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  CalendarDays,
  Gift,
  IndianRupee,
  LineChart,
  PenLine,
  TrendingDown,
  TrendingUp,
  Gauge,
  CircleAlert,
} from "lucide-react";
import axios from "axios";

interface UserShape {
  _id: string;
  name: string;
  role: "employee" | "hr" | "super_admin";
}

interface Claim {
  amount: number;
}

interface IncentiveShape {
  _id: string;
  amount: number;
  base_amount: number;
  status: string;
  createdAt?: string;
}

interface KpiShape {
  final_score: number;
}

interface EmployeeSummaryRow {
  id: string;
  name: string;
  score: number;
  baseIncentive: number;
  employeeMultiplier: number;
  finalIncentive: number;
  status: string;
}

type ConfigShape = {
  company_revenue: number;
  profit_percentage: number;
  expense_percentage: number;
  company_stage: string;
  equity_min_percentage: number;
  equity_max_percentage: number;
  revenue_achievement_percentage: number;
  collections_percentage: number;
  delivery_health_percentage: number;
  payout_pool_amount: number;
  payout_capacity: string;
  claim_limit: number;
  current_claim_cycle: number;
};

const monthOptions = [
  { label: "January 2026", value: "January 2026" },
  { label: "February 2026", value: "February 2026" },
  { label: "March 2026", value: "March 2026" },
  { label: "April 2026", value: "April 2026" },
];

export default function AdminOverview() {
  const { request } = useApi();
  const { user } = useAuth();
  const [config, setConfig] = useState<ConfigShape | null>(null);
  const [employeeRows, setEmployeeRows] = useState<EmployeeSummaryRow[]>([]);
  const [approvedClaimsAmount, setApprovedClaimsAmount] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState("April 2026");
  const [processingVesting, setProcessingVesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [configRes, claimsRes, usersRes] = await Promise.all([
          request<{ config: ConfigShape }>({ url: "/api/config" }),
          request<{ claims: Claim[] }>({ url: "/api/claims?status=approved" }),
          request<{ users: UserShape[] }>({ url: "/api/users?role=employee&limit=4" }),
        ]);

        const cfg = configRes.config;
        setConfig(cfg);
        setApprovedClaimsAmount((claimsRes.claims ?? []).reduce((sum, claim) => sum + claim.amount, 0));

        const companyScore = calculateCompanyScore(
          cfg.revenue_achievement_percentage,
          cfg.collections_percentage,
          cfg.delivery_health_percentage
        );
        const companyMultiplier = getCompanyMultiplier(companyScore);

        const rows = await Promise.all(
          (usersRes.users ?? []).map(async (employee) => {
            const [kpiRes, incentiveRes] = await Promise.all([
              request<{ scores: KpiShape[] }>({ url: `/api/kpi?employeeId=${employee._id}` }),
              request<{ incentives: IncentiveShape[] }>({ url: `/api/incentives?employeeId=${employee._id}` }),
            ]);

            const score = kpiRes.scores?.[0]?.final_score ?? 80;
            const employeeMultiplier = getEmployeeMultiplier(score);
            const latestIncentive = incentiveRes.incentives?.[0];
            const baseIncentive = latestIncentive?.base_amount ?? 10000;
            const finalIncentive = latestIncentive?.amount
              ?? calculateFinalIncentive(0, baseIncentive, employeeMultiplier, companyMultiplier);

            return {
              id: employee._id,
              name: employee.name,
              score,
              baseIncentive,
              employeeMultiplier,
              finalIncentive,
              status: latestIncentive?.status ?? "pending",
            };
          })
        );

        setEmployeeRows(rows);
      } catch (err) {
        setError("Failed to load admin dashboard data.");
        console.error("[AdminDashboard]", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [request]);

  async function processVesting() {
    setProcessingVesting(true);
    try {
      const res = await axios.post("/api/incentives", { action: "process_vesting" });
      alert(res.data.message);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error");
    } finally {
      setProcessingVesting(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell title="Incentive Management">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !config) {
    return (
      <DashboardShell title="Incentive Management">
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-red-500">{error ?? "Unable to load dashboard"}</p>
        </div>
      </DashboardShell>
    );
  }

  const revenue = config.company_revenue;
  const expenses = Math.round((revenue * config.expense_percentage) / 100);
  const profitLoss = revenue - expenses;
  const companyScore = calculateCompanyScore(
    config.revenue_achievement_percentage,
    config.collections_percentage,
    config.delivery_health_percentage
  );
  const companyMultiplier = getCompanyMultiplier(companyScore);
  const revenueTarget = Math.round(revenue / Math.max(config.revenue_achievement_percentage / 100, 0.1));
  const healthScore = Math.round((companyScore + config.revenue_achievement_percentage + (100 - config.expense_percentage)) / 3);
  const runwayMonths = parseFloat((config.payout_pool_amount / Math.max(expenses / 12, 1)).toFixed(1));
  const monthlyTrend = [
    { month: "Jan", revenue: Math.round(revenue * 0.42), expenses: Math.round(expenses * 0.38), profit: Math.round(revenue * 0.42 - expenses * 0.38) },
    { month: "Feb", revenue: Math.round(revenue * 0.58), expenses: Math.round(expenses * 0.63), profit: Math.round(revenue * 0.58 - expenses * 0.63) },
    { month: "Mar", revenue: Math.round(revenue * 0.81), expenses: Math.round(expenses * 0.71), profit: Math.round(revenue * 0.81 - expenses * 0.71) },
    { month: "Apr", revenue, expenses, profit: profitLoss },
  ];

  const insight =
    profitLoss < revenue * 0.15
      ? "Expenses are high this month. Profit margin is below target."
      : "Revenue is outpacing expenses. Incentive pool is healthy for this cycle.";

  const statusTone =
    healthScore >= 80 ? "Healthy"
    : healthScore >= 65 ? "Watch Closely"
    : "Needs Improvement";

  return (
    <DashboardShell title="Incentive Management">
      <div className="rounded-[28px] border border-[#1d2940] bg-[radial-gradient(circle_at_top,#12233a,transparent_45%),linear-gradient(180deg,#08101d,#0d1323)] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="mb-6 border-b border-white/10 pb-4">
          <p className="text-sm text-slate-300">Admin Dashboard</p>
          <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="text-4xl font-semibold tracking-tight">Namaah Startup <span className="font-light text-slate-300">— {selectedMonth}</span></h2>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">
                <CalendarDays size={16} className="text-slate-300" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-sm outline-none"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="secondary" loading={processingVesting} onClick={processVesting} className="border border-white/10 bg-white/5 text-white hover:bg-white/10">
                Process Vesting
              </Button>
              {user?.role === "super_admin" && (
                <Link href="/admin/config">
                  <Button className="bg-blue-600 text-white hover:bg-blue-500">
                    <PenLine size={16} />
                    Edit Targets
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4 grid gap-4 xl:grid-cols-4">
          {[
            {
              label: "Revenue",
              value: formatCurrency(revenue),
              note: `Target: ${formatCurrency(revenueTarget)} (${config.revenue_achievement_percentage}%)`,
              trend: `↑ ${Math.max(config.revenue_achievement_percentage - 71, 1)}%`,
              tone: "text-emerald-300",
              iconBg: "bg-blue-500/15",
              icon: <IndianRupee size={20} className="text-blue-300" />,
            },
            {
              label: "Expenses",
              value: formatCurrency(expenses),
              note: `${config.expense_percentage}% of Revenue`,
              trend: `↑ ${Math.max(config.expense_percentage - 52, 1)}%`,
              tone: "text-rose-300",
              iconBg: "bg-amber-500/15",
              icon: <TrendingDown size={20} className="text-amber-300" />,
            },
            {
              label: "Profit / Loss",
              value: `${profitLoss < 0 ? "-" : ""}${formatCurrency(Math.abs(profitLoss))}`,
              note: `Margin: ${Math.round((profitLoss / Math.max(revenue, 1)) * 100)}%`,
              trend: profitLoss >= 0 ? "Positive" : "Negative",
              tone: profitLoss >= 0 ? "text-emerald-300" : "text-rose-300",
              iconBg: "bg-emerald-500/15",
              icon: <LineChart size={20} className="text-emerald-300" />,
            },
            {
              label: "Incentive Pool",
              value: formatCurrency(config.payout_pool_amount),
              note: "Available for Payout",
              trend: `${companyMultiplier.toFixed(1)}x`,
              tone: "text-violet-300",
              iconBg: "bg-violet-500/15",
              icon: <Gift size={20} className="text-violet-300" />,
            },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start justify-between">
                <div className={`rounded-2xl p-4 ${card.iconBg}`}>{card.icon}</div>
                <span className={`rounded-full bg-white/5 px-3 py-1 text-xs font-medium ${card.tone}`}>{card.trend}</span>
              </div>
              <p className="mt-4 text-2xl font-semibold">{card.label}</p>
              <p className={`mt-2 text-4xl font-bold ${card.tone}`}>{card.value}</p>
              <p className="mt-2 text-sm text-slate-400">{card.note}</p>
              <div className="mt-4 h-10 rounded-full bg-[linear-gradient(90deg,transparent,rgba(59,130,246,0.18),transparent)]" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_1.1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-2xl font-semibold">Company Performance Score</h3>
              <CircleAlert size={16} className="text-slate-400" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-center justify-center">
                <div
                  className="relative flex h-44 w-44 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(#22c55e 0 ${companyScore}%, rgba(255,255,255,0.08) ${companyScore}% 100%)` }}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#091321]">
                    <p className="text-5xl font-bold">{Math.round(companyScore)}%</p>
                    <p className="mt-1 text-lg text-slate-300">{companyScore >= 80 ? "Good" : companyScore >= 60 ? "Average" : "Poor"}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-lg">
                  Multiplier: <span className="text-emerald-300">{companyMultiplier.toFixed(1)}x</span>
                </div>
              </div>

              <div>
                <p className="mb-4 text-lg font-medium text-slate-200">Score Breakdown</p>
                <div className="space-y-7">
                  {[
                    { label: "Revenue Achievement", value: config.revenue_achievement_percentage },
                    { label: "Collections", value: config.collections_percentage },
                    { label: "Delivery Health", value: config.delivery_health_percentage },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-base text-slate-300">{item.label}</span>
                        <span className="text-2xl font-semibold">{item.value}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500" style={{ width: `${Math.min(item.value, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Revenue vs Expenses</h3>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Month</div>
            </div>
            <div className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="prof" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1f2b40" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#rev)" strokeWidth={3} />
                  <Area type="monotone" dataKey="expenses" stroke="#fb923c" fill="url(#exp)" strokeWidth={3} />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#prof)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="my-4 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-[linear-gradient(90deg,rgba(251,146,60,0.15),rgba(17,24,39,0.35))] px-5 py-4">
          <div>
            <p className="text-2xl font-semibold">Key Insight</p>
            <p className="mt-1 text-lg text-slate-300">{insight}</p>
          </div>
          <Button variant="secondary" className="border border-white/10 bg-white/5 text-white hover:bg-white/10">
            View Details
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Employee Incentive Summary <span className="font-normal text-slate-300">({selectedMonth})</span></h3>
              <Link href="/admin/users">
                <Button variant="secondary" className="border border-white/10 bg-white/5 text-white hover:bg-white/10">
                  View All Employees
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Base Incentive</th>
                    <th className="pb-3">Multiplier</th>
                    <th className="pb-3">Final Incentive</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeRows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5">
                      <td className="py-4 text-base font-medium">{row.name}</td>
                      <td className="py-4">{Math.round(row.score)}%</td>
                      <td className="py-4">{formatCurrency(row.baseIncentive)}</td>
                      <td className="py-4">{row.employeeMultiplier.toFixed(1)} x {companyMultiplier.toFixed(1)}</td>
                      <td className="py-4 text-lg font-semibold">{formatCurrency(row.finalIncentive)}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          row.status === "paid"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : row.status === "approved"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-2xl font-semibold">Company Health</h3>
              <CircleAlert size={16} className="text-slate-400" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-center justify-center">
                <div
                  className="relative flex h-44 w-44 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(#22c55e 0 24%, #f59e0b 24% 72%, #ef4444 72% ${healthScore}%, rgba(255,255,255,0.08) ${healthScore}% 100%)` }}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#091321]">
                    <p className="text-5xl font-bold">{healthScore}%</p>
                  </div>
                </div>
                <div className="mt-5 rounded-full border border-amber-400/20 bg-amber-500/10 px-5 py-2 text-lg text-amber-200">
                  {statusTone}
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Runway", value: `${runwayMonths} months` },
                  { label: "Expense Ratio", value: `${config.expense_percentage}%` },
                  { label: "Target Achievement", value: `${config.revenue_achievement_percentage}%` },
                  { label: "Approved Claims", value: formatCurrency(approvedClaimsAmount) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                    <span className="text-lg text-slate-300">{item.label}</span>
                    <span className="text-xl font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-300 lg:flex-row lg:items-center lg:justify-between">
          <p>
            Incentive payout for {selectedMonth.split(" ")[0]} will be processed based on Company Score ({Math.round(companyScore)}%) and Employee Performance.
          </p>
          <p className="text-slate-400">Last updated: 01 Apr 2026, 09:30 AM</p>
        </div>
      </div>
    </DashboardShell>
  );
}
