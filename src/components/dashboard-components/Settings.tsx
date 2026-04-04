'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import {
    AlertCircle,
    Bell,
    Camera,
    Check,
    ChevronRight,
    HelpCircle,
    KeyRound,
    Lock,
    Mail,
    Settings as SettingsIcon,
    Shield,
    Upload,
    User,
    UserCircle2,
    X,
} from 'lucide-react';
import { AppwriteException } from 'appwrite';
import { account } from '@/lib/appwrite';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
    appwrite_id: string;
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
    { id: 'profile' as SettingsTab,        label: 'Profile',         icon: User,        note: 'Identity and account details' },
    { id: 'security' as SettingsTab,       label: 'Security',        icon: Lock,        note: 'Password and access controls' },
    { id: 'appearance' as SettingsTab,     label: 'Appearance',      icon: Camera,      note: 'Profile image and presentation' },
    { id: 'notifications' as SettingsTab,  label: 'Notifications',   icon: Bell,        note: 'Alerts and updates' },
    { id: 'help' as SettingsTab,           label: 'Help & Support',  icon: HelpCircle,  note: 'Resources and troubleshooting' },
];

function Field({ labelText, children }: { labelText: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label
                className="block text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'var(--dash-text-muted)' }}
            >
                {labelText}
            </label>
            {children}
        </div>
    );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="mb-5 flex items-start gap-3 border-b pb-4" style={{ borderColor: 'var(--dash-card-border)' }}>
            <div
                className="flex h-10 w-10 items-center justify-center rounded-full border"
                style={{ background: 'var(--dash-card-header-bg)', borderColor: 'var(--dash-card-border)', color: 'var(--color-primary)' }}
            >
                {icon}
            </div>
            <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--dash-text-primary)' }}>{title}</h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--dash-text-secondary)' }}>{subtitle}</p>
            </div>
        </div>
    );
}

export default function UserSettings() {
    const { user: appwriteUser, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading]   = useState(false);
    const [alert, setAlert]       = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    // Profile tab state
    const [newUsername, setNewUsername] = useState('');
    const [newEmail,    setNewEmail]    = useState('');

    // Security tab state
    const [currentPassword,  setCurrentPassword]  = useState('');
    const [newPassword,      setNewPassword]      = useState('');
    const [confirmPassword,  setConfirmPassword]  = useState('');

    // Appearance tab state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl,   setPreviewUrl]   = useState<string | null>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [cropImageEl, setCropImageEl] = useState<HTMLImageElement | null>(null);
    const [pendingFileName, setPendingFileName] = useState<string>('profile-picture.jpg');
    const [fixedCropSize, setFixedCropSize] = useState<number>(220);

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const buildFixedCrop = (imgWidth: number, imgHeight: number, nextX?: number, nextY?: number): PixelCrop => {
        const maxSize = Math.min(imgWidth, imgHeight);
        const targetSize = Math.max(120, Math.min(maxSize, 320));
        const x = typeof nextX === 'number' ? nextX : (imgWidth - targetSize) / 2;
        const y = typeof nextY === 'number' ? nextY : (imgHeight - targetSize) / 2;

        return {
            unit: 'px',
            width: targetSize,
            height: targetSize,
            x: clamp(x, 0, imgWidth - targetSize),
            y: clamp(y, 0, imgHeight - targetSize),
        };
    };

    const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 4200);
    };

    // ── Load profile from FastAPI /users/me (JWT attached via api interceptor) ──

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/me');
            const data: UserProfile = res.data.user;
            setProfile(data);
            setNewUsername(data.username ?? '');
            setNewEmail(data.email ?? '');
        } catch (err) {
            const e = err as ApiError;
            showAlert(e.response?.data?.detail || e.message || 'Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && appwriteUser) {
            loadProfile();
        }
    }, [authLoading, appwriteUser, loadProfile]);

    // ── Update MongoDB profile fields (username / email) ──────────────────────

    const updateProfile = async () => {
        const body: Record<string, string> = {};
        if (newUsername.trim()) body.username = newUsername.trim();
        if (newEmail.trim())    body.email    = newEmail.trim();
        if (!Object.keys(body).length) return showAlert('Enter at least one field to update', 'error');

        setLoading(true);
        try {
            await api.put('/users/profile', body);
            showAlert('Profile updated successfully!');
            loadProfile();
        } catch (err) {
            const e = err as ApiError;
            showAlert(e.response?.data?.detail || e.message || 'Update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Change password via Appwrite SDK (account.updatePassword) ─────────────

    const changePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword)
            return showAlert('All fields are required', 'error');
        if (newPassword !== confirmPassword)
            return showAlert('Passwords do not match', 'error');
        if (newPassword.length < 8)
            return showAlert('Password must be at least 8 characters', 'error');

        setLoading(true);
        try {
            await account.updatePassword(newPassword, currentPassword);
            showAlert('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            if (err instanceof AppwriteException) {
                showAlert(err.message, 'error');
            } else {
                const e = err as ApiError;
                showAlert(e.message || 'Failed to change password', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Upload profile picture via FastAPI ────────────────────────────────────

    const uploadPicture = async () => {
        if (!selectedFile) return showAlert('No file selected', 'error');
        const formData = new FormData();
        formData.append('file', selectedFile);
        setLoading(true);
        try {
            await api.post('/users/profilepic', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showAlert('Profile picture updated!');
            setSelectedFile(null);
            setPreviewUrl(null);
            loadProfile();
        } catch (err) {
            const e = err as ApiError;
            showAlert(e.response?.data?.detail || e.message || 'Upload failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deletePicture = async () => {
        setLoading(true);
        try {
            await api.delete('/users/profilepic');
            showAlert('Profile picture deleted!');
            setSelectedFile(null);
            setPreviewUrl(null);
            loadProfile();
        } catch (err) {
            const e = err as ApiError;
            showAlert(e.response?.data?.detail || e.message || 'Delete failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getCroppedBlob = async (image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = Math.max(1, Math.floor(pixelCrop.width * scaleX));
        canvas.height = Math.max(1, Math.floor(pixelCrop.height * scaleY));

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
            image,
            pixelCrop.x * scaleX,
            pixelCrop.y * scaleY,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height,
        );

        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to generate cropped image'));
            }, 'image/jpeg', 0.92);
        });
    };

    const applyCrop = async () => {
        if (!cropImageEl || !completedCrop?.width || !completedCrop?.height) {
            showAlert('Please choose a crop area', 'error');
            return;
        }

        try {
            const croppedBlob = await getCroppedBlob(cropImageEl, completedCrop);
            const croppedFile = new File([croppedBlob], pendingFileName.replace(/\.[^.]+$/, '') + '.jpg', {
                type: 'image/jpeg',
            });

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(croppedBlob);

            setSelectedFile(croppedFile);
            setCropSrc(null);
            setCrop(undefined);
            setCompletedCrop(undefined);
            setCropImageEl(null);
        } catch (err) {
            const e = err as Error;
            showAlert(e.message || 'Failed to crop image', 'error');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showAlert('Please select an image file', 'error');
            return;
        }

        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            showAlert('Image size must be 5 MB or less', 'error');
            return;
        }

        setPendingFileName(file.name || 'profile-picture.jpg');
        const reader = new FileReader();
        reader.onloadend = () => {
            setCropSrc(reader.result as string);
            setSelectedFile(null);
            setCrop(undefined);
            setCompletedCrop(undefined);
            setCropImageEl(null);
        };
        reader.readAsDataURL(file);

        e.target.value = '';
    };

    // ── Auth guard ────────────────────────────────────────────────────────────

    if (authLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>Loading…</div>
            </div>
        );
    }

    if (!appwriteUser) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div
                    className="w-full max-w-md rounded-2xl border p-8 text-center"
                    style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)', boxShadow: 'var(--shadow-lg)' }}
                >
                    <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border"
                        style={{ background: 'var(--dash-card-header-bg)', borderColor: 'var(--dash-card-border)', color: 'var(--color-primary)' }}
                    >
                        <Lock className="h-7 w-7" />
                    </div>
                    <h1 className="mt-5 text-2xl font-semibold" style={{ color: 'var(--dash-text-primary)' }}>
                        Authentication Required
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
                        Please log in to access your settings.
                    </p>
                    <button
                        onClick={() => { window.location.href = '/login'; }}
                        className="mt-6 w-full inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    const inputClass  = 'h-11 w-full rounded-xl border px-4 text-sm outline-none transition placeholder:opacity-50';
    const inputStyle  = { background: 'var(--dash-input-bg)', borderColor: 'var(--dash-input-border)', color: 'var(--dash-input-text)' };
    const shellStyle  = { background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)', boxShadow: 'var(--shadow-sm)' };
    const mutedShell  = { background: 'var(--dash-card-header-bg)', borderColor: 'var(--dash-card-border)' };

    // Display name: prefer MongoDB profile, fall back to Appwrite user
    const displayName    = profile?.username  ?? appwriteUser.name  ?? appwriteUser.email?.split('@')[0] ?? 'User';
    const displayEmail   = profile?.email     ?? appwriteUser.email ?? '';
    const profileImage   = profile?.profile_image ?? null;
    const memberSince    = profile?.created_at ?? appwriteUser.$createdAt;

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div className="rounded-2xl border p-5" style={shellStyle}>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                        <SettingsIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--dash-text-muted)' }}>Settings</p>
                        <h1 className="text-xl font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Account Control</h1>
                    </div>
                </div>
                <p className="mt-3 text-sm leading-6" style={{ color: 'var(--dash-text-secondary)' }}>
                    Manage your identity, security settings, and profile information.
                </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                {/* Sidebar */}
                <aside className="space-y-4">
                    {/* User card */}
                    <div
                        className="rounded-2xl border p-5"
                        style={{ background: 'var(--color-primary)', borderColor: 'transparent', boxShadow: 'var(--shadow-md)' }}
                    >
                        <div className="flex items-center gap-4">
                            {profileImage ? (
                                <Image src={profileImage} alt="Profile" width={56} height={56}
                                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white/30" />
                            ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/20 text-xl font-bold text-white">
                                    {displayName[0]?.toUpperCase() ?? <UserCircle2 className="h-8 w-8" />}
                                </div>
                            )}
                            <div className="min-w-0">
                                <h2 className="truncate text-base font-semibold text-white">{displayName}</h2>
                                <p className="mt-0.5 truncate text-sm text-blue-200">{displayEmail}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-sm">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.18em] text-blue-200">Member Since</p>
                                <p className="mt-1 font-medium text-white">
                                    {memberSince
                                        ? new Date(memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                        : '–'}
                                </p>
                            </div>
                            {profile?.updated_at && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-blue-200">Updated</p>
                                    <p className="mt-1 font-medium text-white">
                                        {new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab navigation */}
                    <nav className="rounded-2xl border p-1.5" style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)' }}>
                        {tabs.map((tab) => {
                            const Icon   = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                                    style={active ? { background: 'var(--color-primary)', color: '#fff' } : { color: 'var(--dash-text-secondary)' }}
                                    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--dash-nav-hover-bg)'; }}
                                    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <span
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border"
                                        style={active
                                            ? { background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }
                                            : { background: 'var(--dash-card-header-bg)', borderColor: 'var(--dash-card-border)' }}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold">{tab.label}</span>
                                        <span className="mt-0.5 block text-xs" style={{ opacity: active ? 0.75 : 1, color: active ? 'inherit' : 'var(--dash-text-muted)' }}>
                                            {tab.note}
                                        </span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0" style={{ opacity: active ? 1 : 0.3 }} />
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main content */}
                <div className="space-y-4 min-w-0">
                    {/* Alert banner */}
                    {alert && (
                        <div
                            className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium"
                            style={alert.type === 'success'
                                ? { background: 'rgba(22,163,74,0.1)', borderColor: 'var(--color-success)', color: 'var(--color-success)' }
                                : { background: 'rgba(220,38,38,0.1)', borderColor: 'var(--color-danger)',  color: 'var(--color-danger)' }}
                        >
                            {alert.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                            <span className="flex-1">{alert.message}</span>
                            <button onClick={() => setAlert(null)} className="cursor-pointer opacity-60 transition hover:opacity-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* ── Profile Tab ──────────────────────────────────────── */}
                    {activeTab === 'profile' && (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_300px]">
                            <section className="rounded-2xl border p-5" style={shellStyle}>
                                <SectionHeader icon={<UserCircle2 className="h-4 w-4" />} title="Edit Profile" subtitle="Update your display name and email address" />
                                <div className="space-y-4">
                                    <Field labelText="Username">
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            placeholder="Enter new username"
                                            className={inputClass} style={inputStyle}
                                        />
                                    </Field>
                                    <Field labelText="Email Address">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            readOnly={true}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="Enter new email"
                                            className={inputClass} style={inputStyle}
                                        />
                                    </Field>
                                    <button
                                        onClick={updateProfile}
                                        disabled={loading}
                                        className=" cursor-pointer inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{ background: 'var(--color-primary)' }}
                                    >
                                        {loading ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border p-5" style={mutedShell}>
                                <SectionHeader icon={<Mail className="h-4 w-4" />} title="Current Details" subtitle="Reference info from your account" />
                                <div className="space-y-3">
                                    {[
                                        { label: 'Username', value: displayName },
                                        { label: 'Email',    value: displayEmail },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="rounded-xl border p-4" style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)' }}>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--dash-text-muted)' }}>{label}</p>
                                            <p className="mt-2 break-all text-sm font-medium" style={{ color: 'var(--dash-text-primary)' }}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ── Security Tab (Appwrite password change) ──────────── */}
                    {activeTab === 'security' && (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_300px]">
                            <section className="rounded-2xl border p-5" style={shellStyle}>
                                <SectionHeader icon={<KeyRound className="h-4 w-4" />} title="Change Password" subtitle="Use a strong password you do not reuse elsewhere" />
                                <div className="space-y-4">
                                    <Field labelText="Current Password">
                                        <input
                                            type="password" value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••" className={inputClass} style={inputStyle}
                                        />
                                    </Field>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field labelText="New Password">
                                            <input
                                                type="password" value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••" className={inputClass} style={inputStyle}
                                            />
                                        </Field>
                                        <Field labelText="Confirm Password">
                                            <input
                                                type="password" value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••" className={inputClass} style={inputStyle}
                                            />
                                        </Field>
                                    </div>
                                    <button
                                        onClick={changePassword}
                                        disabled={loading}
                                        className=" cursor-pointer inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{ background: 'var(--color-primary)' }}
                                    >
                                        {loading ? 'Updating…' : 'Update Password'}
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border p-5" style={mutedShell}>
                                <SectionHeader icon={<Shield className="h-4 w-4" />} title="Password Rules" subtitle="Minimum requirements for secure access" />
                                <ul className="space-y-3">
                                    {['At least 8 characters long', 'Mix letters, numbers, and symbols', 'Avoid reusing old passwords'].map((tip) => (
                                        <li
                                            key={tip}
                                            className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
                                            style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)', color: 'var(--dash-text-secondary)' }}
                                        >
                                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>
                    )}

                    {/* ── Appearance Tab ────────────────────────────────────── */}
                    {activeTab === 'appearance' && (
                        <section className="rounded-2xl border p-5" style={shellStyle}>
                            <SectionHeader icon={<Camera className="h-4 w-4" />} title="Profile Picture" subtitle="Upload a JPG or PNG, maximum 5 MB" />
                            <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
                                {/* Preview box */}
                                <div className="rounded-xl border p-4" style={mutedShell}>
                                    <div
                                        className="flex min-h-40 items-center justify-center rounded-xl border border-dashed"
                                        style={{ borderColor: 'var(--dash-card-border)', background: 'var(--dash-card-bg)' }}
                                    >
                                        {previewUrl ? (
                                            <Image src={previewUrl} alt="Preview" width={112} height={112} className="h-28 w-28 rounded-full object-cover" />
                                        ) : profileImage ? (
                                            <Image src={profileImage} alt="Profile" width={112} height={112} className="h-28 w-28 rounded-full object-cover" />
                                        ) : (
                                            <UserCircle2 className="h-16 w-16" style={{ color: 'var(--dash-text-muted)' }} />
                                        )}
                                    </div>
                                    <p className="mt-3 text-center text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--dash-text-muted)' }}>
                                        {previewUrl ? 'Preview' : 'Current Image'}
                                    </p>
                                </div>

                                {/* Upload area */}
                                <div
                                    className="flex flex-col items-center justify-center rounded-xl border border-dashed p-6 transition"
                                    style={{ borderColor: 'var(--dash-card-border)', background: 'var(--dash-card-header-bg)' }}
                                >
                                    <Upload className="mx-auto h-8 w-8" style={{ color: 'var(--color-primary)' }} />
                                    <p className="mt-3 text-center text-sm font-medium" style={{ color: 'var(--dash-text-primary)' }}>Choose a file to upload</p>
                                    <p className="mt-1 text-center text-sm" style={{ color: 'var(--dash-text-muted)' }}>JPG or PNG, max 5 MB</p>
                                    <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFileSelect} id="profile-pic-input" className="hidden" />
                                    <div className="mt-5 flex w-full flex-col gap-3 sm:flex-row">
                                        <label htmlFor="profile-pic-input" className="flex-1">
                                            <span
                                                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border px-4 text-sm font-semibold transition"
                                                style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)', color: 'var(--dash-text-primary)' }}
                                            >
                                                Browse File
                                            </span>
                                        </label>
                                        <button
                                            onClick={uploadPicture}
                                            disabled={loading || !selectedFile}
                                            className=" cursor-pointer inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{ background: 'var(--color-primary)' }}
                                        >
                                            {loading ? 'Uploading…' : 'Upload Picture'}
                                        </button>
                                    </div>
                                    <div className="mt-3 w-full">
                                        <button
                                            onClick={deletePicture}
                                            disabled={loading || (!profileImage && !previewUrl)}
                                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{
                                                background: 'rgba(220,38,38,0.08)',
                                                borderColor: 'rgba(220,38,38,0.35)',
                                                color: 'var(--color-danger)',
                                            }}
                                        >
                                            {loading ? 'Deleting…' : 'Delete Current Picture'}
                                        </button>
                                    </div>
                                    {selectedFile && (
                                        <p className="mt-3 truncate text-center text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
                                            {selectedFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {cropSrc && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                            <div className="w-full max-w-2xl rounded-2xl border p-5" style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)' }}>
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Crop Profile Image</h3>
                                        <p className="text-sm" style={{ color: 'var(--dash-text-secondary)' }}>Drag to adjust your profile picture crop.</p>
                                    </div>
                                    <button
                                        className="rounded-lg p-2"
                                        style={{ background: 'var(--dash-card-header-bg)', color: 'var(--dash-text-secondary)' }}
                                        onClick={() => {
                                            setCropSrc(null);
                                            setCrop(undefined);
                                            setCompletedCrop(undefined);
                                            setCropImageEl(null);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="max-h-[60vh] overflow-auto rounded-xl border p-3" style={{ borderColor: 'var(--dash-card-border)', background: 'var(--dash-card-header-bg)' }}>
                                    <ReactCrop
                                        crop={crop}
                                        onChange={(nextCrop) => {
                                            if (!cropImageEl) {
                                                setCrop(nextCrop);
                                                return;
                                            }

                                            const constrained = buildFixedCrop(
                                                cropImageEl.width,
                                                cropImageEl.height,
                                                nextCrop.x,
                                                nextCrop.y,
                                            );
                                            constrained.width = fixedCropSize;
                                            constrained.height = fixedCropSize;
                                            constrained.x = clamp(constrained.x, 0, cropImageEl.width - fixedCropSize);
                                            constrained.y = clamp(constrained.y, 0, cropImageEl.height - fixedCropSize);
                                            setCrop(constrained);
                                        }}
                                        onComplete={(c) => {
                                            if (!cropImageEl) return;
                                            const constrained = buildFixedCrop(
                                                cropImageEl.width,
                                                cropImageEl.height,
                                                c.x,
                                                c.y,
                                            );
                                            constrained.width = fixedCropSize;
                                            constrained.height = fixedCropSize;
                                            constrained.x = clamp(constrained.x, 0, cropImageEl.width - fixedCropSize);
                                            constrained.y = clamp(constrained.y, 0, cropImageEl.height - fixedCropSize);
                                            setCompletedCrop(constrained);
                                        }}
                                        aspect={1}
                                        keepSelection
                                        ruleOfThirds
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={cropSrc}
                                            alt="Crop source"
                                            className="max-h-[52vh] w-auto max-w-full object-contain"
                                            onLoad={(e) => {
                                                const image = e.currentTarget;
                                                setCropImageEl(image);
                                                const initial = buildFixedCrop(image.width, image.height);
                                                setFixedCropSize(initial.width);
                                                setCrop(initial);
                                                setCompletedCrop(initial);
                                            }}
                                        />
                                    </ReactCrop>
                                </div>

                                <p className="mt-3 text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                                    Drag to reposition the image area you want.
                                </p>

                                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border px-4 text-sm font-semibold"
                                        style={{ background: 'var(--dash-card-header-bg)', borderColor: 'var(--dash-card-border)', color: 'var(--dash-text-secondary)' }}
                                        onClick={() => {
                                            setCropSrc(null);
                                            setCrop(undefined);
                                            setCompletedCrop(undefined);
                                            setCropImageEl(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
                                        style={{ background: 'var(--color-primary)' }}
                                        onClick={applyCrop}
                                    >
                                        Save Image
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Notifications Tab ─────────────────────────────────── */}
                    {activeTab === 'notifications' && (
                        <section className="rounded-2xl border p-5" style={shellStyle}>
                            <SectionHeader icon={<Bell className="h-4 w-4" />} title="Notifications" subtitle="Alert preferences and delivery controls" />
                            <div
                                className="rounded-xl border p-6 text-center text-sm"
                                style={{ background: 'var(--dash-card-header-bg)', borderColor: 'var(--dash-card-border)', color: 'var(--dash-text-secondary)' }}
                            >
                                Notification settings will be available in a future update.
                            </div>
                        </section>
                    )}

                    {/* ── Help Tab ──────────────────────────────────────────── */}
                    {activeTab === 'help' && (
                        <section className="rounded-2xl border p-5" style={shellStyle}>
                            <SectionHeader icon={<HelpCircle className="h-4 w-4" />} title="Help & Support" subtitle="Resources, guides, and troubleshooting" />
                            <div
                                className="rounded-xl border p-6 text-center text-sm"
                                style={{ background: 'var(--dash-card-header-bg)', borderColor: 'var(--dash-card-border)', color: 'var(--dash-text-secondary)' }}
                            >
                                Support resources and documentation will be added here in a future update.
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
