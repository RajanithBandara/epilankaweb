'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import axios from 'axios';
import {
    User,
    Lock,
    Camera,
    Check,
    X,
    Settings as SettingsIcon,
    Bell,
    Shield,
    HelpCircle,
    Upload,
    AlertCircle,
    ChevronRight,
    KeyRound,
    Mail,
    UserCircle2,
    CalendarDays,
} from 'lucide-react';

interface UserData {
    _id: string;
    username: string;
    email: string;
    profile_image: string | null;
    created_at: string;
    updated_at: string;
}

interface ApiError {
    response?: { data?: { detail?: string } };
    message?: string;
}

type SettingsTab = 'profile' | 'security' | 'appearance' | 'notifications' | 'help';

const tabs = [
    { id: 'profile'       as SettingsTab, label: 'Profile',       icon: User,        color: 'text-blue-600',   activeBg: 'bg-blue-50',   activeBorder: 'border-blue-200' },
    { id: 'security'      as SettingsTab, label: 'Security',      icon: Lock,        color: 'text-rose-600',   activeBg: 'bg-rose-50',   activeBorder: 'border-rose-200' },
    { id: 'appearance'    as SettingsTab, label: 'Appearance',    icon: Camera,      color: 'text-violet-600', activeBg: 'bg-violet-50', activeBorder: 'border-violet-200' },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell,        color: 'text-amber-600',  activeBg: 'bg-amber-50',  activeBorder: 'border-amber-200' },
    { id: 'help'          as SettingsTab, label: 'Help & Support', icon: HelpCircle, color: 'text-emerald-600',activeBg: 'bg-emerald-50',activeBorder: 'border-emerald-200' },
];

/* ── Small reusable field wrapper ─────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

/* ── Section card header ─────────────────────────────────────────── */
function SectionHeader({ icon, title, subtitle }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="card-panel-header -mx-5 -mt-5 mb-4 px-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb]
                flex items-center justify-center shadow-sm text-white shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function UserSettings() {
    const [userData,        setUserData]        = useState<UserData | null>(null);
    const [loading,         setLoading]         = useState(false);
    const [alert,           setAlert]           = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [activeTab,       setActiveTab]       = useState<SettingsTab>('profile');

    const [newUsername,     setNewUsername]     = useState('');
    const [newEmail,        setNewEmail]        = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword,     setNewPassword]     = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedFile,    setSelectedFile]    = useState<File | null>(null);
    const [previewUrl,      setPreviewUrl]      = useState<string | null>(null);

    const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 4200);
    };

    const getUserId = (): string | null =>
        typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;

    const loadSettings = useCallback(async () => {
        const userId = getUserId();
        if (!userId) { showAlert('User ID not found. Please login again.', 'error'); return; }
        setLoading(true);
        try {
            const response = await axios.get(`/api/settings/${userId}`);
            setUserData(response.data.user);
            setNewUsername(response.data.user.username);
            setNewEmail(response.data.user.email);
        } catch (error) {
            const e = error as ApiError;
            showAlert(e.response?.data?.detail || e.message || 'Failed to load settings', 'error');
        } finally { setLoading(false); }
    }, []);

    const updateProfile = async () => {
        const userId = getUserId();
        if (!userId) { showAlert('User ID not found', 'error'); return; }
        const body: Record<string, string> = {};
        if (newUsername.trim()) body.username = newUsername;
        if (newEmail.trim())    body.email    = newEmail;
        if (!Object.keys(body).length) { showAlert('Enter at least one field to update', 'error'); return; }
        setLoading(true);
        try {
            await axios.put(`/api/profile/${userId}`, body);
            showAlert('Profile updated successfully!');
            loadSettings();
        } catch (error) {
            const e = error as ApiError;
            showAlert(e.response?.data?.detail || e.message || 'Update failed', 'error');
        } finally { setLoading(false); }
    };

    const changePassword = async () => {
        const userId = getUserId();
        if (!userId) { showAlert('User ID not found', 'error'); return; }
        if (!currentPassword || !newPassword || !confirmPassword) { showAlert('All fields required', 'error'); return; }
        if (newPassword !== confirmPassword) { showAlert('Passwords do not match', 'error'); return; }
        if (newPassword.length < 6) { showAlert('Password must be 6+ characters', 'error'); return; }
        setLoading(true);
        try {
            await axios.post(`/api/change-password/${userId}`, {
                current_password: currentPassword,
                new_password:     newPassword,
            });
            showAlert('Password changed successfully!');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (error) {
            const e = error as ApiError;
            showAlert(e.response?.data?.detail || e.message || 'Failed to change password', 'error');
        } finally { setLoading(false); }
    };

    const uploadPicture = async () => {
        const userId = getUserId();
        if (!userId || !selectedFile) { showAlert('User ID or file not found', 'error'); return; }
        const formData = new FormData();
        formData.append('file', selectedFile);
        setLoading(true);
        try {
            await axios.post(`/api/profilepic/${userId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showAlert('Picture uploaded successfully!');
            setSelectedFile(null); setPreviewUrl(null); loadSettings();
        } catch (error) {
            const e = error as ApiError;
            showAlert(e.response?.data?.detail || e.message || 'Upload failed', 'error');
        } finally { setLoading(false); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    useEffect(() => { loadSettings(); }, [loadSettings]);

    if (!getUserId()) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="card-primary max-w-sm w-full text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb]
                        flex items-center justify-center mx-auto shadow-lg">
                        <Lock className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Authentication Required</h2>
                    <p className="text-sm text-slate-500">Please log in to access your settings.</p>
                    <button onClick={() => window.location.href = '/login'} className="btn-primary w-full">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 py-2">

            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb]
                    flex items-center justify-center shadow-md">
                    <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Settings</h1>
                    <p className="text-xs text-slate-400">Manage your account preferences</p>
                </div>
            </div>

            {/* ── Alert banner ──────────────────────────────────────────────── */}
            {alert && (
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium animate-fade-in-scale ${
                    alert.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    {alert.type === 'success'
                        ? <Check className="w-4 h-4 shrink-0" />
                        : <AlertCircle className="w-4 h-4 shrink-0" />
                    }
                    {alert.message}
                    <button onClick={() => setAlert(null)} className="ml-auto opacity-60 hover:opacity-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ── Settings body: sidebar tabs + panel ───────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-4">

                {/* ── Vertical Tab Sidebar (sm+) / Horizontal scrollbar (xs) ── */}
                <div className="sm:w-44 shrink-0">
                    {/* Mobile: horizontal scroll strip */}
                    <div className="sm:hidden flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon     = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                                        whitespace-nowrap shrink-0 transition-all duration-180 border
                                        ${isActive
                                            ? `${tab.activeBg} ${tab.color} ${tab.activeBorder} shadow-sm`
                                            : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Desktop: vertical sidebar tabs */}
                    <nav className="hidden sm:flex flex-col gap-1 p-1 rounded-2xl border border-slate-200/80
                        bg-white/90 shadow-sm">
                        {tabs.map((tab) => {
                            const Icon     = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm
                                        text-left font-medium transition-all duration-180 group
                                        ${isActive
                                            ? `${tab.activeBg} ${tab.color} shadow-sm`
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0
                                        transition-colors duration-150
                                        ${isActive
                                            ? 'bg-white/80 shadow-sm'
                                            : 'bg-slate-100 group-hover:bg-slate-200/70'
                                        }`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="flex-1 text-left">{tab.label}</span>
                                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* ── Tab content panel ─────────────────────────────────────── */}
                <div className="flex-1 min-w-0">

                    {/* ── Profile tab ─────────────────────────────────────────── */}
                    {activeTab === 'profile' && userData && (
                        <div className="space-y-4 animate-fade-in-scale">
                            {/* Profile overview card */}
                            <div className="card-panel overflow-hidden">
                                {/* Top gradient */}
                                <div className="h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl" />
                                <div className="px-5 pb-5 pt-0 -mt-6">
                                    <div className="flex items-end gap-4">
                                        {userData.profile_image ? (
                                            <Image
                                                src={userData.profile_image}
                                                alt="Profile"
                                                width={72}
                                                height={72}
                                                className="rounded-2xl object-cover ring-4 ring-white shadow-md"
                                            />
                                        ) : (
                                            <div className="w-[72px] h-[72px] rounded-2xl
                                                bg-gradient-to-br from-slate-200 to-slate-300
                                                flex items-center justify-center ring-4 ring-white shadow-md">
                                                <UserCircle2 className="w-9 h-9 text-slate-500" />
                                            </div>
                                        )}
                                        <div className="pb-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base font-bold text-slate-900 truncate">{userData.username}</h2>
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                            </div>
                                            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {userData.email}
                                            </p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                                                <CalendarDays className="w-3 h-3" />
                                                Member since {new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Edit profile form */}
                            <div className="card-primary space-y-4">
                                <SectionHeader
                                    icon={<UserCircle2 className="w-4 h-4" />}
                                    title="Edit Profile"
                                    subtitle="Update your username and email"
                                />
                                <Field label="Username">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Enter new username"
                                        className="input-primary"
                                    />
                                </Field>
                                <Field label="Email Address">
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="Enter new email"
                                        className="input-primary"
                                    />
                                </Field>
                                <button onClick={updateProfile} disabled={loading} className="btn-primary w-full">
                                    {loading ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Security tab ────────────────────────────────────────── */}
                    {activeTab === 'security' && (
                        <div className="space-y-4 animate-fade-in-scale">
                            <div className="card-primary space-y-4">
                                <SectionHeader
                                    icon={<KeyRound className="w-4 h-4" />}
                                    title="Change Password"
                                    subtitle="Choose a strong, unique password"
                                />
                                <Field label="Current Password">
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="input-primary"
                                        placeholder="••••••••"
                                    />
                                </Field>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <Field label="New Password">
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="input-primary"
                                            placeholder="••••••••"
                                        />
                                    </Field>
                                    <Field label="Confirm Password">
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="input-primary"
                                            placeholder="••••••••"
                                        />
                                    </Field>
                                </div>
                                <button onClick={changePassword} disabled={loading} className="btn-primary w-full">
                                    {loading ? 'Updating…' : 'Update Password'}
                                </button>
                            </div>

                            {/* Security tip card */}
                            <div className="card-panel overflow-hidden">
                                <div className="card-panel-header border-b border-blue-100 bg-blue-50/60">
                                    <Shield className="w-4 h-4 text-blue-700 shrink-0" />
                                    <h4 className="text-xs font-bold text-blue-800">Password Requirements</h4>
                                </div>
                                <ul className="px-5 py-4 space-y-2">
                                    {['At least 6 characters long',
                                      'Mix letters, numbers, and symbols',
                                      'Avoid reusing old passwords'].map((tip) => (
                                        <li key={tip} className="flex items-center gap-2 text-xs text-slate-600">
                                            <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* ── Appearance tab ──────────────────────────────────────── */}
                    {activeTab === 'appearance' && (
                        <div className="card-primary space-y-4 animate-fade-in-scale">
                            <SectionHeader
                                icon={<Camera className="w-4 h-4" />}
                                title="Profile Picture"
                                subtitle="Upload a JPG or PNG, max 5 MB"
                            />

                            {previewUrl && (
                                <div className="flex flex-col items-center gap-2">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        width={88}
                                        height={88}
                                        className="rounded-2xl object-cover ring-2 ring-blue-200 shadow-md"
                                    />
                                    <span className="text-xs text-slate-400">Preview</span>
                                </div>
                            )}

                            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50
                                p-6 text-center hover:border-blue-300 hover:bg-blue-50/40 transition-colors duration-200">
                                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-slate-600 mb-1">Choose a file to upload</p>
                                <p className="text-xs text-slate-400 mb-3">JPG or PNG, max 5 MB</p>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={handleFileSelect}
                                    id="profile-pic-input"
                                    className="hidden"
                                />
                                <label
                                    htmlFor="profile-pic-input"
                                    className="btn-secondary text-xs px-4 py-1.5 cursor-pointer"
                                >
                                    Browse File
                                </label>
                                {selectedFile && (
                                    <p className="text-xs text-slate-600 mt-2 font-medium truncate px-2">
                                        {selectedFile.name}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={uploadPicture}
                                disabled={loading || !selectedFile}
                                className="btn-primary w-full"
                            >
                                {loading ? 'Uploading…' : 'Upload Picture'}
                            </button>
                        </div>
                    )}

                    {/* ── Notifications tab ───────────────────────────────────── */}
                    {activeTab === 'notifications' && (
                        <div className="card-panel animate-fade-in-scale">
                            <div className="card-panel-header border-b border-amber-100 bg-amber-50/40">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shadow-sm">
                                    <Bell className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                                    <p className="text-xs text-slate-400">Alert preferences</p>
                                </div>
                            </div>
                            <div className="px-5 py-10 text-center">
                                <p className="text-sm text-slate-500">
                                    Notification settings will be available in a future update.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Help & Support tab ──────────────────────────────────── */}
                    {activeTab === 'help' && (
                        <div className="card-panel animate-fade-in-scale">
                            <div className="card-panel-header border-b border-emerald-100 bg-emerald-50/40">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm">
                                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Help &amp; Support</h3>
                                    <p className="text-xs text-slate-400">Resources &amp; documentation</p>
                                </div>
                            </div>
                            <div className="px-5 py-10 text-center">
                                <p className="text-sm text-slate-500">
                                    Support resources and documentation will be added here in a future update.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
