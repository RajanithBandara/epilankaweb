import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
    try {
        const { reportid, userid, location } = await request.json();

        if (!reportid || !userid || !location) {
            return NextResponse.json(
                { error: 'Missing required fields: reportid, userid, location' },
                { status: 400 }
            );
        }

        // FastAPI expects query parameters for the vote endpoint
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/user_reports/vote`,
            null,
            {
                params: {
                    reportid,
                    userid,
                    location,
                },
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_SECRET_KEY!,
                    'Content-Type': 'application/json',
                },
            }
        );

        return NextResponse.json(response.data, { status: 201 });
    } catch (error) {
        console.error('Error voting on report:', error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: error.response?.data?.message || 'Failed to vote on report' },
                { status: error.response?.status || 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to vote on report' },
            { status: 500 }
        );
    }
}
