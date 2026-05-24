"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { AppwriteException } from "appwrite";
import { account } from "@/lib/appwrite";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Auto-redirect if already logged in as admin
  useEffect(() => {
    account.get().then(async (user) => {
      const labels: string[] = (user as { labels?: string[] }).labels ?? [];
      if (labels.includes("admin")) {
        router.replace("/admindashboard");
      } else {
        // Logged in but not admin — clean up stale session
        try { await account.deleteSession("current"); } catch { /* ignore */ }
      }
    }).catch(async () => {
      // No session — clean up any stale SDK token
      try { await account.deleteSession("current"); } catch { /* ignore */ }
    });
  }, [router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Delete any stale session first to avoid "session prohibited" error
      try { await account.deleteSession("current"); } catch { /* no session */ }

      // 1. Create Appwrite session
      await account.createEmailPasswordSession(email, password);

      // 2. Fetch current user and verify admin label
      const user = await account.get();
      const labels: string[] = (user as { labels?: string[] }).labels ?? [];

      if (!labels.includes("admin")) {
        // Not an admin — delete the session immediately
        await account.deleteSession("current");
        setError("Access denied. This account does not have admin privileges.");
        return;
      }

      // 3. Get short-lived JWT
      const jwtObj = await account.createJWT();

      // 4. Store JWT in HttpOnly cookie via session route
      const res = await fetch("/api/admin/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt: jwtObj.jwt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to create session");
        return;
      }

      router.push("/admindashboard");
    } catch (err) {
      if (err instanceof AppwriteException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed. Check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#1E3A8A] flex items-center justify-center px-4 py-12 text-white">
      {/* Ambient Background Grid & Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        {/* Cyber grid overlay */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" 
        />
        {/* Glowing radial orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Split Dual-Panel Dashboard Container */}
      <div className="relative z-10 w-full max-w-5xl bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.6)] overflow-hidden grid lg:grid-cols-12 transition-all duration-300 hover:border-white/15">
        
        {/* Left Side Panel - Branding & Security Illustration (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 overflow-hidden border-r border-white/10 bg-gradient-to-br from-black/40 via-white/[0.01] to-black/30">
          {/* Background patterns */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0EA5A4_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Logo/System tag */}
          <div className="relative z-10 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0EA5A4]/15 border border-[#0EA5A4]/30 text-[#0EA5A4]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-black tracking-wider text-sm text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              EPILANKA
            </span>
          </div>

          {/* Animated Holographic Security Lottie Illustration */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="w-56 h-56 relative drop-shadow-[0_0_30px_rgba(14,165,164,0.3)]">
              <iframe 
                src="https://lottie.host/embed/e1f871db-2a07-4bc1-b2fe-00ce8e04fb70/wUnAkCWVrw.lottie" 
                className="w-full h-full mix-blend-screen scale-[1.2] border-none"
                style={{ background: 'transparent' }}
                allow="autoplay"
                title="Security Shield Animation"
              />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-center mt-6">
              Secure Access Control
            </h2>
            <p className="text-xs text-white/50 text-center max-w-[240px] mt-2 leading-relaxed">
              System-wide encryption, multi-level checks, and automated hazard verification.
            </p>
          </div>

          {/* Footer note */}
          <div className="relative z-10 text-[10px] text-white/30 tracking-widest uppercase">
            AUTHORIZED STAFF ONLY • PORTAL v2.1
          </div>
        </div>

        {/* Right Side Panel - The Sleek Login Form */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-center p-8 sm:p-12 md:p-16">
          {/* Title Header for mobile (branding shown as badge) */}
          <div className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0EA5A4]/10 border border-[#0EA5A4]/20 text-[#0EA5A4] text-xs font-semibold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0EA5A4] animate-pulse"></span>
              Admin Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Sign In
            </h1>
            <p className="text-sm text-white/60">
              Please authenticate using your administrator credentials.
            </p>
          </div>

          {/* Error display */}
          {error ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 animate-shake">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-red-200 leading-relaxed">{error}</div>
            </div>
          ) : null}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="admin-email" className="text-xs font-bold uppercase tracking-wider text-white/60">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#0EA5A4] transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@epilanka.gov.lk"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm text-white placeholder-white/20 outline-none transition-all focus:border-[#0EA5A4]/75 focus:bg-white/[0.05] focus:ring-4 focus:ring-[#0EA5A4]/10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="admin-password" className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Access Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#0EA5A4] transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security phrase"
                  className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm text-white placeholder-white/20 outline-none transition-all focus:border-[#0EA5A4]/75 focus:bg-white/[0.05] focus:ring-4 focus:ring-[#0EA5A4]/10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#0EA5A4] via-[#0D9488] to-[#2563EB] text-white py-4 rounded-2xl text-sm font-bold shadow-[0_10px_25px_-5px_rgba(14,165,164,0.4)] transition-all duration-300 hover:shadow-[0_15px_30px_-5px_rgba(14,165,164,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none overflow-hidden cursor-pointer"
            >
              {/* Inner shining hover effect */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Authenticating Portal...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Authenticate Access
                </>
              )}
            </button>

            <div className="pt-2 text-center flex flex-col items-center gap-2">
              <span className="text-[10px] tracking-wider font-semibold text-white/30 uppercase">
                Security Shield Active
              </span>
              <p className="text-[11px] text-white/40 leading-relaxed max-w-sm">
                All session requests are monitored and logged. Unauthorised attempts are subject to automatic security lockdowns.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
