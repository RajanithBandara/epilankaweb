"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, RefreshCw, Loader2, X, Plus, Trash2, Save } from "lucide-react";

type Disease = { disease_id: number; disease_name: string; description?: string };

const inputCls = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 h-9 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm";
const labelCls = "block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

export default function DiseaseManage() {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [loading, setLoading]   = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [query, setQuery]       = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [saving, setSaving]     = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    // Edit form
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");

    // Create form
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const selected = useMemo(() => diseases.find(d => d.disease_id === selectedId) ?? null, [diseases, selectedId]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return diseases;
        return diseases.filter(d => d.disease_name.toLowerCase().includes(q) || String(d.disease_id).includes(q));
    }, [diseases, query]);

    const fetchDiseases = useCallback(async () => {
        setLoading(true); setErrorMsg("");
        try {
            const res = await fetch("/api/admin/diseases", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: Disease[] = await res.json();
            setDiseases(Array.isArray(data) ? data : []);
            if (data.length && selectedId === null) setSelectedId(data[0].disease_id);
        } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Failed to load"); }
        finally { setLoading(false); }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { void fetchDiseases(); }, [fetchDiseases]);

    useEffect(() => {
        if (selected) {
            setEditName(selected.disease_name);
            setEditDesc(selected.description ?? "");
            setShowDeleteConfirm(false);
        }
    }, [selected]);

    const handleUpdate = async () => {
        if (!selected || !editName.trim()) return;
        setSaving(true); setErrorMsg("");
        try {
            const res = await fetch(`/api/admin/diseases/${selected.disease_id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ disease_name: editName.trim(), description: editDesc.trim() || undefined }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d?.detail || "Failed"); }
            await fetchDiseases();
        } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Update failed"); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setSaving(true); setErrorMsg("");
        try {
            const res = await fetch(`/api/admin/diseases/${selected.disease_id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            setSelectedId(null); setShowDeleteConfirm(false);
            await fetchDiseases();
        } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Delete failed"); }
        finally { setSaving(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setSaving(true); setErrorMsg("");
        try {
            const res = await fetch("/api/admin/diseases", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ disease_name: newName.trim(), description: newDesc.trim() || undefined }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d?.detail || "Failed"); }
            setNewName(""); setNewDesc(""); setShowCreate(false);
            await fetchDiseases();
        } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Create failed"); }
        finally { setSaving(false); }
    };

    return (
        <div className="flex gap-5 h-[calc(100vh-112px)] min-h-[500px] animate-in fade-in duration-300">

            {/* LEFT — disease list */}
            <aside className="w-64 shrink-0 flex flex-col gap-3 z-30">
                <div className="flex items-center gap-2">
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search diseases…"
                        className="h-8 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg px-3 flex-1 shadow-sm" />
                    <button onClick={() => setShowCreate(v => !v)}
                        className="shrink-0 h-8 px-2.5 rounded-lg text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 transition-all duration-150 shadow-sm flex items-center gap-1">
                        <Plus className="w-3 h-3" />New
                    </button>
                    <button onClick={() => void fetchDiseases()} disabled={loading}
                        className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition-all duration-150 shadow-sm">
                        <RefreshCw className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(" ")} />
                    </button>
                </div>

                {showCreate && (
                    <form onSubmit={handleCreate} className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/30 p-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                        <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">New Disease</p>
                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Disease name *" required className={inputCls} />
                        <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className={inputCls} />
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={saving} className="h-7 text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm">
                                {saving ? "Saving…" : "Create"}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate(false)}
                                className="h-7 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">Cancel</Button>
                        </div>
                    </form>
                )}

                <ScrollArea className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="p-2 space-y-0.5">
                        {loading && !diseases.length ? (
                            <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-slate-400 dark:text-slate-500" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-10 space-y-2">
                                <Stethoscope className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
                                <p className="text-xs text-slate-400 dark:text-slate-500">No diseases found</p>
                            </div>
                        ) : filtered.map(d => {
                            const active = d.disease_id === selectedId;
                            return (
                                <button key={d.disease_id} type="button" onClick={() => setSelectedId(d.disease_id)}
                                    className={["w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150",
                                        active ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"].join(" ")}>
                                    <div className="flex items-center justify-between gap-1.5">
                                        <span className={["text-xs font-semibold truncate", active ? "text-blue-700 dark:text-blue-400" : ""].join(" ")}>{d.disease_name}</span>
                                        <Badge className={["text-[10px] px-1.5 py-0 h-4 font-medium border-0",
                                            active ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"].join(" ")}>
                                            #{d.disease_id}
                                        </Badge>
                                    </div>
                                    {d.description && <p className={["text-[11px] truncate mt-0.5", active ? "text-blue-700/60 dark:text-blue-400/60" : "text-slate-400 dark:text-slate-500"].join(" ")}>{d.description}</p>}
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
                <div className="text-xs text-slate-400 dark:text-slate-500 px-2">{filtered.length} / {diseases.length} diseases</div>
            </aside>

            {/* RIGHT — detail panel */}
            <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <Stethoscope className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">Select a disease to manage</p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 overflow-auto">
                        <div className="p-6 space-y-0">

                            {/* Header */}
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                    <Stethoscope className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base truncate">{selected.disease_name}</h3>
                                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0 text-[10px]">ID: {selected.disease_id}</Badge>
                                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 dark:text-slate-500" />}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selected.description || "No description"}</p>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="flex items-center justify-between gap-2 mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
                                    {errorMsg}
                                    <button onClick={() => setErrorMsg("")}><X className="w-3.5 h-3.5" /></button>
                                </div>
                            )}

                            {/* Edit form */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Edit Disease</span>
                                <div className="space-y-3">
                                    <div>
                                        <label className={labelCls}>Disease Name</label>
                                        <input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Description</label>
                                        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm resize-none" />
                                    </div>
                                    <Button size="sm" disabled={saving} onClick={() => void handleUpdate()}
                                        className="h-7 text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm">
                                        <Save className="w-3 h-3 mr-1.5" />Save changes
                                    </Button>
                                </div>
                            </div>

                            {/* Danger zone */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Danger Zone</span>
                                {!showDeleteConfirm ? (
                                    <Button size="sm" onClick={() => setShowDeleteConfirm(true)}
                                        className="h-7 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 font-semibold shadow-sm">
                                        <Trash2 className="w-3 h-3 mr-1.5" />Delete disease
                                    </Button>
                                ) : (
                                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 space-y-3 animate-in fade-in duration-150">
                                        <p className="text-xs text-red-600 dark:text-red-400">This may break historical data references. Are you sure?</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" disabled={saving} onClick={() => void handleDelete()}
                                                className="h-7 text-xs bg-red-600 text-white hover:bg-red-700 font-semibold shadow-sm">Confirm delete</Button>
                                            <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}
                                                className="h-7 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">Cancel</Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="h-8" />
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
}
