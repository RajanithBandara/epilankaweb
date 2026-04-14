import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import redis from '@/lib/redis';

const CACHE_TTL_SECONDS = 3600; // 1 hour

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const district_name = searchParams.get('district_name')?.trim();

    if (!district_name) {
        return NextResponse.json(
            { error: 'District name is required' },
            { status: 400 }
        );
    }

    // 1. Try to fetch from Redis Cache
    const cacheKey = `dashboard:analytics:historical-chart:${district_name}`;
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return NextResponse.json(JSON.parse(cachedData));
        }
    } catch (e) {
        console.warn("Redis historical chart cache get failed", e);
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
        return NextResponse.json(
            { error: 'API base URL is not configured' },
            { status: 500 }
        );
    }

    try {
        const response = await axios.get(
            `${apiBaseUrl}/reports/historical-chart`,
            {
                params: { district_name },
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_SECRET_KEY as string,
                    'Content-Type': 'application/json',
                },
            }
        );

        // 2. Cache the valid API response to Redis
        try {
            await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response.data));
        } catch (e) {
            console.warn("Redis historical chart cache set failed", e);
        }

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching historical chart data:', error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error:
                        error.response?.data?.detail ||
                        error.response?.data?.error ||
                        'Failed to fetch historical chart data',
                },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to fetch historical chart data' },
            { status: 500 }
        );
    }
}
