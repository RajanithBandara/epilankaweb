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
    hidden: { opacity: 0, y: 28 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: EASE },
    },
};

const features = [
    {
        icon: (
            <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
        ),
        title: 'Reduce Travel Risk',
        description: 'Travelers can quickly see high-risk areas and changing disease patterns, helping them avoid outbreaks and plan safer routes.',
    },
    {
        icon: (
            <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        title: 'District-Level Insights',
        description: 'EpiWatch collects and displays detailed district-level disease reports, giving you accurate and localized health information.',
    },
    {
        icon: (
            <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        title: 'Awareness for Prevention',
        description: 'Learn about symptoms, preventive steps, and seasonal disease patterns to protect yourself and your family.',
    },
    {
        icon: (
            <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        title: 'Supports Health Preparedness',
        description: 'With predictive analytics (coming soon), EpiWatch helps forecast potential outbreaks, enabling early precautions.',
    },
];

function FeaturesSection() {
    return (
        <motion.section
            id="features"
            className="px-6 py-16 mx-4 md:mx-8 my-6 relative z-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: EASE }}
        >
            <div className="max-w-5xl mx-auto">
                <div className="relative bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden p-8 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
                    {/* Decorative glows */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(30, 58, 138, 0.15) 0%, transparent 70%)' }} />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(14, 165, 164, 0.10) 0%, transparent 70%)' }} />

                    <div className="relative">
                        {/* Section Header */}
                        <motion.div
                            className="text-center mb-10"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.6 }}
                        >
                            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 bg-white/10 rounded-full border border-white/20">
                                <svg className="w-3.5 h-3.5 text-[#67e8f9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                <span className="text-xs font-bold tracking-widest uppercase text-white/80">Platform Features</span>
                            </motion.div>

                            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-black mb-4 text-white">
                                Why Choose{' '}
                                <span className="bg-gradient-to-r from-[#7dd3fc] to-[#67e8f9] bg-clip-text text-transparent">
                                    EpiWatch Lanka?
                                </span>
                            </motion.h2>

                            <motion.p variants={itemVariants} className="text-white/60 text-base md:text-lg max-w-xl mx-auto">
                                Advanced tools and real-time insights to keep you informed and protected.
                            </motion.p>
                        </motion.div>

                        {/* Feature Cards Grid */}
                        <motion.div
                            className="grid gap-4 sm:grid-cols-2"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.15 }}
                        >
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="group relative flex flex-col p-5 bg-white/[0.05] rounded-2xl border border-white/10 hover:border-[#0EA5A4]/40 hover:bg-white/[0.08] transition-all duration-300 overflow-hidden"
                                    whileHover={{ y: -3 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                >
                                    {/* Subtle glow on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5A4]/0 to-[#1E3A8A]/0 group-hover:from-[#0EA5A4]/5 group-hover:to-transparent transition-all duration-500 rounded-2xl pointer-events-none" />

                                    {/* Icon + Title row */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex-shrink-0 p-2.5 bg-white rounded-xl border border-[#1E3A8A]/15 shadow-sm group-hover:scale-110 group-hover:border-[#0EA5A4]/40 transition-all duration-300">
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-base font-bold text-white leading-snug">
                                            {feature.title}
                                        </h3>
                                    </div>

                                    {/* Description */}
                                    <p className="text-white/60 text-sm leading-relaxed">
                                        {feature.description}
                                    </p>

                                    {/* Bottom accent line */}
                                    <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-[#1E3A8A]/60 via-[#0EA5A4] to-[#1E3A8A]/60 transition-all duration-500" />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Bottom shine */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0EA5A4]/40 to-transparent" />
                </div>
            </div>
        </motion.section>
    );
}

export default FeaturesSection;