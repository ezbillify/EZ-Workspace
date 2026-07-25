/*
 * Copyright (c) 2026 EZBillify Ventures Pvt Ltd. All rights reserved.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
 *
 * WARNING & LIABILITY DISCLAIMER:
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * IMPORTANT: WHOEVER COPIES, REDISTRIBUTES, OR USES THIS SOFTWARE MUST KNOW THAT
 * UNDER NO CIRCUMSTANCES CAN THEY RECOVER DAMAGES, LOSSES, OR LIABILITIES
 * ENCOUNTERED FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS SOFTWARE.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth, getDashboardForRole, type Role } from "@/components/layout/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/ButtonLegacy";
import {
  Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Info, BarChart3, Building2,
  Key, ArrowLeft, CheckCircle2, Zap, Lock as LockIcon,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastLegacy";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: ShieldCheck, label: "Bank-grade security with full audit trails" },
  { icon: Building2,   label: "HR, finance & operations unified in one panel" },
  { icon: BarChart3,   label: "Real-time insights across every team" },
];

const STATS = [
  { k: "40+",     v: "Integrated modules" },
  { k: "Real-time", v: "Sync across teams" },
  { k: "SSO",     v: "Enterprise identity" },
];

const PASSWORD_REQUIREMENTS = [
  { label: "Min. 8 characters", check: (pw: string) => pw.length >= 8 },
  { label: "Uppercase (A-Z)", check: (pw: string) => /[A-Z]/.test(pw) },
  { label: "Lowercase (a-z)", check: (pw: string) => /[a-z]/.test(pw) },
  { label: "Number (0-9)", check: (pw: string) => /\d/.test(pw) },
  { label: "Special symbol", check: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent opacity-60" /></div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { user, loading: authLoading, login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next");
  const pwdChanged = searchParams?.get("pwd") === "changed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Inline "forgot credentials" flow
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [fpStep, setFpStep] = useState<"request" | "verify">("request");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpDone, setFpDone] = useState(false);
  const [obscuredEmails, setObscuredEmails] = useState<string[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("nexus_post_pwd_email");
    if (stored) {
      setEmail(stored);
      sessionStorage.removeItem("nexus_post_pwd_email");
    }
    const qEmail = searchParams?.get("email");
    if (qEmail) setEmail(qEmail);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(nextPath && nextPath.startsWith("/") ? nextPath : getDashboardForRole(user.role as Role));
    }
  }, [user, authLoading, router, nextPath]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast("Access Granted. Welcome back to EZ-Workspace.", "success");
    } catch (err: any) {
      showToast(err.message || "Authentication failed. Please check your credentials.", "error");
    } finally {
      setLoading(false);
    }
  }

  const openForgot = () => { setMode("forgot"); setFpStep("request"); setFpDone(false); };
  const backToSignin = () => {
    setMode("signin"); setFpStep("request"); setFpDone(false);
    setOtp(""); setNewPassword(""); setConfirmPassword("");
  };

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setFpLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-credentials/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request verification code.");
      showToast(data.message, "success");
      setObscuredEmails(data.recipients || []);
      setFpStep("verify");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setFpLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!PASSWORD_REQUIREMENTS.every((r) => r.check(newPassword))) {
      showToast("Password does not meet all security requirements.", "error"); return;
    }
    if (newPassword !== confirmPassword) { showToast("Passwords do not match.", "error"); return; }
    if (!otp) { showToast("Verification code is required.", "error"); return; }
    setFpLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-credentials/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset credentials.");
      showToast("Password updated successfully across all accounts!", "success");
      setFpDone(true);
      setPassword("");
      setTimeout(() => backToSignin(), 3500);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setFpLoading(false);
    }
  }

  const year = new Date().getFullYear();
  const inputCls =
    "w-full rounded-xl border border-border bg-white pl-11 pr-4 text-[13px] font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/15";
  const inputStyle = { height: "clamp(2.6rem, 2.3rem + 0.6vw, 3rem)" } as const;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white selection:bg-primary/20">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ezFloatA{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(42px,-52px,0) scale(1.12)}}
        @keyframes ezFloatB{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-54px,42px,0) scale(1.18)}}
        @keyframes ezFloatC{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(28px,34px,0) scale(0.92)}}
        @media (prefers-reduced-motion: reduce){.ez-anim{animation:none !important}}
      ` }} />

      {/* ── SPLIT ── */}
      <div className="flex min-h-0 flex-1">

        {/* LEFT · 70% · brand / details */}
        <aside className="relative hidden w-[70%] flex-col justify-between overflow-hidden bg-[#1f2937] py-8 px-10 xl:py-12 xl:px-14 lg:flex">
          <div className="pointer-events-none absolute inset-0">
            <div className="ez-anim absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#3b82f6]/40 blur-3xl" style={{ animation: "ezFloatA 17s ease-in-out infinite" }} />
            <div className="ez-anim absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-[#3b82f6]/22 blur-3xl" style={{ animation: "ezFloatB 23s ease-in-out infinite" }} />
            <div className="ez-anim absolute -right-16 top-1/4 h-80 w-80 rounded-full bg-[#3b82f6]/15 blur-3xl" style={{ animation: "ezFloatC 19s ease-in-out infinite" }} />
            <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_72%)]" />
          </div>

          {/* Brand */}
          <div className="relative flex items-center gap-3">
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/20">
              <img src="/favicon.png" alt="EZ-Workspace" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-xl font-black leading-none tracking-tight text-white">EZ-Workspace</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Enterprise Operations Panel</p>
            </div>
          </div>

          {/* Headline + features */}
          <div className="relative max-w-2xl space-y-6 xl:space-y-8">
            <div>
              <h2 className="font-black leading-[1.05] tracking-tight text-white" style={{ fontSize: "clamp(2rem, 1rem + 2.6vw, 3.4rem)" }}>
                Run your entire company<br /> from one secure panel.
              </h2>
              <p className="mt-4 max-w-lg text-[14px] font-medium leading-relaxed text-white/55">
                The unified operations platform for HR, finance, payroll, recruitment and everything your teams run on — with enterprise-grade security built in.
              </p>
            </div>

            <ul className="space-y-2.5 xl:space-y-3.5">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#3b82f6]/15 text-[#3b82f6] ring-1 ring-[#3b82f6]/30">
                    <Icon size={16} />
                  </span>
                  <span className="text-[14px] font-medium text-white/80">{label}</span>
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 pt-1">
              {STATS.map((s) => (
                <div key={s.v} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-sm">
                  <p className="text-lg font-black text-white">{s.k}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust strip */}
          <div className="relative flex items-center gap-2 text-[12px] font-semibold text-white/45 mt-6 xl:mt-8 mb-1">
            <ShieldCheck size={14} className="text-[#3b82f6]" /> Encrypted · SSO-ready · Fully audit-logged
          </div>
        </aside>

        {/* RIGHT · 30% · sign-in / recovery */}
        <section className="relative flex w-full flex-col lg:w-[30%] border-l border-border/40 bg-white">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl" />
          </div>

          <div className="relative flex flex-1 flex-col justify-between overflow-y-auto">
            <div className="flex flex-1 flex-col justify-center py-10">
              <div key={mode + fpStep + String(fpDone)} className="mx-auto w-full max-w-sm px-6 duration-500 animate-in fade-in slide-in-from-right-4 sm:px-8">

              {/* Compact brand — small screens only */}
              <div className="mb-7 flex flex-col items-center text-center lg:hidden">
                <div className="mb-3 h-14 w-14 overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/70">
                  <img src="/favicon.png" alt="EZ-Workspace" className="h-full w-full object-cover" />
                </div>
                <h1 className="text-xl font-black tracking-tight text-foreground">EZ-Workspace</h1>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Enterprise Operations Panel</p>
              </div>

              {/* ───── SIGN IN ───── */}
              {mode === "signin" && (
                <>
                  <div className="mb-6">
                    <h2 className="text-[17px] font-black uppercase tracking-wider text-foreground">Internal Sign In</h2>
                    <p className="mt-1 text-[12px] font-medium text-muted-foreground">Access your financial administration dashboard</p>
                  </div>

                  {pwdChanged && (
                    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-2.5">
                      <Info size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                      <p className="text-[11px] font-semibold leading-relaxed text-foreground">
                        Password updated. Please log in with your <span className="font-black text-primary">professional (company) email</span> from now on. Personal email access has been disabled.
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="px-0.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Corporate Email</label>
                      <div className="group relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} className={inputCls} placeholder="name@ezbillify.in" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="px-0.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Security Password</label>
                      <div className="group relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" style={inputStyle} className={cn(inputCls, "pr-11")} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary">
                          {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" loading={loading} style={inputStyle} className="mt-1 w-full rounded-xl bg-primary text-[12px] font-black uppercase tracking-widest text-primary-foreground">
                      Authorize Access
                      {!loading && <ArrowRight className="ml-2 h-3.5 w-3.5" />}
                    </Button>
                  </form>

                  <div className="mt-6 border-t border-border pt-4 text-left">
                    <button type="button" onClick={openForgot} className="text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary">
                      Forgot credentials?
                    </button>
                  </div>
                </>
              )}

              {/* ───── FORGOT / RECOVERY ───── */}
              {mode === "forgot" && (
                <>
                  {fpDone ? (
                    <div className="space-y-5 py-4 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 size={32} />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-foreground">Credentials Reset Complete</h3>
                        <p className="px-2 text-[12px] leading-relaxed text-muted-foreground">
                          Your security credentials have been updated. Returning you to sign in…
                        </p>
                      </div>
                      <button type="button" onClick={backToSignin} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline">
                        <ArrowLeft size={12} /> Back to Sign In now
                      </button>
                    </div>
                  ) : fpStep === "request" ? (
                    <>
                      <div className="mb-6">
                        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                          <Key size={11} /> Recovery Console
                        </span>
                        <h2 className="text-[17px] font-black uppercase tracking-wider text-foreground">Forgot Credentials</h2>
                        <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                          Enter your corporate or personal email to request a security verification code.
                        </p>
                      </div>

                      <form onSubmit={handleRequestOTP} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="px-0.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Registered Email Address</label>
                          <div className="group relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} className={inputCls} placeholder="personal or corporate email" />
                          </div>
                        </div>
                        <Button type="submit" loading={fpLoading} style={inputStyle} className="mt-1 w-full rounded-xl bg-primary text-[12px] font-black uppercase tracking-widest text-primary-foreground">
                          Send Verification Code
                          {!fpLoading && <ArrowRight className="ml-2 h-3.5 w-3.5" />}
                        </Button>
                      </form>

                      <div className="mt-6 border-t border-border pt-4 text-left">
                        <button type="button" onClick={backToSignin} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary">
                          <ArrowLeft size={12} /> Back to Sign In
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-5">
                        <h2 className="text-[17px] font-black uppercase tracking-wider text-foreground">Security Verification</h2>
                        <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                          A 6-digit code was dispatched. Enter it with your new password.
                        </p>
                        {obscuredEmails.length > 0 && (
                          <div className="mt-2.5 space-y-1 rounded-xl border border-border bg-primary/[0.04] p-2.5 text-[10px] font-semibold text-muted-foreground">
                            <p className="text-[9px] font-black uppercase tracking-wider text-foreground">Dispatched to:</p>
                            {obscuredEmails.map((e, i) => (
                              <p key={i} className="flex items-center gap-1.5 font-mono"><span className="text-primary">✓</span> {e}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="px-0.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">One-Time Code</label>
                          <div className="group relative">
                            <Key className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required style={inputStyle} className={cn(inputCls, "text-center font-mono tracking-[0.3em]")} placeholder="••••••" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="px-0.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">New Password</label>
                          <div className="group relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input type={showNewPwd ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={inputStyle} className={cn(inputCls, "pr-11")} placeholder="Enter new password" />
                            <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary">
                              {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl border border-border bg-primary/[0.03] p-2.5">
                            {PASSWORD_REQUIREMENTS.map((req, i) => {
                              const ok = req.check(newPassword);
                              return (
                                <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold">
                                  <span className={cn("flex h-3 w-3 items-center justify-center rounded-full text-[7px]", ok ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{ok ? "✓" : ""}</span>
                                  <span className={ok ? "text-primary" : "text-muted-foreground"}>{req.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="px-0.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Confirm Password</label>
                          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle}
                            className={cn("w-full rounded-xl border bg-white px-4 text-[13px] font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-primary/15",
                              confirmPassword && newPassword !== confirmPassword ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary")}
                            placeholder="Re-enter new password" />
                          {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-[10px] font-bold text-red-500">Passwords do not match</p>
                          )}
                        </div>

                        <Button type="submit" loading={fpLoading}
                          disabled={!otp || newPassword !== confirmPassword || !PASSWORD_REQUIREMENTS.every((r) => r.check(newPassword))}
                          style={inputStyle}
                          className="mt-1 w-full rounded-xl bg-primary text-[12px] font-black uppercase tracking-widest text-primary-foreground">
                          Update Credentials
                          {!fpLoading && <ArrowRight className="ml-2 h-3.5 w-3.5" />}
                        </Button>
                      </form>

                      <div className="mt-5 border-t border-border pt-4 text-left">
                        <button type="button" onClick={() => setFpStep("request")} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary">
                          <ArrowLeft size={12} /> Request code again
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
              </div>
            </div>

            {/* Clean, integrated footer placed at the bottom of the container */}
            <footer className="shrink-0 pb-8 pt-4 px-6 text-center">
              <p className="mx-auto text-[10px] font-semibold leading-relaxed text-muted-foreground">
                &copy; {year} EZBillify Ventures Pvt Ltd. All rights reserved.
              </p>
              <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground/80">
                Licensed under AGPL-3.0. Copied versions cannot recover or hold developers liable for any losses or damages.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground/50">
                <span>Confidential</span>
                <span>·</span>
                <span>IP Restricted</span>
                <span>·</span>
                <span>v2.1.0-preview</span>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
