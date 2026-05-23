"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MapPin, RefreshCw, Loader2, X, Plus, Trash2, Save,
    Users, Building2, ChevronRight, PencilLine
} from "lucide-react";

type District = {
    district_id: number;
    district_name: string;
    province_name?: string;
    province?: string;
    population?: number | null;
    latitude?: number;
    longitude?: number;
};

const inputCls = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 h-9 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm";
const labelCls = "block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

function getProvince(d: District) {
    return d.province_name || d.province || "";
}

function formatPop(pop: number | null | undefined): string {
    if (!pop && pop !== 0) return "";
    return pop.toLocaleString();
}

export default function DistrictManage() {
    const [districts, setDistricts] = useState<District[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    const [editName, setEditName] = useState("");
    const [editProvince, setEditProvince] = useState("");
    const [editPopulation, setEditPopulation] = useState("");

    const [newId, setNewId] = useState("");
    const [newName, setNewName] = useState("");
    const [newProvince, setNewProvince] = useState("");
    const [newPopulation, setNewPopulation] = useState("");

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const selected = useMemo(
        () => districts.find(d => d.district_id === selectedId) ?? null,
        [districts, selectedId]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return districts;
        return districts.filter(d =>
            d.district_name.toLowerCase().includes(q) ||
            getProvince(d).toLowerCase().includes(q) ||
            String(d.district_id).includes(q)
        );
    }, [districts, query]);

    const fetchDistricts = useCallback(async () => {
        setLoading(true); setErrorMsg("");
        try {
            const res = await fetch("/api/admin/districts", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: District[] = await res.json();
            setDistricts(Array.isArray(data) ? data : []);
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchDistricts(); }, [fetchDistricts]);

    useEffect(() => {
        if (selected) {
            setEditName(selected.district_name);
            setEditProvince(getProvince(selected));
            setEditPopulation(selected.population != null ? String(selected.population) : "");
            setShowDeleteConfirm(false);
        }
    }, [selected]);

    const handleUpdate = async () => {
        if (!selected || !editName.trim()) return;
        setSaving(true); setErrorMsg("");
        try {
            const body: Record<string, unknown> = {
                district_name: editName.trim(),
                province: editProvince.trim() || undefined,
            };
            if (editPopulation !== "") body.population = Number(editPopulation);
            const res = await fetch(`/api/admin/districts/${selected.district_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d?.detail || "Failed"); }
            await fetchDistricts();
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setSaving(true); setErrorMsg("");
        try {
            const res = await fetch(`/api/admin/districts/${selected.district_id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            setSelectedId(null); setShowDeleteConfirm(false);
            await fetchDistricts();
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Delete failed");
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newId.trim()) return;
        setSaving(true); setErrorMsg("");
        try {
            const body: Record<string, unknown> = {
                district_id: Number(newId),
                district_name: newName.trim(),
                province: newProvince.trim() || undefined,
            };
            if (newPopulation !== "") body.population = Number(newPopulation);
            const res = await fetch("/api/admin/districts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d?.detail || "Failed"); }
            setNewId(""); setNewName(""); setNewProvince(""); setNewPopulation("");
            setShowCreate(false);
            await fetchDistricts();
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Create failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex gap-5 h-[calc(100vh-112px)] min-h-[500px] animate-in fade-in duration-300">

            {/* LEFT — district table */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">

                {/* Toolbar */}
                <div className="flex items-center gap-2">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search by name, province or ID…"
                        className="h-8 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg px-3 flex-1 shadow-sm"
                    />
                    <button
                        onClick={() => setShowCreate(v => !v)}
                        className="shrink-0 h-8 px-3 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-150 shadow-sm flex items-center gap-1.5"
                    >
                        <Plus className="w-3 h-3" /> New District
                    </button>
                    <button
                        onClick={() => void fetchDistricts()}
                        disabled={loading}
                        className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition-all duration-150 shadow-sm"
                    >
                        <RefreshCw className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(" ")} />
                    </button>
                </div>

                {/* Create form */}
                {showCreate && (
                    <form onSubmit={handleCreate} className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/30 p-4 animate-in slide-in-from-top-1 duration-200">
                        <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-3">New District</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <div>
                                <label className={labelCls}>District ID *</label>
                                <input value={newId} onChange={e => setNewId(e.target.value)} type="number" placeholder="e.g. 26" required className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Name *</label>
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Colombo" required className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Province</label>
                                <input value={newProvince} onChange={e => setNewProvince(e.target.value)} placeholder="e.g. Western" className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Population</label>
                                <input value={newPopulation} onChange={e => setNewPopulation(e.target.value)} type="number" placeholder="e.g. 2500000" className={inputCls} />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Button type="submit" size="sm" disabled={saving} className="h-7 text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm">
                                {saving ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Saving…</> : "Create"}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate(false)}
                                className="h-7 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">Cancel</Button>
                        </div>
                        {errorMsg && !selectedId && (
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
                        )}
                    </form>
                )}

                {/* Table */}
                <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                    {/* Table header */}
                    <div className="grid grid-cols-[2rem_2fr_2fr_2fr_3rem] gap-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">#</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">District Name</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Province</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />Population</span>
                        </span>
                        <span />
                    </div>

                    <ScrollArea className="flex-1 overflow-auto">
                        {loading && !districts.length ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-300 dark:text-slate-600" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <MapPin className="w-7 h-7 text-slate-200 dark:text-slate-700" />
                                <p className="text-xs text-slate-400 dark:text-slate-500">No districts found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-auto">
                                {filtered.map(d => {
                                    const active = d.district_id === selectedId;
                                    const pop = formatPop(d.population);
                                    const province = getProvince(d);
                                    return (
                                        <button
                                            key={d.district_id}
                                            type="button"
                                            onClick={() => setSelectedId(d.district_id)}
                                            className={[
                                                "w-full grid grid-cols-[2rem_2fr_2fr_2fr_3rem] gap-0 px-4 py-3 text-left transition-all duration-100 group",
                                                active ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/80",
                                            ].join(" ")}
                                        >
                                            {/* ID */}
                                            <span className={["text-[11px] font-mono font-semibold self-center", active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"].join(" ")}>
                                                {d.district_id}
                                            </span>
                                            {/* Name */}
                                            <span className={["text-sm font-medium self-center truncate", active ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"].join(" ")}>
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className={["w-3 h-3 shrink-0", active ? "text-blue-500 dark:text-blue-400" : "text-slate-300 dark:text-slate-600"].join(" ")} />
                                                    {d.district_name}
                                                </span>
                                            </span>
                                            {/* Province */}
                                            <span className="self-center">
                                                {province ? (
                                                    <Badge className={["text-[10px] font-medium border-0 px-2",
                                                        active ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"].join(" ")}>
                                                        <Building2 className="w-2.5 h-2.5 mr-1" />
                                                        {province}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-[11px] text-slate-300 dark:text-slate-600 italic">—</span>
                                                )}
                                            </span>
                                            {/* Population */}
                                            <span className="self-center">
                                                {pop ? (
                                                    <span className={["text-sm font-semibold tabular-nums", active ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"].join(" ")}>
                                                        {pop}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-300 dark:text-slate-600 italic">not set</span>
                                                )}
                                            </span>
                                            {/* Arrow */}
                                            <span className="self-center flex justify-end">
                                                <ChevronRight className={["w-4 h-4 transition-all duration-150",
                                                    active ? "text-blue-400 dark:text-blue-500" : "text-slate-200 dark:text-slate-700 group-hover:text-slate-400 dark:group-hover:text-slate-500"].join(" ")} />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{filtered.length} of {districts.length} districts</span>
                        {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-300 dark:text-slate-600" />}
                    </div>
                </div>
            </div>

            {/* RIGHT — edit panel */}
            <aside className="w-72 shrink-0 flex flex-col gap-3">
                {!selected ? (
                    <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
                        <div className="text-center space-y-2 px-6">
                            <PencilLine className="w-7 h-7 text-slate-200 dark:text-slate-700 mx-auto" />
                            <p className="text-xs text-slate-400 dark:text-slate-500">Click a district row to edit it</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                        <ScrollArea className="flex-1">
                            <div className="p-5 space-y-0">

                                {/* Header */}
                                <div className="flex items-start gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{selected.district_name}</h3>
                                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0 text-[10px] shrink-0">ID #{selected.district_id}</Badge>
                                            {saving && <Loader2 className="w-3 h-3 animate-spin text-slate-400 dark:text-slate-500" />}
                                        </div>
                                        {/* Current summary */}
                                        <div className="mt-1.5 flex flex-col gap-0.5">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Building2 className="w-2.5 h-2.5" />
                                                {getProvince(selected) || <span className="italic text-slate-300 dark:text-slate-600">No province</span>}
                                            </span>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Users className="w-2.5 h-2.5" />
                                                {selected.population
                                                    ? selected.population.toLocaleString()
                                                    : <span className="italic text-slate-300 dark:text-slate-600">No population data</span>
                                                }
                                            </span>
                                        </div>
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
                                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Edit District</span>
                                    <div className="space-y-3">
                                        <div>
                                            <label className={labelCls}>District Name</label>
                                            <input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} placeholder="District name" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Province</label>
                                            <input value={editProvince} onChange={e => setEditProvince(e.target.value)} className={inputCls} placeholder="e.g. Western" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Population</label>
                                            <input
                                                value={editPopulation}
                                                onChange={e => setEditPopulation(e.target.value)}
                                                type="number"
                                                className={inputCls}
                                                placeholder="Enter population count"
                                            />
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Leave blank to keep existing value</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={saving || !editName.trim()}
                                            onClick={() => void handleUpdate()}
                                            className="w-full h-8 text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm"
                                        >
                                            <Save className="w-3 h-3 mr-1.5" />Save changes
                                        </Button>
                                    </div>
                                </div>

                                {/* Danger zone */}
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-5">
                                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Danger Zone</span>
                                    {!showDeleteConfirm ? (
                                        <Button size="sm" onClick={() => setShowDeleteConfirm(true)}
                                            className="h-7 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 font-semibold shadow-sm">
                                            <Trash2 className="w-3 h-3 mr-1.5" />Delete district
                                        </Button>
                                    ) : (
                                        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 space-y-2 animate-in fade-in duration-150">
                                            <p className="text-xs text-red-600 dark:text-red-400">This may break historical data. Confirm?</p>
                                            <div className="flex gap-2">
                                                <Button size="sm" disabled={saving} onClick={() => void handleDelete()}
                                                    className="h-7 text-xs bg-red-600 text-white hover:bg-red-700 font-semibold shadow-sm">Confirm</Button>
                                                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}
                                                    className="h-7 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">Cancel</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="h-4" />
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </aside>
        </div>
    );
}
