"use client";

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full min-h-[480px] w-full items-center justify-center bg-black/70">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-white" />
        </div>
    ),
});

export default function OfficerMapPage() {
    return (
        <section className="space-y-4">
            <header>
                <h2 className="text-xl font-semibold tracking-tight">Sri Lanka Disease Risk Map</h2>
                <p className="text-sm text-black/65 dark:text-white/65">
                    View district-level disease risk and active alerts from the officer dashboard.
                </p>
            </header>

            <div className="overflow-hidden rounded-2xl border border-black/15 bg-black p-3 shadow-xl dark:border-white/20">
                <div className="h-[72vh] min-h-[520px] overflow-hidden rounded-xl border border-black/20 bg-black dark:border-white/20">
                    <MapComponent variant="mono" />
                </div>
            </div>
        </section>
    );
}

