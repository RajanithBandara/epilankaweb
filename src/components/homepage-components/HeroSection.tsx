'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { ShinyButton } from "@/components/ui/shiny-button";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
});

function HeroSection() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const user = await account.get();
                setIsLoggedIn(!!user);
            } catch {
                setIsLoggedIn(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const handleCTA = () => {
        if (isLoggedIn) {
            router.push('/dashboard');
        } else {
            router.push('/signup');
        }
    };

    const buttonText = isLoggedIn ? 'Go to Dashboard' : 'Get Started';

    return (
        <section className="relative px-6 py-24 text-center min-h-screen flex items-center justify-center">
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Badge */}
                <motion.div
                    {...fadeUp(0)}
                    className="inline-flex items-center gap-2 mb-6 px-5 py-3 bg-white/15 backdrop-blur-xl rounded-full border border-white/30 shadow-2xl"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
                        className="flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </motion.div>
                    <span className="text-sm font-bold text-white tracking-wide">Disease Surveillance Platform</span>
                </motion.div>

                {/* Main Heading */}
                <motion.p
                    {...fadeUp(0.1)}
                    className="text-6xl font-bold md:text-7xl mb-8 leading-tight text-white drop-shadow-2xl"
                >
                    EpiWatch Lanka
                </motion.p>

                {/* Subheading */}
                <motion.p
                    {...fadeUp(0.2)}
                    className="text-xl md:text-3xl max-w-4xl mx-auto mb-4 text-white/95 leading-relaxed font-semibold drop-shadow-lg"
                >
                    Sri Lanka&#39;s intelligent infectious disease awareness and prediction platform.
                </motion.p>
                <motion.p
                    {...fadeUp(0.28)}
                    className="text-lg md:text-xl text-white/80 mb-12 font-medium drop-shadow-md"
                >
                    Stay informed, stay protected — wherever you travel.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    {...fadeUp(0.36)}
                    className="flex flex-col sm:flex-row gap-5 justify-center items-center"
                >
                    <motion.a
                        href="/dashboard"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        className="group relative"
                        onClick={(e) => {
                            e.preventDefault();
                            handleCTA();
                        }}
                    >
                        <button
                            disabled={loading}
                            className="relative inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-white/90 border border-white/30 rounded-lg backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300">
                            {loading ? 'Loading...' : buttonText}
                            <svg
                                className="w-6 h-6 opacity-60 group-hover:opacity-100 transition-opacity"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </motion.a>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                </motion.div>
            </div>
        </section>
    );
}

export default HeroSection;