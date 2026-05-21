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
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    <p className="text-xs text-slate-400">Verifying admin session…</p>
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
            <div className="h-14 flex items-center gap-2.5 px-5 border-b border-slate-100">
                <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white tracking-tight">EL</span>
                </div>
                <span className="text-[13px] font-semibold tracking-tight text-slate-900">EpiLanka</span>
                <span className="ml-auto text-[10px] font-medium text-slate-400 tracking-wider">ADMIN</span>
                <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden ml-1 p-1 text-slate-400 hover:text-slate-700"
                    aria-label="Close menu"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {NAV_GROUPS.map((group) => (
                    <div key={group.heading} className="mb-5 last:mb-0">
                        <p className="px-2 mb-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
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
                                            "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px]",
                                            "transition-colors duration-150",
                                            isActive
                                                ? "bg-slate-100 text-slate-900 font-medium"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                                        ].join(" ")}>
                                            <Icon className={[
                                                "h-[15px] w-[15px] shrink-0",
                                                isActive ? "text-slate-700" : "text-slate-400",
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

            <div className="border-t border-slate-100 p-3">
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center justify-center shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-slate-700 truncate">
                            {adminUser?.name ?? "Admin"}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                            {adminUser?.email ?? ""}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => void handleLogout()}
                    className="mt-1 flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                    <LogOut className="h-[15px] w-[15px] text-slate-400" />
                    Sign out
                </button>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-white text-slate-900">

            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-slate-100 flex-col sticky top-0 h-screen">
                {SidebarContent}
            </aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-150"
                    />
                    <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col animate-in slide-in-from-left duration-200">
                        {SidebarContent}
                    </aside>
                </>
            )}

            {/* Main column */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Topbar */}
                <header className="h-14 bg-white/80 backdrop-blur border-b border-slate-100 px-4 md:px-8 flex items-center gap-3 shrink-0 sticky top-0 z-30">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden p-1.5 -ml-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-50"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="min-w-0">
                        <h1 className="text-[14px] font-semibold text-slate-900 tracking-tight truncate">
                            {pageTitle}
                        </h1>
                        {pageSubtitle && (
                            <p className="hidden sm:block text-[11px] text-slate-400 truncate -mt-0.5">
                                {pageSubtitle}
                            </p>
                        )}
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            Live
                        </div>
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center justify-center">
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
