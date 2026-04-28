'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

// Dynamically import MapComponent to prevent SSR "window is not defined" issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center w-full h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
    )
});

// Dynamically import AreaReportsList to prevent SSR issues
const AreaReportsList = dynamic(() => import('@/components/AreaReportsList'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
    )
});

export default function MapPage() {
    return (
        <main className="min-h-screen flex flex-col relative text-white">
            {/* Fixed background */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] overflow-hidden -z-10">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Page header */}
            <div className="w-full max-w-7xl mx-auto px-4 pt-28 pb-4 relative z-10">
                <h1 className="text-3xl font-bold mb-2 tracking-tight text-white drop-shadow-md">Sri Lanka Disease Risk Map</h1>
                <p className="text-white/80 text-lg font-medium drop-shadow-sm max-w-2xl">
                    View real-time disease risk levels across all districts of Sri Lanka.
                </p>
            </div>

            {/* Map container */}
            <div className="w-full max-w-7xl mx-auto px-4 pb-8 flex-1 relative z-10">
                <div className="w-full rounded-2xl overflow-hidden glass-panel p-0 h-[70vh] min-h-[500px] border border-white/20 shadow-2xl">
                    <MapComponent />
                </div>
            </div>

            {/* Area Reports Section */}
            <div className="w-full max-w-7xl mx-auto px-4 pb-8 relative z-10">
                <div className="rounded-2xl border border-white/20 p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
                    <AreaReportsList />
                </div>
            </div>

            {/* How to Stay Safe section */}
            <div className="w-full max-w-7xl mx-auto px-4 pb-16 relative z-10">
                <div className="rounded-2xl border border-white/20 p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">How to Stay Safe</h2>
                                <p className="text-sm text-white/70">Open the safety page to view symptoms and prevention guidance.</p>
                            </div>
                        </div>
                        <Link
                            href="/safety"
                            className="inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            View Safety Guide
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
