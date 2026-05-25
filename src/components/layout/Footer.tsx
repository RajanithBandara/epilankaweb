'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { getGsap } from '@/lib/gsap';

const quickLinks = [
    { label: 'About Platform', href: '#about' },
    { label: 'Features', href: '#features' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Disease Map', href: '/map' },
    { label: 'Safety Guide', href: '/safety' },
];

const legalLinks = ['Privacy Policy', 'Terms of Service', 'Contact'];

function Footer() {
    const footerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const { gsap } = getGsap();
        const root = footerRef.current;

        if (!root) {
            return;
        }

        const ctx = gsap.context(() => {
            const container = root.querySelector('.footer-container');
            const items = gsap.utils.toArray<HTMLElement>('.footer-item');

            if (container) {
                gsap.fromTo(
                    container,
                    { opacity: 0, y: 56, scale: 0.98 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.9,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: container,
                            start: "top 95%",
                            end: "top 50%",
                            toggleActions: "play none none reverse",
                        },
                    }
                );
            }

            if (items.length > 0) {
                gsap.fromTo(
                    items,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        stagger: 0.08,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: container,
                            start: "top 85%",
                            toggleActions: "play none none reverse",
                        },
                    }
                );
            }
        }, root);

        return () => ctx.revert();
    }, []);

    return (
        <footer ref={footerRef} className="relative bg-transparent pb-6 pt-4">
            <div className="max-w-8xl mx-auto px-4 sm:px-6">
                <div
                    className="footer-container relative rounded-3xl border border-white/10 overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                        backdropFilter: 'blur(24px)',
                        opacity: 0, // Initial state for GSAP
                    }}
                >
                    {/* Mesh grid overlay — matches CtaSection */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />

                    {/* Decorative corner glows */}
                    <div className="absolute -top-20 -left-20 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-[#0EA5A4]/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Top shine line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="relative z-10 px-8 sm:px-12 pt-10 pb-8">
                        {/* Top grid: Brand | Links | Connect */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
                            {/* ── Brand Column ── */}
                            <div className="footer-item text-center md:text-left opacity-0">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-bold text-white tracking-tight">EpiWatch Lanka</span>
                                </div>
                                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto md:mx-0 mb-6">
                                    Sri Lanka&#39;s intelligent infectious disease awareness and prediction platform.
                                </p>
                                {/* Platform badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/15">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#67e8f9] animate-pulse" />
                                    <span className="text-xs font-bold text-white/70 tracking-widest uppercase">Live Platform</span>
                                </div>
                            </div>

                            {/* ── Quick Links ── */}
                            <div className="footer-item text-center opacity-0">
                                <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-5 flex items-center justify-center gap-2">
                                    <span className="block w-4 h-px bg-white/30" />
                                    Quick Links
                                    <span className="block w-4 h-px bg-white/30" />
                                </h3>
                                <div className="flex flex-col gap-2.5">
                                    {quickLinks.map((link) => (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            className="group inline-flex items-center justify-center gap-1.5 text-white/60 text-sm font-medium hover:text-[#67e8f9] transition-colors duration-200"
                                        >
                                            <svg
                                                className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-[#67e8f9]"
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* ── Connect ── */}
                            <div className="footer-item text-center md:text-right opacity-0">
                                <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-5 flex items-center justify-center md:justify-end gap-2">
                                    <span className="block w-4 h-px bg-white/30" />
                                    Connect
                                    <span className="block w-4 h-px bg-white/30" />
                                </h3>

                                <div className="flex justify-center md:justify-end gap-3 mb-5">
                                    {/* Facebook */}
                                    <motion.a
                                        href="#"
                                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] border border-white/15 text-white/70 hover:text-[#67e8f9] hover:bg-white/15 hover:border-[#67e8f9]/40 transition-all duration-300"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </motion.a>
                                    {/* Twitter/X */}
                                    <motion.a
                                        href="#"
                                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] border border-white/15 text-white/70 hover:text-[#67e8f9] hover:bg-white/15 hover:border-[#67e8f9]/40 transition-all duration-300"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                        </svg>
                                    </motion.a>
                                    {/* Telegram */}
                                    <motion.a
                                        href="#"
                                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] border border-white/15 text-white/70 hover:text-[#67e8f9] hover:bg-white/15 hover:border-[#67e8f9]/40 transition-all duration-300"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.308-.346-.11l-6.4 4.03-2.76-.918c-.6-.187-.612-.6.125-.89l10.782-4.156c.5-.18.943.112.78.89z" />
                                        </svg>
                                    </motion.a>
                                </div>

                                <a
                                    href="mailto:contact@epiwatch.lk"
                                    className="group inline-flex items-center justify-center md:justify-end gap-2 text-white/60 text-sm font-medium hover:text-[#67e8f9] transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    contact@epiwatch.lk
                                </a>
                            </div>
                        </div>

                        {/* Teal gradient divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-[#67e8f9]/30 to-transparent mb-6" />

                        {/* Bottom Bar */}
                        <div
                            className="footer-item flex flex-col sm:flex-row justify-between items-center gap-4 opacity-0"
                        >
                            <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
                                <svg className="w-3.5 h-3.5 text-[#67e8f9]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                © 2026 EpiWatch Lanka. All rights reserved.
                            </div>
                            <div className="flex gap-5 text-xs font-medium">
                                {legalLinks.map((item, i) => (
                                    <span key={item} className="flex items-center gap-5">
                                        <a href="#" className="text-white/40 hover:text-[#67e8f9] transition-colors duration-200">
                                            {item}
                                        </a>
                                        {i < legalLinks.length - 1 && (
                                            <span className="text-white/20">·</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom shine line */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
            </div>
        </footer>
    );
}

export default Footer;
