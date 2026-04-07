"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/layout/AuthProvider";
import { getYearRange } from "@/lib/utils";
import {
  calculateBehavioralScore,
  calculateFinalKpiScore,
  calculateKraScore,
  calculateWeightedKpi,
  getKpiRating,
  type BehavioralMetricsInput,
  type KpiEntryInput,
  type KraMetricsInput,
} from "@/lib/kpiMath";

interface User {
  _id: string;
  name: string;
  employeeId: string;
  department: string;
}

interface KpiScore {
  _id: string;
  month: number;
  year: number;
  kpi_score: number;
  kra_score: number;
  behavioral_score?: number;
  final_score: number;
  remarks?: string;
  rating_label?: string;
  incentive_hint?: string;
  kpi_entries?: KpiEntryInput[];
  kra_metrics?: KraMetricsInput;
  behavioral_metrics?: BehavioralMetricsInput;
  enteredBy?: { name: string };
}

interface FormState {
  month: number;
  year: number;
  kpiEntries: KpiEntryInput[];
  kraMetrics: KraMetricsInput;
  behavioralMetrics: BehavioralMetricsInput;
  remarks: string;
}

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i).toLocaleString("en-IN", { month: "long" }),
}));

const ratingOptions = [1, 2, 3, 4, 5];
const attendanceOptions = Array.from({ length: 21 }, (_, i) => i * 5);

function createDefaultForm(month: number, year: number): FormState {
  return {
    month,
    year,
    kpiEntries: [
      { label: "KPI 1", weight: 30, score: 0 },
      { label: "KPI 2", weight: 30, score: 0 },
      { label: "KPI 3 (Optional)", weight: 40, score: 0 },
    ],
    kraMetrics: {
      ownership: 0,
      quality: 0,
      initiative: 0,
    },
    behavioralMetrics: {
      attendance: 0,
      discipline: 0,
      communication: 0,
    },
    remarks: "",
  };
}

function createFormFromScore(score: KpiScore): FormState {
  return {
    month: score.month,
    year: score.year,
    kpiEntries: score.kpi_entries?.length
      ? score.kpi_entries
      : [
          { label: "KPI 1", weight: 30, score: score.kpi_score ?? 0 },
          { label: "KPI 2", weight: 30, score: score.kpi_score ?? 0 },
          { label: "KPI 3 (Optional)", weight: 40, score: score.kpi_score ?? 0 },
        ],
    kraMetrics: score.kra_metrics ?? {
      ownership: Math.round((score.kra_score ?? 0) / 20),
      quality: Math.round((score.kra_score ?? 0) / 20),
      initiative: Math.round((score.kra_score ?? 0) / 20),
    },
    behavioralMetrics: score.behavioral_metrics ?? {
      attendance: score.behavioral_score ?? 0,
      discipline: 0,
      communication: 0,
    },
    remarks: score.remarks ?? "",
  };
}

function ProgressBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="h-4 rounded-full bg-white/10">
      <div
        className={`h-4 rounded-full ${colorClass}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default function AdminKpiPage() {
  const { user } = useAuth();
  const today = new Date();
  const [users, setUsers] = useState<User[]>([]);
  const [scores, setScores] = useState<KpiScore[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(createDefaultForm(today.getMonth() + 1, today.getFullYear()));

  const canEdit = user?.role === "super_admin" || user?.role === "lead";

  useEffect(() => {
    setLoadingUsers(true);
    axios
      .get("/api/users?role=employee&limit=100")
      .then((res) => setUsers(res.data.users ?? []))
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setScores([]);
      return;
    }

    setLoadingScores(true);
    axios
      .get(`/api/kpi?employeeId=${selectedUser}`)
      .then((res) => setScores(res.data.scores ?? []))
      .finally(() => setLoadingScores(false));
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const existingScore = scores.find((score) => score.month === form.month && score.year === form.year);
    if (!existingScore) return;

    const nextForm = createFormFromScore(existingScore);
    const currentState = JSON.stringify(form);
    const nextState = JSON.stringify(nextForm);
    if (currentState !== nextState) {
      setForm(nextForm);
    }
  }, [selectedUser, scores, form]);

  const kpiScore = useMemo(() => calculateWeightedKpi(form.kpiEntries), [form.kpiEntries]);
  const kraScore = useMemo(() => calculateKraScore(form.kraMetrics), [form.kraMetrics]);
  const behavioralScore = useMemo(
    () => calculateBehavioralScore(form.behavioralMetrics),
    [form.behavioralMetrics]
  );
  const finalScore = useMemo(
    () => calculateFinalKpiScore(kpiScore, kraScore, behavioralScore),
    [kpiScore, kraScore, behavioralScore]
  );
  const rating = useMemo(() => getKpiRating(finalScore), [finalScore]);
  const selectedEmployee = users.find((employee) => employee._id === selectedUser);
  const currentRecord = scores.find((score) => score.month === form.month && score.year === form.year);

  function updateKpiEntry(index: number, field: "weight" | "score", value: number) {
    setForm((current) => ({
      ...current,
      kpiEntries: current.kpiEntries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      ),
    }));
  }

  function updateKraMetric(field: keyof KraMetricsInput, value: number) {
    setForm((current) => ({
      ...current,
      kraMetrics: {
        ...current.kraMetrics,
        [field]: value,
      },
    }));
  }

  function updateBehaviorMetric(field: keyof BehavioralMetricsInput, value: number) {
    setForm((current) => ({
      ...current,
      behavioralMetrics: {
        ...current.behavioralMetrics,
        [field]: value,
      },
    }));
  }

  function resetForPeriod(month: number, year: number) {
    const existingScore = scores.find((score) => score.month === month && score.year === year);
    setForm(existingScore ? createFormFromScore(existingScore) : createDefaultForm(month, year));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) {
      alert("Select an employee");
      return;
    }
    if (!canEdit) {
      alert("Only admin and lead can edit KPI / KRA entries.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/api/kpi", {
        employee: selectedUser,
        month: form.month,
        year: form.year,
        kpi_entries: form.kpiEntries,
        kra_metrics: form.kraMetrics,
        behavioral_metrics: form.behavioralMetrics,
        remarks: form.remarks,
      });

      const res = await axios.get(`/api/kpi?employeeId=${selectedUser}`);
      setScores(res.data.scores ?? []);
      alert("KPI / KRA score saved");
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell title="KPI / KRA Entry">
      <div className="rounded-[28px] border border-[#1d2940] bg-[radial-gradient(circle_at_top,#16263a,transparent_45%),linear-gradient(180deg,#111827,#1c2433)] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="mb-8 border-b border-white/10 pb-5">
          <h1 className="text-4xl font-semibold tracking-tight">KPI / KRA Entry</h1>
        </div>

        {!canEdit && (
          <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            This page is read-only for your role. Only admin and lead can update KPI / KRA entries.
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-3xl font-semibold">Enter Scores</h2>

          <div className="mt-8">
            <label className="mb-2 block text-sm text-slate-300">Employee</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setForm(createDefaultForm(form.month, form.year));
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xl text-white outline-none"
              required
            >
              <option value="" className="bg-slate-900">-- Select Employee --</option>
              {users.map((employee) => (
                <option key={employee._id} value={employee._id} className="bg-slate-900">
                  {employee.name} ({employee.employeeId}) — {employee.department}
                </option>
              ))}
            </select>
            {loadingUsers && <p className="mt-2 text-sm text-slate-400">Loading employees...</p>}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Month</label>
              <select
                value={form.month}
                onChange={(e) => {
                  const nextMonth = parseInt(e.target.value, 10);
                  resetForPeriod(nextMonth, form.year);
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xl text-white outline-none"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value} className="bg-slate-900">
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Year</label>
              <select
                value={form.year}
                onChange={(e) => {
                  const nextYear = parseInt(e.target.value, 10);
                  resetForPeriod(form.month, nextYear);
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xl text-white outline-none"
              >
                {getYearRange().map((year) => (
                  <option key={year} value={year} className="bg-slate-900">
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentRecord && (
            <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
              Editing existing entry for {monthOptions.find((month) => month.value === form.month)?.label} {form.year}
              {currentRecord.enteredBy?.name ? ` · last saved by ${currentRecord.enteredBy.name}` : ""}
            </div>
          )}

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between text-2xl">
              <span>KPI Score ({String(Math.round(kpiScore)).padStart(2, "0")}%)</span>
              <span className="font-semibold text-sky-300">{Math.round(kpiScore)}</span>
            </div>
            <ProgressBar value={kpiScore} colorClass="bg-sky-400" />

            <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              {form.kpiEntries.map((entry, index) => (
                <div key={entry.label} className="grid gap-3 border-b border-white/10 pb-4 last:border-b-0 last:pb-0 md:grid-cols-[1.2fr_220px_1fr_90px] md:items-center">
                  <span className="text-2xl text-slate-100">{entry.label}</span>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <span className="text-slate-400">Weight:</span>
                    <select
                      value={entry.weight}
                      onChange={(e) => updateKpiEntry(index, "weight", parseInt(e.target.value, 10))}
                      className="w-full bg-transparent text-xl text-white outline-none"
                      disabled={!canEdit}
                    >
                      {[10, 20, 25, 30, 35, 40, 50, 60].map((weight) => (
                        <option key={weight} value={weight} className="bg-slate-900">
                          {weight}%
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={entry.score}
                    onChange={(e) => updateKpiEntry(index, "score", parseInt(e.target.value, 10))}
                    className="w-full accent-sky-400"
                    disabled={!canEdit}
                  />
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xl">
                    <span>{entry.score}</span>
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between text-2xl">
                <span>KPI Score (auto)</span>
                <span className="font-semibold">{Math.round(kpiScore)} %</span>
              </div>
              <ProgressBar value={kpiScore} colorClass="bg-sky-400" />
            </div>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_0.95fr]">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-semibold">KRA Score (Quality of Work) (40%)</h3>
                <span className="text-lg text-slate-300">100%</span>
              </div>

              <div className="space-y-4">
                {[
                  { key: "ownership" as const, label: "Ownership (1–5)" },
                  { key: "quality" as const, label: "Quality (1–5)" },
                  { key: "initiative" as const, label: "Initiative (1–5)" },
                ].map((metric) => (
                  <div key={metric.key} className="grid gap-4 md:grid-cols-[1fr_260px] md:items-center">
                    <label className="text-2xl text-slate-100">{metric.label}</label>
                    <select
                      value={form.kraMetrics[metric.key]}
                      onChange={(e) => updateKraMetric(metric.key, parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xl text-white outline-none"
                      disabled={!canEdit}
                    >
                      <option value={0} className="bg-slate-900">-- Select Rating --</option>
                      {ratingOptions.map((ratingValue) => (
                        <option key={ratingValue} value={ratingValue} className="bg-slate-900">
                          {ratingValue}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between text-2xl">
                  <span>KRA Score (auto)</span>
                  <span className="font-semibold">{Math.round(kraScore)} %</span>
                </div>
                <ProgressBar value={kraScore} colorClass="bg-cyan-400" />
              </div>

              <div className="mt-8 mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-semibold">Behavioral / Compliance Score (20%)</h3>
                <span className="text-lg text-slate-300">100%</span>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[1fr_260px] md:items-center">
                  <label className="text-2xl text-slate-100">Attendance (%)</label>
                  <select
                    value={form.behavioralMetrics.attendance}
                    onChange={(e) => updateBehaviorMetric("attendance", parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xl text-white outline-none"
                    disabled={!canEdit}
                  >
                    {attendanceOptions.map((attendance) => (
                      <option key={attendance} value={attendance} className="bg-slate-900">
                        {attendance}%
                      </option>
                    ))}
                  </select>
                </div>

                {[
                  { key: "discipline" as const, label: "Discipline (1–5)" },
                  { key: "communication" as const, label: "Communication (1–5)" },
                ].map((metric) => (
                  <div key={metric.key} className="grid gap-4 md:grid-cols-[1fr_260px] md:items-center">
                    <label className="text-2xl text-slate-100">{metric.label}</label>
                    <select
                      value={form.behavioralMetrics[metric.key]}
                      onChange={(e) => updateBehaviorMetric(metric.key, parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xl text-white outline-none"
                      disabled={!canEdit}
                    >
                      <option value={0} className="bg-slate-900">-- Select Rating --</option>
                      {ratingOptions.map((ratingValue) => (
                        <option key={ratingValue} value={ratingValue} className="bg-slate-900">
                          {ratingValue}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="mb-3 flex items-center justify-between text-2xl">
                  <span>Behavioral Score (auto)</span>
                  <span className="font-semibold">{Math.round(behavioralScore)} %</span>
                </div>
                <ProgressBar value={behavioralScore} colorClass="bg-emerald-400" />
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-2xl text-slate-100">Remarks (optional)</label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm((current) => ({ ...current, remarks: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xl text-white outline-none"
                  placeholder="Any comments..."
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div>
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(59,130,246,0.18),rgba(15,23,42,0.18))] p-5">
                <div className="flex flex-wrap items-center gap-3 text-3xl font-semibold">
                  <span>Final Score</span>
                  <span className="text-lg font-normal text-slate-300">(KPI×40%) + (KRA×40%) + (Behavioral×20%)</span>
                  <span className="ml-auto text-4xl font-bold text-sky-300">{Math.round(finalScore)}/100</span>
                </div>
                <div className="mt-5 grid gap-3 text-lg text-slate-200 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-slate-400">KPI Score</p>
                    <p className="mt-1 text-3xl font-semibold">{Math.round(kpiScore)}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-slate-400">KRA Score</p>
                    <p className="mt-1 text-3xl font-semibold">{Math.round(kraScore)}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-slate-400">Behavioral Score</p>
                    <p className="mt-1 text-3xl font-semibold">{Math.round(behavioralScore)}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-slate-400">Rating</p>
                    <p className="mt-1 text-3xl font-semibold">{rating.label}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 border-b border-white/10 pb-3 text-lg text-slate-300">
                  <span>Score Range</span>
                  <span>Rating</span>
                  <span>Incentive</span>
                </div>
                {[
                  ["90–100", "Outstanding", "100% × incentive"],
                  ["75–89", "Exceeds", "80–90% × incentive"],
                  ["60–74", "Meets", "60–70% × incentive"],
                  ["40–59", "Needs Improvement", "30–50% × incentive"],
                  ["Below 40", "Poor", "0%"],
                ].map(([range, label, incentive]) => (
                  <div key={range} className="grid grid-cols-[1fr_1fr_1fr] gap-4 border-b border-white/10 py-3 text-lg last:border-b-0">
                    <span>{range}</span>
                    <span>{label}</span>
                    <span>{incentive}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-2xl font-semibold">Recent Entries</h3>
                {!selectedUser ? (
                  <p className="mt-4 text-slate-400">Select an employee to view score history.</p>
                ) : loadingScores ? (
                  <p className="mt-4 text-slate-400">Loading scores...</p>
                ) : scores.length === 0 ? (
                  <p className="mt-4 text-slate-400">No scores saved yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {scores.slice(0, 4).map((score) => (
                      <button
                        key={score._id}
                        type="button"
                        onClick={() => setForm(createFormFromScore(score))}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium">
                            {new Date(score.year, score.month - 1).toLocaleString("en-IN", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-xl font-semibold text-sky-300">{score.final_score}/100</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          KPI {score.kpi_score} · KRA {score.kra_score} · Behavioral {score.behavioral_score ?? 0}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            loading={submitting}
            disabled={!canEdit}
            className="mt-8 w-full bg-sky-600 py-4 text-xl text-white hover:bg-sky-500"
          >
            Save Score
          </Button>
        </form>

        {selectedEmployee && (
          <div className="mt-5 text-sm text-slate-400">
            Working on: {selectedEmployee.name} ({selectedEmployee.employeeId}) · {selectedEmployee.department}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
