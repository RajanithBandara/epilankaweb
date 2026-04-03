"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppwriteException } from "appwrite";

import { account } from "@/lib/appwrite";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MagicCard } from "@/components/ui/magic-card";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    <main className="min-h-screen bg-page flex items-center justify-center px-4 py-8">
      <MagicCard
        mode="gradient"
        gradientSize={220}
        gradientOpacity={0.36}
        gradientColor="rgba(30,58,138,0.2)"
        gradientFrom="rgba(30,58,138,0.45)"
        gradientTo="rgba(14,165,164,0.35)"
        className="w-full max-w-md rounded-2xl border border-default"
      >
        <CardHeader className="space-y-2 pb-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Admin Login</CardTitle>
          <CardDescription>
            Sign in with your administrator account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error ? (
            <Alert className="mb-4 border-red-500/30 bg-red-500/10">
              <AlertDescription className="text-sm text-red-600 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="admin-email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Authorized administrators only.
            </p>
          </form>
        </CardContent>
      </MagicCard>
    </main>
  );
}
