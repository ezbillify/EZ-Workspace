"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, statusBadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/layout/AuthProvider";
import { formatCurrency, formatDate } from "@/lib/utils";
import axios from "axios";

interface Claim {
  _id: string;
  amount: number;
  status: string;
  cycle: number;
  queue_position?: number;
  requested_at: string;
  employee?: { name: string; employeeId: string; department: string };
  incentive?: { amount: number; month: number; year: number };
}

export default function AdminClaimsPage() {
  
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("approved");

  async function load() {
    setLoading(true);
    try {
      const url = `/api/claims${statusFilter ? `?status=${statusFilter}` : ""}`;
      const res = await axios.get(url);
      setClaims(res.data.claims ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function processClaim(claimId: string) {
    setProcessing(claimId);
    try {
      await axios.post(
        "/api/claims",
        { action: "process", claimId }
      );
      await load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error");
    } finally {
      setProcessing(null);
    }
  }

  async function advanceCycle() {
    if (!confirm("Advance to next claim cycle? Queued users will be moved.")) return;
    try {
      await axios.post("/api/claims", { action: "advance_cycle" });
      alert("Cycle advanced successfully");
      await load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error");
    }
  }

  return (
    <DashboardShell title="Claims Management">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {["pending", "approved", "paid", "queued", ""].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={advanceCycle}>
          Advance Cycle
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Claims ({claims.length})</CardTitle></CardHeader>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
        ) : claims.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No claims found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left text-xs text-gray-500">
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Cycle</th>
                  <th className="pb-3 pr-4">Position</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Requested</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {claims.map((c) => (
                  <tr key={c._id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{c.employee?.name}</p>
                      <p className="text-xs text-gray-500">{c.employee?.employeeId}</p>
                    </td>
                    <td className="py-3 pr-4 font-semibold">{formatCurrency(c.amount)}</td>
                    <td className="py-3 pr-4 text-gray-500">#{c.cycle}</td>
                    <td className="py-3 pr-4 text-gray-500">{c.queue_position ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusBadgeVariant(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(c.requested_at)}</td>
                    <td className="py-3">
                      {c.status === "approved" && (
                        <Button
                          size="sm"
                          loading={processing === c._id}
                          onClick={() => processClaim(c._id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
