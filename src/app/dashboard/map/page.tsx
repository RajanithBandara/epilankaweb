'use client';

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapComponent = dynamic(() => import("@/components/dashboard-components/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-white/90 shadow-sm flex items-center justify-center"
             style={{ minHeight: '520px' }}>
            <div className="flex flex-col items-center gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Loading map…</p>
                <p className="text-xs text-slate-400">Fetching your location and disease risk data.</p>
            </div>
        </div>
    ),
});

export default function MapPage() {
    return <MapComponent />;
}