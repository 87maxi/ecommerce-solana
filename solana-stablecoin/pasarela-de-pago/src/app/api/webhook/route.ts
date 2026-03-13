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

    console.log(
      "[WEBHOOK] Received headers:",
      Object.fromEntries(request.headers.entries()),
    );
    console.log("[WEBHOOK] Payload received, checking signature...");

    if (!sig) {
      console.error(
        "[WEBHOOK] ❌ Error: Missing Stripe signature. Ensure the webhook is configured correctly in the Stripe Dashboard.",
      );
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 },
      );
    }

    // Verificar la firma del webhook de Stripe
    let event;
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET is not set in .env.local");
      }
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
      console.log(`[WEBHOOK] Signature verified. Event type: ${event.type}`);
    } catch (err: any) {
      console.error(
        "[WEBHOOK] Error verifying webhook signature:",
        err.message,
      );
      console.error(
        "[WEBHOOK] ❌ STRIPE_WEBHOOK_SECRET value:",
        process.env.STRIPE_WEBHOOK_SECRET,
      );
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 },
      );
    }

    console.log(`[WEBHOOK] Processing event: ${event.type}`);

    // Procesar evento de pago exitoso
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { walletAddress, invoice } = paymentIntent.metadata;
      const amount = paymentIntent.amount / 100;

      console.log("[WEBHOOK] ✅ Payment succeeded event details:", {
        paymentIntentId: paymentIntent.id,
        walletAddress,
        amount,
        invoice,
      });

      // Store transaction details in memory
      const orderDetails = {
        orderId: paymentIntent.id,
        buyerAddress: walletAddress,
        tokenAmount: amount,
        invoice,
        status: "processing",
        txHash: null,
        createdAt: new Date(),
        completedAt: null,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Expire in 5 mins
      };
      orders.set(paymentIntent.id, orderDetails);
      console.log(
        `[WEBHOOK] Stored order details in memory for paymentIntentId: ${paymentIntent.id}`,
      );

      console.log("[WEBHOOK] Order found for minting:", paymentIntent.id);

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

        // Update the order with transaction hash and completed status
        const orderToUpdate = orders.get(paymentIntent.id);
        if (orderToUpdate) {
          orderToUpdate.status = "completed";
          orderToUpdate.txHash = transactionHash;
          orderToUpdate.completedAt = new Date();
          orders.set(paymentIntent.id, orderToUpdate);
          console.log(
            `[WEBHOOK] ✅ Order ${paymentIntent.id} completed with txHash: ${transactionHash}`,
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
