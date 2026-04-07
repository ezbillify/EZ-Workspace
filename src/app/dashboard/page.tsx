"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuth } from "@/components/layout/AuthProvider";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { calculateCompanyScore, getCompanyMultiplier, getEmployeeMultiplier } from "@/lib/incentiveMath";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  CalendarDays,
  CircleAlert,
  Gauge,
  IndianRupee,
  Award,
  TrendingUp,
  Building2,
  Clock3,
} from "lucide-react";

interface WalletData {
  wallet: {
    earned_total: number;
    locked_amount: number;
    claimable_amount: number;
    held_amount: number;
    claimed_amount: number;
  };
}

interface IncentiveData {
  incentives: Array<{
    _id: string;
    amount: number;
    base_amount: number;
    fixed_amount?: number;
    variable_amount?: number;
    employee_multiplier?: number;
    company_multiplier?: number;
    company_score?: number;
    status: string;
    month: number;
    year: number;
  }>;
  summary: {
    total_earned: number;
    locked: number;
    claimable: number;
    held: number;
    claimed: number;
  };
}

interface ConfigData {
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
  payout_capacity: "HIGH" | "MODERATE" | "LOW";
}

interface KpiData {
  scores: Array<{
    month: number;
    year: number;
    kpi_score: number;
    kra_score: number;
    final_score: number;
  }>;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { request } = useApi();
  const [wallet, setWallet] = useState<WalletData["wallet"] | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [kpi, setKpi] = useState<KpiData["scores"]>([]);
  const [incentiveData, setIncentiveData] = useState<IncentiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const [walletRes, configRes, kpiRes, incentiveRes] = await Promise.all([
          request<WalletData>({ url: "/api/wallet" }),
          request<ConfigData>({ url: "/api/config" }),
          request<KpiData>({ url: "/api/kpi" }),
          request<IncentiveData>({ url: "/api/incentives" }),
        ]);

        setWallet(walletRes.wallet);
        setConfig(configRes);
        setKpi(kpiRes.scores ?? []);
        setIncentiveData(incentiveRes);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, request]);

  if (loading) {
    return (
      <DashboardShell title="Incentive Management">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  const latestKpi = kpi[0];
  const latestIncentive = incentiveData?.incentives?.[0];
  const employeeScore = latestKpi?.final_score ?? 80;
  const companyScore = config
    ? calculateCompanyScore(
        config.revenue_achievement_percentage,
        config.collections_percentage,
        config.delivery_health_percentage
      )
    : 72;
  const employeeMultiplier = latestIncentive?.employee_multiplier ?? getEmployeeMultiplier(employeeScore);
  const companyMultiplier = latestIncentive?.company_multiplier ?? getCompanyMultiplier(companyScore);
  const totalMultiplier = parseFloat((employeeMultiplier * companyMultiplier).toFixed(2));
  const baseIncentive = latestIncentive?.base_amount ?? Math.max(wallet?.claimable_amount ?? 0, 10000);
  const finalIncentive = latestIncentive?.amount ?? Math.round(baseIncentive * totalMultiplier);
  const pendingPayment = (wallet?.claimable_amount ?? 0) + (wallet?.held_amount ?? 0);
  const expectedPayout = finalIncentive;
  const expenses = Math.round(((config?.company_revenue ?? 0) * (config?.expense_percentage ?? 0)) / 100);
  const runwayMonths = parseFloat((((config?.payout_pool_amount ?? 0) / Math.max(expenses / 12, 1))).toFixed(1));
  const scoreTag =
    employeeScore >= 85 ? "Strong Performance"
    : employeeScore >= 70 ? "On Track"
    : "Needs Focus";
  const companyTag =
    companyScore >= 85 ? "Excellent"
    : companyScore >= 75 ? "Good"
    : companyScore >= 60 ? "Needs Improvement"
    : "At Risk";
  const keyInsight =
    companyScore < 80
      ? "Expenses are high this month due to below target company performance."
      : "Company performance is stable this month and incentive outlook remains healthy.";
  const topPerformerBonus = employeeScore >= 80 ? Math.round(baseIncentive * 0.2) : 0;
  const payoutDate = latestKpi
    ? new Date(latestKpi.year, latestKpi.month, 11).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "11 May 2026";
  const periodLabel = latestKpi
    ? new Date(latestKpi.year, latestKpi.month - 1).toLocaleString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "April 2026";

  const trendData = (kpi.slice(0, 4).reverse().length > 0
    ? kpi.slice(0, 4).reverse()
    : [{ month: 1, year: 2026, final_score: employeeScore }]).map((item, index) => ({
    label: new Date(item.year, item.month - 1).toLocaleString("en-IN", { month: "short" }),
    yourScore: item.final_score,
    target: Math.max(Math.round(companyScore + (index - 1)), 60),
  }));

  return (
    <DashboardShell title="Incentive Management">
      <div className="rounded-[28px] border border-[#1d2940] bg-[radial-gradient(circle_at_top,#12233a,transparent_45%),linear-gradient(180deg,#08101d,#0d1323)] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="mb-6 border-b border-white/10 pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm text-slate-300">Employee Dashboard</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight">Your Dashboard <span className="font-light text-slate-300">— {periodLabel}</span></h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                <CalendarDays size={16} className="text-slate-400" />
                {periodLabel}
              </div>
              <Link href="/dashboard/performance">
                <Button variant="secondary" className="border border-white/10 bg-white/5 text-white hover:bg-white/10">
                  Performance Detail
                </Button>
              </Link>
              <Link href="/dashboard/incentives">
                <Button className="bg-blue-600 text-white hover:bg-blue-500">
                  My Incentives
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(15,23,42,0.3))] p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div>
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-blue-500/20 p-4">
                    <Award size={24} className="text-blue-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{user?.name}</p>
                    <p className="mt-1 text-6xl font-bold">{Math.round(employeeScore)}%</p>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-medium">Your Score</p>
                <span className="mt-3 inline-flex rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200">
                  {scoreTag}
                </span>
                <p className="mt-5 text-lg text-slate-300">
                  {employeeScore >= 80 ? "You exceeded your targets." : "You are progressing toward your targets."}
                </p>
                <Link href="/dashboard/performance">
                  <Button className="mt-6 bg-white/10 text-white hover:bg-white/15">
                    View Details
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center">
                <div
                  className="relative flex h-56 w-56 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(#4ade80 0 ${employeeScore}%, rgba(255,255,255,0.08) ${employeeScore}% 100%)` }}
                >
                  <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-[#091321] text-center">
                    <p className="text-5xl font-bold">{Math.round(employeeScore)}%</p>
                    <p className="mt-1 text-2xl text-slate-300">Your Score</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(251,146,60,0.15),rgba(15,23,42,0.28))] p-5">
            <div className="mb-5 flex items-center gap-2">
              <h3 className="text-2xl font-semibold">Company Score</h3>
              <CircleAlert size={16} className="text-slate-400" />
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-amber-500/20 p-4">
                <Building2 size={24} className="text-amber-300" />
              </div>
              <div>
                <p className="text-5xl font-bold text-amber-200">{Math.round(companyScore)}%</p>
                <p className="mt-1 text-2xl text-amber-100">{companyTag}</p>
              </div>
            </div>
            <p className="mt-6 text-2xl text-slate-200">Potential Incentive Multiplier: <span className="font-semibold text-white">{companyMultiplier.toFixed(1)}x</span></p>
            <p className="mt-5 text-lg text-slate-300">
              {companyScore < 80 ? "Company performance was below target this month." : "Company performance stayed close to target this month."}
            </p>
            <Link href="/dashboard/priority" className="mt-5 inline-block text-lg text-sky-300 hover:text-sky-200">
              How Is This Calculated?
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="mb-5 text-2xl font-semibold">Company Health</h3>
            <div className="space-y-5">
              {[
                { label: "Revenue Achievement", value: `${config?.revenue_achievement_percentage ?? 72}%`, icon: <TrendingUp size={18} className="text-emerald-300" /> },
                { label: "Expense Ratio", value: `${config?.expense_percentage ?? 72}%`, icon: <Gauge size={18} className="text-amber-300" /> },
                { label: "Runway", value: `${runwayMonths} months`, icon: <Clock3 size={18} className="text-slate-300" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-b-0">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-lg text-slate-200">{item.label}</span>
                  </div>
                  <span className="text-2xl font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-400">
              <div>
                <p>Current Payout</p>
                <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(pendingPayment)}</p>
              </div>
              <div>
                <p>Expected Payout</p>
                <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(expectedPayout)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="my-4 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-[linear-gradient(90deg,rgba(251,191,36,0.14),rgba(17,24,39,0.35))] px-5 py-4">
          <div>
            <p className="text-2xl font-semibold">Key Insight</p>
            <p className="mt-1 text-lg text-slate-300">{keyInsight}</p>
          </div>
          <Link href="/dashboard/incentives">
            <Button variant="secondary" className="border border-white/10 bg-white/5 text-white hover:bg-white/10">
              View Details
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="mb-4 text-3xl font-semibold">Your Performance vs. Target</h3>
            <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-semibold">Your Bonuses</p>
                <p className="mt-4 text-sm text-slate-400">Pending Payment</p>
                <p className="mt-2 text-6xl font-bold">{formatCurrency(finalIncentive)}</p>
                <p className="mt-1 text-lg text-slate-400">Reward Payment</p>
                <div className="mt-6 space-y-4 border-t border-white/10 pt-5 text-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Employee Score</span>
                    <span>{employeeMultiplier.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Company Score</span>
                    <span>{companyMultiplier.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4 text-2xl font-semibold">
                    <span>Total Multiplier</span>
                    <span>{totalMultiplier.toFixed(1)}x</span>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-base text-slate-300">
                  Base Incentive: {formatCurrency(baseIncentive)} × {totalMultiplier.toFixed(1)}
                </div>
                <Link href="/dashboard/incentives">
                  <Button className="mt-5 bg-blue-600 text-white hover:bg-blue-500">
                    View Breakdown
                  </Button>
                </Link>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-semibold">Company Health</p>
                <div className="mt-4 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="yourScoreFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#67e8f9" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1f2b40" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[60, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}
                      />
                      <Area type="monotone" dataKey="yourScore" stroke="#67e8f9" fill="url(#yourScoreFill)" strokeWidth={3} />
                      <Area type="monotone" dataKey="target" stroke="#60a5fa" fillOpacity={0} strokeWidth={2} strokeDasharray="6 6" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="mb-4 text-3xl font-semibold">Your Performance vs. Target</h3>
              <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
                <div className="flex flex-col items-center justify-center">
                  <div
                    className="relative flex h-48 w-48 items-center justify-center rounded-full"
                    style={{ background: `conic-gradient(#4ade80 0 ${companyScore}%, #fb923c ${companyScore}% 100%)` }}
                  >
                    <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-[#091321]">
                      <p className="text-5xl font-bold">{Math.round(companyScore)}%</p>
                    </div>
                  </div>
                  <span className="mt-4 rounded-full bg-amber-500/15 px-4 py-2 text-base text-amber-200">{companyTag}</span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Revenue", value: `${config?.revenue_achievement_percentage ?? 72}%` },
                    { label: "Expense Ratio", value: `${config?.expense_percentage ?? 72}%` },
                    { label: "Runway", value: `${runwayMonths} months` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-lg">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-slate-300">
                    Reminder: incentive multiplier is based on company and employee performance.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(251,146,60,0.12),rgba(15,23,42,0.28))] p-5">
                <p className="text-2xl font-semibold">Your Bonuses</p>
                <p className="mt-5 text-5xl font-bold">{formatCurrency(finalIncentive)}</p>
                <p className="mt-2 text-lg text-slate-300">Pending Payment</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(74,222,128,0.12),rgba(15,23,42,0.28))] p-5">
                <p className="text-2xl font-semibold">Top Performer Bonus</p>
                <p className="mt-5 text-5xl font-bold">{formatCurrency(topPerformerBonus)}</p>
                <p className="mt-2 text-lg text-slate-300">
                  {topPerformerBonus > 0
                    ? "Awarded for strong individual performance this month."
                    : "Unlock this by moving into the top performance band."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-300 lg:flex-row lg:items-center lg:justify-between">
          <p>
            Your incentive multiplier is {companyScore < 80 ? "lower" : "stable"} this month due to {companyScore < 80 ? "below target company performance" : "current company performance"}.
          </p>
          <p className="text-slate-400">Incentives will be processed on {payoutDate}</p>
        </div>
      </div>
    </DashboardShell>
  );
}
