'use client';

import { motion } from 'framer-motion';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function Footer() {
    const containerVariants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.08, delayChildren: 0.05 },
        },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.45, ease: EASE },
        },
    };

    return (
        <motion.footer
            className="relative mt-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: EASE }}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-[#0f1e45]/90 backdrop-blur-xl border-t border-white/10" />

            <div className="relative max-w-5xl mx-auto px-6 py-12">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    {/* Brand */}
                    <motion.div variants={itemVariants} className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/15">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold text-white">EpiWatch Lanka</span>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                            Sri Lanka&#39;s intelligent infectious disease awareness and prediction platform.
                        </p>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div variants={itemVariants} className="text-center">
                        <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-4">Quick Links</h3>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { label: 'About Platform', href: '#about' },
                                { label: 'Features', href: '#features' },
                                { label: 'Dashboard', href: '/dashboard' },
                                { label: 'Disease Map', href: '/dashboard/map' },
                            ].map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="text-white/60 text-sm hover:text-[#67e8f9] transition-colors duration-200"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Connect */}
                    <motion.div variants={itemVariants} className="text-center md:text-right">
                        <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-4">Connect With Us</h3>
                        <div className="flex justify-center md:justify-end gap-2.5 mb-4">
                            {/* Facebook */}
                            <motion.a
                                href="#"
                                className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                                whileHover={{ scale: 1.1, rotate: 4 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </motion.a>
                            {/* Twitter/X */}
                            <motion.a
                                href="#"
                                className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                                whileHover={{ scale: 1.1, rotate: 4 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                            </motion.a>
                            {/* Telegram */}
                            <motion.a
                                href="#"
                                className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                                whileHover={{ scale: 1.1, rotate: 4 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.308-.346-.11l-6.4 4.03-2.76-.918c-.6-.187-.612-.6.125-.89l10.782-4.156c.5-.18.943.112.78.89z" />
                                </svg>
                            </motion.a>
                        </div>
                        <p className="text-white/60 text-sm">contact@epiwatch.lk</p>
                    </motion.div>
                </motion.div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="text-white/40 text-xs text-center md:text-left">
                        © 2026 EpiWatch Lanka. All rights reserved.
                    </div>
                    <div className="flex gap-5 text-xs">
                        {['Privacy Policy', 'Terms of Service', 'Contact'].map((item) => (
                            <a key={item} href="#" className="text-white/40 hover:text-white/70 transition-colors duration-200">
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </motion.footer>
    );
}

export default Footer;