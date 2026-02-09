'use client';

import { motion } from 'framer-motion';

function AboutSection() {
    return (
        <motion.section
            id="about"
            className="px-6 py-12 mx-4 md:mx-8 my-8 relative z-10"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <div className="max-w-4xl mx-auto">
                {/* Main card with glassmorphism */}
                <motion.div
                    className="relative bg-black/20 backdrop-blur-xl rounded-3xl shadow-[0_20px_70px_rgba(30,58,138,0.15)] border border-white/10 overflow-hidden p-8 md:p-12"
                    whileInView={{ scale: [0.95, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >

                    {/* Decorative elements */}
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#1E3A8A]/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#0EA5A4]/10 rounded-full blur-3xl"></div>

                    <div className="relative text-center">
                        {/* Badge */}
                        <motion.div
                            className="inline-flex items-center gap-2 mb-6 px-5 py-2 bg-gradient-to-br from-white via-white/90 to-white/80 rounded-full border border-[#1E3A8A]/20 shadow-lg shadow-[#1E3A8A]/10"
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            <svg className="w-4 h-4 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-semibold text-[#1E3A8A]">About the Platform</span>
                        </motion.div>

                        {/* Heading */}
                        <motion.h2
                            className="text-4xl md:text-5xl font-black mb-6 bg-white/80 bg-clip-text text-transparent"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            What Is EpiWatch Lanka?
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            className="text-white/70 text-lg leading-relaxed font-medium"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                        >
                            EpiWatch Lanka provides real-time district-level disease information, interactive heatmaps,
                            and analytical insights. The platform transforms weekly epidemiology reports into
                            user-friendly visual data, helping citizens and health authorities understand disease trends.
                        </motion.p>

                        {/* Decorative bottom shine */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0EA5A4]/30 to-transparent"></div>
                    </div>
                </motion.div>
            </div>
        </motion.section>
    )
}

export default AboutSection;