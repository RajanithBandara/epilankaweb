'use client';

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapComponent = dynamic(() => import("@/components/dashboard-components/Map"), {
    ssr: false,
    loading: () => (
        <div
            className="w-full rounded-2xl overflow-hidden border flex items-center justify-center"
            style={{
                minHeight: '520px',
                background: 'var(--dash-card-bg)',
                borderColor: 'var(--dash-card-border)',
            }}
        >
            <div className="flex flex-col items-center gap-3 text-center px-6">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(30,58,138,0.1)' }}
                >
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--dash-text-primary)' }}>
                    Loading map…
                </p>
                <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                    Fetching your location and disease risk data.
                </p>
            </div>
        </div>
    ),
});

export default function MapPage() {
    return <MapComponent />;
}