import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        organ: 'liver',
        status: 'active',
        riskScore: 12,
        lastAssessment: new Date().toISOString()
    });
}
