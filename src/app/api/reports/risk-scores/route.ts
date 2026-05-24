import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const district_id = searchParams.get('district_id');
    const disease_id = searchParams.get('disease_id');

    const params: Record<string, string | number> = {};
    if (district_id) params.district_id = Number(district_id);
    if (disease_id) params.disease_id = Number(disease_id);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiKey = process.env.API_SECRET_KEY || process.env.SECRET_KEY;

    if (!apiBaseUrl) {
        return NextResponse.json({ error: 'API base URL is not configured' }, { status: 500 });
    }
    if (!apiKey) {
        return NextResponse.json({ error: 'Backend API key is not configured' }, { status: 500 });
    }

    try {
        const response = await axios.get(`${apiBaseUrl}/reports/risk-scores`, {
            params,
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching CERI risk scores:', error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: error.response?.data?.detail || 'Failed to fetch risk scores' },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json({ error: 'Failed to fetch risk scores' }, { status: 500 });
    }
}
