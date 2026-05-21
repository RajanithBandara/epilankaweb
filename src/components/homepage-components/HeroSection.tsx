'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';

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
                        className="group relative inline-flex items-center gap-3 bg-white text-[#1E3A8A] font-bold px-8 py-4 rounded-xl text-base overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => {
                            if (loading) e.preventDefault();
                            else {
                                e.preventDefault();
                                handleCTA();
                            }
                        }}
                        whileHover={!loading ? { scale: 1.04 } : {}}
                        whileTap={!loading ? { scale: 0.96 } : {}}
                        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                        style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        <span className="relative z-10">{loading ? 'Loading...' : buttonText}</span>
                        {!loading && (
                            <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        )}
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
