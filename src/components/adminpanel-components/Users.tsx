"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    User, ShieldOff, ShieldCheck, Trash2, KeyRound, ImagePlus,
    RefreshCw, Activity, Loader2, X, ChevronDown, ChevronUp,
} from "lucide-react";

type UserType = {
    _id: string; username?: string; email?: string;
    profile_image?: string | null; created_at?: string; updated_at?: string;
    is_banned?: boolean; ban_reason?: string; banned_at?: string;
};
type JsonValue = string | number | boolean | null | { [k: string]: JsonValue } | JsonValue[];
type ActivityLog  = { _id: string; user_id: string; action: string; timestamp: string; details?: JsonValue };
type ActivityResponse = ActivityLog[] | { user?: string; logs?: ActivityLog[]; msg?: string };
type ApiError = { msg?: string; detail?: string };

const api = axios.create({ baseURL: "/api" });
const err = (e: unknown) => { const a = e as AxiosError<ApiError>; return a?.response?.data?.msg || a?.response?.data?.detail || a?.message || "Request failed"; };
const safeDate = (ts?: string) => { if (!ts) return "—"; try { const d = new Date(ts); return isNaN(d.getTime()) ? "—" : d.toLocaleString(); } catch { return "—"; } };
const safeJSON = (v: unknown) => { try { return JSON.stringify(v, null, 2); } catch { return String(v); } };
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const labelCls = "block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5";
const inputCls = "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm rounded-lg px-3 py-2 h-9 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 shadow-sm";

function Section({ title, children, collapsible }: { title: string; children: React.ReactNode; collapsible?: boolean }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="border-t border-slate-200 pt-4">
            <button type="button" onClick={() => collapsible && setOpen((o) => !o)}
                className={["flex w-full items-center justify-between mb-3", collapsible ? "cursor-pointer" : "cursor-default"].join(" ")}>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{title}</span>
                {collapsible && (open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />)}
            </button>
            {open && <div className="space-y-3">{children}</div>}
        </div>
    );
}

export default function AdminUsersPanel() {
    const [users, setUsers]                   = useState<UserType[]>([]);
    const [loading, setLoading]               = useState(false);
    const [errorMsg, setErrorMsg]             = useState("");
    const [query, setQuery]                   = useState("");
    const [selectedId, setSelectedId]         = useState<string | null>(null);
    const [showBannedOnly, setShowBannedOnly] = useState(false);

    const selectedUser = useMemo(() => users.find((u) => u._id === selectedId) ?? null, [users, selectedId]);

    const [editUsername, setEditUsername] = useState("");
    const [editEmail, setEditEmail]       = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newPassword, setNewPassword]   = useState("");
    const [banReason, setBanReason]       = useState("");
    const [saving, setSaving]             = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activityLogs, setActivityLogs]           = useState<ActivityLog[]>([]);
    const [showActivity, setShowActivity]           = useState(false);
    const [loadingActivity, setLoadingActivity]     = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let r = users;
        if (q) r = r.filter((u) => [(u.username ?? ""), (u.email ?? ""), u._id].some((f) => f.toLowerCase().includes(q)));
        if (showBannedOnly) r = r.filter((u) => u.is_banned);
        return r;
    }, [users, query, showBannedOnly]);

    async function loadUsers() {
        setLoading(true); setErrorMsg("");
        try {
            const res = await api.get<{ users: UserType[] }>("/admin/users/getall", { headers: { "Cache-Control": "no-store" } });
            const data = res.data.users; setUsers(data);
            if (data.length && !selectedId) setSelectedId(data[0]._id);
        } catch (e) { setErrorMsg(err(e)); } finally { setLoading(false); }
    }

    useEffect(() => { void loadUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!selectedUser) return;
        setEditUsername(selectedUser.username ?? ""); setEditEmail(selectedUser.email ?? "");
        setSelectedFile(null); setNewPassword(""); setBanReason(selectedUser.ban_reason ?? "");
        setShowDeleteConfirm(false); setShowActivity(false);
    }, [selectedUser]);

    async function saveProfile() {
        if (!selectedUser) return;
        const payload: Partial<UserType> = {};
        const u = editUsername.trim(), e = editEmail.trim();
        if (u) payload.username = u;
        if (e) { if (!isValidEmail(e)) { setErrorMsg("Invalid email"); return; } payload.email = e; }
        if (!payload.username && !payload.email) { setErrorMsg("No valid fields"); return; }
        setSaving(true); setErrorMsg("");
        try { await api.patch(`/admin/users/${selectedUser._id}`, payload); await loadUsers(); }
        catch (e) { setErrorMsg(err(e)); } finally { setSaving(false); }
    }

    async function saveProfileImage() {
        if (!selectedUser || !selectedFile) { setErrorMsg("Please select a file"); return; }
        setSaving(true); setErrorMsg("");
        try {
            const fd = new FormData(); fd.append("file", selectedFile);
            await api.post(`/admin/users/${selectedUser._id}/profile-image`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            setSelectedFile(null); await loadUsers();
        } catch (e) { setErrorMsg(err(e)); } finally { setSaving(false); }
    }

    async function resetPassword() {
        if (!selectedUser) return;
        const pw = newPassword.trim();
        if (pw.length < 8) { setErrorMsg("Minimum 8 characters"); return; }
        setSaving(true); setErrorMsg("");
        try { await api.post(`/admin/users/${selectedUser._id}/reset-password`, { new_password: pw }); setNewPassword(""); }
        catch (e) { setErrorMsg(err(e)); } finally { setSaving(false); }
    }

    async function toggleBan() {
        if (!selectedUser) return;
        const newBan = !selectedUser.is_banned;
        setSaving(true); setErrorMsg("");
        try {
            await api.put(`/admin/users/${selectedUser._id}/ban`, { is_banned: newBan, reason: newBan ? (banReason.trim() || "No reason") : null });
            setBanReason(""); await loadUsers();
        } catch (e) { setErrorMsg(err(e)); } finally { setSaving(false); }
    }

    async function deleteUser() {
        if (!selectedUser) return;
        setSaving(true); setErrorMsg("");
        try { await api.delete(`/admin/users/${selectedUser._id}/delete`); setShowDeleteConfirm(false); setSelectedId(null); await loadUsers(); }
        catch (e) { setErrorMsg(err(e)); } finally { setSaving(false); }
    }

    async function loadActivity() {
        if (!selectedUser) return;
        setLoadingActivity(true); setErrorMsg("");
        try {
            const res = await api.get<ActivityResponse>(`/admin/users/${selectedUser._id}/activity`);
            const d = res.data; setActivityLogs(Array.isArray(d) ? d : (d?.logs ?? [])); setShowActivity(true);
        } catch (e) { setErrorMsg(err(e)); } finally { setLoadingActivity(false); }
    }

    return (
        <div className="flex gap-5 h-[calc(100vh-112px)] min-h-[500px] animate-in fade-in duration-300">

            {/* LEFT — user list */}
            <aside className="w-72 shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…"
                        className="h-8 text-xs bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-blue-500 flex-1 shadow-sm" />
                    <button onClick={() => setShowBannedOnly((v) => !v)}
                        className={["shrink-0 h-8 px-2.5 rounded-lg text-xs font-medium border transition-all duration-150 shadow-sm",
                            showBannedOnly ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"].join(" ")}>
                        {showBannedOnly ? "Banned" : "All"}
                    </button>
                    <button onClick={() => void loadUsers()} disabled={loading}
                        className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-all duration-150 shadow-sm">
                        <RefreshCw className={["w-3.5 h-3.5", loading ? "animate-spin" : ""].join(" ")} />
                    </button>
                </div>

                <ScrollArea className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-2 space-y-0.5">
                        {loading && !users.length ? (
                            <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-8">No users found</div>
                        ) : filtered.map((u) => {
                            const active = u._id === selectedId;
                            return (
                                <button key={u._id} type="button" onClick={() => setSelectedId(u._id)}
                                    className={["w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150",
                                        active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"].join(" ")}>
                                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                        <span className={["text-xs font-semibold truncate", active ? "text-blue-700" : ""].join(" ")}>
                                            {u.username ?? "(no username)"}
                                        </span>
                                        {u.is_banned && (
                                            <span className={["text-[9px] px-1.5 py-0.5 rounded-full font-semibold tracking-wide shrink-0",
                                                active ? "bg-red-600 text-white" : "bg-red-50 text-red-600"].join(" ")}>
                                                BAN
                                            </span>
                                        )}
                                    </div>
                                    <div className={["text-[11px] truncate", active ? "text-blue-700/60" : "text-slate-400"].join(" ")}>{u.email ?? "(no email)"}</div>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className={["text-xs px-2", showBannedOnly ? "text-red-500/80" : "text-slate-400"].join(" ")}>
                    {filtered.length} / {users.length} users
                </div>
            </aside>

            {/* RIGHT — detail panel */}
            <div className="flex-1 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm">
                {!selectedUser ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <User className="w-8 h-8 text-slate-200 mx-auto" />
                            <p className="text-sm text-slate-400">Select a user to manage</p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-0">

                            {/* Header */}
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                                    {selectedUser.profile_image
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        ? <img src={selectedUser.profile_image} alt="" className="w-full h-full object-cover" />
                                        : <User className="w-5 h-5 text-slate-300" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-800 text-base truncate">{selectedUser.username ?? "(no username)"}</h3>
                                        {selectedUser.is_banned && <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">Banned</Badge>}
                                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{selectedUser.email ?? "—"}</p>
                                    <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">{selectedUser._id}</p>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="flex items-center justify-between gap-2 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                                    {errorMsg}
                                    <button onClick={() => setErrorMsg("")}><X className="w-3.5 h-3.5" /></button>
                                </div>
                            )}

                            {/* Meta */}
                            <Section title="Account info">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                                    {[["Created", safeDate(selectedUser.created_at)], ["Updated", safeDate(selectedUser.updated_at)]].map(([k, v]) => (
                                        <React.Fragment key={k}>
                                            <span className="text-slate-400">{k}</span>
                                            <span className="text-slate-700">{v}</span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </Section>

                            {/* Edit profile */}
                            <Section title="Edit profile" collapsible>
                                <div>
                                    <label className={labelCls}>Username</label>
                                    <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Email</label>
                                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputCls} />
                                </div>
                                <Button size="sm" disabled={saving} onClick={() => void saveProfile()}
                                    className="h-7 text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm">
                                    Save profile
                                </Button>
                            </Section>

                            {/* Profile image */}
                            <Section title="Profile image" collapsible>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                                        {selectedUser.profile_image
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            ? <img src={selectedUser.profile_image} alt="" className="w-full h-full object-cover" />
                                            : <ImagePlus className="w-4 h-4 text-slate-300" />
                                        }
                                    </div>
                                    <input type="file" accept="image/jpeg,image/png,image/jpg"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                                        className="flex-1 text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors" />
                                </div>
                                <Button size="sm" disabled={saving || !selectedFile} onClick={() => void saveProfileImage()}
                                    className="h-7 text-xs bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm">
                                    Upload image
                                </Button>
                            </Section>

                            {/* Reset password */}
                            <Section title="Reset password" collapsible>
                                <div>
                                    <label className={labelCls}>New password</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 8 characters" className={inputCls} />
                                </div>
                                <Button size="sm" disabled={saving} onClick={() => void resetPassword()}
                                    className="h-7 text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm">
                                    <KeyRound className="w-3 h-3 mr-1.5" /> Reset password
                                </Button>
                            </Section>

                            {/* Ban management */}
                            <Section title="Ban management" collapsible>
                                {selectedUser.is_banned && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 space-y-1">
                                        <p className="text-xs font-semibold text-red-600">User is currently banned</p>
                                        {selectedUser.ban_reason && <p className="text-[11px] text-red-500/80">Reason: {selectedUser.ban_reason}</p>}
                                        {selectedUser.banned_at  && <p className="text-[11px] text-red-500/60">Since: {safeDate(selectedUser.banned_at)}</p>}
                                    </div>
                                )}
                                {!selectedUser.is_banned && (
                                    <div>
                                        <label className={labelCls}>Ban reason</label>
                                        <input value={banReason} onChange={(e) => setBanReason(e.target.value)}
                                            placeholder="Optional reason…" className={inputCls} />
                                    </div>
                                )}
                                <Button size="sm" disabled={saving} onClick={() => void toggleBan()}
                                    className={["h-7 text-xs font-semibold shadow-sm",
                                        selectedUser.is_banned
                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                                            : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                    ].join(" ")}>
                                    {selectedUser.is_banned
                                        ? <><ShieldCheck className="w-3 h-3 mr-1.5" />Unban user</>
                                        : <><ShieldOff  className="w-3 h-3 mr-1.5" />Ban user</>
                                    }
                                </Button>
                            </Section>

                            {/* Activity log */}
                            <Section title="Activity log" collapsible>
                                <Button size="sm" disabled={loadingActivity} onClick={() => void loadActivity()}
                                    className="h-7 text-xs bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm">
                                    <Activity className="w-3 h-3 mr-1.5" />
                                    {loadingActivity ? "Loading…" : showActivity ? "Refresh" : "View activity"}
                                </Button>
                                {showActivity && (
                                    <div className="max-h-52 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1.5 animate-in fade-in duration-150">
                                        {activityLogs.length === 0
                                            ? <p className="text-xs text-slate-400 text-center py-4">No activity found</p>
                                            : activityLogs.map((log) => (
                                                <div key={log._id} className="rounded-md bg-white border border-slate-100 px-3 py-2 shadow-sm">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-medium text-slate-800 truncate">{log.action}</span>
                                                        <span className="text-[10px] text-slate-400 shrink-0">{safeDate(log.timestamp)}</span>
                                                    </div>
                                                    {log.details != null && (
                                                        <pre className="mt-1.5 text-[10px] text-slate-500 overflow-auto max-h-24 leading-relaxed bg-slate-50 p-1.5 rounded">
                                                            {safeJSON(log.details)}
                                                        </pre>
                                                    )}
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </Section>

                            {/* Danger zone */}
                            <Section title="Danger zone">
                                {!showDeleteConfirm ? (
                                    <Button size="sm" onClick={() => setShowDeleteConfirm(true)}
                                        className="h-7 text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold shadow-sm">
                                        <Trash2 className="w-3 h-3 mr-1.5" />Delete user
                                    </Button>
                                ) : (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-3 animate-in fade-in duration-150">
                                        <p className="text-xs text-red-600">This action is permanent and cannot be undone.</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" disabled={saving} onClick={() => void deleteUser()}
                                                className="h-7 text-xs bg-red-600 text-white hover:bg-red-700 font-semibold shadow-sm">
                                                Confirm delete
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}
                                                className="h-7 text-xs border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Section>

                            {/* spacer */}
                            <div className="h-8" />
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
}
