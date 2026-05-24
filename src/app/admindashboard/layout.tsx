"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    LayoutDashboard,
    Users,
    Database,
    History,
    LogOut,
    ShieldCheck,
    Stethoscope,
    Bell,
    MapPin,
    Loader2,
    BriefcaseMedical,
    Menu,
    X,
    Moon,
    Sun,
    CloudRain,
    FileText
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";

type NavItem = {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = { heading: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
    {
        heading: "General",
        items: [
            { label: "Overview", href: "/admindashboard", icon: LayoutDashboard },
        ],
    },
    {
        heading: "People",
        items: [
            { label: "Users",    href: "/admindashboard/users",    icon: Users },
            { label: "Admins",   href: "/admindashboard/admins",   icon: ShieldCheck },
            { label: "Officers", href: "/admindashboard/officers", icon: BriefcaseMedical },
        ],
    },
    {
        heading: "Data",
        items: [
            { label: "Diseases",      href: "/admindashboard/diseases",      icon: Stethoscope },
            { label: "Districts",     href: "/admindashboard/districts",     icon: MapPin },
            { label: "Notifications", href: "/admindashboard/notifications", icon: Bell },
            { label: "User Reports",  href: "/admindashboard/reports",       icon: FileText },
            { label: "Rainfall",      href: "/admindashboard/rainfall",      icon: CloudRain },
        ],
    },
    {
        heading: "System",
        items: [
            { label: "Tables",  href: "/admindashboard/tables",      icon: Database },
            { label: "History", href: "/admindashboard/historydata", icon: History },
        ],
    },
];

const PAGE_TITLES: Record<string, string> = {
    "/admindashboard":              "Overview",
    "/admindashboard/users":        "User Management",
    "/admindashboard/admins":       "Admin Accounts",
    "/admindashboard/officers":     "Health Officers",
    "/admindashboard/diseases":     "Disease Management",
    "/admindashboard/districts":    "District Management",
    "/admindashboard/notifications":"Notification Centre",
    "/admindashboard/reports":      "User Reports",
    "/admindashboard/rainfall":     "Rainfall Data",
    "/admindashboard/tables":       "Database Browser",
    "/admindashboard/historydata":  "Historical Data",
};

const PAGE_SUBTITLES: Record<string, string> = {
    "/admindashboard":              "At-a-glance metrics and quick actions",
    "/admindashboard/users":        "View, edit, ban, or remove user accounts",
    "/admindashboard/admins":       "Manage system administrators",
    "/admindashboard/officers":     "Manage registered health officers",
    "/admindashboard/diseases":     "Add, edit, or remove tracked diseases",
    "/admindashboard/districts":    "Add, edit, or remove geographic districts",
    "/admindashboard/notifications":"Broadcast and manage notifications",
    "/admindashboard/reports":      "View submitted disease reports from civilians",
    "/admindashboard/rainfall":     "View and sync monthly rainfall data",
    "/admindashboard/tables":       "Inspect raw PostgreSQL tables",
    "/admindashboard/historydata":  "Add or review weekly case records",
};

/** Refresh interval: 45 minutes (JWT lasts ~1h, cookie 55min) */
const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

type AdminUser = { name?: string; email?: string };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router   = useRouter();
    const [ready, setReady] = useState(false);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initialize theme
    useEffect(() => {
        if (typeof window !== "undefined") {
            const isDark = document.documentElement.classList.contains("dark");
            setTheme(isDark ? "dark" : "light");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        document.documentElement.style.colorScheme = newTheme;
        localStorage.setItem("theme", newTheme);
    };

    const refreshSession = useCallback(async (): Promise<boolean> => {
        try {
            const user = await account.get();
            const labels: string[] = (user as { labels?: string[] }).labels ?? [];
            if (!labels.includes("admin")) {
                try { await account.deleteSession("current"); } catch { /* ignore */ }
                await fetch("/api/admin/auth/logout", { method: "POST" });
                return false;
            }
            setAdminUser({
                name: (user as { name?: string }).name,
                email: (user as { email?: string }).email,
            });
            const jwtObj = await account.createJWT();
            const res = await fetch("/api/admin/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jwt: jwtObj.jwt }),
            });
            return res.ok;
        } catch {
            return false;
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        refreshSession().then((ok) => {
            if (cancelled) return;
            if (ok) {
                setReady(true);
            } else {
                router.replace("/admin/login");
            }
        });

        intervalRef.current = setInterval(() => {
            refreshSession().then((ok) => {
                if (!ok && !cancelled) {
                    router.replace("/admin/login");
                }
            });
        }, REFRESH_INTERVAL_MS);

        return () => {
            cancelled = true;
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [refreshSession, router]);

    // Close mobile drawer on route change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    const handleLogout = async () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        try {
            await account.deleteSession("current");
        } catch {
            // session may already be expired
        }
        await fetch("/api/admin/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    const pageTitle    = PAGE_TITLES[pathname ?? ""] ?? "Admin";
    const pageSubtitle = PAGE_SUBTITLES[pathname ?? ""] ?? "";

    if (!ready) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400 dark:text-slate-500" />
                    <p className="text-xs text-slate-400 dark:text-slate-500">Verifying admin session…</p>
                </div>
            </div>
        );
    }

    const initials = (adminUser?.name ?? adminUser?.email ?? "A")
        .split(/[ @.]/)[0]
        .slice(0, 2)
        .toUpperCase();

    const SidebarContent = (
        <>
            <div className="h-14 flex items-center gap-2.5 px-5 border-b border-white/10">
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-black tracking-tight">EL</span>
                </div>
                <span className="text-[14px] font-bold tracking-tight text-white">EpiLanka</span>
                <span className="ml-auto text-[11px] font-semibold text-white/50 tracking-wider">ADMIN</span>
                <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden ml-1 p-1 text-white/60 hover:text-white"
                    aria-label="Close menu"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {NAV_GROUPS.map((group) => (
                    <div key={group.heading} className="mb-5 last:mb-0">
                        <p className="px-2 mb-1.5 text-[11px] font-bold text-white/40 uppercase tracking-widest">
                            {group.heading}
                        </p>
                        <div className="space-y-px">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== "/admindashboard" && (pathname ?? "").startsWith(item.href));
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <div className={[
                                            "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[14px]",
                                            "transition-all duration-150",
                                            isActive
                                                ? "bg-white text-black font-semibold shadow-sm"
                                                : "text-white/70 hover:text-white hover:bg-white/10",
                                        ].join(" ")}>
                                            <Icon className={[
                                                "h-[15px] w-[15px] shrink-0",
                                                isActive ? "text-black" : "text-white/40",
                                            ].join(" ")} />
                                            {item.label}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="border-t border-white/10 p-3">
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
                    <div className="w-7 h-7 rounded-full bg-white/10 text-white text-[12px] font-semibold flex items-center justify-center shrink-0 border border-white/10">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white truncate">
                            {adminUser?.name ?? "Admin"}
                        </p>
                        <p className="text-[11px] text-white/50 truncate">
                            {adminUser?.email ?? ""}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => void handleLogout()}
                    className="mt-1 flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[14px] text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <LogOut className="h-[15px] w-[15px] text-white/40" />
                    Sign out
                </button>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">

            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-60 shrink-0 bg-black border-r border-white/10 flex-col sticky top-0 h-screen">
                {SidebarContent}
            </aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 z-40 bg-slate-900/30 dark:bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
                    />
                    <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-white/10 flex flex-col animate-in slide-in-from-left duration-200">
                        {SidebarContent}
                    </aside>
                </>
            )}

            {/* Main column */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Topbar */}
                <header className="h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-100 dark:border-slate-800 px-4 md:px-8 flex items-center gap-3 shrink-0 sticky top-0 z-30">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden p-1.5 -ml-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                            {pageTitle}
                        </h1>
                        {pageSubtitle && (
                            <p className="hidden sm:block text-[12px] text-slate-400 dark:text-slate-500 truncate -mt-0.5">
                                {pageSubtitle}
                            </p>
                        )}
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            title="Toggle theme"
                        >
                            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </button>
                        <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            Live
                        </div>
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[12px] font-semibold flex items-center justify-center">
                            {initials}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
