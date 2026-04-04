'use client';

import dynamic from 'next/dynamic';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// Dynamically import MapComponent to prevent SSR "window is not defined" issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center w-full h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]"></div>
        </div>
    )
});

export default function MapPage() {
    return (
        <main className="min-h-screen flex flex-col relative text-white">
            {/* Fixed background with hero gradient exactly like home page */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] overflow-hidden -z-10">
                {/* Decorative background elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Page header area */}
            <div className="w-full max-w-7xl mx-auto px-4 pt-28 pb-4 relative z-10">
                <h1 className="text-3xl font-bold mb-2 tracking-tight text-white drop-shadow-md">Sri Lanka Disease Risk Map</h1>
                <p className="text-white/80 text-lg font-medium drop-shadow-sm max-w-2xl">
                    View real-time disease risk levels across all districts of Sri Lanka.
                </p>
            </div>

            {/* Map container */}
            <div className="w-full max-w-7xl mx-auto px-4 pb-12 flex-1 relative z-10">
                <div
                    className="w-full rounded-2xl overflow-hidden glass-panel p-0 h-[70vh] min-h-[500px] border border-white/20 shadow-2xl"
                >
                    <MapComponent />
                </div>
            </div>
        </main>
    );
}
