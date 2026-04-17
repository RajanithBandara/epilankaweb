'use client';

import { motion } from 'framer-motion';
import { LogIn, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import api from '@/lib/api';

function NavBar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [hideAvatarImage, setHideAvatarImage] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const currentPath = pathname ?? '/';
    const { user, loading } = useAuth();

    const navItems = [
        { href: '/', label: 'Home' },
        { href: '/map', label: 'Map' },
        { href: '/safety', label: 'Safety Guide' },
    ];

    const isActivePath = (href: string) => {
        if (href === '/') return currentPath === '/';
        return currentPath === href || currentPath.startsWith(`${href}/`);
    };

    const displayName = user?.name || user?.email?.split('@')[0] || 'User';
    const avatarLetter = displayName ? displayName[0].toUpperCase() : 'U';
    const userPrefs = (user?.prefs ?? {}) as Record<string, unknown>;
    const avatarImage = [
        userPrefs.profile_image,
        userPrefs.avatar,
        userPrefs.picture,
        userPrefs.photoURL,
        userPrefs.photo_url,
        userPrefs.image,
    ].find((value): value is string => typeof value === 'string' && /^https?:\/\//.test(value)) ?? null;
    const resolvedAvatarImage = profileImage || avatarImage;

    useEffect(() => {
        let isCancelled = false;

        const loadNavbarProfileImage = async () => {
            if (!user) {
                setProfileImage(null);
                return;
            }

            try {
                const response = await api.get('/users/me');
                const image =
                    typeof response?.data?.user?.profile_image === 'string' && response.data.user.profile_image.trim().length > 0
                        ? response.data.user.profile_image
                        : null;

                if (!isCancelled) setProfileImage(image);
            } catch {
                if (!isCancelled) setProfileImage(null);
            }
        };

        void loadNavbarProfileImage();
        return () => {
            isCancelled = true;
        };
    }, [user]);

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
                        <div className="absolute inset-0 rounded-full bg-linear-to-r from-white/5 via-transparent to-white/5"></div>

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
                                {navItems.map((item) => {
                                    const isActive = isActivePath(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            aria-current={isActive ? 'page' : undefined}
                                            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm ${
                                                isActive
                                                    ? 'bg-white/20 text-white border border-white/25'
                                                    : 'text-white/90 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </motion.div>

                            {/* Desktop Auth Action */}
                            <motion.div
                                className="hidden sm:flex items-center gap-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                {loading ? (
                                    <div className="h-10 w-10 rounded-full bg-white/15 border border-white/25 animate-pulse" />
                                ) : user ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="cursor-pointer h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/25 hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden text-white"
                                        onClick={() => router.push('/dashboard')}
                                        aria-label="Go to dashboard"
                                        title={`${displayName}\n${user?.email}`}
                                    >
                                        {resolvedAvatarImage && !hideAvatarImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={resolvedAvatarImage}
                                                alt="Profile"
                                                className="h-full w-full object-cover"
                                                onError={() => setHideAvatarImage(true)}
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-white text-sm font-semibold">
                                                {avatarLetter || <User className="h-4 w-4" />}
                                            </span>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="cursor-pointer px-4 md:px-5 py-2 h-10 bg-white/10 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-sm inline-flex items-center gap-2"
                                        onClick={() => router.push('/login')}
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Sign In
                                    </Button>
                                )}
                            </motion.div>

                            {/* Mobile Menu Button */}
                            <motion.div
                                className="sm:hidden"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                    <SheetTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                                            aria-label="Toggle mobile menu"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {isMobileMenuOpen ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                )}
                                            </svg>
                                        </Button>
                                    </SheetTrigger>

                                    <SheetContent
                                        side="top"
                                        className="top-20 right-4 left-4 sm:hidden z-50 bg-[#1E3A8A]/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden p-0 text-white"
                                    >
                                        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                                        <div className="p-6 space-y-4">
                                            {/* Mobile Navigation Links */}
                                            <div className="space-y-2">
                                                {navItems.map((item) => {
                                                    const isActive = isActivePath(item.href);
                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            aria-current={isActive ? 'page' : undefined}
                                                            className={`block px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                                                isActive
                                                                    ? 'bg-white/20 text-white border border-white/25'
                                                                    : 'text-white/90 hover:text-white hover:bg-white/10'
                                                            }`}
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                        >
                                                            {item.label}
                                                        </Link>
                                                    );
                                                })}
                                            </div>

                                            {/* Mobile Auth Action */}
                                            <div className="pt-4 border-t border-white/10 space-y-2">
                                                {loading ? (
                                                    <div className="h-11 w-full rounded-xl bg-white/15 border border-white/25 animate-pulse" />
                                                ) : user ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="w-full h-auto px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 font-semibold transition-all duration-300 inline-flex items-center justify-start gap-3"
                                                        onClick={() => {
                                                            router.push('/dashboard');
                                                            setIsMobileMenuOpen(false);
                                                        }}
                                                    >
                                                        {resolvedAvatarImage && !hideAvatarImage ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={resolvedAvatarImage}
                                                                alt="Profile"
                                                                className="h-7 w-7 rounded-full object-cover"
                                                                onError={() => setHideAvatarImage(true)}
                                                            />
                                                        ) : (
                                                            <span className="h-7 w-7 rounded-full bg-white/20 inline-flex items-center justify-center text-xs font-semibold">
                                                                {avatarLetter}
                                                            </span>
                                                        )}
                                                        Go to Dashboard
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="w-full h-auto px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2"
                                                        onClick={() => {
                                                            router.push('/login');
                                                            setIsMobileMenuOpen(false);
                                                        }}
                                                    >
                                                        <LogIn className="h-4 w-4" />
                                                        Sign In
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </nav>
        </>
    );
}

export default NavBar;
