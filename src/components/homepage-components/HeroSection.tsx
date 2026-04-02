'use client';

import { motion } from 'framer-motion';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
});

function HeroSection() {
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="/dashboard"
                        className="group relative inline-flex items-center gap-3 bg-white text-black font-bold px-10 py-5 rounded-xl shadow-[0_20px_60px_rgba(255,255,255,0.3)] hover:shadow-[0_20px_80px_rgba(255,255,255,0.5)] transition-all duration-300 text-lg overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        <span className="relative z-10">Go to Dashboard</span>
                        <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </motion.a>

                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="#about"
                        className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xl text-white font-bold px-10 py-5 rounded-xl border-2 border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 text-lg shadow-xl"
                    >
                        <span>Learn More</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
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