"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock, Mail, Activity, AlertTriangle, Users } from "lucide-react";
import { AppwriteException } from "appwrite";
import { motion } from "framer-motion";
import Image from "next/image";

import { account } from "@/lib/appwrite";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OfficerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    account
      .get()
      .then(async (user) => {
        const labels: string[] = (user as { labels?: string[] }).labels ?? [];
        if (labels.includes("officer")) {
          router.replace("/officerdashboard");
        } else {
          try {
            await account.deleteSession("current");
          } catch {
            // ignore stale session cleanup failure
          }
        }
      })
      .catch(async () => {
        try {
          await account.deleteSession("current");
        } catch {
          // ignore stale session cleanup failure
        }
      });
  }, [router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      try {
        await account.deleteSession("current");
      } catch {
        // no session
      }

      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      const labels: string[] = (user as { labels?: string[] }).labels ?? [];

      if (!labels.includes("officer")) {
        await account.deleteSession("current");
        setError("Access denied. This account does not have officer privileges.");
        return;
      }

      const jwtObj = await account.createJWT(3600); // 1 hour expiry

      const response = await fetch("/api/officer/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt: jwtObj.jwt }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Failed to create officer session");
        return;
      }

      router.push("/officerdashboard");
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
    <main
      className="min-h-screen w-full flex overflow-hidden"
      style={{ background: "#000000", color: "#f1f5f9" }}
    >
      {/* Left Section — Branding panel, pure black base */}
      <div
        className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "#000" }}
      >
        <Image
          src="/images/officer_login_bg.png"
          alt="EpiLanka Medical Background"
          fill
          priority
          className="object-cover opacity-40 scale-105"
        />

        {/* Dark overlays anchored to the site dark palette — #0f172a base */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.55) 60%, rgba(14,165,164,0.12) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #000000 0%, rgba(0,0,0,0.6) 40%, transparent 100%)" }} />

        {/* Ambient glow — site primary navy */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(30,58,138,0.18) 0%, transparent 70%)" }} />

        <div className="relative z-10 p-14 flex flex-col items-start justify-end h-full w-full">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {/* Logo badge */}
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-8"
              style={{
                background: "rgba(14,165,164,0.12)",
                border: "1px solid rgba(14,165,164,0.25)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Activity className="h-7 w-7" style={{ color: "#0EA5A4" }} />
            </div>

            <h1 className="text-5xl font-bold tracking-tight mb-5 leading-[1.1]" style={{ color: "#f1f5f9" }}>
              EpiLanka
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg, #0EA5A4, #3b82f6)" }}
              >
                Officer Portal
              </span>
            </h1>

            <p className="text-base mb-12 max-w-sm leading-relaxed" style={{ color: "#64748b" }}>
              Secure access to the national health surveillance dashboard. Monitor outbreaks, manage reports, and protect public health.
            </p>

            {/* Feature badges */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              {[
                { icon: <AlertTriangle className="h-4 w-4" />, label: "Live", sub: "Monitoring", color: "#1E3A8A", delay: 0.45 },
                { icon: <Users className="h-4 w-4" />, label: "Secure", sub: "Access", color: "#0EA5A4", delay: 0.6 },
              ].map(({ icon, label, sub, color, delay }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay }}
                  className="flex items-center gap-3 rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="p-2 rounded-lg" style={{ background: `${color}26` }}>
                    <span style={{ color }}>{icon}</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{label}</div>
                    <div className="text-[11px] uppercase tracking-widest" style={{ color: "#475569" }}>{sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Section — Login form, black background */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 relative"
        style={{ background: "#000000" }}
      >
        {/* Ambient glows matching site colors */}
        <div className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(30,58,138,0.14) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle at bottom left, rgba(14,165,164,0.10) 0%, transparent 70%)" }} />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] z-10 relative"
        >
          {/* Mobile-only header */}
          <div className="lg:hidden flex flex-col items-center mb-8 text-center">
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4"
              style={{ background: "rgba(14,165,164,0.10)", border: "1px solid rgba(14,165,164,0.20)" }}
            >
              <ShieldCheck className="h-6 w-6" style={{ color: "#0EA5A4" }} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#f1f5f9" }}>Officer Portal</h1>
            <p className="mt-2 text-sm" style={{ color: "#64748b" }}>Sign in to manage health reports</p>
          </div>

          {/* Card */}
          <Card
            className="w-full rounded-2xl backdrop-blur-xl"
            style={{ background: "rgba(15,23,42,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Card header */}
            <CardHeader className="pt-8 pb-5 px-8 space-y-1 hidden lg:block">
              <CardTitle className="text-2xl font-semibold" style={{ color: "#f1f5f9" }}>
                Welcome back
              </CardTitle>
              <CardDescription className="text-sm" style={{ color: "#64748b" }}>
                Enter your officer credentials to continue.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {/* Error alert */}
              {error ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-5 overflow-hidden"
                >
                  <Alert
                    className="rounded-xl border text-sm"
                    style={{ background: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.25)", color: "#f87171" }}
                  >
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              ) : null}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5 group">
                  <label
                    htmlFor="officer-email"
                    className="text-sm font-medium transition-colors"
                    style={{ color: "#94a3b8" }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 transition-colors" style={{ color: "#475569" }} />
                    </div>
                    <Input
                      id="officer-email"
                      type="email"
                      placeholder="officer@epilanka.gov.lk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="pl-10 h-11 text-sm transition-all rounded-xl"
                      style={{
                        background: "rgba(15,23,42,0.60)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#f1f5f9",
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 group">
                  <label
                    htmlFor="officer-password"
                    className="text-sm font-medium transition-colors"
                    style={{ color: "#94a3b8" }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 transition-colors" style={{ color: "#475569" }} />
                    </div>
                    <Input
                      id="officer-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="pl-10 h-11 text-sm transition-all rounded-xl"
                      style={{
                        background: "rgba(15,23,42,0.60)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#f1f5f9",
                      }}
                    />
                  </div>
                </div>

                {/* Submit button — navy-to-teal gradient matching site theme */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 font-semibold text-white rounded-xl border-0 relative overflow-hidden group transition-all"
                  style={{
                    background: "linear-gradient(135deg, #1E3A8A 0%, #2563eb 50%, #0EA5A4 100%)",
                    boxShadow: "0 4px 20px -4px rgba(30,58,138,0.45)",
                  }}
                >
                  {/* Shine hover effect */}
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0d9190 100%)" }} />
                  <span className="relative flex items-center justify-center gap-2 text-sm">
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Sign In to Portal
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>

                {/* Footer note */}
                <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: "#475569" }}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Authorized government personnel only
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

