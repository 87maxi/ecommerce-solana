'use client';

import { useState, useEffect } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';
import { useEuroTokenBalance } from '@/hooks/useEuroTokenBalance';
import { Package, Calendar, Clock, CheckCircle2, Truck, ArrowRight, Loader2, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  product: {
    name: string;
    price: string;
    image: string;
  };
  quantity: number;
}

interface Order {
  id: number;
  date: string;
  total: string;
  status: 'Pending' | 'Shipped' | 'Delivered';
  items: {
    product: {
      name: string;
      price: string;
      image: string;
    };
    quantity: number;
  }[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { getCustomerInvoices } = useContract();
  const { isConnected, account } = useWallet();
  const { balance, loading: balanceLoading, error: balanceError } = useEuroTokenBalance();

  useEffect(() => {
    const fetchOrders = async () => {
      if (isConnected && account) {
        try {
          // Get invoices for this customer
          const invoices = await getCustomerInvoices(account);

          const fetchedOrders = invoices.map((invoice: any) => {
            return {
              id: invoice.id,
              date: invoice.timestamp,
              total: invoice.totalAmount,
              status: (invoice.isPaid ? 'Delivered' : 'Pending') as 'Pending' | 'Shipped' | 'Delivered',
              items: invoice.items.map((item: any) => ({
                product: {
                  name: item.productName,
                  price: item.unitPrice,
                  image: "/placeholder-product.jpg" // Image not available in invoice items
                },
                quantity: item.quantity
              }))
            };
          });

          setOrders(fetchedOrders);
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      } else {
        setOrders([]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [getCustomerInvoices, isConnected, account]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 font-display text-foreground">Order History</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-xl"></div>
          <div className="h-48 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4 font-display text-foreground">No orders yet</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          You haven't placed any orders yet. Start shopping to see your order history here.
        </p>
        <a
          href="/products"
          className={cn(
            "inline-flex items-center gap-2 px-8 py-3 rounded-full",
            "bg-primary text-primary-foreground font-semibold",
            "hover:bg-primary/90 transition-all duration-200 hover:scale-105",
            "shadow-lg shadow-primary/25"
          )}
        >
          Start Shopping
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold font-display text-foreground">Order History</h1>

        {/* Display EURT balance when connected */}
        {isConnected && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-secondary/50 backdrop-blur-sm border border-border/50",
            "text-sm font-medium text-foreground"
          )}>
            {balanceLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : balanceError ? (
              <span className="text-destructive">{balanceError}</span>
            ) : (
              <>
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-bold">{balance} EURT</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className={cn(
              "bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6",
              "hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            )}
          >
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-border/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">Order #{order.id}</h2>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                    order.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-green-500/10 text-green-500'
                  )}>
                    {order.status === 'Pending' && <Clock className="w-3 h-3" />}
                    {order.status === 'Shipped' && <Truck className="w-3 h-3" />}
                    {order.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {order.date}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-primary">{order.total} EURT</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-xl bg-secondary/20 border border-border/50"
                >
                  <div className="w-12 h-12 rounded-lg bg-background overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.product.image && item.product.image !== "/placeholder-product.jpg" ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>

                  <p className="font-semibold text-foreground">
                    {(parseFloat(item.product.price) * item.quantity).toFixed(2)} EURT
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}