'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

function NavBar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="app-navbar fixed top-0 left-0 right-0 z-50 px-4 pt-4">
                {/* Centered bubble container */}
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="relative bg-[#1E3A8A]/90 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl shadow-[#1E3A8A]/20 px-4 sm:px-6 py-3"
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {/* Inner glow effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/5 via-transparent to-white/5"></div>

                        {/* Content */}
                        <div className="relative flex items-center justify-between">
                            {/* Brand Logo */}
                            <motion.div
                                className="flex items-center gap-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-lg">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="text-base sm:text-lg md:text-xl font-bold text-white cursor-pointer hover:text-white/90 transition-all duration-300">
                                    EpiWatch Lanka
                                </div>
                            </motion.div>

                            {/* Desktop Navigation Links */}
                            <motion.div
                                className="hidden lg:flex items-center gap-1 bg-white/5 rounded-full px-2 py-1.5 border border-white/10"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <a href="\" className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full font-medium transition-all duration-200 text-sm">
                                    Home
                                </a>
                                <a href="/map" className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full font-medium transition-all duration-200 text-sm">
                                    Map
                                </a>
                                <a href="/dashboard" className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full font-medium transition-all duration-200 text-sm">
                                    Dashboard
                                </a>
                            </motion.div>

                            {/* Desktop Action Buttons */}
                            <motion.div
                                className="hidden sm:flex items-center gap-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                <motion.button
                                    className="px-4 md:px-5 py-2 bg-white/10 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-sm"
                                    onClick={() => window.location.href = "/login"}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Sign In
                                </motion.button>
                                <motion.button
                                    className="px-4 md:px-5 py-2 bg-[#0EA5A4] text-white rounded-full hover:bg-[#0d9190] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl border border-[#0EA5A4]/30 text-sm"
                                    onClick={() => window.location.href = "/signup"}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Sign Up
                                </motion.button>
                            </motion.div>

                            {/* Mobile Menu Button */}
                            <motion.button
                                className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Mobile Menu Drawer */}
                        <motion.div
                            className="fixed top-20 right-4 left-4 sm:hidden z-50 bg-[#1E3A8A]/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <div className="p-6 space-y-4">
                                {/* Mobile Navigation Links */}
                                <div className="space-y-2">
                                    <a
                                        href="#about"
                                        className="block px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all duration-200"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        About Platform
                                    </a>
                                    <a
                                        href="#features"
                                        className="block px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all duration-200"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Features
                                    </a>
                                    <a
                                        href="/dashboard"
                                        className="block px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all duration-200"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </a>
                                </div>

                                {/* Mobile Action Buttons */}
                                <div className="pt-4 border-t border-white/10 space-y-2">
                                    <button
                                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/20 hover:bg-white/20 font-semibold transition-all duration-300"
                                        onClick={() => {
                                            window.location.href = "/login";
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        className="w-full px-4 py-3 bg-[#0EA5A4] text-white rounded-xl hover:bg-[#0d9190] font-semibold transition-all duration-300 border border-[#0EA5A4]/30"
                                        onClick={() => {
                                            window.location.href = "/signup";
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default NavBar;
