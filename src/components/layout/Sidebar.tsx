"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, TrendingUp, Wallet,
  FileText, Zap, Users, Settings, LogOut, Sun, Moon, ChevronRight, ClipboardList,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const employeeLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/attendance", label: "Attendance", icon: CalendarDays },
  { href: "/dashboard/performance", label: "Performance", icon: TrendingUp },
  { href: "/dashboard/incentives", label: "Incentives", icon: Wallet },
  { href: "/dashboard/reimbursements", label: "Reimbursements", icon: FileText },
  { href: "/dashboard/priority", label: "Priority Payout", icon: Zap },
];

// HR can do everything except System Config
const hrLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Employees", icon: Users },
  { href: "/admin/kpi", label: "KPI / KRA", icon: TrendingUp },
  { href: "/admin/incentives", label: "Incentives", icon: Wallet },
  { href: "/admin/claims", label: "Claims", icon: FileText },
  { href: "/admin/reimbursements", label: "Reimbursements", icon: FileText },
  { href: "/admin/priority", label: "Priority Requests", icon: Zap },
  { href: "/admin/report", label: "Feature Report", icon: ClipboardList },
];

const leadLinks = [
  { href: "/admin/kpi", label: "KPI / KRA", icon: TrendingUp },
];

// Super Admin gets everything
const superAdminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Employees", icon: Users },
  { href: "/admin/kpi", label: "KPI / KRA", icon: TrendingUp },
  { href: "/admin/incentives", label: "Incentives", icon: Wallet },
  { href: "/admin/claims", label: "Claims", icon: FileText },
  { href: "/admin/reimbursements", label: "Reimbursements", icon: FileText },
  { href: "/admin/priority", label: "Priority Requests", icon: Zap },
  { href: "/admin/config", label: "System Config", icon: Settings },
  { href: "/admin/report", label: "Feature Report", icon: ClipboardList },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const links =
    user?.role === "employee"
      ? employeeLinks
      : user?.role === "lead"
      ? leadLinks
      : user?.role === "super_admin"
      ? superAdminLinks
      : hrLinks;

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white font-bold text-sm">
          N
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Namaah Pulse</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon size={16} />
                  {label}
                  {active && <ChevronRight size={14} className="ml-auto" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + actions */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="mb-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            onClick={() => logout()}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
