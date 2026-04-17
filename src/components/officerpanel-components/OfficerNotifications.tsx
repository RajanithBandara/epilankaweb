"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BellRing,
    Check,
    Loader2,
    Pencil,
    RefreshCw,
    Save,
    Send,
    Trash2,
    User,
    Users,
    X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Severity = "info" | "warning" | "critical" | "success";

type OfficerNotification = {
    _id: string;
    notification_id: string;
    text: string;
    severity: Severity;
    user_id?: string | null;
    created_at: string;
    read?: boolean;
    metadata?: Record<string, unknown>;
};

const severityOptions: { value: Severity; label: string }[] = [
    { value: "info", label: "Info" },
    { value: "warning", label: "Warning" },
    { value: "critical", label: "Critical" },
    { value: "success", label: "Success" },
];

const severityToneClass: Record<Severity, string> = {
    info: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    critical: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
};

const severityBadgeClass: Record<Severity, string> = {
    info: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-200",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200",
    critical: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-200",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
};

function formatRelative(dateInput: string) {
    const date = new Date(dateInput);
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleString();
}

export default function OfficerNotificationsPage() {
    const [text, setText] = useState("");
    const [severity, setSeverity] = useState<Severity>("info");
    const [targetUserId, setTargetUserId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [notifications, setNotifications] = useState<OfficerNotification[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [editSeverity, setEditSeverity] = useState<Severity>("info");
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const trimmedText = useMemo(() => text.trim(), [text]);
    const remaining = 500 - trimmedText.length;

    const fetchNotifications = useCallback(async () => {
        try {
            setListLoading(true);
            const response = await fetch("/api/officer/notifications?skip=0&limit=50", { cache: "no-store" });
            const data = (await response.json()) as { items?: OfficerNotification[]; error?: string };

            if (!response.ok) {
                throw new Error(data.error || "Failed to load notifications");
            }

            setNotifications(data.items ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load notifications");
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchNotifications();

        const timer = setInterval(() => {
            void fetchNotifications();
        }, 10000);

        return () => clearInterval(timer);
    }, [fetchNotifications]);

    const startEdit = (notification: OfficerNotification) => {
        setEditingId(notification.notification_id);
        setEditText(notification.text);
        setEditSeverity(notification.severity);
        setError("");
        setSuccess("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText("");
        setEditSeverity("info");
    };

    const saveEdit = async (notificationId: string) => {
        const trimmed = editText.trim();
        if (!trimmed) {
            setError("Edited notification text cannot be empty.");
            return;
        }

        setActionLoadingId(notificationId);
        setError("");
        setSuccess("");
        try {
            const response = await fetch(`/api/officer/notifications/${notificationId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: trimmed, severity: editSeverity }),
            });

            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(data.error || "Failed to update notification");
            }

            setNotifications((prev) =>
                prev.map((item) =>
                    item.notification_id === notificationId
                        ? { ...item, text: trimmed, severity: editSeverity }
                        : item
                )
            );
            setSuccess("Notification updated successfully.");
            cancelEdit();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update notification");
        } finally {
            setActionLoadingId(null);
        }
    };

    const removeNotification = async (notificationId: string) => {
        setActionLoadingId(notificationId);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`/api/officer/notifications/${notificationId}`, {
                method: "DELETE",
            });

            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(data.error || "Failed to delete notification");
            }

            setNotifications((prev) => prev.filter((item) => item.notification_id !== notificationId));
            if (editingId === notificationId) {
                cancelEdit();
            }
            setSuccess("Notification deleted.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete notification");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!trimmedText) {
            setError("Notification text is required.");
            return;
        }

        if (trimmedText.length > 500) {
            setError("Notification text must be 500 characters or less.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                text: trimmedText,
                severity,
                user_id: targetUserId.trim() ? targetUserId.trim() : null,
                metadata: {
                    source: "officer_dashboard",
                    created_from: "officerdashboard/notifications",
                },
            };

            const response = await fetch("/api/officer/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = (await response.json()) as { error?: string; message?: string; notification?: { notification_id?: string } };
            if (!response.ok) {
                throw new Error(data.error || "Failed to push notification");
            }

            const mode = payload.user_id ? `user ${payload.user_id}` : "all users";
            const id = data.notification?.notification_id ? ` (${data.notification.notification_id})` : "";
            setSuccess(`Notification pushed to ${mode}${id}.`);

            const created = data.notification as OfficerNotification | undefined;
            if (created && created.notification_id) {
                setNotifications((prev) => [created, ...prev]);
            } else {
                await fetchNotifications();
            }

            setText("");
            setTargetUserId("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to push notification");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white">Push Notifications</h1>
                    <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                        Send live notifications to all users or a specific user from the officer dashboard.
                    </p>
                </div>
                <Badge className="rounded-full border border-black/15 bg-black/5 px-3 py-1 text-black dark:border-white/20 dark:bg-white/10 dark:text-white">
                    <BellRing className="mr-1 h-3.5 w-3.5" /> Live Push
                </Badge>
            </div>

            {error ? (
                <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
            ) : null}

            {success ? (
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
                </Alert>
            ) : null}

            <Card className="border-black/10 dark:border-white/15">
                <CardHeader>
                    <CardTitle>Compose Notification</CardTitle>
                    <CardDescription>
                        Leave Target User ID empty to broadcast globally. Fill it to send a user-specific push.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="notification-text" className="text-sm font-medium text-black dark:text-white">
                                Notification Text
                            </label>
                            <Textarea
                                id="notification-text"
                                value={text}
                                onChange={(event) => setText(event.target.value)}
                                maxLength={520}
                                rows={4}
                                placeholder="Example: Weekly dengue surveillance report is now available."
                                className="resize-none border-black/15 bg-white text-black placeholder:text-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/40"
                                disabled={submitting}
                            />
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-black/50 dark:text-white/50">Max 500 characters</span>
                                <span
                                    className={remaining < 0 ? "text-red-600 dark:text-red-400" : "text-black/60 dark:text-white/60"}
                                >
                                    {remaining}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="notification-severity" className="text-sm font-medium text-black dark:text-white">
                                    Severity
                                </label>
                                <Select value={severity} onValueChange={(value) => setSeverity(value as Severity)} disabled={submitting}>
                                    <SelectTrigger id="notification-severity" className="border-black/15 bg-white text-black dark:border-white/15 dark:bg-black dark:text-white">
                                        <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {severityOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="target-user-id" className="text-sm font-medium text-black dark:text-white">
                                    Target User ID (optional)
                                </label>
                                <Input
                                    id="target-user-id"
                                    value={targetUserId}
                                    onChange={(event) => setTargetUserId(event.target.value)}
                                    placeholder="Leave empty to send globally"
                                    className="border-black/15 bg-white text-black placeholder:text-black/40 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/40"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        <div className={`rounded-lg border px-3 py-2 text-sm ${severityToneClass[severity]}`}>
                            Preview: {trimmedText || "Your notification text will appear here."}
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting || !trimmedText || remaining < 0}
                            className="w-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Pushing Notification...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Push Notification
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-black/10 dark:border-white/15">
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                    <div>
                        <CardTitle>Sent Notifications</CardTitle>
                        <CardDescription>
                            Officers can view, edit, and delete notifications from this list.
                        </CardDescription>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void fetchNotifications()}
                        className="border-black/15 text-black hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                        disabled={listLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {listLoading ? (
                        <div className="flex items-center justify-center py-8 text-sm text-black/60 dark:text-white/60">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading notifications...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-black/60 dark:border-white/15 dark:text-white/60">
                            No notifications yet. Push one to see it instantly here.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notification) => {
                                const isEditing = editingId === notification.notification_id;
                                const rowBusy = actionLoadingId === notification.notification_id;

                                return (
                                    <div
                                        key={notification.notification_id}
                                        className="rounded-xl border border-black/10 bg-linear-to-br from-white to-black/2 p-4 shadow-sm dark:border-white/15 dark:from-black dark:to-white/3"
                                    >
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <Badge className={`rounded-full border ${severityBadgeClass[notification.severity]}`}>
                                                {notification.severity.toUpperCase()}
                                            </Badge>

                                            <Badge className="rounded-full border border-black/15 bg-black/5 text-black dark:border-white/20 dark:bg-white/10 dark:text-white">
                                                {notification.user_id ? (
                                                    <>
                                                        <User className="mr-1 h-3.5 w-3.5" /> User: {notification.user_id}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Users className="mr-1 h-3.5 w-3.5" /> Global
                                                    </>
                                                )}
                                            </Badge>

                                            <span className="text-xs text-black/50 dark:text-white/50">
                                                {formatRelative(notification.created_at)}
                                            </span>
                                        </div>

                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <Textarea
                                                    value={editText}
                                                    onChange={(event) => setEditText(event.target.value)}
                                                    rows={3}
                                                    className="resize-none border-black/15 bg-white text-black dark:border-white/15 dark:bg-black dark:text-white"
                                                    disabled={rowBusy}
                                                />

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Select
                                                        value={editSeverity}
                                                        onValueChange={(value) => setEditSeverity(value as Severity)}
                                                        disabled={rowBusy}
                                                    >
                                                        <SelectTrigger className="w-[180px] border-black/15 bg-white text-black dark:border-white/15 dark:bg-black dark:text-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {severityOptions.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        type="button"
                                                        onClick={() => void saveEdit(notification.notification_id)}
                                                        disabled={rowBusy}
                                                        className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                                    >
                                                        {rowBusy ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="mr-2 h-4 w-4" />
                                                        )}
                                                        Save
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={cancelEdit}
                                                        disabled={rowBusy}
                                                        className="border-black/15 text-black hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm leading-relaxed text-black dark:text-white">
                                                    {notification.text}
                                                </p>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => startEdit(notification)}
                                                        className="h-8 border-black/15 text-black hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                                                    >
                                                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => void removeNotification(notification.notification_id)}
                                                        disabled={rowBusy}
                                                        className="h-8 border-red-500/40 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                                                    >
                                                        {rowBusy ? (
                                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                                        )}
                                                        Delete
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
