"use client";

import { FormEvent, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { account } from "@/lib/appwrite";
import { AlertCircle, Check, Loader2 } from "lucide-react";

interface UserProfile {
    user_id: string;
    email: string;
    name: string;
    emailVerification: boolean;
}

export default function OfficerSettingsPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [newName, setNewName] = useState("");
    const [updatingName, setUpdatingName] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("/api/officer/settings");
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Failed to fetch profile" }));
                    throw new Error(errorData.error || errorData.message || "Failed to fetch profile");
                }
                const data = await response.json();
                setProfile(data);
                setNewName(data.name || "");
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Failed to load profile";
                console.error("Profile fetch error:", errorMsg);
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleNameUpdate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!newName.trim()) {
            setError("Name cannot be empty");
            return;
        }

        setUpdatingName(true);
        try {
            const response = await fetch("/api/officer/settings/name", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || "Failed to update name");
            }

            await account.updateName(newName.trim());

            setProfile((prev) => (prev ? { ...prev, name: newName.trim() } : null));
            setSuccess("Name updated successfully");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update name");
        } finally {
            setUpdatingName(false);
        }
    };

    const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All password fields are required");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match");
            return;
        }

        if (currentPassword === newPassword) {
            setError("New password must be different from current password");
            return;
        }

        setChangingPassword(true);
        try {
            await account.updatePassword(newPassword, currentPassword);

            const response = await fetch("/api/officer/settings/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Failed to update password on server");
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSuccess("Password changed successfully");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-black dark:text-white" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-black dark:text-white">Settings</h1>
                <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                    Manage your account settings and security preferences
                </p>
            </div>

            {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
                </Alert>
            )}

            {profile && (
                <Card className="border-black/10 dark:border-white/15">
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>Your email and account status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-black dark:text-white">Email</label>
                            <p className="mt-1 text-sm text-black/60 dark:text-white/60">{profile.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-black dark:text-white">Account Status</label>
                            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                                {profile.emailVerification ? "✓ Verified" : "Pending Verification"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-black/10 dark:border-white/15">
                <CardHeader>
                    <CardTitle>Change Name</CardTitle>
                    <CardDescription>Update your display name</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleNameUpdate} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-black dark:text-white">Full Name</label>
                            <Input
                                type="text"
                                value={newName}
                                onChange={(event) => setNewName(event.target.value)}
                                placeholder="Enter your full name"
                                className="mt-1 border-black/15 bg-white text-black placeholder:text-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/40"
                                disabled={updatingName}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={updatingName || newName === profile?.name}
                            className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                            {updatingName ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Name"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-black/10 dark:border-white/15">
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password for security</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-black dark:text-white">Current Password</label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                placeholder="Enter current password"
                                className="mt-1 border-black/15 bg-white text-black placeholder:text-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/40"
                                disabled={changingPassword}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-black dark:text-white">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                placeholder="Enter new password (min 8 characters)"
                                className="mt-1 border-black/15 bg-white text-black placeholder:text-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/40"
                                disabled={changingPassword}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-black dark:text-white">Confirm New Password</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Confirm new password"
                                className="mt-1 border-black/15 bg-white text-black placeholder:text-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/40"
                                disabled={changingPassword}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                            className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                            {changingPassword ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Changing...
                                </>
                            ) : (
                                "Change Password"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}