"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, statusBadgeVariant } from "@/components/ui/Badge";
import { useAuth } from "@/components/layout/AuthProvider";
import { useApi } from "@/hooks/useApi";
import { getYearRange } from "@/lib/utils";

interface AttendanceRecord {
  date: string;
  status: string;
}

interface MonthlyData {
  total_days: number;
  present: number;
  absent: number;
  pto: number;
  holiday: number;
  records: AttendanceRecord[];
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { request } = useApi();
  const [data, setData] = useState<MonthlyData | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    request<{ attendance: MonthlyData }>({
      url: `/api/attendance?employeeId=${user.employeeId}&month=${month}&year=${year}`,
    })
      .then((res) => setData(res.attendance))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, month, year, request]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleString("en-IN", { month: "long" }),
  }));

  return (
    <DashboardShell title="Attendance">
      {/* Controls */}
      <div className="mb-6 flex gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
        >
          {getYearRange().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Working Days", value: data.total_days, color: "text-gray-800 dark:text-gray-100" },
            { label: "Present", value: data.present, color: "text-emerald-600" },
            { label: "Absent", value: data.absent, color: "text-red-500" },
            { label: "PTO / Leave", value: data.pto, color: "text-sky-600" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="text-center">
              <p className="mb-1 text-xs text-gray-500">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar-style record list */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Records</CardTitle>
        </CardHeader>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading attendance data...</div>
        ) : !data || data.records.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No attendance data for this period.<br />
            <span className="text-xs">Make sure Google Sheets is configured.</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
            {data.records.map((rec) => (
              <div
                key={rec.date}
                className="flex flex-col items-center rounded-lg border border-gray-100 py-3 dark:border-gray-700"
              >
                <p className="text-xs text-gray-400">
                  {new Date(rec.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
                <Badge variant={statusBadgeVariant(rec.status)} className="mt-1">
                  {rec.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
