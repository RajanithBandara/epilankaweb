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

function AboutSection() {
    return (
        <motion.section
            id="about"
            className="px-6 py-16 mx-4 md:mx-8 my-6 relative z-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: EASE }}
        >
            <div className="max-w-5xl mx-auto">
                <div className="relative bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden p-8 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
                    {/* Decorative glows */}
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#1E3A8A]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#0EA5A4]/15 rounded-full blur-3xl pointer-events-none" />

                    <motion.div
                        className="relative text-center"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.5 }}
                    >
                        {/* Badge */}
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 bg-white/10 rounded-full border border-white/20">
                            <svg className="w-3.5 h-3.5 text-[#67e8f9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-bold tracking-widest uppercase text-white/80">About the Platform</span>
                        </motion.div>

                        {/* Heading */}
                        <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-black mb-5 text-white">
                            What Is{' '}
                            <span className="bg-gradient-to-r from-[#7dd3fc] to-[#67e8f9] bg-clip-text text-transparent">
                                EpiWatch Lanka?
                            </span>
                        </motion.h2>

                        {/* Description */}
                        <motion.p variants={itemVariants} className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                            EpiWatch Lanka provides real-time district-level disease information, interactive heatmaps,
                            and analytical insights. The platform transforms weekly epidemiology reports into
                            user-friendly visual data, helping citizens and health authorities understand disease trends.
                        </motion.p>
                    </motion.div>

                    {/* Bottom shine */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0EA5A4]/40 to-transparent" />
                </div>
            </div>
        </motion.section>
    );
}

export default AboutSection;