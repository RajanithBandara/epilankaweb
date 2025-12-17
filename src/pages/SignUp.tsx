"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function SignUp() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // ✅ Call Next.js API route
            const res = await axios.post("/api/signup", {
                username,
                email,
                password,
            });

            console.log("Signup success:", res.data);

            router.push("/success");
        } catch (err) {
            console.error("Signup error:", err);

            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    "Signup failed. Please try again."
                );
            } else {
                setError("Signup failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-lg">
                <h2 className="text-3xl font-extrabold mb-6 text-center bg-white/80 bg-clip-text text-transparent">
                    Create Your Account
                </h2>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSignUp}>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none"
                            placeholder="Enter your username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none"
                            placeholder="Create a password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-winered hover:bg-winered-dark text-white font-bold py-3 rounded-lg transition disabled:opacity-60"
                    >
                        {loading ? "Signing up…" : "Sign Up"}
                    </button>
                </form>
            </div>
        </div>
    );
}
