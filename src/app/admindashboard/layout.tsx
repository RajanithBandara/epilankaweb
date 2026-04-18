"use client";

import {
    LayoutDashboard,
    Users,
    Database,
    History,
    LogOut,
    Activity,
    ShieldCheck,
    Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const sidebarItems = [
    { label: "Overview",  href: "/admindashboard",             icon: LayoutDashboard },
    { label: "Users",     href: "/admindashboard/users",        icon: Users },
    { label: "Admins",    href: "/admindashboard/admins",       icon: ShieldCheck },
    { label: "Officers",  href: "/admindashboard/officers",     icon: Stethoscope },
    { label: "Tables",    href: "/admindashboard/tables",       icon: Database },
    { label: "History",   href: "/admindashboard/historydata",  icon: History },
];

const PAGE_TITLES: Record<string, string> = {
    "/admindashboard":              "Overview",
    "/admindashboard/users":        "User Management",
    "/admindashboard/admins":       "Admin Accounts",
    "/admindashboard/officers":     "Health Officers",
    "/admindashboard/tables":       "Database Browser",
    "/admindashboard/historydata":  "Historical Data",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router   = useRouter();

    const handleLogout = async () => {
        try {
            await import("@/lib/appwrite").then(({ account }) =>
                account.deleteSession("current")
            );
        } catch {
            // session may already be expired
        }
        await fetch("/api/admin/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    const pageTitle = PAGE_TITLES[pathname ?? ""] ?? "Admin";

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">

            {/* SIDEBAR */}
            <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">

                {/* Brand */}
                <div className="h-14 flex items-center gap-3 px-4 border-b border-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">EpiLanka</span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium tracking-wide">
                        ADMIN
                    </span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-3 space-y-0.5">
                    {sidebarItems.map((item) => {
                        const Icon     = item.icon;
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/admindashboard" && (pathname ?? "").startsWith(item.href));

                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={[
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                                    "transition-all duration-200 ease-out",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
                                ].join(" ")}>
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {item.label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sign out */}
                <div className="p-2 border-t border-slate-200">
                    <button
                        onClick={() => void handleLogout()}
                        className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Topbar */}
                <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
                    <h1 className="text-sm font-semibold text-slate-800 tracking-wide">
                        {pageTitle}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-xs text-slate-400">Live</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
