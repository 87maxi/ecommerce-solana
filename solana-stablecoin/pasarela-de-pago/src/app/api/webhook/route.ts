import { NextRequest, NextResponse } from "next/server";
import { mintTokens } from "@/lib/contracts";
import { orders } from "@/lib/orderStorage";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY!);

/**
 * Webhook de Stripe para procesar eventos de pago
 * Este endpoint recibe notificaciones cuando un pago es exitoso
 * y llama a compra-stablecoin para mintear los tokens
 */
export async function POST(request: NextRequest) {
  console.log("[WEBHOOK] Received a request.");
  try {
    const sig = request.headers.get("stripe-signature");
    const payload = await request.text();

    console.log("[WEBHOOK] Payload received, checking signature...");

    if (!sig) {
      console.error("[WEBHOOK] Missing Stripe signature");
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 },
      );
    }

    // Verificar la firma del webhook de Stripe
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
      console.log(`[WEBHOOK] Signature verified. Event type: ${event.type}`);
    } catch (err: any) {
      console.error(
        "[WEBHOOK] Error verifying webhook signature:",
        err.message,
      );
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 },
      );
    }

    console.log(`[WEBHOOK] Processing event: ${event.type}`);

    // Procesar evento de pago exitoso
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { walletAddress, invoice } = paymentIntent.metadata;
      const amount = paymentIntent.amount / 100; // Convertir de céntimos a euros

      console.log("[WEBHOOK] Payment succeeded event details:", {
        paymentIntentId: paymentIntent.id,
        walletAddress,
        amount,
        invoice,
      });

      // Buscar la orden correspondiente por paymentIntentId primero
      let orderToUpdate = orders.get(paymentIntent.id);
      console.log(
        `[WEBHOOK] Order lookup by paymentIntentId (${paymentIntent.id}): ${orderToUpdate ? "Found" : "Not found"}`,
      );

      // Fallback: buscar por invoice y wallet si no se encuentra por ID
      if (!orderToUpdate) {
        console.log(
          "[WEBHOOK] Order not found by paymentIntentId, searching by invoice/wallet...",
        );
        for (const [orderId, order] of orders.entries()) {
          if (
            order.buyerAddress.toLowerCase() === walletAddress.toLowerCase() &&
            order.invoice === invoice
          ) {
            orderToUpdate = order;
            break;
          }
        }
        console.log(
          `[WEBHOOK] Order lookup by invoice/wallet: ${orderToUpdate ? "Found" : "Not found"}`,
        );
      }

      if (!orderToUpdate) {
        console.error("[WEBHOOK] No order found for payment:", {
          paymentIntentId: paymentIntent.id,
          walletAddress,
          amount,
          invoice,
        });
        return NextResponse.json({
          received: true,
          error: "Order not found",
        });
      }

      console.log("[WEBHOOK] Order found for minting:", orderToUpdate.orderId);

      // Llamar a la función local para mintear tokens
      console.log("[WEBHOOK] Calling local mintTokens function for Solana...");

      try {
        const mintResult = await mintTokens(walletAddress, amount, invoice);

        console.log(
          "[WEBHOOK] Tokens minted successfully! Result:",
          mintResult,
        );

        // Guardar transaction hash en metadata (opcional, para futuras referencias)
        const transactionHash = mintResult.transactionHash;

        // Actualizar la orden con el hash de transacción y estado
        if (orderToUpdate) {
          orderToUpdate.status = "completed";
          orderToUpdate.txHash = transactionHash;
          orderToUpdate.completedAt = new Date();
          orders.set(orderToUpdate.orderId, orderToUpdate);
          console.log(
            "[WEBHOOK] Order updated with transaction hash:",
            orderToUpdate.orderId,
            transactionHash,
          );
        }

        console.log("[WEBHOOK] Responding with success.");
        return NextResponse.json({
          received: true,
          success: true,
          transactionHash,
          message: "Payment processed and tokens minted",
        });
      } catch (mintError: any) {
        console.error("[WEBHOOK] Exception calling mintTokens:", mintError);
        return NextResponse.json({
          received: true,
          mintError: mintError.message || "Failed to mint tokens",
        });
      }
    }

    // Otros tipos de eventos
    console.log("[WEBHOOK] Event type not handled:", event.type);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[WEBHOOK] Unexpected error in handler:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 },
    );
  }
}
