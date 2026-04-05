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
          <CardTitle className="text-xl">Officer Login</CardTitle>
          <CardDescription>
            Sign in with your officer account.
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
              <label htmlFor="officer-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="officer-email"
                type="email"
                placeholder="officer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="officer-password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="officer-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full text-white">
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Authorized officers only.
            </p>
          </form>
        </CardContent>
      </MagicCard>
    </main>
  );
}
