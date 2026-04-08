"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { IndianRupee, Download, Play, CheckCircle2, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS = [2026, 2025];

const PAYROLL_DATA = [
  { id: 1, emp: "Rahul Mehta",    empId: "NP001", dept: "Engineering", base: 85000, incentive: 12400, deductions: 8500,  gross: 97400, net: 88900, status: "processed" },
  { id: 2, emp: "Sneha Patel",    empId: "NP002", dept: "Engineering", base: 72000, incentive: 9800,  deductions: 7200,  gross: 81800, net: 74600, status: "processed" },
  { id: 3, emp: "Amit Verma",     empId: "NP003", dept: "Sales",       base: 65000, incentive: 18500, deductions: 6500,  gross: 83500, net: 77000, status: "processed" },
  { id: 4, emp: "Priya Sharma",   empId: "NP004", dept: "Product",     base: 78000, incentive: 11200, deductions: 7800,  gross: 89200, net: 81400, status: "processed" },
  { id: 5, emp: "Deepa Nair",     empId: "NP005", dept: "Sales",       base: 62000, incentive: 15600, deductions: 6200,  gross: 77600, net: 71400, status: "draft" },
  { id: 6, emp: "Arjun Singh",    empId: "NP006", dept: "Engineering", base: 90000, incentive: 13500, deductions: 9000,  gross: 103500, net: 94500, status: "draft" },
  { id: 7, emp: "Neha Kapoor",    empId: "NP007", dept: "Marketing",   base: 58000, incentive: 7200,  deductions: 5800,  gross: 65200, net: 59400, status: "draft" },
  { id: 8, emp: "Vikram Joshi",   empId: "NP008", dept: "Operations",  base: 55000, incentive: 6800,  deductions: 5500,  gross: 61800, net: 56300, status: "draft" },
  { id: 9, emp: "Kiran Reddy",    empId: "NP009", dept: "Operations",  base: 60000, incentive: 8400,  deductions: 6000,  gross: 68400, net: 62400, status: "paid" },
  { id: 10, emp: "Pooja Sharma",  empId: "NP010", dept: "People",      base: 68000, incentive: 9600,  deductions: 6800,  gross: 77600, net: 70800, status: "paid" },
];

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-[hsl(var(--warning-bg))] text-amber-600 dark:text-amber-400",
  processed: "bg-[hsl(var(--info-bg))] text-sky-600 dark:text-sky-400",
  paid:      "bg-[hsl(var(--success-bg))] text-emerald-600 dark:text-emerald-400",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: Clock,
  processed: CheckCircle2,
  paid: CheckCircle2,
};

export default function PayrollPage() {
  const [month, setMonth] = useState(3);
  const [year, setYear] = useState(2026);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? PAYROLL_DATA : PAYROLL_DATA.filter((r) => r.status === filter);

  const totalGross = filtered.reduce((s, r) => s + r.gross, 0);
  const totalNet   = filtered.reduce((s, r) => s + r.net, 0);
  const totalDeductions = filtered.reduce((s, r) => s + r.deductions, 0);

  return (
    <DashboardShell
      title="Payroll"
      subtitle="Manage monthly payroll for all employees"
      actions={
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="field text-xs py-1.5 px-3 w-32"
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="field text-xs py-1.5 px-3 w-24"
          >
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
          <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
            <Play size={12} /> Run Payroll
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-default bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[hsl(var(--surface-raised))] transition-colors">
            <Download size={12} /> Export
          </button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Gross",      value: `₹${(totalGross/100000).toFixed(2)}L`, color: "text-sky-600" },
          { label: "Total Net Pay",    value: `₹${(totalNet/100000).toFixed(2)}L`,   color: "text-emerald-600" },
          { label: "Total Deductions", value: `₹${(totalDeductions/1000).toFixed(0)}K`, color: "text-red-500" },
          { label: "Employees",        value: filtered.length,                        color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="page-card">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 border-b border-default pb-3">
          {["all", "draft", "processed", "paid"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === s ? "bg-sky-600 text-white" : "text-muted hover:text-foreground hover:bg-[hsl(var(--surface-raised))]"
              }`}
            >
              {s === "all" ? "All Employees" : s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Base Salary</th>
                <th>Incentives</th>
                <th>Deductions</th>
                <th>Gross Pay</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const Icon = STATUS_ICONS[row.status];
                return (
                  <tr key={row.id}>
                    <td>
                      <div>
                        <p className="font-medium text-foreground text-sm">{row.emp}</p>
                        <p className="text-xs text-muted">{row.empId}</p>
                      </div>
                    </td>
                    <td className="text-muted text-sm">{row.dept}</td>
                    <td className="font-medium">₹{row.base.toLocaleString()}</td>
                    <td className="text-emerald-600 font-medium">+₹{row.incentive.toLocaleString()}</td>
                    <td className="text-red-500 font-medium">-₹{row.deductions.toLocaleString()}</td>
                    <td className="font-semibold">₹{row.gross.toLocaleString()}</td>
                    <td className="font-bold text-sky-600">₹{row.net.toLocaleString()}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${STATUS_STYLES[row.status]}`}>
                        <Icon size={10} />
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="rounded-md px-2.5 py-1 text-[11px] font-medium border border-default text-muted hover:text-foreground hover:bg-[hsl(var(--surface-raised))] transition-colors">
                          Payslip
                        </button>
                        {row.status === "processed" && (
                          <button className="rounded-md px-2.5 py-1 text-[11px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
