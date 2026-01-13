"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type TablePayload = {
    columns?: string[];
    total_rows?: number;
    displayed_rows?: number;
    is_limited?: boolean;
    limit?: number;
    data?: Array<Record<string, unknown>>;
    error?: string;
};

type DbDump = Record<string, TablePayload>;

export default function DbBrowser() {
    const [dump, setDump] = useState<DbDump | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string>("");

    const [activeTable, setActiveTable] = useState<string>("");
    const [tableSearch, setTableSearch] = useState("");
    const [sidebarSearch, setSidebarSearch] = useState("");

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const res = await fetch("/api/admin/postgres/tables", { cache: "no-store" });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || "Failed to load");
            }
            const json = (await res.json()) as DbDump;
            setDump(json);

            const first = Object.keys(json)[0];
            setActiveTable((prev) => prev || first || "");
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Request failed");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    const tableNames = useMemo(() => {
        if (!dump) return [];
        const all = Object.keys(dump).sort((a, b) => a.localeCompare(b));
        const q = sidebarSearch.trim().toLowerCase();
        if (!q) return all;
        return all.filter((n) => n.toLowerCase().includes(q));
    }, [dump, sidebarSearch]);

    const active = useMemo(() => {
        if (!dump || !activeTable) return null;
        return dump[activeTable] || null;
    }, [dump, activeTable]);

    const rows = active?.data || [];
    const columns = active?.columns || [];

    const filteredRows = useMemo(() => {
        const q = tableSearch.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((r) =>
            Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
        );
    }, [rows, tableSearch]);

    return (
        <div className="flex h-screen w-full bg-[#0B0B10]">
            {/* LEFT SIDEBAR */}
            <div className="w-80 border-r border-white/10 bg-black/20 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-lg font-semibold text-white">Database Browser</h1>
                            <p className="text-xs text-white/50 mt-1">
                                {dump ? `${Object.keys(dump).length} tables` : "Loading..."}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={load}
                            disabled={loading}
                            className="h-8 bg-white/5 text-white hover:bg-white/10 border border-white/10"
                        >
                            {loading ? "..." : "↻"}
                        </Button>
                    </div>

                    <Input
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                        placeholder="Search tables..."
                        className="border-white/10 bg-black/30 text-white placeholder:text-white/40 focus-visible:ring-white/20"
                    />
                </div>

                {err && (
                    <div className="mx-4 mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                        {err}
                    </div>
                )}

                <ScrollArea className="flex-1 px-4 py-4">
                    {!dump ? (
                        <div className="text-sm text-white/60">Loading tables...</div>
                    ) : tableNames.length === 0 ? (
                        <div className="text-sm text-white/60">No tables found.</div>
                    ) : (
                        <div className="space-y-1">
                            {tableNames.map((name) => {
                                const t = dump[name];
                                const isActive = name === activeTable;

                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => {
                                            setActiveTable(name);
                                            setTableSearch("");
                                        }}
                                        className={[
                                            "w-full rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                                            isActive
                                                ? "bg-white/10 border border-white/20"
                                                : "border border-transparent hover:bg-white/5",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium text-white/90">
                                                    {name}
                                                </div>
                                                <div className="mt-1 text-xs text-white/50">
                                                    {t?.total_rows ?? "—"} rows
                                                </div>
                                            </div>

                                            {t?.is_limited && (
                                                <Badge
                                                    variant="secondary"
                                                    className="border border-white/10 bg-white/5 text-[10px] text-white/70 h-5"
                                                >
                                                    Limited
                                                </Badge>
                                            )}
                                        </div>

                                        {t?.error && (
                                            <div className="mt-2 text-[11px] text-red-200/80">
                                                {t.error}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col">
                {!active ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-white/40 text-sm">Select a table to view data</div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* HEADER */}
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">{activeTable}</h2>
                                    <p className="text-sm text-white/50 mt-1">
                                        Total rows: {active.total_rows ?? "—"} • Showing:{" "}
                                        {active.displayed_rows ?? "—"}
                                        {active.is_limited ? ` (limit ${active.limit})` : ""}
                                    </p>
                                </div>

                                <Input
                                    value={tableSearch}
                                    onChange={(e) => setTableSearch(e.target.value)}
                                    placeholder="Search rows..."
                                    className="w-80 border-white/10 bg-black/30 text-white placeholder:text-white/40 focus-visible:ring-white/20"
                                />
                            </div>

                            {/* Column badges */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {columns.map((c) => (
                                    <span
                                        key={c}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                                    >
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 overflow-hidden">
                            <Tabs defaultValue="preview" className="h-full flex flex-col">
                                <div className="px-6 pt-4">
                                    <TabsList className="bg-white/5 border border-white/10">
                                        <TabsTrigger
                                            value="preview"
                                            className="data-[state=active]:bg-white data-[state=active]:text-black"
                                        >
                                            Preview
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="json"
                                            className="data-[state=active]:bg-white data-[state=active]:text-black"
                                        >
                                            JSON
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* PREVIEW TAB */}
                                <TabsContent value="preview" className="flex-1 overflow-hidden px-6 pb-6">
                                    <div className="h-full rounded-xl border border-white/10 bg-black/25 overflow-hidden flex flex-col">
                                        <ScrollArea className="flex-1">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-[#0B0B10] z-10">
                                                    <TableRow className="border-white/10">
                                                        {columns.map((c) => (
                                                            <TableHead key={c} className="text-white/70">
                                                                {c}
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>

                                                <TableBody>
                                                    {filteredRows.length === 0 ? (
                                                        <TableRow className="border-white/10">
                                                            <TableCell
                                                                colSpan={Math.max(columns.length, 1)}
                                                                className="text-center text-white/50 h-32"
                                                            >
                                                                No rows found.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        filteredRows.map((row, idx) => (
                                                            <TableRow
                                                                key={idx}
                                                                className="border-white/5 hover:bg-white/5 transition-colors duration-150"
                                                            >
                                                                {columns.map((c) => (
                                                                    <TableCell key={c} className="align-top text-white/85">
                                                                        <Cell value={row?.[c]} />
                                                                    </TableCell>
                                                                ))}
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>

                                        {active.is_limited && (
                                            <div className="border-t border-white/10 px-4 py-3 text-xs text-white/55 bg-[#0B0B10]">
                                                Limited view: showing up to {active.limit} rows.
                                                Consider a paginated endpoint for full browsing.
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* JSON TAB */}
                                <TabsContent value="json" className="flex-1 overflow-hidden px-6 pb-6">
                                    <div className="h-full rounded-xl border border-white/10 bg-black/25 p-4 overflow-auto">
                                        <pre className="text-xs leading-relaxed text-white/70">
                                            {safeStringify(active)}
                                        </pre>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Cell({ value }: { value: unknown }) {
    if (value == null) return <span className="text-white/40">—</span>;

    if (typeof value === "object") {
        const text = safeStringify(value);
        const short = text.length > 120 ? text.slice(0, 120) + "…" : text;

        return (
            <div className="space-y-1">
                <div className="rounded bg-white/5 border border-white/10 px-2 py-1 text-[11px] text-white/70">
                    {short}
                </div>
                <details className="text-[11px] text-white/60">
                    <summary className="cursor-pointer select-none hover:text-white/80 transition-colors">
                        Expand
                    </summary>
                    <pre className="mt-2 max-h-44 overflow-auto rounded bg-white/5 border border-white/10 p-2 text-[10px] leading-relaxed text-white/70">
                        {text}
                    </pre>
                </details>
            </div>
        );
    }

    return <span className="wrap-break-word">{String(value)}</span>;
}

function safeStringify(v: unknown) {
    try {
        return JSON.stringify(v, null, 2);
    } catch {
        return String(v);
    }
}