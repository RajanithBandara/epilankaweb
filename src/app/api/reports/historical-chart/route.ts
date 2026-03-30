import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const district_name = searchParams.get('district_name')?.trim();

    if (!district_name) {
        return NextResponse.json(
            { error: 'District name is required' },
            { status: 400 }
        );
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
