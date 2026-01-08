'use client';

import { Home, Map, FileText, Settings, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { LocationProvider } from "@/contexts/LocationContext";

const navItems = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Map", href: "/dashboard/map", icon: Map },
    { label: "Reports", href: "/dashboard/report", icon: FileText },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.clear();
        document.cookie = "token=; path=/; max-age=0";
        router.push("/login");
    };

    const [username] = useState(
        () => (typeof window !== "undefined" ? localStorage.getItem("username") || "" : "")
    );

    return (
        <LocationProvider>
            <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0]">
                {/* ================ DESKTOP FLOATING TOP BAR ================ */}
                <header className="hidden md:block sticky top-4 z-50 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 px-6 py-3">
                            <div className="flex items-center justify-between gap-6">
                                {/* Brand */}
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] flex items-center justify-center shadow-md">
                                        <span className="text-white font-bold text-base">E</span>
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-[#1E3A8A] leading-tight">EpiLanka</h1>
                                        <p className="text-[10px] text-gray-500 leading-tight">Disease Surveillance</p>
                                    </div>
                                </div>

                                {/* Centered Navigation */}
                                <nav className="flex-1 flex justify-center max-w-2xl">
                                    <div className="flex items-center gap-2 bg-gray-50/80 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-200/50">
                                        {navItems.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = pathname === item.href;

                                            return (
                                                <Link key={item.href} href={item.href}>
                                                    <div
                                                        className={
                                                            `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ` +
                                                            (isActive
                                                                ? "bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] text-white shadow-lg"
                                                                : "text-gray-600 hover:text-[#1E3A8A] hover:bg-white/60")
                                                        }
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                        <span className="hidden xl:inline">{item.label}</span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </nav>

                                {/* User Profile + Logout */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-gray-50/80 rounded-full px-3 py-1.5 border border-gray-200/50">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#3b82f6] text-white flex items-center justify-center text-xs font-semibold">
                                            {username ? username[0].toUpperCase() : <User size={14} />}
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 truncate max-w-[100px] hidden lg:inline">
                                            {username || "User"}
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-full px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-200 border border-red-200"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span className="text-xs hidden lg:inline">Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ================ MAIN CONTENT ================ */}
                <main className="flex-1 p-4 md:p-6 md:pt-4">
                    <div className="bg-white rounded-2xl shadow-lg p-6 min-h-full w-full transition-all duration-300 border border-gray-200/50">
                        {children}
                    </div>
                </main>

                {/* ================ MOBILE BOTTOM BAR ================ */}
                <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl shadow-xl rounded-2xl z-50 border border-gray-200/50 overflow-hidden">
                    <div className="flex h-16">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link key={item.href} href={item.href} className="flex-1">
                                    <div
                                        className={
                                            `flex flex-col items-center justify-center h-full text-[10px] font-medium transition-all duration-200 mx-1 rounded-xl ` +
                                            (isActive
                                                ? "text-white bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] shadow-lg"
                                                : "text-gray-500 hover:text-[#1E3A8A] hover:bg-gray-50")
                                        }
                                    >
                                        <Icon className="h-5 w-5 mb-0.5" />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </LocationProvider>
    );
}
