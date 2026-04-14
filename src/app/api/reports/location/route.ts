import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import redis from '@/lib/redis';

const CACHE_TTL_SECONDS = 3600; // 1 hour

function parseIntParam(value: string | null, name: string) {
    if (value === null) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new Error(`${name} must be an integer`);
    }
    return parsed;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const district_name = searchParams.get('district_name')?.trim() || null;
    const province_name = searchParams.get('province_name')?.trim() || null;
    const user_id = searchParams.get('user_id')?.trim() || null;
    const limit = searchParams.get('limit');
    const skip = searchParams.get('skip');
    const days = searchParams.get('days');

    if (!district_name && !province_name) {
        return NextResponse.json(
            { error: 'District name or province name is required' },
            { status: 400 }
        );
    }

    let parsedLimit: number | undefined;
    let parsedSkip: number | undefined;
    let parsedDays: number | undefined;

    try {
        parsedLimit = parseIntParam(limit, 'limit');
        parsedSkip = parseIntParam(skip, 'skip');
        parsedDays = parseIntParam(days, 'days');
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Invalid query parameter' },
            { status: 400 }
        );
    }

    const params: Record<string, string | number> = {};
    if (district_name) params.district_name = district_name;
    if (province_name) params.province_name = province_name;
    if (user_id) params.user_id = user_id;
    if (parsedLimit !== undefined) params.limit = parsedLimit;
    if (parsedSkip !== undefined) params.skip = parsedSkip;
    if (parsedDays !== undefined) params.days = parsedDays;

    // 1. Try to fetch from Redis Cache
    const cacheKey = `dashboard:analytics:location:${district_name || 'all'}:${province_name || 'all'}:${user_id || 'all'}:${parsedLimit || 'null'}:${parsedSkip || 'null'}:${parsedDays || 'null'}`;
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return NextResponse.json(JSON.parse(cachedData));
        }
    } catch (e) {
        console.warn("Redis location reports cache get failed", e);
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiKey =
        process.env.API_SECRET_KEY ||
        process.env.NEXT_PUBLIC_SECRET_KEY ||
        process.env.NEXT_PUBLIC_API_KEY;
        
    if (!apiBaseUrl) {
        return NextResponse.json(
            { error: 'API base URL is not configured' },
            { status: 500 }
        );
    }

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Backend API key is not configured' },
            { status: 500 }
        );
    }

    try {
        const response = await axios.get(
            `${apiBaseUrl}/reports/location`,
            {
                params,
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        // 2. Cache the valid API response to Redis
        try {
            await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response.data));
        } catch (e) {
            console.warn("Redis location reports cache set failed", e);
        }

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching reports:', error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error: error.response?.data?.detail || error.response?.data?.error || 'Failed to fetch reports',
                },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}
