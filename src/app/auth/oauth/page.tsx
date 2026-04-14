"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { account } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";

export default function OAuthCallback() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const rawProvider = params.get("provider") ?? "OAuth";
      const providerName =
        rawProvider.length > 0
          ? rawProvider.charAt(0).toUpperCase() + rawProvider.slice(1)
          : "OAuth";

      try {
        // The user was redirected here after a successful Appwrite OAuth login.
        // Appwrite SDK should now have a valid session locally.
        
        // Validate session by getting user details
        await account.get();
        
        // Request short-lived JWT for the FastAPI backend
        const jwtObj = await account.createJWT();
        
        // Store the JWT in our HttpOnly cookie via the Next.js API route
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jwt: jwtObj.jwt }),
        });

        if (!res.ok) {
          throw new Error("Failed to secure the session");
        }

        // Refresh global AuthContext state so the dashboard knows we're logged in
        await refreshUser();
        
        // Finally, redirect to dashboard
        router.push("/dashboard");

      } catch (err) {
        console.error("OAuth handler failed:", err);
        // Delete any invalid session to stay clean
        try { await account.deleteSession("current"); } catch {}
        router.push(`/login?error=${encodeURIComponent(`${providerName} login verification failed. Please try again.`)}`);
      }
    }

    handleCallback();
  }, [router, refreshUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4ff]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
}
