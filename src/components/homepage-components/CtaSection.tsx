'use client';

import { motion } from 'framer-motion';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: EASE },
    },
};

function CtaSection() {
    return (
        <motion.section
            className="px-6 py-16 mx-4 md:mx-8 my-6 mb-6 relative z-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: EASE }}
        >
            <div className="max-w-5xl mx-auto">
                <div className="relative bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0c7490] rounded-3xl border border-white/10 overflow-hidden shadow-[0_8px_40px_rgba(14,165,164,0.2)]">
                    {/* Decorative glows */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#0EA5A4]/20 rounded-full blur-3xl pointer-events-none" />

                    {/* Mesh grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />

                    <motion.div
                        className="relative z-10 text-center px-8 py-14 md:py-16"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.4 }}
                    >
                        {/* Badge */}
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 bg-white/10 rounded-full border border-white/20">
                            <svg className="w-3.5 h-3.5 text-[#67e8f9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-xs font-bold tracking-widest uppercase text-white/80">Get Started Today</span>
                        </motion.div>

                        {/* Heading */}
                        <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-black mb-5 text-white leading-tight">
                            Ready to Stay{' '}
                            <span className="bg-gradient-to-r from-[#7dd3fc] to-[#67e8f9] bg-clip-text text-transparent">
                                Protected?
                            </span>
                        </motion.h2>

                        {/* Description */}
                        <motion.p variants={itemVariants} className="text-white/60 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                            Access real-time disease data, interactive maps, and AI-powered predictions to make informed health decisions.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        >
                            <motion.a
                                href="/dashboard"
                                className="group relative inline-flex items-center gap-3 bg-white text-[#1E3A8A] font-bold px-8 py-4 rounded-xl text-base overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                                <span className="relative z-10">Explore Dashboard</span>
                                <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </motion.a>

                            <motion.a
                                href="#about"
                                className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-xl border border-white/25 hover:bg-white/20 hover:border-white/40 transition-all duration-300 text-base"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            >
                                <span>Learn More</span>
                                <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </motion.a>
                        </motion.div>
                    </motion.div>

                    {/* Bottom shine */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
            </div>
        </motion.section>
    );
}

export default CtaSection;