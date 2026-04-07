"use client";

import { useAuth } from "./AuthProvider";
import { Sidebar } from "./Sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardShell({ children, title }: DashboardShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {title && (
          <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
