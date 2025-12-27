"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Loader2, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  isPaid: boolean;
  total: number;
  subtotal?: number;
  shipping?: number;
  walletAmountUsed?: number;
  promoDiscount?: number;
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
  const [isRetrying, setIsRetrying] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const fetchOrderStatus = useCallback(async (): Promise<OrderDetails | null> => {
    if (!orderId) return null;
    
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.order) {
          return data.order;
        }
      }
    } catch (err) {
      console.error("Error fetching order status:", err);
    }
    return null;
  }, [orderId]);

  const verifyPayment = useCallback(async () => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // Try for up to 30 seconds
    const pollInterval = 1000; // Check every 1 second

    const pollOrderStatus = async (): Promise<OrderDetails | null> => {
      const orderData = await fetchOrderStatus();
      
      if (orderData) {
        setPollCount(attempts + 1);
        
        // Check if payment is completed
        if (orderData.isPaid && orderData.paymentStatus === 'COMPLETED') {
          return orderData;
        }
        
        // Check if payment failed
        if (orderData.paymentStatus === 'FAILED' || orderData.status === 'CANCELLED') {
          setError(`Payment was declined or cancelled. Status: ${orderData.paymentStatus}. Please try again with a different payment method.`);
          setOrder(orderData);
          return null;
        }
        
        // Keep polling if we haven't exceeded max attempts
        if (attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return pollOrderStatus();
        }
        
        // Timeout - but still show the order info
        return orderData;
      }
      
      return null;
    };

    try {
      const orderData = await pollOrderStatus();
      if (orderData) {
        setOrder(orderData);
        // Clear cart on successful payment
        if (orderData.isPaid && orderData.paymentStatus === 'COMPLETED') {
          clearCart();
        } else if (!error) {
          // Payment not completed after polling
          setError("Payment verification timeout. Your payment may still be processing. Click 'Check Again' to refresh status.");
        }
      } else if (!error) {
        setError("Could not verify payment. Please check your orders page or contact support.");
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      if (!error) {
        setError("An error occurred while verifying your payment. Please check your orders page.");
      }
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [orderId, clearCart, fetchOrderStatus]);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetched) return;
    verifyPayment();
  }, [hasFetched, verifyPayment]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    
    try {
      const orderData = await fetchOrderStatus();
      if (orderData) {
        setOrder(orderData);
        if (orderData.isPaid && orderData.paymentStatus === 'COMPLETED') {
          clearCart();
          setError(null);
        } else if (orderData.paymentStatus === 'FAILED' || orderData.status === 'CANCELLED') {
          setError(`Payment was declined. Status: ${orderData.paymentStatus}. Please try again.`);
        } else {
          setError("Payment still processing. Please wait a moment and try again.");
        }
      }
    } catch (err) {
      setError("Failed to check payment status. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-[120px] sm:pt-[124px] xl:pt-[124px]">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-brand-teal mb-4" />
              <p className="text-lg text-muted-foreground">Verifying your payment...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Checking payment status ({pollCount}/30)...
              </p>
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
      <main className="min-h-screen bg-background pt-[120px] sm:pt-[124px] xl:pt-[124px]">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-brand-h1 font-headline text-brand-blue mb-8 text-center">
            Checkout Status
          </h1>

          {/* Payment failed/declined state */}
          {order && (order.paymentStatus === 'FAILED' || order.status === 'CANCELLED') ? (
            <div className="max-w-2xl mx-auto text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                Payment Declined
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                Your payment could not be processed.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
                <p className="text-red-800 font-medium mb-2">Possible reasons:</p>
                <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                  <li>Insufficient funds in your account</li>
                  <li>Card expired or invalid</li>
                  <li>Card issuer declined the transaction</li>
                  <li>Incorrect card details</li>
                </ul>
              </div>
              <div className="flex gap-4 justify-center">
                <Link href="/checkout">
                  <Button className="bg-brand-teal hover:bg-brand-teal/90">
                    Try Again
                  </Button>
                </Link>
                <Link href="/account?tab=orders">
                  <Button variant="outline">View My Orders</Button>
                </Link>
              </div>
            </div>
          ) : error && (!order || !order.isPaid) ? (
            <div className="max-w-2xl mx-auto text-center">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                Payment Verification Pending
              </h2>
              <p className="text-lg text-muted-foreground mb-4">{error}</p>
              
              {order && (
                <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-medium mb-2">Order: {order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="font-medium">{order.status}</span> • 
                    Payment: <span className="font-medium">{order.paymentStatus}</span>
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 justify-center flex-wrap">
                <Button 
                  onClick={handleRetry} 
                  disabled={isRetrying}
                  className="bg-brand-teal hover:bg-brand-teal/90"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Again
                    </>
                  )}
                </Button>
                <Link href="/checkout">
                  <Button variant="outline">Try Again</Button>
                </Link>
                <Link href="/account?tab=orders">
                  <Button variant="outline">View My Orders</Button>
                </Link>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                If you were charged but see this message, please contact support with your order details.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Success Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-brand-h2 font-headline text-brand-blue mb-2">
                  Payment Successful!
                </h2>
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
                    
                    {/* Price Breakdown */}
                    <div className="pt-4 border-t mt-4 space-y-2">
                      {order.subtotal && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>€{order.subtotal.toFixed(2)}</span>
                        </div>
                      )}
                      {order.shipping !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{order.shipping === 0 ? 'Free' : `€${order.shipping.toFixed(2)}`}</span>
                        </div>
                      )}
                      {order.promoDiscount && order.promoDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Promo Discount</span>
                          <span>-€{order.promoDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {order.walletAmountUsed && order.walletAmountUsed > 0 && (
                        <div className="flex justify-between text-sm text-blue-600">
                          <span>Wallet Applied</span>
                          <span>-€{order.walletAmountUsed.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <p className="text-lg font-bold">Total Paid</p>
                        <p className="text-lg font-bold text-brand-teal">
                          €{order.total.toFixed(2)}
                        </p>
                      </div>
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

                  {/* Success Status */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        Payment Confirmed ✓
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      Your payment has been confirmed. Your order is now being processed and will be shipped soon.
                    </p>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-600">
                        Payment Status: <span className="font-semibold">COMPLETED</span> • 
                        Order Status: <span className="font-semibold">{order.status}</span>
                      </p>
                    </div>
                  </div>
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
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
