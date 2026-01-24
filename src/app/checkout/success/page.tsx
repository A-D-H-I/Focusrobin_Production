"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Loader2, XCircle, RefreshCw, AlertTriangle, Download } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getDeliveryTime } from "@/lib/delivery-time";
import { trackPurchase } from "@/components/analytics/MetaPixel";
import { trackGA4Purchase } from "@/components/analytics/GoogleAnalytics";

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
    id: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
    prescriptionData?: any;
    hasPrescription?: boolean;
    productSlug?: string | null;
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
  const paypalToken = searchParams.get("token"); // PayPal includes token in return URL
  const { clearCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [hasRefundedWallet, setHasRefundedWallet] = useState(false);
  const [isCapturingPayPal, setIsCapturingPayPal] = useState(false);
  const hasTrackedPurchase = useRef(false);

  // Helper function to refund wallet for failed order
  const refundWalletForFailedOrder = useCallback(async (orderId: string) => {
    if (hasRefundedWallet) {
      console.log('[CheckoutSuccess] Wallet already refunded, skipping...');
      return;
    }

    try {
      const response = await fetch('/api/checkout/refund-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.refunded > 0) {
          console.log('[CheckoutSuccess] Wallet refunded:', data.refunded);
          setHasRefundedWallet(true);
        }
      }
    } catch (err) {
      console.error('[CheckoutSuccess] Error refunding wallet:', err);
    }
  }, [hasRefundedWallet]);

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
          
          // Refund wallet if payment failed and wallet was used
          if (orderData.walletAmountUsed && orderData.walletAmountUsed > 0 && orderId) {
            console.log('[CheckoutSuccess] Payment failed, refunding wallet...');
            refundWalletForFailedOrder(orderId);
          }
          
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
          // Track Purchase event with Meta Pixel and GA4 (only once)
          if (!hasTrackedPurchase.current) {
            hasTrackedPurchase.current = true;
            try {
              const contents = orderData.items.map((item) => ({
                id: item.sku || item.id,
                quantity: item.quantity,
              }));
              
              // Meta Pixel
              trackPurchase(orderData.orderNumber, orderData.total, orderData.currency || 'EUR', contents);
              
              // GA4
              const ga4Items = orderData.items.map((item) => ({
                item_id: item.sku || item.id,
                item_name: item.productName,
                price: item.price,
                quantity: item.quantity,
              }));
              
              trackGA4Purchase({
                transaction_id: orderData.orderNumber,
                value: orderData.total,
                currency: orderData.currency || 'EUR',
                items: ga4Items,
              });
            } catch (trackError) {
              console.error('[CheckoutSuccess] Analytics tracking error:', trackError);
            }
          }
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

  // Handle PayPal return - capture the payment
  const capturePayPalPayment = useCallback(async () => {
    // Check for pending PayPal order in session storage
    const pendingOrderJson = sessionStorage.getItem('pendingPayPalOrder');
    if (!pendingOrderJson) {
      console.log('[CheckoutSuccess] No pending PayPal order found');
      return null;
    }

    const pendingOrder = JSON.parse(pendingOrderJson);
    console.log('[CheckoutSuccess] Capturing PayPal order:', pendingOrder);

    setIsCapturingPayPal(true);

    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId: pendingOrder.paypalOrderId,
          orderId: pendingOrder.orderId,
        }),
      });

      const result = await response.json();

      // Clear the pending order from session storage
      sessionStorage.removeItem('pendingPayPalOrder');

      if (response.ok && result.success) {
        console.log('[CheckoutSuccess] PayPal payment captured successfully');
        return result.orderId;
      } else {
        console.error('[CheckoutSuccess] PayPal capture failed:', result);
        setError(result.error || 'Failed to capture PayPal payment');
        
        // Refund wallet if payment failed and wallet was used
        if (pendingOrder.orderId) {
          console.log('[CheckoutSuccess] PayPal capture failed, refunding wallet...');
          refundWalletForFailedOrder(pendingOrder.orderId);
        }
        
        return null;
      }
    } catch (err: any) {
      console.error('[CheckoutSuccess] Error capturing PayPal payment:', err);
      setError('An error occurred while processing your PayPal payment');
      sessionStorage.removeItem('pendingPayPalOrder');
      return null;
    } finally {
      setIsCapturingPayPal(false);
    }
  }, []);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetched) return;

    const handlePayment = async () => {
      // Check if this is a PayPal return (has token in URL or pending order in session)
      const pendingPayPalOrder = sessionStorage.getItem('pendingPayPalOrder');
      
      if (paypalToken || pendingPayPalOrder) {
        console.log('[CheckoutSuccess] PayPal return detected, capturing payment...');
        const capturedOrderId = await capturePayPalPayment();
        
        if (capturedOrderId) {
          // Update URL with orderId for consistency
          const url = new URL(window.location.href);
          url.searchParams.set('orderId', capturedOrderId);
          url.searchParams.delete('token');
          url.searchParams.delete('PayerID');
          window.history.replaceState({}, '', url.toString());
          
          // Fetch the order details
          try {
            const response = await fetch(`/api/orders/${capturedOrderId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.order) {
                setOrder(data.order);
                clearCart();
                // Track Purchase event with Meta Pixel and GA4 (only once)
                if (!hasTrackedPurchase.current) {
                  hasTrackedPurchase.current = true;
                  try {
                    const contents = data.order.items.map((item: any) => ({
                      id: item.sku || item.id,
                      quantity: item.quantity,
                    }));
                    
                    // Meta Pixel
                    trackPurchase(data.order.orderNumber, data.order.total, data.order.currency || 'EUR', contents);
                    
                    // GA4
                    const ga4Items = data.order.items.map((item: any) => ({
                      item_id: item.sku || item.id,
                      item_name: item.productName,
                      price: item.price,
                      quantity: item.quantity,
                    }));
                    
                    trackGA4Purchase({
                      transaction_id: data.order.orderNumber,
                      value: data.order.total,
                      currency: data.order.currency || 'EUR',
                      items: ga4Items,
                    });
                  } catch (trackError) {
                    console.error('[CheckoutSuccess] Analytics tracking error:', trackError);
                  }
                }
                setLoading(false);
                setHasFetched(true);
                return;
              }
            }
          } catch (err) {
            console.error('[CheckoutSuccess] Error fetching PayPal order:', err);
          }
        } else {
          // Capture failed - check if we need to refund wallet
          // The refund is already handled in capturePayPalPayment, but we should fetch order to show status
          if (pendingPayPalOrder) {
            const pendingOrder = JSON.parse(pendingPayPalOrder);
            try {
              const response = await fetch(`/api/orders/${pendingOrder.orderId}`);
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.order) {
                  setOrder(data.order);
                }
              }
            } catch (err) {
              console.error('[CheckoutSuccess] Error fetching failed PayPal order:', err);
            }
          }
        }
        
        setLoading(false);
        setHasFetched(true);
      } else {
        // Stripe flow - verify payment as before
        verifyPayment();
      }
    };

    handlePayment();
  }, [hasFetched, verifyPayment, paypalToken, capturePayPalPayment, clearCart]);

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
          
          // Refund wallet if payment failed and wallet was used
          if (orderData.walletAmountUsed && orderData.walletAmountUsed > 0 && orderId) {
            console.log('[CheckoutSuccess] Payment failed on retry, refunding wallet...');
            refundWalletForFailedOrder(orderId);
          }
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
              <p className="text-lg text-muted-foreground">
                {isCapturingPayPal ? 'Processing your PayPal payment...' : 'Verifying your payment...'}
              </p>
              {!isCapturingPayPal && (
                <p className="text-sm text-muted-foreground mt-2">
                  Checking payment status ({pollCount}/30)...
                </p>
              )}
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
                          key={item.id || index}
                          className="flex justify-between items-start py-2 border-b last:border-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.variantName} • SKU: {item.sku}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × €{item.price.toFixed(2)} = €{item.total.toFixed(2)}
                            </p>
                            {(item.hasPrescription || item.prescriptionData) && (
                              <a
                                href={`/api/orders/${order.id}/prescription/${item.id}`}
                                download
                                className="inline-flex items-center gap-2 mt-2 text-sm text-brand-teal hover:text-brand-teal/80 font-medium"
                              >
                                <Download className="h-4 w-4" />
                                Download Prescription PDF
                              </a>
                            )}
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
                      {(() => {
                        const deliveryTime = getDeliveryTime(
                          order.items.map((item) => ({
                            prescriptionData: item.prescriptionData,
                            productSlug: item.productSlug,
                          })),
                          order.shippingAddress.country
                        );
                        return (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-semibold text-brand-teal flex items-center gap-1">
                              <span>📦</span>
                              <span>Expected Delivery: {deliveryTime}</span>
                            </p>
                          </div>
                        );
                      })()}
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
                    <p className="text-sm text-green-700 mt-2">
                      We'll send you another email with your tracking ID once your order ships.
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
