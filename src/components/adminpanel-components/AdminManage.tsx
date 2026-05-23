"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ShieldCheck, UserPlus, Trash2, RefreshCw,
    Loader2, X, Eye, EyeOff, ChevronRight, AlertTriangle,
} from "lucide-react";

type AdminEntry = {
    $id: string;
    name?: string;
    email?: string;
    labels?: string[];
    $createdAt?: string;
};
type ApiErr = { msg?: string; detail?: string; error?: { detail?: string } };

const api = axios.create({ baseURL: "/api" });
const errMsg = (e: unknown) => {
    const a = e as AxiosError<ApiErr>;
    return (
        a?.response?.data?.detail ||
        a?.response?.data?.msg ||
        (typeof a?.response?.data?.error === "object"
            ? (a.response?.data?.error as { detail?: string })?.detail
            : String(a?.response?.data?.error ?? "")) ||
        a?.message ||
        "Request failed"
    );
};
const safeDate = (ts?: string) => {
    if (!ts) return "—";
    try { const d = new Date(ts); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); }
    catch { return "—"; }
};

const inputCls =
    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 h-9 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm";
const labelCls = "block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

export default function AdminManagePanel() {
    const [admins, setAdmins] = useState<AdminEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [query, setQuery] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Delete confirm
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return admins;
        return admins.filter((a) =>
            [(a.name ?? ""), (a.email ?? ""), a.$id].some((f) => f.toLowerCase().includes(q))
        );
    }, [admins, query]);

    async function loadAdmins() {
        setLoading(true); setErrorMsg("");
        try {
            const res = await api.get<{ admins: AdminEntry[] }>("/admin/admins");
            setAdmins(res.data.admins ?? []);
        } catch (e) { setErrorMsg(errMsg(e)); }
        finally { setLoading(false); }
    }

    useEffect(() => { void loadAdmins(); }, []);

    async function handleRegister(ev: React.FormEvent) {
        ev.preventDefault();
        if (!name.trim() || !email.trim() || password.length < 8) {
            setErrorMsg("All fields required; password ≥ 8 characters.");
            return;
        }
        setSubmitting(true); setErrorMsg(""); setSuccessMsg("");
        try {
            await api.post("/admin/admins", { name: name.trim(), email: email.trim(), password });
            setSuccessMsg("Admin account created successfully.");
            setName(""); setEmail(""); setPassword("");
            await loadAdmins();
        } catch (e) { setErrorMsg(errMsg(e)); }
        finally { setSubmitting(false); }
    }

    async function handleDelete(id: string) {
        setDeleting(true); setErrorMsg(""); setSuccessMsg("");
        try {
            await api.delete(`/admin/admins/${id}`);
            setSuccessMsg("Admin label removed.");
            setDeleteId(null);
            await loadAdmins();
        } catch (e) { setErrorMsg(errMsg(e)); }
        finally { setDeleting(false); }
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-112px)] min-h-[500px] animate-in fade-in duration-300">

            {/* LEFT — list */}
            <aside className="w-80 shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Input
                        value={query} onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search admins…"
                        className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 flex-1 shadow-sm"
                    />
                    <button
                        onClick={() => void loadAdmins()} disabled={loading}
                        className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition-all shadow-sm"
                    >
                        <RefreshCw className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(" ")} />
                    </button>
                </div>

                <ScrollArea className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="p-2 space-y-0.5">
                        {loading && !admins.length ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400 dark:text-slate-500" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">No admins found</div>
                        ) : filtered.map((a) => (
                            <div
                                key={a.$id}
                                className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{a.name || "(unnamed)"}</p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{a.email || "—"}</p>
                                        <p className="text-[10px] text-slate-300 dark:text-slate-600 font-mono truncate">{safeDate(a.$createdAt)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDeleteId(a.$id)}
                                    className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-all duration-150"
                                    title="Remove admin label"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="text-xs text-slate-400 dark:text-slate-500 px-2">
                    {filtered.length} / {admins.length} admins
                </div>
            </aside>

            {/* RIGHT — form + confirm */}
            <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Add administrator</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Create a new Appwrite account and grant admin access</p>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-5">

                        {/* Feedback */}
                        {errorMsg && (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
                                {errorMsg}
                                <button onClick={() => setErrorMsg("")}><X className="w-3.5 h-3.5" /></button>
                            </div>
                        )}
                        {successMsg && (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                                {successMsg}
                                <button onClick={() => setSuccessMsg("")}><X className="w-3.5 h-3.5" /></button>
                            </div>
                        )}

                        {/* Registration form */}
                        <form onSubmit={(e) => void handleRegister(e)} className="space-y-4">
                            <div>
                                <label className={labelCls}>Full name</label>
                                <input
                                    value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="Dr. Anura Perera" className={inputCls} required
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Email address</label>
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@epilanka.lk" className={inputCls} required
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Password</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 8 characters" className={inputCls + " pr-9"} required
                                    />
                                    <button type="button" onClick={() => setShowPass((v) => !v)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400">
                                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" disabled={submitting}
                                className="h-9 text-sm bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm w-full flex items-center gap-2">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                {submitting ? "Creating account…" : "Create admin account"}
                            </Button>
                        </form>

                        {/* Info note */}
                        <div className="rounded-lg border border-blue-100 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 text-xs text-blue-600 dark:text-blue-400 space-y-1">
                            <p className="font-semibold">What this does</p>
                            <ul className="space-y-0.5 text-blue-500 dark:text-blue-300 list-disc list-inside">
                                <li>Creates a new Appwrite account for the user</li>
                                <li>Assigns the <code className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">admin</code> label in Appwrite</li>
                                <li>Stores a profile record in the MongoDB admins collection</li>
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Delete confirmation modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl p-6 w-80 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Remove admin access?</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">The Appwrite account is kept; only the admin label is removed.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button size="sm" disabled={deleting} onClick={() => void handleDelete(deleteId)}
                                className="flex-1 h-8 text-xs bg-red-600 text-white hover:bg-red-700 font-semibold shadow-sm">
                                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm remove"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}
                                className="flex-1 h-8 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
