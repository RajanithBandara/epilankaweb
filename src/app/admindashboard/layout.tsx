"use client";

import {
    Users,
    LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const sidebarItems = [
    {label: "Home", href: "/admindashboard/", icon: Users},
    { label: "Users", href: "/admindashboard/users", icon: Users },
];

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.clear();
        document.cookie = "token=; path=/; max-age=0";
        router.push("/login");
    };

    return (
        <div className="flex min-h-screen bg-[#0B0B0B] text-white">
            {/* ================= SIDEBAR ================= */}
            <aside className="w-64 bg-[#111] border-r border-white/10 flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <div className="w-9 h-9 rounded-md bg-white text-black flex items-center justify-center font-bold text-sm">
                        E
                    </div>
                    <span className="ml-3 font-semibold tracking-wide">
            EpiLanka
          </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ease-out
                    ${
                                        isActive
                                            ? "bg-white text-black"
                                            : "text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5"
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ================= MAIN ================= */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="h-16 bg-[#0F0F0F] border-b border-white/10 px-6 flex items-center">
                    <h1 className="text-sm font-medium tracking-wide text-gray-200">
                        Admin Dashboard
                    </h1>
                </header>

                {/* Content */}
                <main className="flex-1 p-6">
                    <div className="bg-[#161616] border border-white/10 rounded-xl p-6 min-h-full transition-opacity duration-150">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
