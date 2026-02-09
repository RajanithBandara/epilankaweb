'use client';

import { motion } from 'framer-motion';

function StatSection() {
    const stats = [
        {
            icon: (
                <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            value: "25+",
            label: "Districts Covered"
        },
        {
            icon: (
                <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            value: "Real-Time",
            label: "Disease Tracking"
        },
        {
            icon: (
                <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            value: "AI-Powered",
            label: "Predictions"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };
    return (
        <motion.section
            className="py-6 px-6 mx-4 md:mx-8 -mt-12 relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
        >
            <div className="max-w-5xl mx-auto">
                {/* Main card with enhanced glassmorphism */}
                <motion.div
                    className="relative bg-black/20 backdrop-blur-xl rounded-3xl shadow-[0_20px_70px_rgba(30,58,138,0.15)] border border-white/10 overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >

                    {/* Decorative elements */}
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#1E3A8A]/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#0EA5A4]/10 rounded-full blur-3xl"></div>

                    {/* Stats grid */}
                    <div className="relative grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-300/30">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                className="group relative p-6 md:p-8 text-center transition-all duration-500 hover:to-transparent cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                            >

                                {/* Icon container with enhanced effects */}
                                <div className="relative inline-flex items-center justify-center mb-3">

                                    {/* Icon badge */}
                                    <motion.div
                                        className="relative p-3 bg-gradient-to-br from-white via-white/90 to-white/80 rounded-xl backdrop-blur-sm border border-[#1E3A8A]/20 shadow-lg shadow-[#1E3A8A]/10 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl group-hover:shadow-[#0EA5A4]/30 group-hover:border-[#0EA5A4]/40 transition-all duration-500"
                                        initial={{ rotate: -10, scale: 0 }}
                                        whileInView={{ rotate: 0, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.2 + 0.5, type: "spring", stiffness: 200 }}
                                    >
                                        <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                                            {stat.icon}
                                        </div>

                                        {/* Inner shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </motion.div>
                                </div>

                                {/* Value with enhanced gradient */}
                                <div className="relative mb-1">
                                    <motion.div
                                        className="text-3xl md:text-4xl font-black bg-white/80 bg-clip-text text-transparent group-hover:scale-105 transition-all duration-500 inline-block"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.2 + 0.6, duration: 0.5 }}
                                    >
                                        {stat.value}
                                    </motion.div>

                                    {/* Animated underline */}
                                    <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-[#0EA5A4] to-transparent mx-auto mt-1 transition-all duration-500 rounded-full"></div>
                                </div>

                                {/* Label */}
                                <motion.div
                                    className="text-white/70 text-sm font-medium tracking-wide"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.2 + 0.7, duration: 0.5 }}
                                >
                                    {stat.label}
                                </motion.div>

                                {/* Bottom indicator */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-[#0EA5A4] to-transparent group-hover:w-3/4 transition-all duration-500 rounded-t-full"></div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom shine effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0EA5A4]/30 to-transparent"></div>
                </motion.div>
            </div>
        </motion.section>
    )
}

export default StatSection;