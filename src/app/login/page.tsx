"use client";

import { useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Invalid credentials";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white text-2xl font-bold shadow-lg">
            N
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Namaah Pulse</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Performance & Incentive Management
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-6 text-lg font-semibold text-gray-800 dark:text-gray-100">Sign in</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-sky-800"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-sky-800"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
