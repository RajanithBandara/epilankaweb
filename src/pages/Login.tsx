'use client';

import { useState, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, ArrowRight, Loader2, Zap, Shield, Globe, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/login', {
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            localStorage.setItem('user_id', response.data.user_id);
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('email', response.data.email);

            document.cookie = `token=${response.data.access_token}; path=/; max-age=86400; SameSite=Strict`;

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || 'Login failed');
            } else {
                setError('An unexpected error occurred');
            }
            console.error('Error during login:', error);
        } finally {
            setLoading(false);
        }
    }

    const features = [
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Real-time Monitoring",
            description: "Track infectious disease outbreaks across Sri Lanka in real-time"
        },
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "AI-Powered Predictions",
            description: "Advanced forecasting to predict future disease spread patterns"
        },
        {
            icon: <Globe className="w-6 h-6" />,
            title: "District-Level Insights",
            description: "Interactive maps showing disease trends by province and district"
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Instant Alerts",
            description: "Get notified about high-risk regions and outbreak warnings"
        }
    ];


    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Maroon Brand Section */}
            <motion.div
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#800020] to-[#600018] relative overflow-hidden"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Decorative Elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    {/* Logo & Branding */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <motion.h1
                            className="text-5xl font-bold mb-3"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            EpiLanka
                        </motion.h1>
                        <motion.p
                            className="text-xl text-white/80"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            Your Gateway to Smart Trading
                        </motion.p>
                    </motion.div>

                    {/* Features Section */}
                    <div className="space-y-6">
                        <motion.h2
                            className="text-3xl font-semibold mb-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Why Choose epiLanka?
                        </motion.h2>

                        <div className="space-y-4">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20"
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                    whileHover={{
                                        scale: 1.02,
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        transition: { duration: 0.2 }
                                    }}
                                >
                                    <motion.div
                                        className="bg-white/20 p-2 rounded-lg"
                                        whileHover={{ rotate: 5, scale: 1.1 }}
                                        transition={{ type: 'spring', stiffness: 400 }}
                                    >
                                        {feature.icon}
                                    </motion.div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                                        <p className="text-white/70 text-sm">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Panel - Login Form */}
            <motion.div
                className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <motion.div
                        className="lg:hidden text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl font-bold text-[#800020] mb-2">EpiLanka</h1>
                        <p className="text-gray-600">Your Gateway to Smart Trading</p>
                    </motion.div>

                    {/* Login Card */}
                    <motion.div
                        className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    >
                        {/* Header */}
                        <motion.div
                            className="text-center mb-8"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <motion.div
                                className="inline-flex items-center justify-center w-14 h-14 bg-black rounded-full mb-4"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <Lock className="w-7 h-7 text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                            <p className="text-gray-600">Sign in to access your account</p>
                        </motion.div>

                        {/* Error Alert */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3"
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-800 text-sm font-medium">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Login Form */}
                        <form className="space-y-5" onSubmit={handleLogin}>
                            {/* Email Field */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <motion.div
                                        className="absolute left-3 top-1/2 -translate-y-1/2"
                                        animate={{
                                            scale: focusedField === 'email' ? 1.1 : 1,
                                            color: focusedField === 'email' ? '#800020' : '#6B7280'
                                        }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Mail className="w-5 h-5" />
                                    </motion.div>
                                    <motion.input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        className="w-full pl-11 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                                        placeholder="you@example.com"
                                        whileFocus={{ scale: 1.01 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                            </motion.div>

                            {/* Password Field */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <motion.div
                                        className="absolute left-3 top-1/2 -translate-y-1/2"
                                        animate={{
                                            scale: focusedField === 'password' ? 1.1 : 1,
                                            color: focusedField === 'password' ? '#800020' : '#6B7280'
                                        }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Lock className="w-5 h-5" />
                                    </motion.div>
                                    <motion.input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        className="w-full pl-11 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                                        placeholder="••••••••"
                                        whileFocus={{ scale: 1.01 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#800020] hover:bg-[#600018] text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    whileHover={{ scale: loading ? 1 : 1.02 }}
                                    whileTap={{ scale: loading ? 1 : 0.98 }}
                                >
                                    <AnimatePresence mode="wait">
                                        {loading ? (
                                            <motion.div
                                                key="loading"
                                                className="flex items-center gap-2"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        ease: 'linear'
                                                    }}
                                                >
                                                    <Loader2 className="w-5 h-5" />
                                                </motion.div>
                                                <span>Signing in...</span>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="login"
                                                className="flex items-center gap-2"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <span>Sign In</span>
                                                <motion.div
                                                    whileHover={{ x: 3 }}
                                                    transition={{ type: 'spring', stiffness: 400 }}
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </motion.div>
                        </form>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

export default Login;
