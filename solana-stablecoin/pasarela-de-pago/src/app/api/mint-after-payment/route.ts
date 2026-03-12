import { NextRequest, NextResponse } from 'next/server';
import { mintTokens } from '@/lib/contracts';
import { orders } from '@/lib/orderStorage';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!);

/**
 * API Endpoint para mintear tokens después de confirmar el pago
 * Este endpoint se llama desde el cliente después de que Stripe confirma el pago
 * 
 * Request Body:
 * {
 *   paymentIntentId: string
 * }
 */
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // En producción debería ser específico
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentIntentId } = body;

        if (!paymentIntentId) {
            console.error('[MINT-AFTER-PAYMENT] Missing paymentIntentId');
            return NextResponse.json(
                { error: 'Missing paymentIntentId' },
                { status: 400, headers: corsHeaders }
            );
        }

        console.log('[MINT-AFTER-PAYMENT] Processing mint for payment:', paymentIntentId);

        // Verificar el estado del pago en Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            console.error('[MINT-AFTER-PAYMENT] Payment not succeeded:', paymentIntent.status);
            return NextResponse.json(
                { error: 'Payment not succeeded', status: paymentIntent.status },
                { status: 400, headers: corsHeaders }
            );
        }

        const { walletAddress, invoice } = paymentIntent.metadata;
        const amount = paymentIntent.amount / 100; // Convertir de céntimos a euros

        console.log('[MINT-AFTER-PAYMENT] Payment verified:', {
            paymentIntentId,
            walletAddress,
            amount,
            invoice
        });

        // Buscar la orden
        let order = orders.get(paymentIntentId);

        if (!order) {
            // Fallback: buscar por invoice y wallet
            console.log('[MINT-AFTER-PAYMENT] Order not found by ID, searching by invoice/wallet...');
            for (const [orderId, o] of orders.entries()) {
                if (o.buyerAddress.toLowerCase() === walletAddress.toLowerCase() &&
                    o.invoice === invoice) {
                    order = o;
                    break;
                }
            }
        }

        if (!order) {
            console.error('[MINT-AFTER-PAYMENT] No order found for payment:', {
                paymentIntentId,
                walletAddress,
                invoice
            });
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Verificar si ya se minteó
        if (order.status === 'completed' && order.txHash) {
            console.log('[MINT-AFTER-PAYMENT] Tokens already minted:', order.txHash);
            return NextResponse.json({
                success: true,
                alreadyMinted: true,
                transactionHash: order.txHash,
                message: 'Tokens were already minted'
            }, { headers: corsHeaders });
        }

        // Mintear los tokens
        console.log('[MINT-AFTER-PAYMENT] Calling mintTokens...');
        try {
            const mintResult = await mintTokens(walletAddress, amount, invoice);

            console.log('[MINT-AFTER-PAYMENT] Tokens minted successfully:', mintResult);

            // Actualizar la orden
            order.status = 'completed';
            order.txHash = mintResult.transactionHash;
            order.completedAt = new Date();
            orders.set(order.orderId, order);

            console.log('[MINT-AFTER-PAYMENT] Order updated:', order.orderId);

            return NextResponse.json({
                success: true,
                transactionHash: mintResult.transactionHash,
                amount: mintResult.amount,
                message: 'Tokens minted successfully'
            }, { headers: corsHeaders });

        } catch (mintError: any) {
            console.error('[MINT-AFTER-PAYMENT] Error minting tokens:', mintError);
            return NextResponse.json(
                { error: 'Failed to mint tokens', details: mintError.message },
                { status: 500, headers: corsHeaders }
            );
        }

    } catch (error: any) {
        console.error('[MINT-AFTER-PAYMENT] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500, headers: corsHeaders }
        );
    }
}
