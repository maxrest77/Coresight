import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        organ: 'pancreas',
        status: 'active',
        riskScore: 5,
        lastAssessment: new Date().toISOString()
    });
}
