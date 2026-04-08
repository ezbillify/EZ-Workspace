"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Crown, Users, ChevronDown } from "lucide-react";
import { useState } from "react";

type OrgNode = {
  id: string;
  name: string;
  role: string;
  designation?: string;
  color: string;
  children?: OrgNode[];
};

const ORG: OrgNode = {
  id: "ceo",
  name: "Namaah Startup",
  role: "CEO / Super Admin",
  designation: "Chief Executive Officer",
  color: "bg-purple-600",
  children: [
    {
      id: "cto",
      name: "Engineering",
      role: "Head of Technology",
      designation: "CTO",
      color: "bg-sky-600",
      children: [
        { id: "fe", name: "Frontend Dev", role: "Team Lead", designation: "Rahul Mehta", color: "bg-sky-500", children: [] },
        { id: "be", name: "Backend Dev", role: "Team Lead", designation: "Arjun Singh", color: "bg-sky-500", children: [] },
        { id: "mob", name: "Mobile Dev", role: "Team Lead", designation: "Arun Nair", color: "bg-sky-500", children: [] },
        { id: "do", name: "DevOps", role: "Team Lead", designation: "Sneha Patel", color: "bg-sky-500", children: [] },
        { id: "qa", name: "QA", role: "Team Lead", designation: "Meera Shah", color: "bg-sky-500", children: [] },
        { id: "ds", name: "Data Science", role: "Team Lead", designation: "Siddharth Roy", color: "bg-sky-500", children: [] },
        { id: "sec", name: "Security", role: "Team Lead", designation: "Naveen Rao", color: "bg-sky-500", children: [] },
        { id: "inf", name: "Infrastructure", role: "Team Lead", designation: "Lakshmi Devi", color: "bg-sky-500", children: [] },
      ],
    },
    {
      id: "cpo",
      name: "Product",
      role: "Head of Product",
      designation: "CPO",
      color: "bg-purple-500",
      children: [
        { id: "pd", name: "Product Design", role: "Team Lead", designation: "Priya Sharma", color: "bg-purple-400", children: [] },
        { id: "res", name: "Research", role: "Team Lead", designation: "Divya Menon", color: "bg-purple-400", children: [] },
        { id: "ana", name: "Analytics", role: "Team Lead", designation: "Kartik Verma", color: "bg-purple-400", children: [] },
      ],
    },
    {
      id: "cso",
      name: "Sales",
      role: "Head of Sales",
      designation: "CSO",
      color: "bg-emerald-600",
      children: [
        { id: "sn", name: "Sales North", role: "Team Lead", designation: "Amit Verma", color: "bg-emerald-500", children: [] },
        { id: "ss", name: "Sales South", role: "Team Lead", designation: "Deepa Nair", color: "bg-emerald-500", children: [] },
        { id: "bd", name: "Business Dev", role: "Team Lead", designation: "Suresh Pillai", color: "bg-emerald-500", children: [] },
      ],
    },
    {
      id: "cmo",
      name: "Marketing",
      role: "Head of Marketing",
      designation: "CMO",
      color: "bg-amber-600",
      children: [
        { id: "mkt", name: "Marketing", role: "Team Lead", designation: "Rohan Gupta", color: "bg-amber-500", children: [] },
        { id: "cnt", name: "Content", role: "Team Lead", designation: "Neha Kapoor", color: "bg-amber-500", children: [] },
      ],
    },
    {
      id: "coo",
      name: "Operations",
      role: "Head of Operations",
      designation: "COO",
      color: "bg-rose-600",
      children: [
        { id: "cs", name: "Customer Success", role: "Team Lead", designation: "Kiran Reddy", color: "bg-rose-500", children: [] },
        { id: "sup", name: "Support", role: "Team Lead", designation: "Vikram Joshi", color: "bg-rose-500", children: [] },
      ],
    },
    {
      id: "cfo",
      name: "Finance",
      role: "Head of Finance",
      designation: "CFO",
      color: "bg-cyan-600",
      children: [
        { id: "fin", name: "Finance Team", role: "Accounts Lead", designation: "Anita Kumar", color: "bg-cyan-500", children: [] },
      ],
    },
    {
      id: "chro",
      name: "People",
      role: "Head of HR",
      designation: "CHRO",
      color: "bg-pink-600",
      children: [
        { id: "hr", name: "HR Team", role: "HR Lead", designation: "Pooja Sharma", color: "bg-pink-500", children: [] },
        { id: "leg", name: "Legal", role: "Team Lead", designation: "Rajesh Iyer", color: "bg-pink-500", children: [] },
      ],
    },
  ],
};

function OrgCard({ node, level = 0 }: { node: OrgNode; level?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        className="relative flex flex-col items-center cursor-pointer group"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className={`flex items-center gap-2 rounded-xl border border-default bg-card px-4 py-3 shadow-sm min-w-[160px] text-center transition-all hover:shadow-md ${level === 0 ? "min-w-[200px]" : ""}`}>
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${node.color} text-white text-xs font-bold`}>
            {level === 0 ? <Crown size={14} /> : node.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{node.name}</p>
            <p className="text-[10px] text-muted truncate">{node.designation ?? node.role}</p>
          </div>
          {hasChildren && (
            <ChevronDown
              size={13}
              className={`ml-auto flex-shrink-0 text-muted transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
            />
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && node.children && (
        <>
          {/* Vertical line down */}
          <div className="w-px h-5 bg-border" />
          {/* Horizontal bar + children */}
          <div className="flex gap-4 items-start">
            {node.children.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* Vertical line up to horizontal bar */}
                <div className="w-px h-5 bg-border" />
                <OrgCard node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  return (
    <DashboardShell
      title="Org Chart"
      subtitle="Company hierarchy — 80+ people across 21 teams"
    >
      <div className="page-card overflow-x-auto">
        <div className="flex justify-center py-4 min-w-max">
          <OrgCard node={ORG} level={0} />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 page-card">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Departments</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Engineering", color: "bg-sky-600" },
            { label: "Product", color: "bg-purple-600" },
            { label: "Sales", color: "bg-emerald-600" },
            { label: "Marketing", color: "bg-amber-600" },
            { label: "Operations", color: "bg-rose-600" },
            { label: "Finance", color: "bg-cyan-600" },
            { label: "People & Legal", color: "bg-pink-600" },
          ].map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-sm ${d.color}`} />
              <span className="text-xs text-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
