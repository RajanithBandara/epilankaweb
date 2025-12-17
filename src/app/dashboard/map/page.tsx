'use client';

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/dashboard-components/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">Loading map...</p>
        </div>
    ),
});

function MapPage(){
    return(
        <>
            <MapComponent/>
        </>
    )
}

export default MapPage;