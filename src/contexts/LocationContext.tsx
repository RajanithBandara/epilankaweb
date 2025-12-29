// src/contexts/LocationContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface DiseaseRisk {
    disease_id: number;
    disease_name: string;
    count: number;
    level: 'safe' | 'low' | 'medium' | 'high';
}

interface NearestArea {
    district_id: number;
    district_name: string;
    latitude: number;
    longitude: number;
    province_name: string;
    distance: number;
    week_number: number;
    year: number;
    risk_levels: Record<string, DiseaseRisk>;
}

interface LocationData {
    user_location: {
        latitude: number;
        longitude: number;
    };
    nearest_area: NearestArea | null;
    warning: string;
    data_period?: string;
}

interface LocationContextType {
    locationData: LocationData | null;
    isLoading: boolean;
    error: string | null;
    refetchLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLocation = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Check sessionStorage first
            const cached = sessionStorage.getItem('nearest_location');
            if (cached) {
                setLocationData(JSON.parse(cached));
                setIsLoading(false);
                return;
            }

            // Get user's current position
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;

            // Fetch nearest location from API
            const response = await axios.get<LocationData>('/api/nearestlocation', {
                params: { latitude, longitude },
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY!,
                },
            });

            // Save to sessionStorage
            sessionStorage.setItem('nearest_location', JSON.stringify(response.data));
            setLocationData(response.data);
        } catch (err) {
            console.error('Error fetching location:', err);
            setError('Failed to fetch location data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLocation();
    }, []);

    return (
        <LocationContext.Provider
            value={{
                locationData,
                isLoading,
                error,
                refetchLocation: fetchLocation,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
