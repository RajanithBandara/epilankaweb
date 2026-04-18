"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Stethoscope, UserPlus, Trash2, RefreshCw,
    Loader2, X, Eye, EyeOff, ChevronRight, AlertTriangle,
} from "lucide-react";

type OfficerEntry = {
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
    "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm rounded-lg px-3 py-2 h-9 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-150 shadow-sm";
const labelCls = "block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5";

export default function OfficerManagePanel() {
    const [officers, setOfficers] = useState<OfficerEntry[]>([]);
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
        if (!q) return officers;
        return officers.filter((o) =>
            [(o.name ?? ""), (o.email ?? ""), o.$id].some((f) => f.toLowerCase().includes(q))
        );
    }, [officers, query]);

    async function loadOfficers() {
        setLoading(true); setErrorMsg("");
        try {
            const res = await api.get<{ officers: OfficerEntry[] }>("/admin/officers");
            setOfficers(res.data.officers ?? []);
        } catch (e) { setErrorMsg(errMsg(e)); }
        finally { setLoading(false); }
    }

    useEffect(() => { void loadOfficers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleRegister(ev: React.FormEvent) {
        ev.preventDefault();
        if (!name.trim() || !email.trim() || password.length < 8) {
            setErrorMsg("All fields required; password ≥ 8 characters.");
            return;
        }
        setSubmitting(true); setErrorMsg(""); setSuccessMsg("");
        try {
            await api.post("/admin/officers", { name: name.trim(), email: email.trim(), password });
            setSuccessMsg("Health officer account created successfully.");
            setName(""); setEmail(""); setPassword("");
            await loadOfficers();
        } catch (e) { setErrorMsg(errMsg(e)); }
        finally { setSubmitting(false); }
    }

    async function handleDelete(id: string) {
        setDeleting(true); setErrorMsg(""); setSuccessMsg("");
        try {
            await api.delete(`/admin/officers/${id}`);
            setSuccessMsg("Officer label removed.");
            setDeleteId(null);
            await loadOfficers();
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
                        placeholder="Search officers…"
                        className="h-8 text-xs bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 flex-1 shadow-sm"
                    />
                    <button
                        onClick={() => void loadOfficers()} disabled={loading}
                        className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-all shadow-sm"
                    >
                        <RefreshCw className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(" ")} />
                    </button>
                </div>

                <ScrollArea className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-2 space-y-0.5">
                        {loading && !officers.length ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-8">No officers found</div>
                        ) : filtered.map((o) => (
                            <div
                                key={o.$id}
                                className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-all duration-150"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-800 truncate">{o.name || "(unnamed)"}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{o.email || "—"}</p>
                                        <p className="text-[10px] text-slate-300 font-mono truncate">{safeDate(o.$createdAt)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDeleteId(o.$id)}
                                    className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                                    title="Remove officer label"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="text-xs text-slate-400 px-2">
                    {filtered.length} / {officers.length} officers
                </div>
            </aside>

            {/* RIGHT — form */}
            <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-800">Add Health Officer</h2>
                        <p className="text-xs text-slate-400">Create a new Appwrite account and grant officer access</p>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-5">

                        {/* Feedback */}
                        {errorMsg && (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                                {errorMsg}
                                <button onClick={() => setErrorMsg("")}><X className="w-3.5 h-3.5" /></button>
                            </div>
                        )}
                        {successMsg && (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
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
                                    placeholder="Dr. Kamala Silva" className={inputCls} required
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Email address</label>
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="officer@epilanka.lk" className={inputCls} required
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
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" disabled={submitting}
                                className="h-9 text-sm bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-sm w-full flex items-center gap-2">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                {submitting ? "Creating account…" : "Create officer account"}
                            </Button>
                        </form>

                        {/* Info note */}
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-600 space-y-1">
                            <p className="font-semibold">What this does</p>
                            <ul className="space-y-0.5 text-emerald-500 list-disc list-inside">
                                <li>Creates a new Appwrite account for the health officer</li>
                                <li>Assigns the <code className="font-mono bg-emerald-100 px-1 rounded">officer</code> label in Appwrite</li>
                                <li>Gives access to the Officer Dashboard and reporting tools</li>
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Delete confirmation modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-80 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Remove officer access?</h3>
                                <p className="text-xs text-slate-400 mt-0.5">The Appwrite account is kept; only the officer label is removed.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button size="sm" disabled={deleting} onClick={() => void handleDelete(deleteId)}
                                className="flex-1 h-8 text-xs bg-red-600 text-white hover:bg-red-700 font-semibold shadow-sm">
                                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm remove"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}
                                className="flex-1 h-8 text-xs border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
