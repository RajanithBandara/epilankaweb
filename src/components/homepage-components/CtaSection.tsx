'use client';

import { motion } from 'framer-motion';

function CtaSection() {
    return(
        <motion.section
            className="px-6 py-20 mx-4 md:mx-8 my-8 mb-20 relative z-10"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <motion.div
                className="relative bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] rounded-3xl shadow-[0_20px_70px_rgba(30,58,138,0.3)] border border-[#1E3A8A]/30 overflow-hidden"
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Decorative blur elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-50"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10 px-8 py-12">
                    {/* Icon */}
                    <motion.div
                        className="inline-flex items-center justify-center mb-6"
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </motion.div>

                    {/* Heading */}
                    <motion.h2
                        className="text-4xl md:text-6xl font-black mb-6 text-white drop-shadow-2xl"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        Ready to Stay Protected?
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                        className="text-xl md:text-2xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-lg"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        Access real-time disease data, interactive maps, and AI-powered predictions to make informed health decisions.
                    </motion.p>

                    {/* CTA Button */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                    >
                        <motion.a
                            href="/dashboard"
                            className="group relative inline-flex items-center gap-3 bg-white text-[#1E3A8A] font-bold px-10 py-5 rounded-xl shadow-[0_20px_40px_rgba(255,255,255,0.2)] transition-all duration-300 text-lg overflow-hidden"
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(255,255,255,0.4)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* Button shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                            <span className="relative z-10">Explore Dashboard</span>
                            <svg className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </motion.a>

                        <motion.a
                            href="#about"
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white font-semibold px-8 py-5 rounded-xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 text-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>Learn More</span>
                        </motion.a>
                    </motion.div>
                </div>

                {/* Bottom shine effect */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </motion.div>
        </motion.section>
    )
}

export default CtaSection;