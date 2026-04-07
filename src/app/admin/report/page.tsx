"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuth } from "@/components/layout/AuthProvider";
import { Printer, CheckCircle, XCircle, Shield, Users, User } from "lucide-react";

const check = <CheckCircle size={16} className="inline text-emerald-500" />;
const cross = <XCircle size={16} className="inline text-red-400" />;

const sections = [
  {
    title: "Authentication & Access",
    features: [
      { name: "Login with email & password", employee: true, hr: true, superAdmin: true },
      { name: "JWT-based secure session", employee: true, hr: true, superAdmin: true },
      { name: "Auto logout on token expiry", employee: true, hr: true, superAdmin: true },
      { name: "Dark / Light mode toggle", employee: true, hr: true, superAdmin: true },
    ],
  },
  {
    title: "Employee Management",
    features: [
      { name: "View own profile", employee: true, hr: false, superAdmin: false },
      { name: "View all employees (with search & filter)", employee: false, hr: true, superAdmin: true },
      { name: "Add new employee", employee: false, hr: true, superAdmin: true },
      { name: "Edit employee details (department, designation)", employee: false, hr: true, superAdmin: true },
      { name: "Activate / Deactivate employee account", employee: false, hr: true, superAdmin: true },
      { name: "Assign roles (Employee / HR)", employee: false, hr: true, superAdmin: true },
      { name: "Assign Super Admin role", employee: false, hr: false, superAdmin: true },
    ],
  },
  {
    title: "Attendance",
    features: [
      { name: "View own monthly attendance (from Google Sheets)", employee: true, hr: false, superAdmin: false },
      { name: "View attendance by month / year filter", employee: true, hr: false, superAdmin: false },
      { name: "View attendance of any employee", employee: false, hr: true, superAdmin: true },
      { name: "Attendance summary (Present / Absent / PTO / Holiday)", employee: true, hr: true, superAdmin: true },
      { name: "6-month attendance bar chart", employee: true, hr: true, superAdmin: true },
    ],
  },
  {
    title: "KPI / KRA Performance",
    features: [
      { name: "View own KPI & KRA scores", employee: true, hr: false, superAdmin: false },
      { name: "View score trend chart (line graph)", employee: true, hr: false, superAdmin: false },
      { name: "View score formula (KPI×50% + KRA×50%)", employee: true, hr: true, superAdmin: true },
      { name: "Enter KPI & KRA scores for employees", employee: false, hr: true, superAdmin: true },
      { name: "Add monthly remarks", employee: false, hr: true, superAdmin: true },
      { name: "View score history of any employee", employee: false, hr: true, superAdmin: true },
    ],
  },
  {
    title: "Incentive Wallet",
    features: [
      { name: "View own incentive wallet (Earned / Locked / Claimable / Held / Claimed)", employee: true, hr: false, superAdmin: false },
      { name: "View full transaction history", employee: true, hr: false, superAdmin: false },
      { name: "Claim vested incentive", employee: true, hr: false, superAdmin: false },
      { name: "Hold incentive for bonus (1 or 2 months)", employee: true, hr: false, superAdmin: false },
      { name: "See projected payout with hold bonus calculator", employee: true, hr: false, superAdmin: false },
      { name: "Award incentive to an employee", employee: false, hr: true, superAdmin: true },
      { name: "View wallet of any employee", employee: false, hr: true, superAdmin: true },
      { name: "Manually trigger vesting process", employee: false, hr: true, superAdmin: true },
    ],
  },
  {
    title: "Incentive Business Rules",
    features: [
      { name: "Incentives locked for 30 days (configurable) after award", employee: true, hr: true, superAdmin: true },
      { name: "Auto-vest to claimable after vesting period", employee: true, hr: true, superAdmin: true },
      { name: "Hold 1 month → +5% bonus (configurable)", employee: true, hr: true, superAdmin: true },
      { name: "Hold 2 months → +10% bonus (max cap, configurable)", employee: true, hr: true, superAdmin: true },
      { name: "First 25 users per cycle get approved (configurable)", employee: true, hr: true, superAdmin: true },
      { name: "Overflow users auto-queued to next cycle", employee: true, hr: true, superAdmin: true },
    ],
  },
  {
    title: "Claims & Payouts",
    features: [
      { name: "Submit claim for claimable incentive", employee: true, hr: false, superAdmin: false },
      { name: "View own claim history & queue position", employee: true, hr: false, superAdmin: false },
      { name: "View all claims (filter by status / cycle)", employee: false, hr: true, superAdmin: true },
      { name: "Mark approved claims as paid", employee: false, hr: true, superAdmin: true },
      { name: "Advance to next claim cycle", employee: false, hr: false, superAdmin: true },
    ],
  },
  {
    title: "Priority Payout",
    features: [
      { name: "Submit priority (urgent) payout request with reason", employee: true, hr: false, superAdmin: false },
      { name: "View own priority request status", employee: true, hr: false, superAdmin: false },
      { name: "View all priority requests", employee: false, hr: true, superAdmin: true },
      { name: "Approve priority request (bypasses queue)", employee: false, hr: true, superAdmin: true },
      { name: "Reject priority request with reason", employee: false, hr: true, superAdmin: true },
    ],
  },
  {
    title: "Reimbursements",
    features: [
      { name: "Submit reimbursement request (travel, food, medical, etc.)", employee: true, hr: false, superAdmin: false },
      { name: "Upload bill details", employee: true, hr: false, superAdmin: false },
      { name: "Track own reimbursement status", employee: true, hr: false, superAdmin: false },
      { name: "View all reimbursement requests (filter by status)", employee: false, hr: true, superAdmin: true },
      { name: "Approve reimbursement", employee: false, hr: true, superAdmin: true },
      { name: "Reject reimbursement with reason", employee: false, hr: true, superAdmin: true },
      { name: "Mark reimbursement as paid", employee: false, hr: true, superAdmin: true },
    ],
  },
  {
    title: "System Configuration",
    features: [
      { name: "View payout capacity status (HIGH / MODERATE / LOW)", employee: true, hr: true, superAdmin: true },
      { name: "View current claim cycle & vesting period", employee: true, hr: true, superAdmin: true },
      { name: "Set vesting period (days)", employee: false, hr: false, superAdmin: true },
      { name: "Set hold bonus % (1-month and 2-month cap)", employee: false, hr: false, superAdmin: true },
      { name: "Set claim limit per cycle", employee: false, hr: false, superAdmin: true },
      { name: "Set & manage payout pool amount", employee: false, hr: false, superAdmin: true },
      { name: "Set payout capacity (triggers delay warning for employees)", employee: false, hr: false, superAdmin: true },
    ],
  },
  {
    title: "Admin Overview Dashboard",
    features: [
      { name: "View total employee count", employee: false, hr: true, superAdmin: true },
      { name: "View payout pool balance", employee: false, hr: true, superAdmin: true },
      { name: "View approved claims count & pending amount", employee: false, hr: true, superAdmin: true },
      { name: "View pending priority requests count", employee: false, hr: true, superAdmin: true },
      { name: "View current claim cycle & limit", employee: false, hr: true, superAdmin: true },
    ],
  },
];

function Cell({ value }: { value: boolean }) {
  return (
    <td className="px-4 py-3 text-center">
      {value ? <CheckCircle size={16} className="inline text-emerald-500" /> : <XCircle size={16} className="inline text-red-300 dark:text-red-600" />}
    </td>
  );
}

export default function ReportPage() {
  const { user } = useAuth();

  return (
    <DashboardShell title="System Feature Report">
      {/* Print button */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Complete feature access report by user role — Namaah Pulse
        </p>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Printer size={15} />
          Print / Export PDF
        </button>
      </div>

      {/* Role legend */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3">
        {[
          {
            icon: User,
            role: "Employee",
            color: "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20",
            iconColor: "text-sky-600",
            desc: "Can only view and manage their own data — attendance, incentives, reimbursements.",
          },
          {
            icon: Users,
            role: "HR / Admin",
            color: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20",
            iconColor: "text-emerald-600",
            desc: "Manages all employees, enters KPI scores, reviews reimbursements and claims.",
          },
          {
            icon: Shield,
            role: "Super Admin",
            color: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20",
            iconColor: "text-purple-600",
            desc: "Full control including system configuration, payout pool, vesting & bonus settings.",
          },
        ].map(({ icon: Icon, role, color, iconColor, desc }) => (
          <div key={role} className={`rounded-xl border p-4 ${color}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={18} className={iconColor} />
              <span className="font-semibold text-gray-800 dark:text-gray-100">{role}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{desc}</p>
          </div>
        ))}
      </div>

      {/* Feature sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 print:break-inside-avoid">
            {/* Section header */}
            <div className="bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{section.title}</h3>
            </div>

            {/* Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-full">Feature</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-sky-600 whitespace-nowrap min-w-[90px]">Employee</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-emerald-600 whitespace-nowrap min-w-[90px]">HR</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-purple-600 whitespace-nowrap min-w-[110px]">Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {section.features.map((feature) => (
                  <tr key={feature.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{feature.name}</td>
                    <Cell value={feature.employee} />
                    <Cell value={feature.hr} />
                    <Cell value={feature.superAdmin} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/40 print:mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Generated by:</strong> Namaah Pulse &nbsp;·&nbsp;
          <strong>Date:</strong> {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} &nbsp;·&nbsp;
          <strong>Viewed by:</strong> {user?.name} ({user?.role?.replace("_", " ")})
        </p>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, aside, button { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </DashboardShell>
  );
}
