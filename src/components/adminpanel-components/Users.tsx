'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';

type User = {
    _id: string;
    username?: string;
    email?: string;
    profile_image?: string | null;
    created_at?: string;
    updated_at?: string;
};

type ApiError = { msg?: string; detail?: string };

// Axios instance pointing to Next.js admin API routes
const api = axios.create({
    baseURL: "/api",
});
api.get("/admin/users/getall");


function getErrorMessage(err: unknown) {
    const ax = err as AxiosError<ApiError>;
    return (
        ax?.response?.data?.msg ||
        ax?.response?.data?.detail ||
        ax?.message ||
        'Request failed'
    );
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AdminUsersPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const selectedUser = useMemo(
        () => users.find((u) => u._id === selectedId) || null,
        [users, selectedId]
    );

    const [editUsername, setEditUsername] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => {
            const a = (u.username || '').toLowerCase();
            const b = (u.email || '').toLowerCase();
            const c = (u._id || '').toLowerCase();
            return a.includes(q) || b.includes(q) || c.includes(q);
        });
    }, [users, query]);

    async function loadUsers() {
        setLoading(true);
        setError('');
        try {
            const res = await api.get<{ users: User[] }>('/admin/users/getall', {
                headers: {
                    'Cache-Control': 'no-store',
                },
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

    useEffect(() => {
        void loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedUser) return;
        setEditUsername(selectedUser.username || '');
        setEditEmail(selectedUser.email || '');
        setSelectedFile(null);
        setNewPassword('');
    }, [selectedUser]);

    async function saveProfile() {
        if (!selectedUser) return;

        const payload: Partial<User> = {};
        const u = editUsername.trim();
        const e = editEmail.trim();

        if (u) payload.username = u;
        if (e) {
            if (!isValidEmail(e)) {
                setError('Invalid email');
                return;
            }
            payload.email = e;
        }

        if (!payload.username && !payload.email) {
            setError('No valid fields provided');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await api.patch<{ msg: string }>(
                `/admin/users/${selectedUser._id}`,
                payload,
            );
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
            setError('Please select a file');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            await api.post(
                `/admin/users/${selectedUser._id}/profile-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
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
            setError('Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await api.post<{ msg: string }>(
                `/admin/users/${selectedUser._id}/reset-password`,
                { new_password: pw }
            );
            setNewPassword('');
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
                            onClick={() => void loadUsers()}
                            disabled={loading}
                            className="ml-auto text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-60"
                        >
                            {loading ? 'Refreshing…' : 'Refresh'}
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
                                                        ? 'border-[#800020]/70 bg-[#800020]/15 text-white'
                                                        : 'border-transparent bg-white/0 hover:bg-white/5 text-white/80'
                                                }`}
                                            >
                                                <div className="font-semibold truncate">
                                                    {u.username || '(no username)'}
                                                </div>
                                                <div className="text-xs text-white/50 truncate">
                                                    {u.email || '(no email)'}
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
                        {saving && (
                            <span className="text-xs text-white/60">Saving…</span>
                        )}
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
                                <div className="text-white/80">
                                    {selectedUser.created_at || '—'}
                                </div>

                                <div className="text-white/50">Updated</div>
                                <div className="text-white/80">
                                    {selectedUser.updated_at || '—'}
                                </div>
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
                                    <p className="text-[11px] text-white/50">
                                        Note: these actions use admin-only API routes secured by x-api-key.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
