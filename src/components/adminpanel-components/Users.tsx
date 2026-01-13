"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";

type User = {
    _id: string;
    username?: string;
    email?: string;
    profile_image?: string | null;
    created_at?: string;
    updated_at?: string;
    is_banned?: boolean;
    ban_reason?: string;
    banned_at?: string;
};

// ✅ Better than `unknown` for UI rendering
type JsonValue =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JsonValue }
    | JsonValue[];

type ActivityLog = {
    _id: string;
    user_id: string;
    action: string;
    timestamp: string;
    details?: JsonValue; // ✅ no more unknown
};

type ApiError = { msg?: string; detail?: string };

// Axios instance pointing to Next.js admin API routes
const api = axios.create({
    baseURL: "/api",
});

function getErrorMessage(err: unknown) {
    const ax = err as AxiosError<ApiError>;
    return (
        ax?.response?.data?.msg ||
        ax?.response?.data?.detail ||
        ax?.message ||
        "Request failed"
    );
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ✅ Prevent crashes if details has circular JSON
function safeStringify(value: unknown) {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

// ✅ timestamp safe rendering
function safeDate(ts?: string) {
    if (!ts) return "—";
    try {
        const d = new Date(ts);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toLocaleString();
    } catch {
        return "—";
    }
}

export default function AdminUsersPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const selectedUser = useMemo(
        () => users.find((u) => u._id === selectedId) || null,
        [users, selectedId]
    );

    const [editUsername, setEditUsername] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);

    // Ban & Delete states
    const [banReason, setBanReason] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(false);

    // Filter states
    const [showBannedOnly, setShowBannedOnly] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let result = users;

        if (q) {
            result = result.filter((u) => {
                const a = (u.username || "").toLowerCase();
                const b = (u.email || "").toLowerCase();
                const c = (u._id || "").toLowerCase();
                return a.includes(q) || b.includes(q) || c.includes(q);
            });
        }

        if (showBannedOnly) {
            result = result.filter((u) => u.is_banned === true);
        }

        return result;
    }, [users, query, showBannedOnly]);

    async function loadUsers() {
        setLoading(true);
        setError("");
        try {
            const res = await api.get<{ users: User[] }>("/admin/users/getall", {
                headers: { "Cache-Control": "no-store" },
            });
            const data = res.data.users;
            setUsers(data);
            if (data.length && !selectedId) setSelectedId(data[0]._id);
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }

    async function loadActivity() {
        if (!selectedUser) return;
        setLoadingActivity(true);
        setError("");
        try {
            const res = await api.get<ActivityLog[]>(
                `/admin/users/${selectedUser._id}/activity`
            );
            setActivityLogs(res.data);
            setShowActivityLog(true);
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        } finally {
            setLoadingActivity(false);
        }
    }

    async function toggleBan() {
        if (!selectedUser) return;

        const newBanStatus = !selectedUser.is_banned;
        setSaving(true);
        setError("");

        try {
            await api.put(`/admin/users/${selectedUser._id}/ban`, {
                is_banned: newBanStatus,
                reason: newBanStatus ? banReason.trim() || "No reason provided" : null,
            });
            setBanReason("");
            await loadUsers();
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        } finally {
            setSaving(false);
        }
    }

    async function deleteUser() {
        if (!selectedUser) return;

        setSaving(true);
        setError("");

        try {
            await api.delete(`/admin/users/${selectedUser._id}/delete`);
            setShowDeleteConfirm(false);
            setSelectedId(null);
            await loadUsers();
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        void loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedUser) return;
        setEditUsername(selectedUser.username || "");
        setEditEmail(selectedUser.email || "");
        setSelectedFile(null);
        setNewPassword("");
        setBanReason(selectedUser.ban_reason || "");
        setShowDeleteConfirm(false);
        setShowActivityLog(false);
    }, [selectedUser]);

    async function saveProfile() {
        if (!selectedUser) return;

        const payload: Partial<User> = {};
        const u = editUsername.trim();
        const e = editEmail.trim();

        if (u) payload.username = u;
        if (e) {
            if (!isValidEmail(e)) {
                setError("Invalid email");
                return;
            }
            payload.email = e;
        }

        if (!payload.username && !payload.email) {
            setError("No valid fields provided");
            return;
        }

        setSaving(true);
        setError("");
        try {
            await api.patch<{ msg: string }>(`/admin/users/${selectedUser._id}`, payload);
            await loadUsers();
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        } finally {
            setSaving(false);
        }
    }

    async function saveProfileImage() {
        if (!selectedUser) return;

        if (!selectedFile) {
            setError("Please select a file");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            await api.post(`/admin/users/${selectedUser._id}/profile-image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setSelectedFile(null);
            await loadUsers();
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        } finally {
            setSaving(false);
        }
    }

    async function resetPassword() {
        if (!selectedUser) return;

        const pw = newPassword.trim();
        if (pw.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setSaving(true);
        setError("");
        try {
            await api.post<{ msg: string }>(
                `/admin/users/${selectedUser._id}/reset-password`,
                { new_password: pw }
            );
            setNewPassword("");
        } catch (e: unknown) {
            setError(getErrorMessage(e));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0B0B10] px-4 py-6 flex justify-center">
            <div className="w-full max-w-6xl grid gap-6 md:grid-cols-[340px,1fr]">
                {/* Left column: users list */}
                <section className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-sm font-semibold text-white/90">Users</h2>
                        <button
                            type="button"
                            onClick={() => setShowBannedOnly(!showBannedOnly)}
                            className={`ml-2 text-xs px-3 py-1 rounded-full transition-colors ${
                                showBannedOnly
                                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                    : "bg-white/10 text-white/80 hover:bg-white/20"
                            }`}
                        >
                            {showBannedOnly ? "🚫 Banned Only" : "All Users"}
                        </button>
                        <button
                            type="button"
                            onClick={() => void loadUsers()}
                            disabled={loading}
                            className="ml-auto text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-60"
                        >
                            {loading ? "Refreshing…" : "Refresh"}
                        </button>
                    </div>

                    <div className="mb-3">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by username, email, or id"
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent"
                        />
                    </div>

                    <div className="max-h-[520px] overflow-auto space-y-2 pr-1">
                        {loading ? (
                            <div className="text-sm text-white/70 py-2">Loading…</div>
                        ) : filtered.length === 0 ? (
                            <div className="text-sm text-white/60 py-2">No users found</div>
                        ) : (
                            <ul className="space-y-1">
                                {filtered.map((u) => {
                                    const active = u._id === selectedId;
                                    return (
                                        <li key={u._id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedId(u._id)}
                                                className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors duration-200 ${
                                                    active
                                                        ? "border-[#800020]/70 bg-[#800020]/15 text-white"
                                                        : "border-transparent bg-white/0 hover:bg-white/5 text-white/80"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="font-semibold truncate">
                                                        {u.username || "(no username)"}
                                                    </div>
                                                    {u.is_banned && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 flex-shrink-0">
                              BANNED
                            </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-white/50 truncate">
                                                    {u.email || "(no email)"}
                                                </div>
                                                <div className="text-[11px] text-white/40 mt-1 truncate font-mono">
                                                    {u._id}
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </section>

                {/* Right column: user details */}
                <section className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-sm font-semibold text-white/90">User details</h2>
                        {saving && <span className="text-xs text-white/60">Saving…</span>}
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 text-xs text-red-100 px-3 py-2">
                            {error}
                        </div>
                    )}

                    {!selectedUser ? (
                        <div className="text-sm text-white/60">Select a user to view details</div>
                    ) : (
                        <div className="space-y-5">
                            {/* Meta */}
                            <div className="grid grid-cols-[120px,1fr] gap-3 text-sm">
                                <div className="text-white/50">ID</div>
                                <div className="font-mono text-xs text-white/90 break-all">
                                    {selectedUser._id}
                                </div>

                                <div className="text-white/50">Created</div>
                                <div className="text-white/80">{selectedUser.created_at || "—"}</div>

                                <div className="text-white/50">Updated</div>
                                <div className="text-white/80">{selectedUser.updated_at || "—"}</div>
                            </div>

                            <hr className="border-white/10" />

                            {/* Edit profile */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                                    Edit profile
                                </h3>
                                <label className="space-y-1 text-xs text-white/70">
                                    <span>Username</span>
                                    <input
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent"
                                    />
                                </label>
                                <label className="space-y-1 text-xs text-white/70">
                                    <span>Email</span>
                                    <input
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent"
                                    />
                                </label>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => void saveProfile()}
                                        disabled={saving}
                                        className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-[#800020] hover:bg-[#a0002b] text-white disabled:opacity-60"
                                    >
                                        Save profile
                                    </button>
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            {/* Profile image */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                                    Profile image
                                </h3>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="w-14 h-14 rounded-full border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center text-xs text-white/40">
                                        {selectedUser.profile_image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={selectedUser.profile_image}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>None</span>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2 text-xs text-white/70 w-full">
                                        <label className="space-y-1 block">
                                            <span>Upload Image File</span>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/jpg"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-white/10 file:text-white hover:file:bg-white/20"
                                            />
                                        </label>
                                        {selectedFile && (
                                            <p className="text-[11px] text-white/60">
                                                Selected: {selectedFile.name}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => void saveProfileImage()}
                                            disabled={saving || !selectedFile}
                                            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white disabled:opacity-60"
                                        >
                                            Update image
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            {/* Reset password */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                                    Reset password
                                </h3>
                                <label className="space-y-1 text-xs text-white/70">
                                    <span>New password</span>
                                    <input
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        type="password"
                                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent"
                                    />
                                </label>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => void resetPassword()}
                                        disabled={saving}
                                        className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-white text-[#800020] hover:bg-gray-100 disabled:opacity-60"
                                    >
                                        Reset password
                                    </button>
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            {/* Ban/Unban Section */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                                    Ban Management
                                </h3>

                                {selectedUser.is_banned && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                        <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-red-300">
                        🚫 User is Banned
                      </span>
                                        </div>
                                        {selectedUser.ban_reason && (
                                            <p className="text-xs text-red-200/80 mb-1">
                                                <strong>Reason:</strong> {selectedUser.ban_reason}
                                            </p>
                                        )}
                                        {selectedUser.banned_at && (
                                            <p className="text-xs text-red-200/60">
                                                <strong>Banned at:</strong> {selectedUser.banned_at}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {!selectedUser.is_banned && (
                                    <label className="space-y-1 text-xs text-white/70">
                                        <span>Ban Reason</span>
                                        <input
                                            value={banReason}
                                            onChange={(e) => setBanReason(e.target.value)}
                                            placeholder="Enter reason for ban..."
                                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent"
                                        />
                                    </label>
                                )}

                                <button
                                    type="button"
                                    onClick={() => void toggleBan()}
                                    disabled={saving}
                                    className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold ${
                                        selectedUser.is_banned
                                            ? "bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30"
                                            : "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                                    } disabled:opacity-60`}
                                >
                                    {selectedUser.is_banned ? "✓ Unban User" : "🚫 Ban User"}
                                </button>
                            </div>

                            <hr className="border-white/10" />

                            {/* Activity Log */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                                        Activity Log
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => void loadActivity()}
                                        disabled={loadingActivity}
                                        className="text-xs px-3 py-1 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-60"
                                    >
                                        {loadingActivity
                                            ? "Loading..."
                                            : showActivityLog
                                                ? "Refresh"
                                                : "View Activity"}
                                    </button>
                                </div>

                                {showActivityLog && (
                                    <div className="max-h-64 overflow-auto space-y-2 p-3 rounded-lg bg-black/40 border border-white/10">
                                        {activityLogs.length === 0 ? (
                                            <p className="text-xs text-white/50">No activity found</p>
                                        ) : (
                                            activityLogs.map((log) => (
                                                <div
                                                    key={log._id}
                                                    className="p-2 rounded bg-white/5 border border-white/5"
                                                >
                                                    <div className="flex items-center justify-between mb-1 gap-3">
                            <span className="text-xs font-semibold text-white/90 truncate">
                              {log.action}
                            </span>
                                                        <span className="text-[10px] text-white/50 shrink-0">
                              {safeDate(log.timestamp)}
                            </span>
                                                    </div>

                                                    {/* ✅ FIXED: no more `unknown` in JSX condition */}
                                                    {log.details != null && (
                                                        <pre className="mt-2 max-h-36 overflow-auto rounded bg-white/5 p-2 text-[10px] leading-relaxed text-white/60">
                              {safeStringify(log.details)}
                            </pre>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <hr className="border-white/10" />

                            {/* Delete User */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                                    Danger Zone
                                </h3>

                                {!showDeleteConfirm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-red-600/20 text-red-300 border border-red-600/40 hover:bg-red-600/30"
                                    >
                                        🗑️ Delete User
                                    </button>
                                ) : (
                                    <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/30 space-y-3">
                                        <p className="text-xs text-red-200">
                                            ⚠️ Are you sure you want to permanently delete this user? This
                                            action cannot be undone.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void deleteUser()}
                                                disabled={saving}
                                                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                            >
                                                Yes, Delete Permanently
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                disabled={saving}
                                                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
