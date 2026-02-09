'use client';

import { motion } from 'framer-motion';

function FeaturesSection() {
    const features = [
        {
            icon: (
                <svg className="w-7 h-7 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            ),
            title: "Reduce Travel Risk",
            description: "Travelers can quickly see high-risk areas and changing disease patterns, helping them avoid outbreaks and plan safer routes."
        },
        {
            icon: (
                <svg className="w-7 h-7 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            title: "District-Level Insights",
            description: "EpiWatch collects and displays detailed district-level disease reports, giving you accurate and localized health information."
        },
        {
            icon: (
                <svg className="w-7 h-7 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            title: "Awareness for Prevention",
            description: "Learn symptoms, preventive steps, and seasonal disease patterns to protect yourself and your family."
        },
        {
            icon: (
                <svg className="w-7 h-7 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: "Supports Health Preparedness",
            description: "With predictive analytics (coming soon), EpiWatch helps forecast potential outbreaks, enabling early precautions."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };
    return(
        <motion.section
            id="features"
            className="px-6 py-20 mx-4 md:mx-8 my-8 relative z-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Main card with glassmorphism */}
                <motion.div
                    className="relative bg-black/20 backdrop-blur-xl rounded-3xl shadow-[0_20px_70px_rgba(30,58,138,0.15)] border border-white/10 overflow-hidden p-8 md:p-12"
                    initial={{ scale: 0.95, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#1E3A8A]/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0EA5A4]/10 rounded-full blur-3xl"></div>

                    <div className="relative">
                        <div className="text-center mb-12">
                            {/* Badge */}
                            <motion.div
                                className="inline-flex items-center gap-2 mb-6 px-5 py-2 bg-gradient-to-br from-white via-white/90 to-white/80 rounded-full border border-[#1E3A8A]/20 shadow-lg shadow-[#1E3A8A]/10"
                                initial={{ opacity: 0, y: -20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <svg className="w-4 h-4 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                <span className="text-sm font-semibold text-[#1E3A8A]">Platform Features</span>
                            </motion.div>

                            {/* Heading */}
                            <motion.h2
                                className="text-4xl md:text-5xl font-black mb-4 bg-white/80 bg-clip-text text-transparent"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                            >
                                Why Choose EpiWatch Lanka?
                            </motion.h2>
                            <motion.p
                                className="text-white/70 text-lg max-w-2xl mx-auto font-medium"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                Advanced tools and insights to keep you informed and protected
                            </motion.p>
                        </div>

                        <motion.div
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-2"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className="group relative p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-[#0EA5A4]/40 transition-all duration-500 hover:shadow-xl hover:shadow-[#0EA5A4]/20 cursor-pointer"
                                    whileHover={{ scale: 1.05, y: -5 }}
                                >
                                    {/* Icon badge */}
                                    <div className="relative inline-flex items-center justify-center mb-5">
                                        <motion.div
                                            className="relative p-3 bg-gradient-to-br from-white via-white/90 to-white/80 rounded-xl backdrop-blur-sm border border-[#1E3A8A]/20 shadow-lg shadow-[#1E3A8A]/10 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl group-hover:shadow-[#0EA5A4]/30 group-hover:border-[#0EA5A4]/40 transition-all duration-500"
                                            initial={{ rotate: -10, scale: 0 }}
                                            whileInView={{ rotate: 0, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.15 + 0.5, type: "spring", stiffness: 200 }}
                                        >
                                            <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                                                {feature.icon}
                                            </div>
                                            {/* Inner shine effect */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </motion.div>
                                    </div>

                                    {/* Title */}
                                    <motion.h3
                                        className="text-2xl font-black mb-3 bg-white/80 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.15 + 0.6, duration: 0.5 }}
                                    >
                                        {feature.title}
                                    </motion.h3>

                                    {/* Description */}
                                    <motion.p
                                        className="text-white/70 leading-relaxed font-medium"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.15 + 0.7, duration: 0.5 }}
                                    >
                                        {feature.description}
                                    </motion.p>

                                    {/* Bottom indicator */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-[#0EA5A4] to-transparent group-hover:w-3/4 transition-all duration-500 rounded-t-full"></div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Decorative bottom shine */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0EA5A4]/30 to-transparent"></div>
                    </div>
                </motion.div>
            </div>
        </motion.section>

    )
}

export default FeaturesSection;