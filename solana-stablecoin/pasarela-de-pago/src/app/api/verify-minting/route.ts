import { NextRequest, NextResponse } from "next/server";
import { orders } from "@/lib/orderStorage"; // We'll keep this for a fallback, but prioritize Stripe API

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
          // Payment succeeded but minting might be delayed (webhook processing)
          console.log(
            "[VERIFY-MINTING] Payment succeeded, but minting not yet completed in storage. Status:",
            order?.status,
          );
          return NextResponse.json(
            { success: false, status: "processing" },
            { headers: corsHeaders },
          );
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
