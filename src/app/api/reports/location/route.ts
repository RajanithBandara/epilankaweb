import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const district_name = searchParams.get('district_name');
    const province_name = searchParams.get('province_name');
    const limit = searchParams.get('limit');
    const skip = searchParams.get('skip');
    const days = searchParams.get('days');

    if (!district_name && !province_name) {
        return NextResponse.json(
            { error: 'District name or province name is required' },
            { status: 400 }
        );
    }

    const params: Record<string, string | number> = {};
    if (district_name) params.district_name = district_name;
    if (province_name) params.province_name = province_name;
    if (limit) params.limit = limit;
    if (skip) params.skip = skip;
    if (days) params.days = days;

    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/reports/location`,
            {
                params,
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_SECRET_KEY!,
                    'Content-Type': 'application/json',
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}