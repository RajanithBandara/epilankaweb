'use client';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import {LocationProvider} from "@/contexts/LocationContext";

const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Map", href: "/dashboard/map" },
    { label: "Reports", href: "/dashboard/report" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    // Logout function
    const handleLogout = () => {
        // Clear localStorage
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        localStorage.removeItem('email');

        // Clear cookie
        document.cookie = 'token=; path=/; max-age=0';

        // Redirect to login
        router.push('/login');
    };

    const [username] = useState<string>(()=>{
        if (typeof window !== 'undefined') {
            return localStorage.getItem('username') || '';
        }
        return '';
    });

    const [email] = useState<string>(()=>{
        if (typeof window !== 'undefined') {
            return localStorage.getItem('email') || '';
        }
        return '';
    });

return (
    <LocationProvider>
    <div className="flex h-screen bg-gray-100">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-white shadow-md">
            <div className="p-4 text-xl font-bold border-b">My Dashboard</div>

            {/* User Profile Section */}
            <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-winered rounded-full flex items-center justify-center text-white font-bold">
                        {username.charAt(0).toUpperCase() || <User size={20} />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-gray-800 truncate">{username || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{email}</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Button
                            variant={pathname === item.href ? "default" : "ghost"}
                            className="w-full justify-start"
                        >
                            {item.label}
                        </Button>
                    </Link>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t">
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet>
            <SheetTrigger className="md:hidden absolute top-4 left-4 z-50">
                <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-white flex flex-col">
                <div className="p-4 text-xl font-bold border-b">My Dashboard</div>

                {/* User Profile Section */}
                <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-winered rounded-full flex items-center justify-center text-white font-bold">
                            {username.charAt(0).toUpperCase() || <User size={20} />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-gray-800 truncate">{username || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{email}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={pathname === item.href ? "default" : "ghost"}
                                className="w-full justify-start"
                            >
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t mt-auto">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
    </LocationProvider>
);
}
