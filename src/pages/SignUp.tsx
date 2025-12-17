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

    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!apiBase) {
            alert("API URL is not configured.");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(
                `${apiBase}users/register`,
                { username, email, password },
                { headers: { "Content-Type": "application/json", "x-api-key": process.env.SECRET_KEY } }
            );

            console.log("API Response:", res.data);

            if (res.status === 201 || res.status === 200) {
                router.push("/success");
            } else {
                alert("Signup failed. Try again.");
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const message = err.response?.data?.detail || err.response?.data?.message || err.message || "Signup failed.";
                console.error("Signup error:", err.response?.data || err.message);
                alert(message);
            } else if (err instanceof Error) {
                console.error("Signup error:", err.message);
                alert("Signup failed.");
            } else {
                console.error("Signup error: Unknown error");
                alert("Signup failed.");
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

                <form className="space-y-6" onSubmit={handleSignUp}>
                    <div>
                        <label className="block text-sm font-medium mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none"
                            placeholder="Create a password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-winered hover:bg-winered-dark text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:opacity-60"
                    >
                        {loading ? "Signing up…" : "Sign Up"}
                    </button>
                </form>
            </div>
        </div>
    );
}
