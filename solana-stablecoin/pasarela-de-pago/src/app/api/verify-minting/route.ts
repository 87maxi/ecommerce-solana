import { NextRequest, NextResponse } from "next/server";
import { orders } from "@/lib/orderStorage"; // We'll keep this for a fallback, but prioritize Stripe API
import { mintTokens } from "@/lib/contracts";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Endpoint to verify if tokens were successfully minted.
 * This has been refactored to fetch the payment status directly from the Stripe API,
 * which is more reliable than in-memory storage.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("payment_intent");

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, error: "Payment Intent ID is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    console.log(
      `[VERIFY-MINTING] Verifying payment_intent: ${paymentIntentId}`,
    );

    // Primary source of truth: Stripe API
    try {
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === "succeeded") {
        // If payment succeeded, check our in-memory store for minting details.
        // In a production app, this would query a database.
        const order = orders.get(paymentIntentId);

        if (order && order.status === "completed") {
          console.log("[VERIFY-MINTING] Order found and completed in storage.");
          return NextResponse.json(
            {
              success: true,
              status: order.status,
              txHash: order.txHash,
              amount: order.tokenAmount,
              walletAddress: order.buyerAddress,
              invoice: order.invoice,
            },
            { headers: corsHeaders },
          );
        } else {
          // SELF-HEALING LOGIC: Payment succeeded in Stripe but minting hasn't been recorded.
          // This usually happens if the webhook failed or was delayed.
          console.warn(
            `[VERIFY-MINTING] Payment succeeded for ${paymentIntentId}, but minting not found in storage. Triggering manual minting...`,
          );

          const { walletAddress, invoice } = paymentIntent.metadata;
          const amount = paymentIntent.amount / 100;

          if (!walletAddress) {
            console.error("[VERIFY-MINTING] Missing walletAddress in metadata");
            return NextResponse.json(
              { success: false, error: "Missing metadata for minting" },
              { status: 500, headers: corsHeaders },
            );
          }

          try {
            // Trigger minting immediately
            const mintResult = await mintTokens(
              walletAddress,
              amount,
              invoice || "Manual-Verification",
            );
            console.log(
              `[VERIFY-MINTING] Manual minting successful: ${mintResult.transactionHash}`,
            );

            // Update local storage so subsequent calls find it
            const completedOrder = {
              orderId: paymentIntentId,
              buyerAddress: walletAddress,
              tokenAmount: amount,
              invoice: invoice || "Manual-Verification",
              status: "completed" as const,
              txHash: mintResult.transactionHash,
              createdAt: order?.createdAt || new Date(),
              completedAt: new Date(),
              expiresAt:
                order?.expiresAt || new Date(Date.now() + 5 * 60 * 1000),
            };
            orders.set(paymentIntentId, completedOrder);

            return NextResponse.json(
              {
                success: true,
                status: "completed",
                txHash: mintResult.transactionHash,
                amount: amount,
                walletAddress: walletAddress,
                invoice: invoice,
                note: "Minting triggered by verification (webhook fallback)",
              },
              { headers: corsHeaders },
            );
          } catch (mintError: any) {
            console.error(
              "[VERIFY-MINTING] Failed to trigger manual minting:",
              mintError,
            );
            return NextResponse.json(
              {
                success: false,
                status: "failed_minting",
                error: mintError.message,
              },
              { status: 500, headers: corsHeaders },
            );
          }
        }
      } else {
        // Payment has not succeeded yet
        console.warn(
          `[VERIFY-MINTING] Payment intent ${paymentIntentId} not succeeded yet. Status: ${paymentIntent.status}`,
        );
        return NextResponse.json(
          {
            success: false,
            status: paymentIntent.status,
          },
          { headers: corsHeaders },
        );
      }
    } catch (stripeError: any) {
      console.error(
        `[VERIFY-MINTING] Stripe API error for ${paymentIntentId}:`,
        stripeError,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Stripe API error",
          details: stripeError.message,
        },
        { status: 500, headers: corsHeaders },
      );
    }
  } catch (error: any) {
    console.error("[VERIFY-MINTING] General error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error verifying minting",
        details: error.message,
      },
      { status: 500, headers: corsHeaders },
    );
  }
}
