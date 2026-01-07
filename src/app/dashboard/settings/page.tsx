'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { User, Mail, Lock, Camera, Check, X } from 'lucide-react';

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

export default function UserSettings() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form states
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL;
    const API_KEY = process.env.NEXT_PUBLIC_SECRET_KEY;

    // Configure axios defaults
    axios.defaults.headers.common['x-api-key'] = API_KEY;

    const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 4000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUserId = (): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('user_id');
        }
        return null;
    };

    const loadSettings = async () => {
        const userId = getUserId();

        if (!userId) {
            showAlert('User ID not found. Please login again.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/settings/${userId}`);

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
    };

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
            await axios.put(`${API_BASE}/profile/${userId}`, body);
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
            await axios.post(`${API_BASE}/change-password/${userId}`, {
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
            await axios.post(`${API_BASE}/profilepic/${userId}`, formData, {
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

    // Load settings automatically on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    if (!getUserId()) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="bg-black text-white rounded-lg p-8 max-w-md w-full text-center border border-gray-800">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                    <p className="text-gray-400 mb-6">Please log in to access your settings.</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-100 transition"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-black mb-2">Account Settings</h1>
                    <p className="text-gray-600">Manage your profile and account preferences</p>
                </div>

                {/* Alert */}
                {alert && (
                    <div
                        className={`mb-6 rounded-lg p-4 border-2 flex items-center gap-3 transition-all duration-300 ${
                            alert.type === 'success'
                                ? 'bg-white border-black text-black'
                                : 'bg-black border-black text-white'
                        }`}
                    >
                        {alert.type === 'success' ? (
                            <Check className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <X className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="font-medium">{alert.message}</span>
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left Column - Profile Overview */}
                    <div className="md:col-span-1">
                        {userData && (
                            <div className="bg-black text-white rounded-lg p-6 sticky top-6">
                                <div className="text-center mb-6">
                                    <div className="relative inline-block">
                                        {userData.profile_image ? (
                                            <Image
                                                src={userData.profile_image}
                                                alt="Profile"
                                                width={120}
                                                height={120}
                                                className="rounded-full object-cover border-4 border-white"
                                            />
                                        ) : (
                                            <div className="w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center border-4 border-white">
                                                <User className="w-12 h-12 text-black" />
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold mt-4">{userData.username}</h2>
                                    <p className="text-gray-400 text-sm mt-1">{userData.email}</p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-700">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Member Since</p>
                                        <p className="text-sm">{formatDate(userData.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Last Updated</p>
                                        <p className="text-sm">{formatDate(userData.updated_at)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Settings Forms */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Update Profile */}
                        {userData && (
                            <div className="border-2 border-black rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <User className="w-5 h-5" />
                                    <h2 className="text-xl font-bold">Profile Information</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-2">Username</label>
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            placeholder="Enter new username"
                                            className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="Enter new email"
                                            className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition bg-white"
                                        />
                                    </div>
                                    <button
                                        onClick={updateProfile}
                                        disabled={loading}
                                        className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Updating...' : 'Update Profile'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Change Password */}
                        {userData && (
                            <div className="border-2 border-black rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <Lock className="w-5 h-5" />
                                    <h2 className="text-xl font-bold">Change Password</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password (min. 6 characters)"
                                            className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition bg-white"
                                        />
                                    </div>
                                    <button
                                        onClick={changePassword}
                                        disabled={loading}
                                        className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Upload Profile Picture */}
                        {userData && (
                            <div className="border-2 border-black rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <Camera className="w-5 h-5" />
                                    <h2 className="text-xl font-bold">Profile Picture</h2>
                                </div>
                                <div className="space-y-4">
                                    {previewUrl && (
                                        <div className="text-center">
                                            <p className="text-sm font-semibold mb-2">Preview:</p>
                                            <Image
                                                src={previewUrl}
                                                alt="Preview"
                                                width={100}
                                                height={100}
                                                className="rounded-full object-cover border-2 border-black mx-auto"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-2">Select Image</label>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg"
                                            onChange={handleFileSelect}
                                            className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-black file:text-white file:font-semibold hover:file:bg-gray-800 file:cursor-pointer"
                                        />
                                        <p className="text-xs text-gray-600 mt-2">Accepted formats: JPG, PNG (max 5MB)</p>
                                    </div>
                                    <button
                                        onClick={uploadPicture}
                                        disabled={loading || !selectedFile}
                                        className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Uploading...' : 'Upload Picture'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}