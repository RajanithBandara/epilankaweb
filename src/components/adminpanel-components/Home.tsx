"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users, Database, History, ArrowRight, Loader2,
    Stethoscope, MapPin, Bell, ShieldCheck, AlertCircle,
    BriefcaseMedical,
} from "lucide-react";

type Stats = {
    users: number;
    tables: number;
    history: number;
    diseases: number;
    districts: number;
    notifications: number;
    officers: number;
    admins: number;
    bannedUsers: number;
    totalPopulation: number;
};

async function fetchStats(): Promise<Stats> {
    const [usersRes, tablesRes, historyRes, diseasesRes, districtsRes, notifsRes, officersRes, adminsRes, popRes] = await Promise.allSettled([
        fetch("/api/admin/users/getall",              { cache: "no-store" }),
        fetch("/api/admin/postgres/tables",            { cache: "no-store" }),
        fetch("/api/admin/historical-data?limit=1",    { cache: "no-store" }),
        fetch("/api/admin/diseases",                   { cache: "no-store" }),
        fetch("/api/admin/districts",                  { cache: "no-store" }),
        fetch("/api/notifications?skip=0&limit=1",     { cache: "no-store" }),
        fetch("/api/admin/officers",                   { cache: "no-store" }),
        fetch("/api/admin/admins",                     { cache: "no-store" }),
        fetch("/api/admin/population",                 { cache: "no-store" }),
    ]);

    let users = 0, tables = 0, history = 0, diseases = 0, districts = 0, notifications = 0, officers = 0, admins = 0, bannedUsers = 0, totalPopulation = 0;

    if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        try {
            const d = await usersRes.value.json();
            const list = Array.isArray(d?.users) ? d.users : Array.isArray(d) ? d : [];
            users = list.length;
            bannedUsers = list.filter((u: Record<string, unknown>) => u.is_banned).length;
        } catch { /* ignore */ }
    }
    if (tablesRes.status === "fulfilled" && tablesRes.value.ok) {
        try { const d = await tablesRes.value.json(); tables = typeof d === "object" ? Object.keys(d).length : 0; } catch { /* ignore */ }
    }
    if (historyRes.status === "fulfilled" && historyRes.value.ok) {
        try { const d = await historyRes.value.json(); history = d?.total ?? d?.count ?? (Array.isArray(d) ? d.length : 0); } catch { /* ignore */ }
    }
    if (diseasesRes.status === "fulfilled" && diseasesRes.value.ok) {
        try { const d = await diseasesRes.value.json(); diseases = Array.isArray(d) ? d.length : 0; } catch { /* ignore */ }
    }
    if (districtsRes.status === "fulfilled" && districtsRes.value.ok) {
        try { const d = await districtsRes.value.json(); districts = Array.isArray(d) ? d.length : 0; } catch { /* ignore */ }
    }
    if (notifsRes.status === "fulfilled" && notifsRes.value.ok) {
        try { const d = await notifsRes.value.json(); notifications = d?.total ?? 0; } catch { /* ignore */ }
    }
    if (officersRes.status === "fulfilled" && officersRes.value.ok) {
        try { const d = await officersRes.value.json(); officers = Array.isArray(d?.officers) ? d.officers.length : 0; } catch { /* ignore */ }
    }
    if (adminsRes.status === "fulfilled" && adminsRes.value.ok) {
        try { const d = await adminsRes.value.json(); admins = Array.isArray(d?.admins) ? d.admins.length : 0; } catch { /* ignore */ }
    }
    if (popRes.status === "fulfilled" && popRes.value.ok) {
        try { const d = await popRes.value.json(); totalPopulation = d?.total_population ?? 0; } catch { /* ignore */ }
    }

    return { users, tables, history, diseases, districts, notifications, officers, admins, bannedUsers, totalPopulation };
}

type StatCard = {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    stat: keyof Stats | null;
    customValue?: string;
    href: string | null;
};

const PEOPLE_CARDS: StatCard[] = [
    { title: "Total users",  icon: Users,             description: "Registered accounts",    stat: "users",    href: "/admindashboard/users" },
    { title: "Admins",       icon: ShieldCheck,       description: "System administrators",  stat: "admins",   href: "/admindashboard/admins" },
    { title: "Officers",     icon: BriefcaseMedical,  description: "Health officers",        stat: "officers", href: "/admindashboard/officers" },
    { title: "Population",   icon: Users,             description: "Estimated (millions)",   stat: "totalPopulation", href: null },
];

const DATA_CARDS: StatCard[] = [
    { title: "Diseases",      icon: Stethoscope, description: "Tracked diseases",         stat: "diseases",      href: "/admindashboard/diseases" },
    { title: "Districts",     icon: MapPin,      description: "Geographic districts",     stat: "districts",     href: "/admindashboard/districts" },
    { title: "Notifications", icon: Bell,        description: "Broadcast notifications",  stat: "notifications", href: "/admindashboard/notifications" },
    { title: "History",       icon: History,     description: "Disease history entries",  stat: "history",       href: "/admindashboard/historydata" },
];

const QUICK: Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = [
    { label: "Manage users",           href: "/admindashboard/users",         icon: Users,       desc: "View, edit, ban, or remove user accounts" },
    { label: "Manage diseases",        href: "/admindashboard/diseases",      icon: Stethoscope, desc: "Add, edit, or remove tracked diseases" },
    { label: "Manage districts",       href: "/admindashboard/districts",     icon: MapPin,      desc: "Add, edit, or remove geographic districts" },
    { label: "Broadcast notification", href: "/admindashboard/notifications", icon: Bell,        desc: "Send notifications to all users" },
    { label: "Browse database",        href: "/admindashboard/tables",        icon: Database,    desc: "Inspect raw PostgreSQL tables" },
    { label: "Historical data",        href: "/admindashboard/historydata",   icon: History,     desc: "Add or review weekly case records" },
];

function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

function StatCardView({ card, value, loading }: { card: StatCard; value: number | null; loading: boolean }) {
    const Icon = card.icon;
    let display: string | number | null = card.customValue ?? (card.stat ? (loading ? null : value ?? 0) : "—");

    if (card.stat === "totalPopulation" && typeof value === "number" && !loading) {
        display = (value / 1_000_000).toFixed(1) + "M";
    }

    const inner = (
        <div className="group h-full rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors duration-150 flex flex-col justify-between">
            <div className="flex items-start justify-between">
                <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                {card.href && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all duration-150" />
                )}
            </div>
            <div className="mt-6">
                {display === null
                    ? <div className="h-7 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    : <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{display}</p>
                }
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{card.description}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{card.title}</p>
            </div>
        </div>
    );
    return card.href ? <Link href={card.href} className="block h-full">{inner}</Link> : <div className="h-full">{inner}</div>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] mb-3">
            {children}
        </h2>
    );
}

export default function AdminHome() {
    const [stats, setStats]     = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [now, setNow]         = useState<string>("");

    useEffect(() => {
        fetchStats()
            .then(setStats)
            .catch(() => setStats({ users: 0, tables: 0, history: 0, diseases: 0, districts: 0, notifications: 0, officers: 0, admins: 0, bannedUsers: 0, totalPopulation: 0 }))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNow(new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }));
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in duration-300 max-w-6xl">

            {/* Greeting */}
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{now}</p>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                        {greeting()}, admin
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here&apos;s what&apos;s happening across EpiLanka today.</p>
                </div>
            </div>

            {/* Alert banner */}
            {stats && stats.bannedUsers > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-red-100 dark:border-red-900/50 bg-red-50/60 dark:bg-red-900/20 px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-red-600 dark:text-red-400">{stats.bannedUsers}</span> user{stats.bannedUsers > 1 ? "s are" : " is"} currently banned.
                    </p>
                    <Link href="/admindashboard/users" className="ml-auto text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                        Review →
                    </Link>
                </div>
            )}

            {/* People */}
            <section>
                <SectionHeading>People</SectionHeading>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {PEOPLE_CARDS.map((card) => (
                        <StatCardView
                            key={card.title}
                            card={card}
                            value={card.stat && stats ? stats[card.stat] : null}
                            loading={loading}
                        />
                    ))}
                </div>
            </section>

            {/* Data */}
            <section>
                <SectionHeading>Data</SectionHeading>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {DATA_CARDS.map((card) => (
                        <StatCardView
                            key={card.title}
                            card={card}
                            value={card.stat && stats ? stats[card.stat] : null}
                            loading={loading}
                        />
                    ))}
                </div>
            </section>

            {/* Quick actions */}
            <section>
                <SectionHeading>Quick actions</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {QUICK.map(({ label, href, icon: Icon, desc }) => (
                        <Link key={href} href={href}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 group transition-colors duration-150">
                            <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 block">{label}</span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">{desc}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* System info */}
            <section>
                <SectionHeading>System</SectionHeading>
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
                        {[
                            ["Platform",      "EpiLanka v2.0"],
                            ["Database",      "PostgreSQL + MongoDB"],
                            ["Auth provider", "Appwrite Cloud"],
                            ["Status",        loading ? "Loading…" : "Operational"],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <span className="text-slate-400 dark:text-slate-500 block mb-1">{k}</span>
                                <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5">
                                    {k === "Status" && !loading && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    )}
                                    {v}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {loading && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading metrics…
                </div>
            )}
        </div>
    );
}
