import { NextRequest, NextResponse } from 'next/server';
import { orders } from '@/lib/orderStorage';

/**
 * Endpoint para verificar si los tokens fueron minteados exitosamente
 * Basado en invoice ID y dirección de wallet
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const invoice = searchParams.get('invoice');
        const wallet = searchParams.get('wallet');

        if (!invoice && !wallet) {
            return NextResponse.json(
                { error: 'Se requiere invoice o wallet para verificar' },
                { status: 400 }
            );
        }

        console.log('[VERIFY-MINTING] Verificando mint para:', { invoice, wallet });

        // Buscar en todas las órdenes
        let mintedOrder = null;
        
        for (const [orderId, order] of orders.entries()) {
            const matchesInvoice = invoice && order.invoice === invoice;
            const matchesWallet = wallet && order.buyerAddress.toLowerCase() === wallet.toLowerCase();
            
            if (matchesInvoice || matchesWallet) {
                mintedOrder = order;
                break;
            }
        }

        if (!mintedOrder) {
            console.log('[VERIFY-MINTING] Orden no encontrada');
            return NextResponse.json({
                minted: false,
                message: 'Orden no encontrada'
            });
        }

        console.log('[VERIFY-MINTING] Orden encontrada:', {
            orderId: mintedOrder.orderId,
            status: mintedOrder.status,
            txHash: mintedOrder.txHash
        });

        return NextResponse.json({
            minted: mintedOrder.status === 'completed',
            status: mintedOrder.status,
            txHash: mintedOrder.txHash,
            amount: mintedOrder.tokenAmount,
            wallet: mintedOrder.buyerAddress,
            invoice: mintedOrder.invoice,
            timestamp: mintedOrder.completedAt
        });

    } catch (error: any) {
        console.error('[VERIFY-MINTING] Error:', error);
        return NextResponse.json(
            { 
                error: 'Error al verificar minting',
                details: error.message 
            },
            { status: 500 }
        );
    }
}