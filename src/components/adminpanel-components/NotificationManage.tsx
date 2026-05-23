"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, RefreshCw, Loader2, X, Trash2, Send, Megaphone, Clock } from "lucide-react";

type Notification = {
    notification_id: string;
    _id: string;
    title?: string;
    text: string;
    severity: string;
    category: string;
    created_at: string;
    read: boolean;
};

const SEV_STYLES: Record<string, { badge: string; dot: string }> = {
    info:     { badge: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",    dot: "bg-blue-500" },
    warning:  { badge: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",  dot: "bg-amber-500" },
    critical: { badge: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",      dot: "bg-red-500" },
    success:  { badge: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
};

const inputCls = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 h-9 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm";
const labelCls = "block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

const safeDate = (ts?: string) => { if (!ts) return "—"; try { const d = new Date(ts); return isNaN(d.getTime()) ? "—" : d.toLocaleString(); } catch { return "—"; } };

export default function NotificationManage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading]   = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving]     = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    // Create form
    const [newTitle, setNewTitle]       = useState("");
    const [newText, setNewText]         = useState("");
    const [newSeverity, setNewSeverity] = useState("info");
    const [newCategory, setNewCategory] = useState("system");

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const selected = useMemo(() => notifications.find(n => n.notification_id === selectedId) ?? null, [notifications, selectedId]);

    const fetchNotifications = useCallback(async () => {
        setLoading(true); setErrorMsg("");
        try {
            const res = await fetch("/api/notifications?skip=0&limit=50", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const items: Notification[] = data?.items ?? (Array.isArray(data) ? data : []);
            setNotifications(items);
            if (items.length && selectedId === null) setSelectedId(items[0].notification_id);
        } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Failed to load"); }
        finally { setLoading(false); }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);

    useEffect(() => {
        if (selected) setShowDeleteConfirm(false);
    }, [selected]);

    const handleDelete = async () => {
        if (!selected) return;
        setSaving(true); setErrorMsg("");
        try {
            const res = await fetch(`/api/notifications/${selected.notification_id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            setSelectedId(null); setShowDeleteConfirm(false);
            await fetchNotifications();
        } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Delete failed"); }
        finally { setSaving(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim()) return;
        setSaving(true); setErrorMsg(""); setSuccessMsg("");
        try {
            const res = await fetch("/api/notifications", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle.trim() || undefined,
                    text: newText.trim(),
                    severity: newSeverity,
                    category: newCategory,
                    metadata: {},
                }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d?.detail || "Failed"); }
            setNewTitle(""); setNewText(""); setNewSeverity("info"); setNewCategory("system");
            setShowCreate(false);
            setSuccessMsg("Notification broadcast to all users!");
            setTimeout(() => setSuccessMsg(""), 4000);
            await fetchNotifications();
        } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Create failed"); }
        finally { setSaving(false); }
    };

    return (
        <div className="flex gap-5 h-[calc(100vh-112px)] min-h-[500px] animate-in fade-in duration-300">

            {/* LEFT — notification list */}
            <aside className="w-80 shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowCreate(v => !v)}
                        className="flex-1 h-9 rounded-lg text-xs font-semibold border bg-blue-600 text-white hover:bg-blue-700 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5">
                        <Megaphone className="w-3.5 h-3.5" />Broadcast Notification
                    </button>
                    <button onClick={() => void fetchNotifications()} disabled={loading}
                        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition-all duration-150 shadow-sm">
                        <RefreshCw className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(" ")} />
                    </button>
                </div>

                {successMsg && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-200">
                        <Send className="w-3.5 h-3.5 shrink-0" />{successMsg}
                    </div>
                )}

                {showCreate && (
                    <form onSubmit={handleCreate} className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/30 p-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                        <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Broadcast to All Users</p>
                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title (optional)" className={inputCls} />
                        <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Notification message *" required rows={3}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm resize-none" />
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelCls}>Severity</label>
                                <select value={newSeverity} onChange={e => setNewSeverity(e.target.value)} className={inputCls}>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="critical">Critical</option>
                                    <option value="success">Success</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Category</label>
                                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className={inputCls}>
                                    <option value="system">System</option>
                                    <option value="disease">Disease</option>
                                    <option value="report">Report</option>
                                    <option value="alert">Alert</option>
                                    <option value="announcement">Announcement</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={saving} className="h-7 text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm">
                                <Send className="w-3 h-3 mr-1" />{saving ? "Sending…" : "Broadcast"}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate(false)}
                                className="h-7 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">Cancel</Button>
                        </div>
                    </form>
                )}

                <ScrollArea className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="p-2 space-y-0.5">
                        {loading && !notifications.length ? (
                            <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-slate-400 dark:text-slate-500" /></div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-10 space-y-2">
                                <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
                                <p className="text-xs text-slate-400 dark:text-slate-500">No notifications yet</p>
                            </div>
                        ) : notifications.map(n => {
                            const active = n.notification_id === selectedId;
                            const sev = SEV_STYLES[n.severity] ?? SEV_STYLES.info;
                            return (
                                <button key={n.notification_id} type="button" onClick={() => setSelectedId(n.notification_id)}
                                    className={["w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150",
                                        active ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"].join(" ")}>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={["w-2 h-2 rounded-full shrink-0", sev.dot].join(" ")} />
                                        <span className={["text-xs font-semibold truncate flex-1", active ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"].join(" ")}>
                                            {n.title || n.text.slice(0, 40)}
                                        </span>
                                        <Badge className={["text-[10px] px-1.5 py-0 h-4 font-medium border-0 shrink-0", sev.badge].join(" ")}>
                                            {n.severity}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <span className={["text-[11px] truncate", active ? "text-blue-700/60 dark:text-blue-400/60" : "text-slate-400 dark:text-slate-500"].join(" ")}>
                                            {n.text.slice(0, 50)}{n.text.length > 50 ? "…" : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 mt-0.5">
                                        <Clock className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{safeDate(n.created_at)}</span>
                                        {!n.read && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-semibold">Unread</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
                <div className="text-xs text-slate-400 dark:text-slate-500 px-2">{notifications.length} notifications</div>
            </aside>

            {/* RIGHT — detail panel */}
            <div className="flex-1 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">Select a notification to view details</p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 overflow-auto">
                        <div className="p-6 space-y-0">
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-6">
                                <div className={["w-12 h-12 rounded-xl border flex items-center justify-center shrink-0",
                                    selected.severity === "critical" ? "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50" :
                                    selected.severity === "warning" ? "bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50" :
                                    selected.severity === "success" ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50" :
                                    "bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50"
                                ].join(" ")}>
                                    <Bell className={["w-5 h-5",
                                        selected.severity === "critical" ? "text-red-500" :
                                        selected.severity === "warning" ? "text-amber-500" :
                                        selected.severity === "success" ? "text-emerald-500" :
                                        "text-blue-500"
                                    ].join(" ")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base truncate">
                                            {selected.title || "Untitled"}
                                        </h3>
                                        <Badge className={["text-[10px] px-1.5 py-0 h-4 font-medium border-0", (SEV_STYLES[selected.severity] ?? SEV_STYLES.info).badge].join(" ")}>
                                            {selected.severity}
                                        </Badge>
                                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0 text-[10px]">{selected.category}</Badge>
                                        {selected.read
                                            ? <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Read</span>
                                            : <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">● Unread</span>
                                        }
                                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 dark:text-slate-500" />}
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono truncate">{selected.notification_id}</p>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="flex items-center justify-between gap-2 mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
                                    {errorMsg}
                                    <button onClick={() => setErrorMsg("")}><X className="w-3.5 h-3.5" /></button>
                                </div>
                            )}

                            {/* Content */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Message</span>
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.text}</p>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Details</span>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                                    <span className="text-slate-400 dark:text-slate-500">Created</span>
                                    <span className="text-slate-700 dark:text-slate-300">{safeDate(selected.created_at)}</span>
                                    <span className="text-slate-400 dark:text-slate-500">Category</span>
                                    <span className="text-slate-700 dark:text-slate-300 capitalize">{selected.category}</span>
                                    <span className="text-slate-400 dark:text-slate-500">Severity</span>
                                    <span className="text-slate-700 dark:text-slate-300 capitalize">{selected.severity}</span>
                                    <span className="text-slate-400 dark:text-slate-500">Read Status</span>
                                    <span className="text-slate-700 dark:text-slate-300">{selected.read ? "Read" : "Unread"}</span>
                                </div>
                            </div>

                            {/* Danger zone */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Danger Zone</span>
                                {!showDeleteConfirm ? (
                                    <Button size="sm" onClick={() => setShowDeleteConfirm(true)}
                                        className="h-7 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 font-semibold shadow-sm">
                                        <Trash2 className="w-3 h-3 mr-1.5" />Delete notification
                                    </Button>
                                ) : (
                                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 space-y-3 animate-in fade-in duration-150">
                                        <p className="text-xs text-red-600 dark:text-red-400">This will permanently delete this notification.</p>
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
