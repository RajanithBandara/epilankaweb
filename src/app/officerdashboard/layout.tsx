"use client";

import { useEffect, useState } from "react";
import {
    Menu,
    FilePenLine,
    BarChart3,
    Map,
    Microscope,
    Activity,
    LogOut,
    Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Update Records", href: "/officerdashboard/update-records", icon: FilePenLine },
    { label: "Diseases", href: "/officerdashboard/diseases", icon: Microscope },
    { label: "Reports", href: "/officerdashboard/reports", icon: FilePenLine },
    { label: "Analytics", href: "/officerdashboard/analytics", icon: BarChart3 },
    { label: "Map", href: "/officerdashboard/map", icon: Map },
    { label: "Settings", href: "/officerdashboard/settings", icon: Settings },
] as const;

const PAGE_TITLES: Record<string, string> = {
    "/officerdashboard": "Officer Dashboard",
    "/officerdashboard/update-records": "Update Records",
    "/officerdashboard/diseases": "Diseases",
    "/officerdashboard/analytics": "Analytics",
    "/officerdashboard/map": "Map",
    "/officerdashboard/settings": "Settings",
};

const isActivePath = (pathname: string | null, href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
};

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authChecking, setAuthChecking] = useState(true);

    useEffect(() => {
        navItems.forEach((item) => {
            router.prefetch(item.href);
        });
    }, [router]);

    useEffect(() => {
        const verifyOfficer = async () => {
            try {
                const { account } = await import("@/lib/appwrite");
                const user = await account.get();
                const labels: string[] = (user as { labels?: string[] }).labels ?? [];

                if (!labels.includes("officer")) {
                    try {
                        await account.deleteSession("current");
                    } catch {
                        // Ignore cleanup errors.
                    }
                    await fetch("/api/officer/auth/logout", { method: "POST" });
                    router.replace("/officer/login");
                    return;
                }
            } catch {
                await fetch("/api/officer/auth/logout", { method: "POST" });
                router.replace("/officer/login");
                return;
            } finally {
                setAuthChecking(false);
            }
        };

        void verifyOfficer();
    }, [router]);

    const handleLogout = async () => {
        try {
            await import("@/lib/appwrite").then(({ account }) =>
                account.deleteSession("current")
            );
        } catch {
            // Session can be already expired; still continue backend cleanup.
        }

        await fetch("/api/officer/auth/logout", { method: "POST" });
        router.push("/officer/login");
    };

    const pageTitle = PAGE_TITLES[pathname ?? ""] ?? "Officer Dashboard";

    if (authChecking) {
        return null;
    }

    return (
        <div className="h-screen bg-white text-black dark:bg-black dark:text-white">
            <div className="flex h-full pb-16 lg:pb-0">
                <aside className="hidden h-screen w-72 shrink-0 border-r border-white/10 bg-black text-white lg:sticky lg:top-0 lg:flex lg:flex-col dark:border-white/15 dark:bg-black dark:text-white">
                    <div className="flex h-14 items-center gap-3 px-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white bg-white text-black dark:border-white dark:bg-white dark:text-black">
                            <Activity className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold tracking-tight">EpiLanka</p>
                            <p className="text-xs text-white/60 dark:text-white/60">Officer Console</p>
                        </div>
                    </div>

                    <Separator className="bg-white/10 dark:bg-white/15" />

                    <nav className="flex-1 space-y-1 p-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActivePath(pathname, item.href);

                            return (
                                <Button
                                    key={item.href}
                                    asChild
                                    variant="ghost"
                                    className={cn(
                                        "h-10 w-full justify-start gap-3 rounded-lg px-3 font-medium",
                                        active
                                            ? "bg-white text-black hover:bg-white/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                            : "text-white/75 hover:bg-white/10 hover:text-white dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
                                    )}
                                >
                                    <Link href={item.href} prefetch scroll={false}>
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {item.label}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>

                    <div className="p-3">
                        <Separator className="mb-3 bg-white/10 dark:bg-white/15" />
                        <Button
                            onClick={() => void handleLogout()}
                            variant="ghost"
                            className="h-10 w-full justify-start gap-3 rounded-lg px-3 text-white/75 hover:bg-white/10 hover:text-white dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </Button>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur lg:bg-white dark:border-white/15 dark:bg-black/95 dark:lg:bg-black">
                        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
                            <div className="flex items-center gap-3">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="lg:hidden"
                                            aria-label="Open officer navigation"
                                        >
                                            <Menu className="h-5 w-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="border-white/15 bg-black text-white dark:border-white/20 dark:bg-black dark:text-white">
                                        <SheetHeader>
                                            <SheetTitle>Officer Navigation</SheetTitle>
                                        </SheetHeader>
                                        <nav className="mt-4 space-y-2">
                                            {navItems.map((item) => {
                                                const Icon = item.icon;
                                                const active = isActivePath(pathname, item.href);

                                                return (
                                                    <Button
                                                        key={item.href}
                                                        asChild
                                                        variant="ghost"
                                                        className={cn(
                                                            "h-10 w-full justify-start gap-3 rounded-lg px-3",
                                                            active
                                                                ? "bg-white text-black hover:bg-white/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                                                : "text-white/75 hover:bg-white/10 hover:text-white dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
                                                        )}
                                                    >
                                                        <Link href={item.href} prefetch scroll={false}>
                                                            <Icon className="h-4 w-4 shrink-0" />
                                                            {item.label}
                                                        </Link>
                                                    </Button>
                                                );
                                            })}
                                        </nav>
                                    </SheetContent>
                                </Sheet>
                                <h1 className="text-sm font-semibold tracking-wide lg:text-base">{pageTitle}</h1>
                            </div>

                            <div className="hidden items-center gap-2 text-xs text-black/60 lg:flex dark:text-white/60">
                                <span className="inline-flex h-2 w-2 rounded-full bg-black dark:bg-white" />
                                Live
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-4 lg:p-6">{children}</div>
                        </ScrollArea>
                    </main>
                </div>
            </div>

            <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/10 bg-black/95 p-2 backdrop-blur lg:hidden dark:border-white/15 dark:bg-black/95">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(pathname, item.href);

                    return (
                        <Button
                            key={item.href}
                            asChild
                            variant="ghost"
                            className={cn(
                                "h-11 flex-col gap-1 rounded-lg px-1 text-[11px]",
                                active
                                    ? "bg-white text-black hover:bg-white/90 dark:bg-white dark:text-black"
                                    : "text-white/70 hover:bg-white/10 dark:text-white/70 dark:hover:bg-white/10"
                            )}
                        >
                            <Link href={item.href} prefetch scroll={false}>
                                <Icon className="h-4 w-4" />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        </Button>
                    );
                })}
            </nav>
        </div>
    );
}
