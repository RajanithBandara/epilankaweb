"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, Loader2, X, ChevronRight } from "lucide-react";

type RowData = Record<string, unknown>;
type TableDetail = {
    columns: string[];
    total_rows: number;
    displayed_rows: number;
    is_limited: boolean;
    limit: number;
    data: RowData[];
} | { error: string };
type TablesDict = { [tableName: string]: TableDetail };
type TableInfo  = { name: string; detail: TableDetail };

function isErrorTable(d: TableDetail): d is { error: string } { return "error" in d; }
function tableRows(d: TableDetail): RowData[] { return isErrorTable(d) ? [] : d.data; }
function tableColumns(d: TableDetail): string[] { return isErrorTable(d) ? [] : d.columns; }
function tableTotal(d: TableDetail): number   { return isErrorTable(d) ? 0 : d.total_rows; }
function tableLimited(d: TableDetail): boolean { return isErrorTable(d) ? false : d.is_limited; }

const safeStr = (v: unknown): string => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") { try { return JSON.stringify(v); } catch { return String(v); } }
    return String(v);
};

export default function AdminTablesPanel() {
    const [tables, setTables]         = useState<TablesDict>({});
    const [selected, setSelected]     = useState<string>("");
    const [loading, setLoading]       = useState(false);
    const [errorMsg, setErrorMsg]     = useState("");
    const [selectedRow, setSelectedRow] = useState<RowData | null>(null);
    const [tab, setTab]               = useState<"table" | "json">("table");

    const fetchTables = useCallback(async () => {
        setLoading(true); setErrorMsg(""); setSelectedRow(null);
        try {
            const res = await fetch("/api/admin/postgres/tables", { cache: "no-store" });
            if (!res.ok) { const t = await res.text(); throw new Error(t || `HTTP ${res.status}`); }
            const data: TablesDict = await res.json();
            setTables(data);
            const keys = Object.keys(data);
            if (keys.length && !selected) setSelected(keys[0]);
        } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Failed to load tables"); }
        finally { setLoading(false); }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { void fetchTables(); }, [fetchTables]);

    const tableList: TableInfo[] = useMemo(
        () => Object.entries(tables).map(([name, detail]) => ({ name, detail })).sort((a, b) => a.name.localeCompare(b.name)),
        [tables],
    );

    const activeDetail  = selected ? tables[selected] : undefined;
    const activeRows    = activeDetail ? tableRows(activeDetail)    : [];
    const columns       = activeDetail ? tableColumns(activeDetail) : [];
    const activeTotal   = activeDetail ? tableTotal(activeDetail)   : 0;
    const activeLimited = activeDetail ? tableLimited(activeDetail) : false;

    return (
        <div className="flex gap-5 h-[calc(100vh-112px)] min-h-[500px] animate-in fade-in duration-300">

            {/* LEFT — table list */}
            <aside className="w-56 shrink-0 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tables</span>
                    <button onClick={() => void fetchTables()} disabled={loading}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors duration-150">
                        <RefreshCw className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(" ")} />
                    </button>
                </div>

                <ScrollArea className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="p-2 space-y-0.5">
                        {loading && tableList.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400 dark:text-slate-500" />
                            </div>
                        ) : tableList.length === 0 ? (
                            <div className="text-center py-10 space-y-2">
                                <Database className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
                                <p className="text-xs text-slate-400 dark:text-slate-500">No tables found</p>
                            </div>
                        ) : tableList.map(({ name, detail }) => {
                            const active    = name === selected;
                            const rowCount  = tableTotal(detail);
                            const hasError  = isErrorTable(detail);
                            return (
                                <button key={name} type="button" onClick={() => { setSelected(name); setSelectedRow(null); setTab("table"); }}
                                    className={["w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-150",
                                        active ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"].join(" ")}>
                                    <ChevronRight className={["w-3 h-3 shrink-0 transition-transform duration-100",
                                        active ? "text-blue-700 dark:text-blue-400" : "text-slate-400 dark:text-slate-500",
                                        active ? "rotate-90" : ""].join(" ")} />
                                    <span className={["flex-1 text-xs font-medium truncate", hasError ? "line-through opacity-50" : ""].join(" ")}>{name}</span>
                                    <Badge className={["text-[10px] px-1.5 py-0 h-4 font-medium border-0",
                                        active ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"].join(" ")}>
                                        {hasError ? "err" : rowCount}
                                    </Badge>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className="text-xs text-slate-400 dark:text-slate-500 px-2">{tableList.length} tables loaded</div>
            </aside>

            {/* RIGHT — table viewer */}
            <div className="flex-1 flex flex-col rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">

                {errorMsg && (
                    <div className="flex items-center justify-between gap-2 m-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
                        {errorMsg}
                        <button onClick={() => setErrorMsg("")}><X className="w-3.5 h-3.5" /></button>
                    </div>
                )}

                {!selected || tableList.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <Database className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">Select a table to browse</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
                        {/* top bar */}
                        <div className="flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selected}</h2>
                                <Badge className="text-[10px] px-2 py-0 h-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0">{activeTotal} rows</Badge>
                                {activeLimited && <Badge className="text-[10px] px-2 py-0 h-4 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-0">limited</Badge>}
                                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 dark:text-slate-500" />}
                            </div>
                        </div>

                        {/* main content */}
                        <Tabs value={tab} onValueChange={(v) => setTab(v as "table" | "json")} className="flex-1 flex flex-col overflow-hidden">
                            <TabsList className="w-fit h-7 gap-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-0.5 rounded-lg shrink-0">
                                {(["table", "json"] as const).map((t) => (
                                    <TabsTrigger key={t} value={t}
                                        className="h-6 px-3 text-[11px] font-medium rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-slate-400 transition-all duration-150">
                                        {t === "table" ? "Table" : "JSON"}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <TabsContent value="table" className="flex-1 overflow-hidden mt-2 flex gap-3">
                                {/* rows table */}
                                <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                                    <ScrollArea className="h-full">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                                                    {columns.map((col) => (
                                                        <TableHead key={col} className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap px-4 py-2.5 h-auto">
                                                            {col}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activeRows.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={Math.max(columns.length, 1)} className="text-center text-slate-400 dark:text-slate-500 text-xs py-10">
                                                            Table is empty
                                                        </TableCell>
                                                    </TableRow>
                                                ) : activeRows.map((row, i) => (
                                                    <TableRow key={i} onClick={() => setSelectedRow(row === selectedRow ? null : row)}
                                                        className={["border-slate-100 dark:border-slate-800 cursor-pointer transition-colors duration-100",
                                                            row === selectedRow ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-slate-50 dark:hover:bg-slate-800"].join(" ")}>
                                                        {columns.map((col) => (
                                                            <TableCell key={col} className="text-xs text-slate-600 dark:text-slate-300 px-4 py-2 whitespace-nowrap max-w-[220px] truncate font-mono">
                                                                {safeStr(row[col])}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>

                                {/* row detail */}
                                {selectedRow && (
                                    <div className="w-64 shrink-0 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-right-2 duration-200 bg-white dark:bg-slate-900">
                                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800">
                                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Row detail</span>
                                            <button onClick={() => setSelectedRow(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <ScrollArea className="flex-1">
                                            <div className="p-3 space-y-2">
                                                {Object.entries(selectedRow).map(([k, v]) => (
                                                    <div key={k}>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium mb-0.5">{k}</div>
                                                        <div className="text-[11px] text-slate-700 dark:text-slate-300 break-all font-mono">{safeStr(v)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="json" className="flex-1 overflow-hidden mt-2">
                                <div className="h-full rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/50">
                                    <ScrollArea className="h-full">
                                        <pre className="text-[11px] text-slate-600 dark:text-slate-400 p-4 font-mono leading-relaxed">
                                            {JSON.stringify(activeRows, null, 2)}
                                        </pre>
                                    </ScrollArea>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
}
