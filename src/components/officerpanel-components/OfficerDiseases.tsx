"use client";

import { FormEvent, useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Disease = {
    disease_id: number;
    disease_name: string;
    description: string | null;
};

type DiseaseDetails = {
    disease_id: number;
    symptoms: string[];
    precautions: string[];
    createdAt: string;
    updatedAt: string;
};

const parseTextareaEntries = (text: string) =>
    text
        .split(/\n|,/) 
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

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

    const [selectedDiseaseId, setSelectedDiseaseId] = useState<number | null>(null);
    const [detailExists, setDetailExists] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailSaving, setDetailSaving] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailSuccess, setDetailSuccess] = useState<string | null>(null);
    const [symptomsText, setSymptomsText] = useState("");
    const [precautionsText, setPrecautionsText] = useState("");

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

    const clearDetailMessages = () => {
        setDetailError(null);
        setDetailSuccess(null);
    };

    const resetDetailForm = () => {
        setSymptomsText("");
        setPrecautionsText("");
        setDetailExists(false);
    };

    const fetchDiseaseDetails = async (diseaseId: number) => {
        clearDetailMessages();
        setDetailsLoading(true);

        try {
            const response = await fetch(`/api/officer/disease-details/${diseaseId}`, {
                cache: "no-store",
            });

            const data = (await response.json()) as DiseaseDetails | { error?: string };

            if (response.status === 404) {
                resetDetailForm();
                setDetailSuccess("No details found yet. You can add them now.");
                return;
            }

            if (!response.ok) {
                const errData = data as { error?: string };
                throw new Error(errData.error || "Failed to fetch disease details");
            }

            const details = data as DiseaseDetails;
            setSymptomsText(details.symptoms.join("\n"));
            setPrecautionsText(details.precautions.join("\n"));
            setDetailExists(true);
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : "Failed to fetch disease details");
            resetDetailForm();
        } finally {
            setDetailsLoading(false);
        }
    };

    const manageDetails = async (diseaseId: number) => {
        setSelectedDiseaseId(diseaseId);
        await fetchDiseaseDetails(diseaseId);
    };

    const saveDiseaseDetails = async () => {
        clearDetailMessages();

        if (!selectedDiseaseId) {
            setDetailError("Select a disease first.");
            return;
        }

        const payload = {
            disease_id: selectedDiseaseId,
            symptoms: parseTextareaEntries(symptomsText),
            precautions: parseTextareaEntries(precautionsText),
        };

        setDetailSaving(true);
        try {
            const response = await fetch(
                detailExists ? `/api/officer/disease-details/${selectedDiseaseId}` : "/api/officer/disease-details",
                {
                    method: detailExists ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(data.error || "Failed to save disease details");
            }

            setDetailExists(true);
            setDetailSuccess("Disease details saved successfully.");
            await fetchDiseaseDetails(selectedDiseaseId);
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : "Failed to save disease details");
        } finally {
            setDetailSaving(false);
        }
    };

    const deleteDiseaseDetails = async () => {
        clearDetailMessages();

        if (!selectedDiseaseId) {
            setDetailError("Select a disease first.");
            return;
        }

        setDetailSaving(true);
        try {
            const response = await fetch(`/api/officer/disease-details/${selectedDiseaseId}`, {
                method: "DELETE",
            });

            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(data.error || "Failed to delete disease details");
            }

            resetDetailForm();
            setDetailSuccess("Disease details deleted successfully.");
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : "Failed to delete disease details");
        } finally {
            setDetailSaving(false);
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
                    <form onSubmit={handleCreateDisease} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <label className="text-sm">
                            Disease Name *
                            <input
                                type="text"
                                value={newDiseaseName}
                                onChange={(event) => setNewDiseaseName(event.target.value)}
                                className="mt-1 w-full rounded-md border bg-transparent px-3 py-2"
                                placeholder="e.g. Dengue"
                            />
                        </label>
                        <label className="text-sm md:col-span-2">
                            Description
                            <input
                                type="text"
                                value={newDiseaseDescription}
                                onChange={(event) => setNewDiseaseDescription(event.target.value)}
                                className="mt-1 w-full rounded-md border bg-transparent px-3 py-2"
                                placeholder="Short description"
                            />
                        </label>
                        <div className="md:col-span-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
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
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Use Manage Details to attach symptoms and precautions by disease ID.
                    </CardDescription>
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
                                                            className="w-full rounded-md border bg-transparent px-2 py-1"
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
                                                            className="w-full rounded-md border bg-transparent px-2 py-1"
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
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => startEdit(disease)}
                                                                className="rounded border px-2 py-1 text-xs"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => void manageDetails(disease.disease_id)}
                                                                className="rounded border px-2 py-1 text-xs"
                                                            >
                                                                Manage Details
                                                            </button>
                                                        </div>
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

            {selectedDiseaseId && (
                <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                    <CardHeader>
                        <CardTitle>Disease Details for ID #{selectedDiseaseId}</CardTitle>
                        <CardDescription className="text-black/65 dark:text-white/65">
                            Add or update symptoms and precautions for this disease.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <label className="block text-sm">
                            Symptoms (one per line or comma-separated)
                            <textarea
                                value={symptomsText}
                                onChange={(event) => setSymptomsText(event.target.value)}
                                className="mt-1 min-h-28 w-full rounded-md border bg-transparent px-3 py-2"
                                placeholder="Fever\nHeadache\nBody pain"
                            />
                        </label>

                        <label className="block text-sm">
                            Precautions (one per line or comma-separated)
                            <textarea
                                value={precautionsText}
                                onChange={(event) => setPrecautionsText(event.target.value)}
                                className="mt-1 min-h-28 w-full rounded-md border bg-transparent px-3 py-2"
                                placeholder="Drink clean water\nUse mosquito repellent"
                            />
                        </label>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={detailSaving || detailsLoading}
                                onClick={() => void saveDiseaseDetails()}
                                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
                            >
                                {detailSaving ? "Saving..." : detailExists ? "Update Details" : "Create Details"}
                            </button>
                            <button
                                type="button"
                                disabled={detailSaving || detailsLoading || !detailExists}
                                onClick={() => void deleteDiseaseDetails()}
                                className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
                            >
                                Remove Details
                            </button>
                        </div>

                        {detailsLoading && <p className="text-sm text-black/60 dark:text-white/60">Loading details...</p>}
                        {detailError && <p className="text-sm text-red-600">{detailError}</p>}
                        {detailSuccess && <p className="text-sm text-green-600">{detailSuccess}</p>}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}