// Define the structure for an order in our system
export interface Order {
  orderId: string; // Corresponds to paymentIntentId
  buyerAddress: string;
  tokenAmount: number;
  invoice: string;
  status: "processing" | "completed" | "expired" | "failed";
  txHash: string | null;
  createdAt: Date;
  completedAt: Date | null;
  expiresAt: Date;
}

/**
 * Shared in-memory order storage.
 *
 * In a serverless environment, this is NOT reliable as memory is not persisted
 * between function invocations. It works for local development where the server
 * process is long-running.
 *
 * In the refactored logic, this serves as a temporary cache for the minting status,
 * while the Stripe API is the primary source of truth for payment status.
 *
 * For a production environment, this should be replaced with a persistent database
 * like Turso, Redis, or a traditional SQL/NoSQL database.
 */
export const orders = new Map<string, Order>();

// Optional: A simple cleanup mechanism for old orders to prevent memory leaks in a long-running dev server.
setInterval(() => {
  const now = new Date();
  let cleanedUp = 0;

  for (const [orderId, order] of orders.entries()) {
    // Clean up very old completed or expired orders
    if (order.status === 'completed' || order.status === 'expired') {
      const timeSinceCreation = now.getTime() - order.createdAt.getTime();
      if (timeSinceCreation > 10 * 60 * 1000) { // 10 minutes
        orders.delete(orderId);
        cleanedUp++;
      }
    }
  }

  if (cleanedUp > 0) {
    console.log(`[ORDER-STORAGE] Cleaned up ${cleanedUp} old orders from memory.`);
  }
}, 5 * 60 * 1000); // Run every 5 minutes
