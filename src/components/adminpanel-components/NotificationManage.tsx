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
    info:     { badge: "bg-blue-50 text-blue-600",    dot: "bg-blue-500" },
    warning:  { badge: "bg-amber-50 text-amber-600",  dot: "bg-amber-500" },
    critical: { badge: "bg-red-50 text-red-600",      dot: "bg-red-500" },
    success:  { badge: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
};

const inputCls = "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm rounded-lg px-3 py-2 h-9 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm";
const labelCls = "block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5";

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
                        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-all duration-150 shadow-sm">
                        <RefreshCw className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(" ")} />
                    </button>
                </div>

                {successMsg && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 animate-in fade-in duration-200">
                        <Send className="w-3.5 h-3.5 shrink-0" />{successMsg}
                    </div>
                )}

                {showCreate && (
                    <form onSubmit={handleCreate} className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                        <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Broadcast to All Users</p>
                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title (optional)" className={inputCls} />
                        <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Notification message *" required rows={3}
                            className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm resize-none" />
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
                                className="h-7 text-xs border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">Cancel</Button>
                        </div>
                    </form>
                )}

                <ScrollArea className="flex-1 rounded-lg border border-slate-100 bg-white">
                    <div className="p-2 space-y-0.5">
                        {loading && !notifications.length ? (
                            <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-10 space-y-2">
                                <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                                <p className="text-xs text-slate-400">No notifications yet</p>
                            </div>
                        ) : notifications.map(n => {
                            const active = n.notification_id === selectedId;
                            const sev = SEV_STYLES[n.severity] ?? SEV_STYLES.info;
                            return (
                                <button key={n.notification_id} type="button" onClick={() => setSelectedId(n.notification_id)}
                                    className={["w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150",
                                        active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"].join(" ")}>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={["w-2 h-2 rounded-full shrink-0", sev.dot].join(" ")} />
                                        <span className={["text-xs font-semibold truncate flex-1", active ? "text-blue-700" : ""].join(" ")}>
                                            {n.title || n.text.slice(0, 40)}
                                        </span>
                                        <Badge className={["text-[10px] px-1.5 py-0 h-4 font-medium border-0 shrink-0", sev.badge].join(" ")}>
                                            {n.severity}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <span className={["text-[11px] truncate", active ? "text-blue-700/60" : "text-slate-400"].join(" ")}>
                                            {n.text.slice(0, 50)}{n.text.length > 50 ? "…" : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 mt-0.5">
                                        <Clock className="w-3 h-3 text-slate-300" />
                                        <span className="text-[10px] text-slate-400">{safeDate(n.created_at)}</span>
                                        {!n.read && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Unread</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
                <div className="text-xs text-slate-400 px-2">{notifications.length} notifications</div>
            </aside>

            {/* RIGHT — detail panel */}
            <div className="flex-1 rounded-lg border border-slate-100 bg-white overflow-hidden flex flex-col">
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <Bell className="w-8 h-8 text-slate-200 mx-auto" />
                            <p className="text-sm text-slate-400">Select a notification to view details</p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 overflow-auto">
                        <div className="p-6 space-y-0">
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-6">
                                <div className={["w-12 h-12 rounded-xl border flex items-center justify-center shrink-0",
                                    selected.severity === "critical" ? "bg-red-50 border-red-100" :
                                    selected.severity === "warning" ? "bg-amber-50 border-amber-100" :
                                    selected.severity === "success" ? "bg-emerald-50 border-emerald-100" :
                                    "bg-blue-50 border-blue-100"
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
                                        <h3 className="font-semibold text-slate-800 text-base truncate">
                                            {selected.title || "Untitled"}
                                        </h3>
                                        <Badge className={["text-[10px] px-1.5 py-0 h-4 font-medium border-0", (SEV_STYLES[selected.severity] ?? SEV_STYLES.info).badge].join(" ")}>
                                            {selected.severity}
                                        </Badge>
                                        <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px]">{selected.category}</Badge>
                                        {selected.read
                                            ? <span className="text-[10px] text-emerald-600 font-medium">✓ Read</span>
                                            : <span className="text-[10px] text-amber-600 font-medium">● Unread</span>
                                        }
                                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">{selected.notification_id}</p>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="flex items-center justify-between gap-2 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                                    {errorMsg}
                                    <button onClick={() => setErrorMsg("")}><X className="w-3.5 h-3.5" /></button>
                                </div>
                            )}

                            {/* Content */}
                            <div className="border-t border-slate-100 pt-4">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block mb-3">Message</span>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.text}</p>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block mb-3">Details</span>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                                    <span className="text-slate-400">Created</span>
                                    <span className="text-slate-700">{safeDate(selected.created_at)}</span>
                                    <span className="text-slate-400">Category</span>
                                    <span className="text-slate-700 capitalize">{selected.category}</span>
                                    <span className="text-slate-400">Severity</span>
                                    <span className="text-slate-700 capitalize">{selected.severity}</span>
                                    <span className="text-slate-400">Read Status</span>
                                    <span className="text-slate-700">{selected.read ? "Read" : "Unread"}</span>
                                </div>
                            </div>

                            {/* Danger zone */}
                            <div className="border-t border-slate-100 pt-4 mt-6">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block mb-3">Danger Zone</span>
                                {!showDeleteConfirm ? (
                                    <Button size="sm" onClick={() => setShowDeleteConfirm(true)}
                                        className="h-7 text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold shadow-sm">
                                        <Trash2 className="w-3 h-3 mr-1.5" />Delete notification
                                    </Button>
                                ) : (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-3 animate-in fade-in duration-150">
                                        <p className="text-xs text-red-600">This will permanently delete this notification.</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" disabled={saving} onClick={() => void handleDelete()}
                                                className="h-7 text-xs bg-red-600 text-white hover:bg-red-700 font-semibold shadow-sm">Confirm delete</Button>
                                            <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}
                                                className="h-7 text-xs border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">Cancel</Button>
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
