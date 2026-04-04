import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
    try {
        const { reportid, userid, location, action } = await request.json();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiKey =
            process.env.API_SECRET_KEY ||
            process.env.NEXT_PUBLIC_SECRET_KEY ||
            process.env.NEXT_PUBLIC_API_KEY;

        if (!reportid || !userid || !location) {
            return NextResponse.json(
                { error: 'Missing required fields: reportid, userid, location' },
                { status: 400 }
            );
        }

        if (!apiBaseUrl) {
            return NextResponse.json(
                { error: 'Backend API URL is not configured' },
                { status: 500 }
            );
        }

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Backend API key is not configured' },
                { status: 500 }
            );
        }

        const normalizedAction = action === 'unvote' ? 'unvote' : 'vote';
        const targetPath = normalizedAction === 'unvote' ? 'unvote' : 'vote';

        const response = await axios.post(
            `${apiBaseUrl}/user_reports/${targetPath}`,
            null,
            {
                params: {
                    reportid,
                    userid,
                    location,
                },
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        return NextResponse.json(response.data, {
            status: normalizedAction === 'unvote' ? 200 : 201,
        });
    } catch (error) {
        console.error('Error voting on report:', error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error:
                        error.response?.data?.detail ||
                        error.response?.data?.message ||
                        'Failed to update vote on report',
                },
                { status: error.response?.status || 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update vote on report' },
            { status: 500 }
        );
    }
}
