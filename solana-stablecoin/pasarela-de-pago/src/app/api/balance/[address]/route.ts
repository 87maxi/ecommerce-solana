import { NextRequest, NextResponse } from 'next/server';
import { getBalance } from '@/lib/contracts';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    try {
        const { address } = await params;

        if (!address) {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        const balance = await getBalance(address);

        return NextResponse.json({
            address,
            balance
        });

    } catch (error: any) {
        console.error('[BALANCE] Error fetching balance:', error);
        return NextResponse.json(
            { error: 'Failed to fetch balance', details: error.message },
            { status: 500 }
        );
    }
}
