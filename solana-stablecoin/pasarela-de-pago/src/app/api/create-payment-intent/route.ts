import { NextRequest, NextResponse } from 'next/server';
import { orders } from '@/lib/orderStorage';
import { CreatePaymentIntentRequest, CreatePaymentIntentResponse } from '@/types';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!);

/**
 * API Endpoint para crear Payment Intent de Stripe
 * 
 * Request Body:
 * {
 *   amount: number,
 *   walletAddress: string,
 *   invoice: string
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
        const body: CreatePaymentIntentRequest = await request.json();
        const { amount, walletAddress, invoice } = body;

        // Validar campos requeridos
        if (!amount || !walletAddress || !invoice) {
            console.error('[CREATE-PAYMENT-INTENT] Missing required fields:', { amount, walletAddress, invoice });
            return NextResponse.json(
                { error: 'Missing required fields: amount, walletAddress, invoice' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Validar que amount sea un número positivo
        const amountNum = parseFloat(amount.toString());
        if (isNaN(amountNum) || amountNum <= 0) {
            console.error('[CREATE-PAYMENT-INTENT] Invalid amount:', amount);
            return NextResponse.json(
                { error: 'Amount must be a positive number' },
                { status: 400, headers: corsHeaders }
            );
        }

        console.log('[CREATE-PAYMENT-INTENT] Creating payment intent:', {
            amount: amountNum,
            walletAddress,
            invoice
        });

        // Crear Payment Intent en Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amountNum * 100), // Convertir a céntimos
            currency: 'eur',
            metadata: {
                walletAddress,
                invoice,
                timestamp: new Date().toISOString()
            },
            // Configurar para recibir webhook después del pago
            automatic_payment_methods: {
                enabled: true,
            },
        });

        console.log('[CREATE-PAYMENT-INTENT] Payment intent created:', {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status
        });

        // Crear orden en orderStorage para que el webhook pueda encontrarla
        const orderId = paymentIntent.id;
        const order = {
            orderId,
            paymentIntentId: paymentIntent.id,
            buyerAddress: walletAddress,
            tokenAmount: amountNum,
            invoice,
            status: 'pending' as const,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            txHash: null,
            completedAt: null
        };

        orders.set(orderId, order);
        console.log('[CREATE-PAYMENT-INTENT] Order created in storage:', orderId);

        const response: CreatePaymentIntentResponse = {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            orderId
        };

        return NextResponse.json(response, { headers: corsHeaders });

    } catch (error: any) {
        console.error('[CREATE-PAYMENT-INTENT] Error:', error);
        return NextResponse.json(
            { error: 'Error al crear el intento de pago', details: error.message },
            { status: 500, headers: corsHeaders }
        );
    }
}