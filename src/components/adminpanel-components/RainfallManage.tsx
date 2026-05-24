"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CloudRain, RefreshCw, Loader2, MapPin, PencilLine, Save, X, Calendar
} from "lucide-react";

type RainfallRecord = {
    district_id: number;
    district_name: string;
    monthly_mm: Record<string, number>;
    annual_rainfall_mm: number;
};

const inputCls = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 h-9 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm";
const labelCls = "block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

const MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
];

export default function RainfallManage() {
    const [records, setRecords] = useState<RainfallRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [query, setQuery] = useState("");
    
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<Record<string, string>>({});

    const selected = useMemo(
        () => records.find(r => r.district_id === selectedId) ?? null,
        [records, selectedId]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return records;
        return records.filter(r =>
            r.district_name.toLowerCase().includes(q) ||
            String(r.district_id).includes(q)
        );
    }, [records, query]);

    const fetchRecords = useCallback(async () => {
        setLoading(true); setErrorMsg("");
        try {
            const res = await fetch("/api/admin/rainfall/list", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setRecords(Array.isArray(data.records) ? data.records : []);
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        if (selected) {
            const init: Record<string, string> = {};
            MONTHS.forEach(m => {
                init[m] = selected.monthly_mm[m] !== undefined ? String(selected.monthly_mm[m]) : "0";
            });
            setEditValues(init);
        }
    }, [selected]);

    const handleSync = async () => {
        setSyncing(true); setErrorMsg("");
        try {
            const res = await fetch("/api/admin/rainfall/sync", {
                method: "POST",
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d?.detail || "Sync Failed");
            }
            await fetchRecords();
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const handleUpdate = async () => {
        if (!selected) return;
        setSaving(true); setErrorMsg("");
        try {
            const payload: Record<string, number> = {};
            MONTHS.forEach(m => {
                if (editValues[m] !== "") {
                    payload[m] = parseInt(editValues[m], 10) || 0;
                }
            });

            const res = await fetch(`/api/admin/rainfall/update/${selected.district_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d?.detail || "Update failed");
            }
            await fetchRecords();
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleEditChange = (month: string, val: string) => {
        setEditValues(prev => ({ ...prev, [month]: val }));
    };

    return (
        <div className="flex gap-5 h-[calc(100vh-112px)] min-h-[500px] animate-in fade-in duration-300">
            {/* LEFT PANE - List */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
                {/* Toolbar */}
                <div className="flex items-center gap-2">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search by district name or ID…"
                        className="h-8 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg px-3 flex-1 shadow-sm"
                    />
                    <button
                        onClick={() => void handleSync()}
                        disabled={syncing}
                        className="shrink-0 h-8 px-3 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all duration-150 shadow-sm flex items-center gap-1.5"
                    >
                        {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudRain className="w-3 h-3" />}
                        {syncing ? "Syncing..." : "Sync Open-Meteo"}
                    </button>
                    <button
                        onClick={() => void fetchRecords()}
                        disabled={loading}
                        className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition-all duration-150 shadow-sm"
                    >
                        <RefreshCw className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(" ")} />
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-[3rem_2fr_3fr] gap-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">#</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">District Name</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><CloudRain className="w-3 h-3" />Annual Rainfall</span>
                        </span>
                    </div>

                    <ScrollArea className="flex-1 overflow-auto">
                        {loading && !records.length ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-300 dark:text-slate-600" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <CloudRain className="w-7 h-7 text-slate-200 dark:text-slate-700" />
                                <p className="text-xs text-slate-400 dark:text-slate-500">No rainfall records found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-auto">
                                {filtered.map(r => {
                                    const active = r.district_id === selectedId;
                                    return (
                                        <button
                                            key={r.district_id}
                                            type="button"
                                            onClick={() => setSelectedId(r.district_id)}
                                            className={[
                                                "w-full grid grid-cols-[3rem_2fr_3fr] gap-0 px-4 py-3 text-left transition-all duration-100 group",
                                                active ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/80",
                                            ].join(" ")}
                                        >
                                            <span className={["text-[11px] font-mono font-semibold self-center", active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"].join(" ")}>
                                                {r.district_id}
                                            </span>
                                            <span className={["text-sm font-medium self-center truncate", active ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"].join(" ")}>
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className={["w-3 h-3 shrink-0", active ? "text-blue-500 dark:text-blue-400" : "text-slate-300 dark:text-slate-600"].join(" ")} />
                                                    {r.district_name}
                                                </span>
                                            </span>
                                            <span className="self-center">
                                                <Badge className={["text-[11px] font-semibold tabular-nums border-0 px-2",
                                                    active ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"].join(" ")}>
                                                    {r.annual_rainfall_mm} mm
                                                </Badge>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{filtered.length} of {records.length} records</span>
                        {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-300 dark:text-slate-600" />}
                    </div>
                </div>
            </div>

            {/* RIGHT PANE - Edit View */}
            <aside className="w-80 shrink-0 flex flex-col gap-3">
                {!selected ? (
                    <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
                        <div className="text-center space-y-2 px-6">
                            <PencilLine className="w-7 h-7 text-slate-200 dark:text-slate-700 mx-auto" />
                            <p className="text-xs text-slate-400 dark:text-slate-500">Click a district row to view and edit monthly rainfall</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                        <ScrollArea className="flex-1">
                            <div className="p-5 space-y-0">
                                {/* Header */}
                                <div className="flex items-start gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                        <CloudRain className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{selected.district_name}</h3>
                                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0 text-[10px] shrink-0">ID #{selected.district_id}</Badge>
                                        </div>
                                        <div className="mt-1.5 flex flex-col gap-0.5">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                                                Annual: {selected.annual_rainfall_mm} mm
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
                                    <div className="flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-200">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest">Monthly Breakdown (mm)</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {MONTHS.map(month => (
                                            <div key={month}>
                                                <label className={labelCls}>{month.substring(0, 3)}</label>
                                                <input
                                                    type="number"
                                                    value={editValues[month] || ""}
                                                    onChange={e => handleEditChange(month, e.target.value)}
                                                    className={inputCls}
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        size="sm"
                                        disabled={saving}
                                        onClick={() => void handleUpdate()}
                                        className="w-full h-8 text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm"
                                    >
                                        {saving ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
                                        Save Changes
                                    </Button>
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
