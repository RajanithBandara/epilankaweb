"use client";

import { FormEvent, useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Disease = {
    disease_id: number;
    disease_name: string;
    description: string | null;
};

export default function OfficerDiseasesPage() {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [newDiseaseName, setNewDiseaseName] = useState("");
    const [newDiseaseDescription, setNewDiseaseDescription] = useState("");

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const fetchDiseases = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/officer/diseases", { cache: "no-store" });
            const data = (await response.json()) as Disease[] | { error?: string };
            if (!response.ok) {
                const errData = data as { error?: string };
                throw new Error(errData.error || "Failed to fetch diseases");
            }
            setDiseases(data as Disease[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch diseases");
            setDiseases([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchDiseases();
    }, []);

    const handleCreateDisease = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!newDiseaseName.trim()) {
            setError("Disease name is required");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch("/api/officer/diseases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    disease_name: newDiseaseName.trim(),
                    description: newDiseaseDescription.trim() || null,
                }),
            });

            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(data.error || "Failed to add disease");
            }

            setSuccess("Disease added successfully.");
            setNewDiseaseName("");
            setNewDiseaseDescription("");
            await fetchDiseases();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add disease");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (disease: Disease) => {
        setEditingId(disease.disease_id);
        setEditName(disease.disease_name);
        setEditDescription(disease.description || "");
        setError(null);
        setSuccess(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditDescription("");
    };

    const saveEdit = async (diseaseId: number) => {
        setError(null);
        setSuccess(null);

        if (!editName.trim()) {
            setError("Disease name is required");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`/api/officer/diseases/${diseaseId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    disease_name: editName.trim(),
                    description: editDescription.trim() || null,
                }),
            });

            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(data.error || "Failed to update disease");
            }

            setSuccess("Disease updated successfully.");
            cancelEdit();
            await fetchDiseases();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update disease");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Disease Management</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Add new diseases and edit existing disease details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateDisease} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="text-sm">
                            Disease Name *
                            <input
                                type="text"
                                value={newDiseaseName}
                                onChange={(event) => setNewDiseaseName(event.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
                                placeholder="e.g. Dengue"
                            />
                        </label>
                        <label className="text-sm md:col-span-2">
                            Description
                            <input
                                type="text"
                                value={newDiseaseDescription}
                                onChange={(event) => setNewDiseaseDescription(event.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
                                placeholder="Short description"
                            />
                        </label>
                        <div className="md:col-span-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Add Disease"}
                            </button>
                        </div>
                    </form>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                    {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
                </CardContent>
            </Card>

            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Existing Diseases</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
                        <table className="min-w-full text-sm">
                            <thead className="bg-black/3 dark:bg-white/5">
                                <tr>
                                    <th className="px-3 py-2 text-left">ID</th>
                                    <th className="px-3 py-2 text-left">Disease Name</th>
                                    <th className="px-3 py-2 text-left">Description</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-6 text-center text-black/60 dark:text-white/60">
                                            Loading diseases...
                                        </td>
                                    </tr>
                                ) : diseases.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-6 text-center text-black/60 dark:text-white/60">
                                            No diseases found.
                                        </td>
                                    </tr>
                                ) : (
                                    diseases.map((disease) => {
                                        const isEditing = editingId === disease.disease_id;
                                        return (
                                            <tr key={disease.disease_id} className="border-t border-black/10 dark:border-white/10">
                                                <td className="px-3 py-2">{disease.disease_id}</td>
                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editName}
                                                            onChange={(event) => setEditName(event.target.value)}
                                                            className="w-full rounded-md border px-2 py-1 bg-transparent"
                                                        />
                                                    ) : (
                                                        disease.disease_name
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editDescription}
                                                            onChange={(event) => setEditDescription(event.target.value)}
                                                            className="w-full rounded-md border px-2 py-1 bg-transparent"
                                                        />
                                                    ) : (
                                                        disease.description || "-"
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() => void saveEdit(disease.disease_id)}
                                                                className="rounded border px-2 py-1 text-xs"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="rounded border px-2 py-1 text-xs"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => startEdit(disease)}
                                                            className="rounded border px-2 py-1 text-xs"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
