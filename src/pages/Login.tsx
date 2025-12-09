'use client';
import { useState } from 'react';
import axios from 'axios';

function Login(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
                email,
                password
            });

            console.log('Login successful:', response.data);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            window.location.href = '/';
        } catch (err) {
            console.error('Login error:', err);
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return(
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-lg">

                <h2 className="text-3xl font-extrabold mb-6 text-center bg-white/80 bg-clip-text text-transparent">
                    Welcome Back
                </h2>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-winered focus:ring-2 focus:ring-winered/30 focus:outline-none transition text-white"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-winered focus:ring-2 focus:ring-winered/30 focus:outline-none transition text-white"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-winered hover:bg-winered-dark text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login;