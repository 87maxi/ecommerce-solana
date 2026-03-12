import { Order } from '@/types';

// Shared in-memory order storage with proper typing
// In production, replace with a database
export const orders = new Map<string, Order>();

// Cleanup expired orders periodically
setInterval(() => {
  const now = new Date();
  let cleanedUp = 0;
  
  for (const [orderId, order] of orders.entries()) {
    if (now > order.expiresAt && order.status === 'pending') {
      order.status = 'expired';
      orders.set(orderId, order);
      cleanedUp++;
    }
  }
  
  if (cleanedUp > 0) {
    console.log(`[ORDER-STORAGE] Cleaned up ${cleanedUp} expired orders`);
  }
}, 60000); // Run every minute