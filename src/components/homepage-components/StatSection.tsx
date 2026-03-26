'use client';

import { motion } from 'framer-motion';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.45, ease: EASE },
    }),
};

function StatSection() {
    const stats = [
        {
            icon: (
                <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            value: '25+',
            label: 'Districts Covered',
        },
        {
            icon: (
                <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            value: 'Real-Time',
            label: 'Disease Tracking',
        },
        {
            icon: (
                <svg className="w-5 h-5 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            value: 'AI-Powered',
            label: 'Predictions',
        },
    ];

    return (
        <motion.section
            className="py-6 px-6 mx-4 md:mx-8 -mt-12 relative z-10"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: EASE }}
        >
            <div className="max-w-5xl mx-auto">
                <div className="relative bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
                    {/* Decorative glows */}
                    <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#1E3A8A]/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#0EA5A4]/15 rounded-full blur-3xl pointer-events-none" />

                    {/* Stats grid */}
                    <div className="relative grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                custom={index}
                                variants={cardVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.5 }}
                                className="group relative p-8 text-center cursor-pointer"
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                            >
                                {/* Icon container */}
                                <div className="inline-flex items-center justify-center mb-4">
                                    <div className="p-3 bg-white rounded-xl border border-[#1E3A8A]/15 shadow-md group-hover:scale-110 group-hover:rotate-3 group-hover:border-[#0EA5A4]/40 transition-all duration-300">
                                        {stat.icon}
                                    </div>
                                </div>

                                {/* Value */}
                                <div className="text-3xl md:text-4xl font-black text-white mb-1 group-hover:scale-105 transition-transform duration-300">
                                    {stat.value}
                                </div>

                                {/* Label */}
                                <div className="text-white/60 text-sm font-medium tracking-wide">
                                    {stat.label}
                                </div>

                                {/* Bottom indicator */}
                                <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-[#1E3A8A]/60 via-[#0EA5A4] to-[#1E3A8A]/60 transition-all duration-500 rounded-b-full" />
                            </motion.div>
                        ))}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0EA5A4]/30 to-transparent" />
                </div>
            </div>
        </motion.section>
    );
}

export default StatSection;