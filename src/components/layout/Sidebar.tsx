"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, TrendingUp, Wallet, FileText, Zap, Users,
  Settings, LogOut, Sun, Moon, ChevronRight, ClipboardList, Building2,
  GitBranch, Receipt, CreditCard, Tag, PiggyBank, Handshake, UserCheck,
  BarChart3, MessageSquare, CalendarClock, IndianRupee, ShieldCheck,
  Network, Briefcase,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// ─── Link definitions ────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavSection = { title: string; items: NavItem[] };

const superAdminNav: NavSection[] = [
  {
    title: "Core",
    items: [
      { href: "/admin",            label: "Overview",        icon: LayoutDashboard },
      { href: "/admin/users",      label: "Employees",       icon: Users },
      { href: "/admin/teams",      label: "Teams",           icon: Building2 },
      { href: "/admin/org-chart",  label: "Org Chart",       icon: Network },
    ],
  },
  {
    title: "HR & People",
    items: [
      { href: "/admin/attendance", label: "Attendance",      icon: CalendarDays },
      { href: "/admin/kpi",        label: "KPI / KRA",       icon: TrendingUp },
      { href: "/admin/payroll",    label: "Payroll",         icon: IndianRupee },
      { href: "/admin/incentives", label: "Incentives",      icon: Wallet },
      { href: "/admin/claims",     label: "Claims",          icon: FileText },
      { href: "/admin/reimbursements", label: "Reimbursements", icon: Receipt },
      { href: "/admin/priority",   label: "Priority Payout", icon: Zap },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/invoicing",  label: "Invoicing",       icon: CreditCard },
      { href: "/admin/vendors",    label: "Vendors",         icon: Briefcase },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Tag },
      { href: "/admin/budgets",    label: "Team Budgets",    icon: PiggyBank },
    ],
  },
  {
    title: "Sales / CRM",
    items: [
      { href: "/admin/crm",        label: "Pipeline",        icon: GitBranch },
      { href: "/admin/crm/clients", label: "Clients & Deals", icon: Handshake },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/admin/messaging",  label: "Messages",        icon: MessageSquare },
      { href: "/admin/meetings",   label: "Meetings",        icon: CalendarClock },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/analytics",  label: "Analytics",       icon: BarChart3 },
      { href: "/admin/report",     label: "Feature Report",  icon: ClipboardList },
      { href: "/admin/config",     label: "System Config",   icon: Settings },
    ],
  },
];

const accountsNav: NavSection[] = [
  {
    title: "Core",
    items: [
      { href: "/admin",            label: "Overview",        icon: LayoutDashboard },
    ],
  },
  {
    title: "HR & People",
    items: [
      { href: "/admin/payroll",    label: "Payroll",         icon: IndianRupee },
      { href: "/admin/incentives", label: "Incentives",      icon: Wallet },
      { href: "/admin/claims",     label: "Claims",          icon: FileText },
      { href: "/admin/reimbursements", label: "Reimbursements", icon: Receipt },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/invoicing",  label: "Invoicing",       icon: CreditCard },
      { href: "/admin/vendors",    label: "Vendors",         icon: Briefcase },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Tag },
      { href: "/admin/budgets",    label: "Team Budgets",    icon: PiggyBank },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/admin/messaging",  label: "Messages",        icon: MessageSquare },
      { href: "/admin/meetings",   label: "Meetings",        icon: CalendarClock },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/analytics",  label: "Analytics",       icon: BarChart3 },
    ],
  },
];

const hrNav: NavSection[] = [
  {
    title: "Core",
    items: [
      { href: "/admin",            label: "Overview",        icon: LayoutDashboard },
      { href: "/admin/users",      label: "Employees",       icon: Users },
      { href: "/admin/teams",      label: "Teams",           icon: Building2 },
    ],
  },
  {
    title: "HR & People",
    items: [
      { href: "/admin/attendance", label: "Attendance",      icon: CalendarDays },
      { href: "/admin/kpi",        label: "KPI / KRA",       icon: TrendingUp },
      { href: "/admin/incentives", label: "Incentives",      icon: Wallet },
      { href: "/admin/claims",     label: "Claims",          icon: FileText },
      { href: "/admin/reimbursements", label: "Reimbursements", icon: Receipt },
      { href: "/admin/priority",   label: "Priority Payout", icon: Zap },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/admin/messaging",  label: "Messages",        icon: MessageSquare },
      { href: "/admin/meetings",   label: "Meetings",        icon: CalendarClock },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/report",     label: "Feature Report",  icon: ClipboardList },
    ],
  },
];

const leadNav: NavSection[] = [
  {
    title: "Team",
    items: [
      { href: "/admin/kpi",        label: "KPI / KRA",       icon: TrendingUp },
      { href: "/admin/attendance", label: "Attendance",      icon: CalendarDays },
      { href: "/admin/budgets",    label: "Team Budget",     icon: PiggyBank },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Tag },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/admin/messaging",  label: "Messages",        icon: MessageSquare },
      { href: "/admin/meetings",   label: "Meetings",        icon: CalendarClock },
    ],
  },
];

const salesNav: NavSection[] = [
  {
    title: "Sales / CRM",
    items: [
      { href: "/admin/crm",        label: "Pipeline",        icon: GitBranch },
      { href: "/admin/crm/clients", label: "Clients & Deals", icon: Handshake },
    ],
  },
  {
    title: "My Info",
    items: [
      { href: "/dashboard",        label: "Dashboard",       icon: LayoutDashboard },
      { href: "/dashboard/incentives", label: "Payslips",    icon: IndianRupee },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/admin/messaging",  label: "Messages",        icon: MessageSquare },
      { href: "/admin/meetings",   label: "Meetings",        icon: CalendarClock },
    ],
  },
];

const employeeNav: NavSection[] = [
  {
    title: "My Workspace",
    items: [
      { href: "/dashboard",                label: "Dashboard",       icon: LayoutDashboard },
      { href: "/dashboard/attendance",     label: "Attendance",      icon: CalendarDays },
      { href: "/dashboard/performance",    label: "Performance",     icon: TrendingUp },
      { href: "/dashboard/incentives",     label: "Incentives",      icon: Wallet },
      { href: "/dashboard/payslips",       label: "Payslips",        icon: IndianRupee },
      { href: "/dashboard/reimbursements", label: "Reimbursements",  icon: Receipt },
      { href: "/dashboard/priority",       label: "Priority Payout", icon: Zap },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/dashboard/messages",  label: "Messages",   icon: MessageSquare },
      { href: "/dashboard/meetings",  label: "Meetings",   icon: CalendarClock },
    ],
  },
];

// ─── Role label + color ───────────────────────────────────────────────────────

const roleDisplay: Record<string, { label: string; color: string }> = {
  super_admin: { label: "Super Admin",    color: "bg-purple-500" },
  accounts:    { label: "Accounts",       color: "bg-emerald-500" },
  hr:          { label: "HR",             color: "bg-sky-500" },
  lead:        { label: "Team Lead",      color: "bg-amber-500" },
  employee:    { label: "Employee",       color: "bg-gray-400" },
  sales:       { label: "Sales",          color: "bg-rose-500" },
};

function getNavForRole(role?: string): NavSection[] {
  switch (role) {
    case "super_admin": return superAdminNav;
    case "accounts":    return accountsNav;
    case "hr":          return hrNav;
    case "lead":        return leadNav;
    case "sales":       return salesNav;
    default:            return employeeNav;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const sections = getNavForRole(user?.role);
  const role = user?.role ?? "employee";
  const roleInfo = roleDisplay[role] ?? roleDisplay.employee;

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white font-bold text-sm shadow-sm flex-shrink-0">
          N
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">Namaah Pulse</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn("status-dot", roleInfo.color)} />
            <p className="text-xs text-muted truncate">{roleInfo.label}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-subtle">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-[hsl(var(--sidebar-item-active-bg))] text-[hsl(var(--sidebar-item-active-text))]"
                          : "text-muted hover:bg-[hsl(var(--sidebar-item-hover-bg))] hover:text-foreground"
                      )}
                    >
                      <Icon size={15} className="flex-shrink-0" />
                      <span className="truncate">{label}</span>
                      {active && <ChevronRight size={13} className="ml-auto flex-shrink-0 opacity-60" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar p-3 space-y-2">
        <div className="rounded-lg bg-[hsl(var(--surface-raised))] px-3 py-2">
          <p className="text-xs font-semibold text-foreground truncate">{user?.name ?? "—"}</p>
          <p className="text-xs text-muted truncate">{user?.email ?? "—"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-muted hover:bg-[hsl(var(--surface-raised))] hover:text-foreground transition-colors"
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            onClick={() => logout()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
