'use client';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Map", href: "/dashboard/map" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();useRouter();

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-md">
                <div className="p-4 text-xl font-bold border-b">My Dashboard</div>
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
            </aside>

            {/* Mobile Sidebar */}
            <Sheet>
                <SheetTrigger className="md:hidden absolute top-4 left-4 z-50">
                    <Menu className="w-6 h-6" />
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-white">
                    <div className="p-4 text-xl font-bold border-b">My Dashboard</div>
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
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
    );
}
