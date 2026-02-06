'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { User, Lock, Camera, Check, X, Settings as SettingsIcon, Bell, Shield, HelpCircle } from 'lucide-react';

interface UserData {
    _id: string;
    username: string;
    email: string;
    profile_image: string | null;
    created_at: string;
    updated_at: string;
}

interface ApiError {
    response?: {
        data?: {
            detail?: string;
        };
    };
    message?: string;
}

type SettingsTab = 'profile' | 'security' | 'appearance' | 'notifications' | 'help';

export default function UserSettings() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    // Form states
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const tabs = [
        { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
        { id: 'security' as SettingsTab, label: 'Security', icon: Lock },
        { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Camera },
        { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
        { id: 'help' as SettingsTab, label: 'Help & Support', icon: HelpCircle },
    ];

    const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 4000);
    };


    const getUserId = (): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('user_id');
        }
        return null;
    };

    const loadSettings = useCallback(async () => {
        const userId = getUserId();

        if (!userId) {
            showAlert('User ID not found. Please login again.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`/api/settings/${userId}`);

            setUserData(response.data.user);
            setNewUsername(response.data.user.username);
            setNewEmail(response.data.user.email);
        } catch (error) {
            const apiError = error as ApiError;
            const errorMsg = apiError.response?.data?.detail || apiError.message || 'Failed to load settings';
            showAlert(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateProfile = async () => {
        const userId = getUserId();

        if (!userId) {
            showAlert('User ID not found', 'error');
            return;
        }

        const body: Record<string, string> = {};
        if (newUsername.trim()) body.username = newUsername;
        if (newEmail.trim()) body.email = newEmail;

        if (Object.keys(body).length === 0) {
            showAlert('Enter at least one field to update', 'error');
            return;
        }

        setLoading(true);
        try {
            await axios.put(`/api/profile/${userId}`, body);
            showAlert('Profile updated successfully!');
            loadSettings();
        } catch (error) {
            const apiError = error as ApiError;
            const errorMsg = apiError.response?.data?.detail || apiError.message || 'Update failed';
            showAlert(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async () => {
        const userId = getUserId();

        if (!userId) {
            showAlert('User ID not found', 'error');
            return;
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('All fields required', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('Password must be 6+ characters', 'error');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`/api/change-password/${userId}`, {
                current_password: currentPassword,
                new_password: newPassword,
            });

            showAlert('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            const apiError = error as ApiError;
            const errorMsg = apiError.response?.data?.detail || apiError.message || 'Failed to change password';
            showAlert(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const uploadPicture = async () => {
        const userId = getUserId();

        if (!userId || !selectedFile) {
            showAlert('User ID or file not found', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        setLoading(true);
        try {
            await axios.post(`/api/profilepic/${userId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showAlert('Picture uploaded successfully!');
            setSelectedFile(null);
            setPreviewUrl(null);
            loadSettings();
        } catch (error) {
            const apiError = error as ApiError;
            const errorMsg = apiError.response?.data?.detail || apiError.message || 'Upload failed';
            showAlert(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    if (!getUserId()) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
                <div className="bg-white border-2 border-gray-200 rounded-xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
                    <p className="text-gray-600 mb-6">Please log in to access your settings.</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="w-full bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-0 h-auto flex items-start justify-center py-6 sm:py-8 md:py-10 px-4 sm:px-6 bg-transparent">
            <div className="w-full max-w-3xl space-y-6 pb-4">
                {/* Page Header */}
                <div className="text-center space-y-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#1E3A8A] text-white mb-1">
                        <SettingsIcon className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A8A]">Settings</h1>
                    <p className="text-xs sm:text-sm text-gray-600">Manage your account preferences</p>
                </div>

                {/* Alert */}
                {alert && (
                    <div
                        className={`rounded-lg p-3 border-l-4 flex items-center gap-3 text-xs sm:text-sm ${{
                            success: 'bg-green-50 border-green-500 text-green-800',
                            error: 'bg-red-50 border-red-500 text-red-800',
                        }[alert.type]}`}
                    >
                        {alert.type === 'success' ? (
                            <Check className="w-4 h-4 flex-shrink-0" />
                        ) : (
                            <X className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="font-medium">{alert.message}</span>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                                        isActive
                                            ? 'bg-[#1E3A8A] text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && userData && (
                        <div className="space-y-4">
                            {/* Profile Overview Card */}
                            <div className="card-primary flex items-center gap-4">
                                <div>
                                    {userData.profile_image ? (
                                        <Image
                                            src={userData.profile_image}
                                            alt="Profile"
                                            width={72}
                                            height={72}
                                            className="rounded-full object-cover border-4 border-white shadow-md"
                                        />
                                    ) : (
                                        <div className="w-18 h-18 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                                            <User className="w-8 h-8 text-gray-500" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-gray-900">{userData.username}</h2>
                                    <p className="text-sm text-gray-600">{userData.email}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Member since {new Date(userData.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Update Profile Form */}
                            <div className="card-primary space-y-4">
                                <h3 className="text-base font-semibold text-gray-900">Edit Profile</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            placeholder="Enter new username"
                                            className="input-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="Enter new email"
                                            className="input-primary"
                                        />
                                    </div>
                                    <button
                                        onClick={updateProfile}
                                        disabled={loading}
                                        className="btn-primary w-full"
                                    >
                                        {loading ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-4">
                            <div className="card-primary space-y-4">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-[#1E3A8A]" />
                                    <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="input-primary"
                                        />
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="input-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Confirm Password
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="input-primary"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={changePassword}
                                        disabled={loading}
                                        className="btn-secondary w-full"
                                    >
                                        {loading ? 'Updating…' : 'Update Password'}
                                    </button>
                                </div>
                            </div>

                            <div className="card-primary bg-blue-50 border-blue-100">
                                <div className="flex gap-2">
                                    <Shield className="w-4 h-4 text-[#1E3A8A] mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-[#1E3A8A] mb-1">
                                            Password tips
                                        </h4>
                                        <ul className="text-xs text-gray-700 space-y-1">
                                            <li>• Use at least 6 characters</li>
                                            <li>• Mix letters, numbers, and symbols</li>
                                            <li>• Avoid reusing old passwords</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="card-primary space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Camera className="w-4 h-4 text-[#1E3A8A]" />
                                <h3 className="text-base font-semibold text-gray-900">Profile Picture</h3>
                            </div>
                            {previewUrl && (
                                <div className="text-center">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        width={80}
                                        height={80}
                                        className="rounded-full object-cover border-4 border-[#1E3A8A] mx-auto mb-2"
                                    />
                                    <p className="text-xs text-gray-500">Preview</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Upload new picture
                                </label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={handleFileSelect}
                                    className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#1E3A8A] file:text-white file:text-xs hover:file:bg-[#1e40af]"
                                />
                                <p className="text-xs text-gray-500">JPG or PNG, max 5MB.</p>
                            </div>
                            <button
                                onClick={uploadPicture}
                                disabled={loading || !selectedFile}
                                className="btn-secondary w-full"
                            >
                                {loading ? 'Uploading…' : 'Upload Picture'}
                            </button>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="card-primary">
                            <div className="flex items-center gap-2 mb-2">
                                <Bell className="w-4 h-4 text-[#1E3A8A]" />
                                <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                            </div>
                            <p className="text-sm text-gray-600">
                                Notification settings will be available soon.
                            </p>
                        </div>
                    )}

                    {/* Help & Support Tab */}
                    {activeTab === 'help' && (
                        <div className="card-primary">
                            <div className="flex items-center gap-2 mb-2">
                                <HelpCircle className="w-4 h-4 text-[#1E3A8A]" />
                                <h3 className="text-base font-semibold text-gray-900">Help & Support</h3>
                            </div>
                            <p className="text-sm text-gray-600">
                                Support resources will be added here in a future update.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
