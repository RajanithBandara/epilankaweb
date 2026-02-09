'use client';

import { motion } from 'framer-motion';

function Footer(){
    return(
        <motion.footer
            className="relative mt-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            {/* Glassmorphism blur background */}
            <div className="absolute inset-0 bg-[#1E3A8A]/80 backdrop-blur-xl border-t border-white/10"></div>

            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-6 py-12">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.2,
                                delayChildren: 0.2
                            }
                        }
                    }}
                >
                    {/* Brand Section */}
                    <motion.div
                        className="text-center md:text-left"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                        }}
                    >
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div className="text-2xl font-bold text-white">EpiWatch Lanka</div>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                            Sri Lanka&#39;s intelligent infectious disease awareness and prediction platform.
                        </p>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        className="text-center"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                        }}
                    >
                        <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                        <div className="flex flex-col gap-2">
                            <a href="#about" className="text-white/70 hover:text-white transition-colors duration-200">About Platform</a>
                            <a href="#features" className="text-white/70 hover:text-white transition-colors duration-200">Features</a>
                            <a href="/dashboard" className="text-white/70 hover:text-white transition-colors duration-200">Dashboard</a>
                            <a href="/dashboard/map" className="text-white/70 hover:text-white transition-colors duration-200">Disease Map</a>
                        </div>
                    </motion.div>

                    {/* Contact & Social */}
                    <motion.div
                        className="text-center md:text-right"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                        }}
                    >
                        <h3 className="text-white font-bold text-lg mb-4">Connect With Us</h3>
                        <div className="flex justify-center md:justify-end gap-3 mb-4">
                            <motion.a
                                href="#"
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </motion.a>
                            <motion.a
                                href="#"
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </motion.a>
                            <motion.a
                                href="#"
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.308-.346-.11l-6.4 4.03-2.76-.918c-.6-.187-.612-.6.125-.89l10.782-4.156c.5-.18.943.112.78.89z"/>
                                </svg>
                            </motion.a>
                        </div>
                        <p className="text-white/70 text-sm">contact@epiwatch.lk</p>
                    </motion.div>
                </motion.div>

                {/* Bottom Bar */}
                <motion.div
                    className="pt-8 border-t border-white/10"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-white/60 text-sm text-center md:text-left">
                            © 2026 EpiWatch Lanka. All rights reserved.
                        </div>
                        <div className="flex gap-6 text-sm">
                            <a href="#" className="text-white/60 hover:text-white transition-colors duration-200">Privacy Policy</a>
                            <a href="#" className="text-white/60 hover:text-white transition-colors duration-200">Terms of Service</a>
                            <a href="#" className="text-white/60 hover:text-white transition-colors duration-200">Contact</a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.footer>
    )
}

export default Footer;