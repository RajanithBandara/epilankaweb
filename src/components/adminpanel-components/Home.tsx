"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Database, History, ArrowRight, Loader2 } from "lucide-react";

type Stats = { users: number; tables: number; history: number };

async function fetchStats(): Promise<Stats> {
    const [usersRes, tablesRes, historyRes] = await Promise.allSettled([
        fetch("/api/admin/users/getall", { cache: "no-store" }),
        fetch("/api/admin/postgres/tables", { cache: "no-store" }),
        fetch("/api/admin/historical-data?limit=1&page=1", { cache: "no-store" }),
    ]);

    let users = 0, tables = 0, history = 0;

    if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        try { const d = await usersRes.value.json(); users = Array.isArray(d?.users) ? d.users.length : 0; } catch { /* ignore */ }
    }
    if (tablesRes.status === "fulfilled" && tablesRes.value.ok) {
        try { const d = await tablesRes.value.json(); tables = typeof d === "object" ? Object.keys(d).length : 0; } catch { /* ignore */ }
    }
    if (historyRes.status === "fulfilled" && historyRes.value.ok) {
        try { const d = await historyRes.value.json(); history = d?.total ?? d?.count ?? 0; } catch { /* ignore */ }
    }

    return { users, tables, history };
}

type StatKey = keyof Stats;

const CARDS: Array<{ title: string; icon: React.ComponentType<{ className?: string }>; description: string; stat: StatKey | null; href: string | null }> = [
    { title: "Overview",        icon: LayoutDashboard, description: "System health at a glance.", stat: null,      href: null },
    { title: "Users",           icon: Users,           description: "Registered accounts",        stat: "users",   href: "/admindashboard/users" },
    { title: "Database tables", icon: Database,        description: "PostgreSQL tables",           stat: "tables",  href: "/admindashboard/tables" },
    { title: "History records", icon: History,         description: "Disease history entries",     stat: "history", href: "/admindashboard/historydata" },
];

const QUICK: Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }> = [
    { label: "Manage users",    href: "/admindashboard/users",       icon: Users },
    { label: "Browse database", href: "/admindashboard/tables",      icon: Database },
    { label: "History data",    href: "/admindashboard/historydata", icon: History },
];

export default function AdminHome() {
    const [stats, setStats]     = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats()
            .then(setStats)
            .catch(() => setStats({ users: 0, tables: 0, history: 0 }))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {CARDS.map(({ title, icon: Icon, description, stat, href }) => {
                    const value = stat && stats ? stats[stat] : null;
                    const inner = (
                        <div className="relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 h-36 flex flex-col justify-between group hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-200">
                            <div className="flex items-start justify-between">
                                <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-white/60" />
                                </div>
                                {href && <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all duration-200" />}
                            </div>
                            <div>
                                {stat
                                    ? loading
                                        ? <Loader2 className="w-4 h-4 animate-spin text-white/25 mb-1" />
                                        : <p className="text-2xl font-bold text-white tabular-nums">{value ?? 0}</p>
                                    : <p className="text-2xl font-bold text-white">—</p>
                                }
                                <p className="text-xs text-white/35 mt-0.5">{description}</p>
                            </div>
                        </div>
                    );
                    return href ? <Link key={title} href={href}>{inner}</Link> : <div key={title}>{inner}</div>;
                })}
            </div>

            <div>
                <h2 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Quick actions</h2>
                <div className="space-y-1.5">
                    {QUICK.map(({ label, href, icon: Icon }) => (
                        <Link key={href} href={href}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.14] group transition-all duration-150">
                            <Icon className="w-4 h-4 text-white/35 group-hover:text-white/70 transition-colors duration-150" />
                            <span className="text-sm text-white/60 group-hover:text-white transition-colors duration-150">{label}</span>
                            <ArrowRight className="ml-auto w-3.5 h-3.5 text-white/15 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
