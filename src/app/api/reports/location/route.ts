import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const district_name = searchParams.get('district_name');

    if (!district_name) {
        return NextResponse.json(
            { error: 'District name is required' },
            { status: 400 }
        );
    }

    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/reports/location`,
            {
                params: { district_name },
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