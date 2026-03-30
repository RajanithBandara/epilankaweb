"use client";

import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { auth } from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MagicCard } from "@/components/ui/magic-card";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();

            const res = await fetch("/api/admin/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            if (!res.ok) {
                const t = await res.text();
                setError(t || "Failed to create session");
                return;
            }

            router.push("/admindashboard");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Login failed");
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
                    <CardDescription>Sign in to access the admin dashboard.</CardDescription>
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
                            <label htmlFor="admin-email" className="text-sm font-medium text-foreground">
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
                            <label htmlFor="admin-password" className="text-sm font-medium text-foreground">
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

                        <Button type="submit" disabled={loading} className="w-full text-white">
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
