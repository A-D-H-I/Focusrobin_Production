"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Loader2, XCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  isPaid: boolean;
  total: number;
  currency: string;
  items: {
    productName: string;
    variantName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
  };
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { clearCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetched) return;

    async function verifyPayment() {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      let attempts = 0;
      const maxAttempts = 10; // Try for up to 10 seconds
      const pollInterval = 1000; // Check every 1 second

      const pollOrderStatus = async (): Promise<OrderDetails | null> => {
        try {
          // First, try to sync with Stripe if webhook hasn't fired
          if (attempts === 0) {
            try {
              const syncResponse = await fetch('/api/orders/sync-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
              });
              if (syncResponse.ok) {
                const syncData = await syncResponse.json();
                console.log('[Success Page] Sync result:', syncData);
              }
            } catch (syncErr) {
              console.error('[Success Page] Sync error:', syncErr);
            }
          }

          const response = await fetch(`/api/orders/${orderId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.order) {
              // If payment is completed or order is confirmed, we're done
              if (data.order.paymentStatus === 'COMPLETED' || data.order.status === 'CONFIRMED' || data.order.isPaid) {
                return data.order;
              }
              // Otherwise, keep polling if we haven't exceeded max attempts
              if (attempts < maxAttempts) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                return pollOrderStatus();
              }
              // If we've tried enough times, return what we have
              return data.order;
            }
          }
        } catch (err) {
          console.error("Error polling order status:", err);
        }
        return null;
      };

      try {
        const orderData = await pollOrderStatus();
        if (orderData) {
          setOrder(orderData);
          // Clear cart on successful payment
          clearCart();
        } else {
          setError("Failed to verify payment status");
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError("An error occurred while verifying your payment");
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    }

    verifyPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-24">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-brand-teal mb-4" />
              <p className="text-lg text-muted-foreground">Verifying your payment...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-24">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold font-headline text-brand-blue mb-4">
                Payment Verification Failed
              </h1>
              <p className="text-lg text-muted-foreground mb-8">{error}</p>
              <div className="flex gap-4 justify-center">
                <Link href="/checkout">
                  <Button variant="outline">Try Again</Button>
                </Link>
                <Link href="/account?tab=orders">
                  <Button>View My Orders</Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold font-headline text-brand-blue mb-2">
                Payment Successful!
              </h1>
              <p className="text-lg text-muted-foreground">
                Thank you for your order. We've sent a confirmation email to your inbox.
              </p>
            </div>

            {order && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order {order.orderNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b last:border-0"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.variantName} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">€{item.total.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                      <p className="text-lg font-bold">Total</p>
                      <p className="text-lg font-bold text-brand-teal">
                        €{order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold mb-3">Shipping Address</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium">{order.shippingAddress.name}</p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.addressLine1}
                      </p>
                      {order.shippingAddress.addressLine2 && (
                        <p className="text-muted-foreground">
                          {order.shippingAddress.addressLine2}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {order.shippingAddress.city}
                        {order.shippingAddress.state && `, ${order.shippingAddress.state}`}{" "}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.country}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  {order.paymentStatus === 'COMPLETED' || order.isPaid || order.status === 'CONFIRMED' ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Payment Successful ✓
                        </span>
                      </div>
                      <p className="text-sm text-green-700">
                        Your payment has been confirmed. Your order is now being processed and will be shipped soon.
                      </p>
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-green-600">
                          Payment Status: <span className="font-semibold">COMPLETED</span> • 
                          Order Status: <span className="font-semibold">Being Processed</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                        <span className="font-medium text-yellow-800">
                          Processing Payment...
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        We're confirming your payment. This usually takes just a few seconds. Please wait...
                      </p>
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="text-xs text-yellow-600">
                          Payment Status: <span className="font-semibold">{order.paymentStatus}</span> • 
                          Order Status: <span className="font-semibold">{order.status}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/account?tab=orders">
                <Button size="lg" className="w-full sm:w-auto">
                  View My Orders
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

