"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Info,
  Lock,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import Link from "next/link";
import { createCheckoutSession, refundWalletForOrder, refundPendingOrders } from "@/app/actions/checkout";
import { getAddresses, addAddress, getWalletBalance, getCart } from "@/app/actions/user";
import { Checkbox } from "@/components/ui/checkbox";
import { getShippingProvider, getShippingProviderDisplayName } from "@/lib/shipping-provider";
import { usePrice } from "@/hooks/usePrice";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getDeliveryTime } from "@/lib/delivery-time";
import { trackInitiateCheckout } from "@/components/analytics/MetaPixel";
import { trackGA4BeginCheckout } from "@/components/analytics/GoogleAnalytics";

const SCHENGEN_COUNTRIES = [
  'Austria',
  'Belgium',
  'Croatia',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Italy',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
];

export default function CheckoutPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cartItems, getCartTotal } = useCart();
  const { currency } = useCurrency();
  const { formatPrice, rate, parseEurPrice } = usePrice();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [saveAddress, setSaveAddress] = useState(false); // Option to save new address
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0); // Stored in EUR
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState<number>(0); // Amount to use in EUR
  const [totalCashback, setTotalCashback] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoCodeError, setPromoCodeError] = useState<string>("");
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoCashback, setPromoCashback] = useState<number>(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<{ id: string; code: string } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Ireland",
  });
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const hasTrackedCheckout = useRef(false);

  const subtotal = getCartTotal();
  const shipping = 0; // Free shipping
  // Apply promo discount first, then wallet discount
  const afterPromoDiscount = Math.max(0, subtotal + shipping - promoDiscount);
  const walletDiscount = useWallet ? Math.min(walletAmount, afterPromoDiscount) : 0;
  const total = Math.max(0, afterPromoDiscount - walletDiscount);
  
  // Determine shipping provider based on country (non-editable, auto-set)
  const shippingProvider = getShippingProvider(shippingForm.country);

  // Calculate delivery time based on cart items and selected country
  const deliveryTime = cartItems && cartItems.length > 0 && shippingForm.country
    ? getDeliveryTime(
        cartItems.map((item) => ({
          prescriptionData: item.prescriptionData,
          productSlug: item.product.slug,
        })),
        shippingForm.country
      )
    : null;

  // Handle cancelled payment - refund wallet if needed (for both Stripe and PayPal)
  useEffect(() => {
    const cancelled = searchParams.get('cancelled');
    const orderId = searchParams.get('orderId');
    const paymentMethod = searchParams.get('paymentMethod'); // 'paypal' or null (Stripe)
    
    if (cancelled === 'true' && orderId && session?.user) {
      console.log('[Checkout] Payment cancelled, attempting to refund wallet for order:', orderId, 'paymentMethod:', paymentMethod || 'stripe');
      
      // Clear PayPal pending order from session storage if it exists
      if (paymentMethod === 'paypal') {
        sessionStorage.removeItem('pendingPayPalOrder');
      }
      
      // Refund wallet for the cancelled order
      refundWalletForOrder(orderId)
        .then((result) => {
          if (result.success && result.refunded && result.refunded > 0) {
            toast({
              title: "Wallet Refunded",
              description: `€${result.refunded.toFixed(2)} has been returned to your wallet.`,
            });
            // Reload wallet balance
            loadWalletBalance();
            // Remove query params to clean URL
            router.replace('/checkout', { scroll: false });
          } else if (result.alreadyRefunded) {
            // Already refunded, just reload wallet
            loadWalletBalance();
            router.replace('/checkout', { scroll: false });
          } else if (result.error) {
            console.error('[Checkout] Error refunding wallet:', result.error);
            toast({
              title: "Refund Error",
              description: result.error || "Could not refund wallet. Please contact support.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.error('[Checkout] Exception refunding wallet:', error);
          toast({
            title: "Refund Error",
            description: "An error occurred while refunding your wallet. Please contact support.",
            variant: "destructive",
          });
        });
    }
  }, [searchParams, session?.user, router, toast]);

  // Check for and refund pending orders with wallet deductions when page loads
  // This handles cases where user navigated back from payment page
  useEffect(() => {
    if (session?.user) {
      // Check for pending orders that need wallet refund
      refundPendingOrders()
        .then((result) => {
          if (result.success && result.ordersProcessed && result.ordersProcessed > 0) {
            console.log(`[Checkout] Refunded wallet for ${result.ordersProcessed} pending order(s), total: €${result.refunded?.toFixed(2) || '0.00'}`);
            if (result.refunded && result.refunded > 0) {
              toast({
                title: "Wallet Refunded",
                description: `€${result.refunded.toFixed(2)} has been returned to your wallet from previous checkout attempts.`,
              });
            }
            // Reload wallet balance after refund
            loadWalletBalance();
          }
        })
        .catch((error) => {
          console.error('[Checkout] Error checking pending orders:', error);
        });
    }
  }, [session?.user, toast]);

  // Load saved addresses and wallet balance
  useEffect(() => {
    if (session?.user) {
      loadAddresses();
      loadWalletBalance();
    }
  }, [session]);

  // Calculate cashback from cartItems (which already have product data)
  useEffect(() => {
    if (session?.user) {
      calculateCashback();
    }
  }, [cartItems, session]);

  // Update wallet amount when useWallet, promo discount, or total changes
  useEffect(() => {
    if (useWallet && walletBalance > 0) {
      const afterPromo = Math.max(0, subtotal + shipping - promoDiscount);
      const maxWalletAmount = Math.min(walletBalance, afterPromo);
      setWalletAmount(prev => Math.min(prev || maxWalletAmount, maxWalletAmount));
    } else {
      setWalletAmount(0);
    }
  }, [useWallet, walletBalance, subtotal, shipping, promoDiscount]);

  // Validate and apply promo code
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError("Please enter a promo code");
      return;
    }

    setIsValidatingPromo(true);
    setPromoCodeError("");

    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          subtotal: subtotal,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPromoDiscount(data.promoCode.discountAmount || 0);
        setPromoCashback(data.promoCode.cashbackAmount || 0);
        setAppliedPromoCode({
          id: data.promoCode.id,
          code: data.promoCode.code,
        });
        setPromoCodeError("");
      } else {
        setPromoCodeError(data.error || "Invalid promo code");
        setPromoDiscount(0);
        setPromoCashback(0);
        setAppliedPromoCode(null);
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
      setPromoCodeError("Failed to validate promo code. Please try again.");
      setPromoDiscount(0);
      setPromoCashback(0);
      setAppliedPromoCode(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode("");
    setPromoCodeError("");
    setPromoDiscount(0);
    setPromoCashback(0);
    setAppliedPromoCode(null);
  };

  const loadWalletBalance = async () => {
    try {
      const result = await getWalletBalance();
      if (result.balance !== undefined) {
        setWalletBalance(result.balance);
      }
    } catch (error) {
      console.error("Error loading wallet balance:", error);
    }
  };

  const calculateCashback = async () => {
    try {
      if (!cartItems || cartItems.length === 0) {
        setTotalCashback(0);
        return;
      }

      // Fetch cart from database to get actual cashbackAmount values
      const cart = await getCart();
      
      if (!cart || !cart.items || cart.items.length === 0) {
        // Fallback to parsing from cartItems if database fetch fails
        let cashback = 0;
        for (const item of cartItems) {
          if (item.product.cashback) {
            const cashbackStr = item.product.cashback.replace(/[€,\s]/g, '').trim();
            const cashbackAmount = parseFloat(cashbackStr);
            if (!isNaN(cashbackAmount) && cashbackAmount > 0) {
              cashback += cashbackAmount * item.quantity;
            }
          }
        }
        setTotalCashback(cashback);
        return;
      }

      // Calculate from database values (cashbackAmount is now a number, not Decimal)
      let cashback = 0;
      for (const item of cart.items) {
        if (item.Product) {
          // cashbackAmount is already converted to number in getCart
          const cashbackAmount = (item.Product as any).cashbackAmount || 0;
          
          if (cashbackAmount > 0) {
            const itemCashback = cashbackAmount * item.quantity;
            cashback += itemCashback;
          }
        }
      }
      
      setTotalCashback(cashback);
    } catch (error) {
      console.error("Error calculating cashback:", error);
      // Fallback to parsing from cartItems
      let cashback = 0;
      for (const item of cartItems) {
        if (item.product.cashback) {
          const cashbackStr = item.product.cashback.replace(/[€,\s]/g, '').trim();
          const cashbackAmount = parseFloat(cashbackStr);
          if (!isNaN(cashbackAmount) && cashbackAmount > 0) {
            cashback += cashbackAmount * item.quantity;
          }
        }
      }
      setTotalCashback(cashback);
    }
  };

  const loadAddresses = async () => {
    try {
      const result = await getAddresses();
      if (result.addresses && result.addresses.length > 0) {
        setAddresses(result.addresses);
        const defaultAddress = result.addresses.find((addr: any) => addr.isDefault) || result.addresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setShippingForm({
            name: defaultAddress.fullName,
            phone: defaultAddress.phone,
            addressLine1: defaultAddress.addressLine1,
            addressLine2: defaultAddress.addressLine2 || "",
            city: defaultAddress.city,
            state: defaultAddress.state || "",
            postalCode: defaultAddress.postalCode,
            country: defaultAddress.country,
          });
        }
      } else {
        setUseSavedAddress(false);
        setIsNewAddress(true);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      setUseSavedAddress(false);
      setIsNewAddress(true);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    if (addressId === "new") {
      setUseSavedAddress(false);
      setIsNewAddress(true);
      setSelectedAddressId(null);
      setShippingForm({
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Ireland",
      });
    } else {
      setUseSavedAddress(true);
      setIsNewAddress(false);
      setSelectedAddressId(addressId);
      const address = addresses.find((addr) => addr.id === addressId);
      if (address) {
        setShippingForm({
          name: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || "",
          city: address.city,
          state: address.state || "",
          postalCode: address.postalCode,
          country: address.country,
        });
      }
    }
  };

  const validateShippingForm = () => {
    if (!shippingForm.name.trim()) return "Name is required";
    if (!shippingForm.phone.trim()) return "Phone is required";
    if (!shippingForm.addressLine1.trim()) return "Address is required";
    if (!shippingForm.city.trim()) return "City is required";
    if (!shippingForm.postalCode.trim()) return "Postal code is required";
    if (!shippingForm.country.trim()) return "Country is required";
    return null;
  };

  const handleProceedToPayment = async () => {
    // Validate cart is not empty
    if (!cartItems || cartItems.length === 0) {
      alert("Your cart is empty. Please add items to your cart first.");
      return;
    }

    const validationError = validateShippingForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    console.log('[CHECKOUT PAGE] Proceeding to payment with', cartItems.length, 'items', 'via', paymentMethod);
    setIsProcessing(true);

    // Track InitiateCheckout event with Meta Pixel and GA4 (only once per checkout attempt)
    if (!hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true;
      try {
        const contents = cartItems.map((item) => ({
          id: item.product.slug || item.product.id,
          quantity: item.quantity,
        }));
        
        // Meta Pixel
        trackInitiateCheckout(total, 'EUR', contents);
        
        // GA4
        const ga4Items = cartItems.map((item) => {
          const price = parseFloat(item.product.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          return {
            item_id: item.product.slug || item.product.id,
            item_name: item.product.name,
            price: price,
            quantity: item.quantity,
          };
        });
        
        trackGA4BeginCheckout({
          value: total,
          currency: 'EUR',
          items: ga4Items,
        });
      } catch (trackError) {
        console.error('[CHECKOUT PAGE] Analytics tracking error:', trackError);
      }
    }

    try {
      // If it's a new address and user wants to save it, save it first
      if (isNewAddress && saveAddress) {
        const addressResult = await addAddress({
          fullName: shippingForm.name,
          phone: shippingForm.phone,
          addressLine1: shippingForm.addressLine1,
          addressLine2: shippingForm.addressLine2 || undefined,
          city: shippingForm.city,
          state: shippingForm.state || undefined,
          postalCode: shippingForm.postalCode,
          country: shippingForm.country,
          isDefault: addresses.length === 0, // Set as default if it's the first address
        });

        if (addressResult.error) {
          alert(addressResult.error || "Failed to save address. Please try again.");
          setIsProcessing(false);
          return;
        }

        // Reload addresses to include the new one
        await loadAddresses();
      }

      console.log('[CHECKOUT PAGE] Order Summary Total:', total);

      if (paymentMethod === "paypal") {
        // PayPal Payment Flow
        await handlePayPalPayment();
      } else {
        // Stripe Payment Flow (default)
        await handleStripePayment();
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("An error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    let result;
    try {
      result = await createCheckoutSession({
        shippingAddress: {
          name: shippingForm.name,
          phone: shippingForm.phone,
          addressLine1: shippingForm.addressLine1,
          addressLine2: shippingForm.addressLine2 || undefined,
          city: shippingForm.city,
          state: shippingForm.state || undefined,
          postalCode: shippingForm.postalCode,
          country: shippingForm.country,
        },
        walletAmount: useWallet ? walletDiscount : 0,
        promoCodeId: appliedPromoCode?.id || null,
        orderTotal: total,
      });
    } catch (apiError: any) {
      console.error("Error calling createCheckoutSession:", apiError);
      alert("Failed to create checkout session. Please try again.");
      setIsProcessing(false);
      return;
    }

    console.log("Checkout session result:", result);

    // Check for error first
    if (result && 'error' in result) {
      console.error("Checkout session error:", result.error);
      alert(result.error || "Failed to create checkout session. Please try again.");
      setIsProcessing(false);
      return;
    }

    // Check if result has success and url
    if (result && 'success' in result && result.success && 'url' in result && result.url) {
      let checkoutUrl: string;
      
      if (typeof result.url === 'string') {
        checkoutUrl = result.url.trim();
      } else {
        console.error("URL is not a string:", result.url, typeof result.url);
        alert("Invalid checkout URL format. Please try again.");
        setIsProcessing(false);
        return;
      }
      
      if (!checkoutUrl || checkoutUrl.length === 0 || checkoutUrl === 'null' || checkoutUrl === 'undefined') {
        console.error("Invalid URL from Stripe (empty/null):", result.url);
        alert("Invalid checkout URL received. Please try again or contact support.");
        setIsProcessing(false);
        return;
      }

      try {
        const url = new URL(checkoutUrl);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
          throw new Error('Invalid URL protocol: ' + url.protocol);
        }
        
        console.log("Redirecting to Stripe Checkout:", checkoutUrl);
        try {
          window.location.assign(checkoutUrl);
        } catch (redirectError: any) {
          console.error("Failed to redirect:", redirectError);
          window.location.href = checkoutUrl;
        }
      } catch (urlError: any) {
        console.error("Invalid URL from Stripe:", checkoutUrl, urlError);
        alert(`Invalid checkout URL: ${urlError.message || 'Invalid format'}. Please try again or contact support.`);
        setIsProcessing(false);
      }
    } else {
      console.error("Missing URL in response:", result);
      alert("Failed to create checkout session. No valid URL received. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    try {
      // Step 1: Create PayPal order
      const createResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: {
            name: shippingForm.name,
            phone: shippingForm.phone,
            addressLine1: shippingForm.addressLine1,
            addressLine2: shippingForm.addressLine2 || undefined,
            city: shippingForm.city,
            state: shippingForm.state || undefined,
            postalCode: shippingForm.postalCode,
            country: shippingForm.country,
          },
          walletAmount: useWallet ? walletDiscount : 0,
          promoCodeId: appliedPromoCode?.id || null,
          orderTotal: total,
        }),
      });

      const createResult = await createResponse.json();

      if (!createResponse.ok || !createResult.success) {
        console.error("PayPal order creation failed:", createResult);
        alert(createResult.error || "Failed to create PayPal order. Please try again.");
        setIsProcessing(false);
        return;
      }

      console.log("PayPal order created:", createResult);

      // Store orderId for capture after approval
      // Also store wallet transaction ID for potential refund
      sessionStorage.setItem('pendingPayPalOrder', JSON.stringify({
        paypalOrderId: createResult.paypalOrderId,
        orderId: createResult.orderId,
        orderNumber: createResult.orderNumber,
        walletTransactionId: createResult.walletTransactionId || null,
      }));

      // Redirect to PayPal for approval
      if (createResult.approvalUrl) {
        console.log("Redirecting to PayPal:", createResult.approvalUrl);
        window.location.assign(createResult.approvalUrl);
      } else {
        console.error("No approval URL in PayPal response");
        alert("Failed to get PayPal checkout URL. Please try again.");
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("PayPal payment error:", error);
      alert("An error occurred with PayPal. Please try again.");
      setIsProcessing(false);
    }
  };

  // formatPrice is now provided by usePrice hook with full currency conversion
  // Wallet balance and amounts are stored/processed in EUR
  const isNonEurCurrency = currency !== 'EUR';

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-brand-h1 font-headline text-brand-blue mb-8">
              Checkout
            </h1>

            {/* Check if user is logged in */}
            {!session?.user ? (
              <div className="max-w-2xl mx-auto text-center py-16">
                <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                  Sign In Required
                </h2>
                <p className="text-muted-foreground mb-8">
                  Please sign in to proceed with checkout.
                </p>
                <Link href="/api/auth/signin" prefetch={true}>
                  <Button size="lg" className="bg-brand-teal text-white hover:bg-brand-teal/90">
                    Sign In
                  </Button>
                </Link>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="max-w-2xl mx-auto text-center py-16">
                <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                  Your Cart is Empty
                </h2>
                <p className="text-muted-foreground mb-8">
                  Add items to your cart to proceed to checkout.
                </p>
                <Link href="/shop" prefetch={true}>
                  <Button size="lg" className="bg-brand-teal text-white hover:bg-brand-teal/90">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address */}
                <div>
                  <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                    Shipping Address
                  </h2>
                  
                  {addresses.length > 0 ? (
                    <div className="mb-4">
                      <Label className="text-brand-blue font-semibold mb-2 block">
                        Select Shipping Address
                      </Label>
                      <Select
                        value={useSavedAddress && selectedAddressId ? selectedAddressId : "new"}
                        onValueChange={handleAddressSelect}
                      >
                        <SelectTrigger className="bg-white border-gray-200">
                          <SelectValue placeholder="Select an address" />
                        </SelectTrigger>
                        <SelectContent>
                          {addresses.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              {address.fullName} - {address.addressLine1}, {address.city}
                              {address.isDefault && " (Default)"}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">Enter New Address</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        No saved addresses found. Please enter your shipping address below.
                      </p>
                    </div>
                  )}

                  <Card className="border border-gray-200">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Label htmlFor="shippingName" className="text-brand-blue font-semibold mb-2 block">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingName"
                          value={shippingForm.name}
                          onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                          className="bg-white border-gray-200 focus:border-brand-teal"
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="shippingPhone" className="text-brand-blue font-semibold mb-2 block">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingPhone"
                          type="tel"
                          value={shippingForm.phone}
                          onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                          className="bg-white border-gray-200 focus:border-brand-teal"
                          placeholder="+370 609 66069"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="shippingAddress1" className="text-brand-blue font-semibold mb-2 block">
                          Address Line 1 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shippingAddress1"
                          value={shippingForm.addressLine1}
                          onChange={(e) => setShippingForm({ ...shippingForm, addressLine1: e.target.value })}
                          className="bg-white border-gray-200 focus:border-brand-teal"
                          placeholder="Street address"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="shippingAddress2" className="text-brand-blue font-semibold mb-2 block">
                          Address Line 2
                        </Label>
                        <Input
                          id="shippingAddress2"
                          value={shippingForm.addressLine2}
                          onChange={(e) => setShippingForm({ ...shippingForm, addressLine2: e.target.value })}
                          className="bg-white border-gray-200 focus:border-brand-teal"
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shippingCity" className="text-brand-blue font-semibold mb-2 block">
                            City <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="shippingCity"
                            value={shippingForm.city}
                            onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                            className="bg-white border-gray-200 focus:border-brand-teal"
                            placeholder="City"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="shippingPostalCode" className="text-brand-blue font-semibold mb-2 block">
                            Postal Code <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="shippingPostalCode"
                            value={shippingForm.postalCode}
                            onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                            className="bg-white border-gray-200 focus:border-brand-teal"
                            placeholder="12345"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="shippingCountry" className="text-brand-blue font-semibold mb-2 block">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={shippingForm.country}
                          onValueChange={(value) => setShippingForm({ ...shippingForm, country: value })}
                          required
                        >
                          <SelectTrigger id="shippingCountry" className="bg-white border-gray-200 focus:border-brand-teal">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {SCHENGEN_COUNTRIES.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Delivery Provider: <span className="font-semibold text-brand-blue">{getShippingProviderDisplayName(shippingProvider)}</span>
                          {shippingProvider === 'Omniva' && ' (Latvia, Lithuania, Estonia)'}
                          {shippingProvider === 'DHL' && ' (Other countries)'}
                        </p>
                        {deliveryTime && (
                          <p className="text-sm text-brand-teal font-semibold mt-2 flex items-center gap-1">
                            <span>📦</span>
                            <span>Expected Delivery: {deliveryTime}</span>
                          </p>
                        )}
                      </div>

                      {/* Option to save address if it's a new address */}
                      {isNewAddress && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="saveAddress"
                              checked={saveAddress}
                              onChange={(e) => setSaveAddress(e.target.checked)}
                              className="w-4 h-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                            />
                            <Label htmlFor="saveAddress" className="text-sm text-brand-blue cursor-pointer">
                              Save this address for future orders
                            </Label>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Section */}
                <div>
                  <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                    Payment Method
                  </h2>
                  <Card className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Lock className="h-6 w-6 text-brand-teal" />
                        <div>
                          <h3 className="text-brand-h3 font-headline text-brand-blue">
                            Secure Payment
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Choose your preferred payment method
                          </p>
                        </div>
                      </div>

                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(value) => setPaymentMethod(value as "stripe" | "paypal")}
                        className="space-y-4"
                      >
                        {/* Stripe Option */}
                        <div className={`relative flex items-center border rounded-lg p-4 cursor-pointer transition-all ${
                          paymentMethod === "stripe" 
                            ? "border-brand-teal bg-brand-teal/5 ring-2 ring-brand-teal/20" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}>
                          <RadioGroupItem value="stripe" id="stripe" className="sr-only" />
                          <Label htmlFor="stripe" className="flex items-center gap-4 cursor-pointer flex-1">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "stripe" ? "border-brand-teal" : "border-gray-300"
                            }`}>
                              {paymentMethod === "stripe" && (
                                <div className="w-3 h-3 rounded-full bg-brand-teal" />
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-6 w-6 text-gray-600" />
                              <div>
                                <span className="font-semibold text-brand-blue">Credit/Debit Card</span>
                                <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex, and more</p>
                              </div>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                              <img src="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/eu.svg" alt="EU" className="h-4 w-6 object-cover rounded-sm opacity-60" />
                              <span className="text-xs text-muted-foreground">Powered by Stripe</span>
                            </div>
                          </Label>
                        </div>

                        {/* PayPal Option */}
                        <div className={`relative flex items-center border rounded-lg p-4 cursor-pointer transition-all ${
                          paymentMethod === "paypal" 
                            ? "border-[#0070ba] bg-[#0070ba]/5 ring-2 ring-[#0070ba]/20" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}>
                          <RadioGroupItem value="paypal" id="paypal" className="sr-only" />
                          <Label htmlFor="paypal" className="flex items-center gap-4 cursor-pointer flex-1">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "paypal" ? "border-[#0070ba]" : "border-gray-300"
                            }`}>
                              {paymentMethod === "paypal" && (
                                <div className="w-3 h-3 rounded-full bg-[#0070ba]" />
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.384a.77.77 0 01.76-.647h6.583c2.178 0 3.908.536 5.012 1.551 1.053.969 1.478 2.359 1.228 4.013-.342 2.256-1.465 3.922-3.239 4.811-1.41.706-3.139 1.056-5.134 1.056H7.57l-1.24 6.441a.75.75 0 01-.746.633l-.509.095z" fill="#009cde"/>
                                <path d="M23.053 8.033c-.384 2.525-1.688 4.382-3.803 5.395-1.583.758-3.588 1.123-5.969 1.123h-1.92l-1.287 6.687a.75.75 0 01-.746.633h-3.45a.47.47 0 01-.464-.543l.176-.915.05-.257L7.067 11.5l.027-.155a.77.77 0 01.76-.647h1.705c2.623 0 4.697-.566 6.166-1.684 1.437-1.092 2.35-2.705 2.715-4.8.185-1.068.113-1.97-.185-2.713 1.234.79 1.985 2.059 1.985 3.74-.001.931-.066 1.852-.187 2.792z" fill="#012169"/>
                              </svg>
                              <div>
                                <span className="font-semibold text-brand-blue">PayPal</span>
                                <p className="text-xs text-muted-foreground">Pay with your PayPal account</p>
                              </div>
                            </div>
                            <div className="ml-auto">
                              <span className="text-xs text-muted-foreground">Fast & Secure</span>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>

                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">
                          {paymentMethod === "stripe" ? (
                            <>🔒 Your payment is secured with Stripe's industry-leading encryption and fraud prevention.</>
                          ) : (
                            <>🔒 PayPal Purchase Protection covers eligible purchases. You can also pay with your linked cards.</>
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

                      {/* Right Column - Order Summary */}
                      <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                          <h2 className="text-brand-h2 font-headline text-brand-blue mb-6">
                            Order Summary
                          </h2>

                          <div className="space-y-4 mb-6">
                            {/* Exchange Rate Info (only show when not EUR) */}
                            {isNonEurCurrency && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded border border-gray-200">
                                <Info className="h-3 w-3" />
                                <span>Exchange rate: 1 EUR = {rate.toFixed(4)} {currency}</span>
                              </div>
                            )}

                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal</span>
                              <div className="text-right">
                                <span className="font-semibold text-brand-blue">{formatPrice(subtotal)}</span>
                                {isNonEurCurrency && (
                                  <span className="block text-xs text-muted-foreground">€{subtotal.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Shipping</span>
                              <span className="font-semibold text-brand-blue">Free</span>
                            </div>
                            <div className="flex justify-between text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <span className="text-blue-700 font-medium">Delivery Provider</span>
                              <span className="font-semibold text-blue-700">{getShippingProviderDisplayName(shippingProvider)}</span>
                            </div>
                            
                            {/* Promo Code Section */}
                            <div className="border-t border-gray-200 pt-4 space-y-3">
                              <Label htmlFor="promoCode" className="text-brand-blue font-semibold">
                                Promo Code
                              </Label>
                              {!appliedPromoCode ? (
                                <div className="flex gap-2">
                                  <Input
                                    id="promoCode"
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => {
                                      setPromoCode(e.target.value.toUpperCase());
                                      setPromoCodeError("");
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleApplyPromoCode();
                                      }
                                    }}
                                    placeholder="Enter promo code"
                                    className="flex-1"
                                    disabled={isValidatingPromo}
                                  />
                                  <Button
                                    type="button"
                                    onClick={handleApplyPromoCode}
                                    disabled={isValidatingPromo || !promoCode.trim()}
                                    className="bg-brand-teal text-white hover:bg-brand-teal/90"
                                  >
                                    {isValidatingPromo ? "..." : "Apply"}
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-700 font-medium">✓ {appliedPromoCode.code}</span>
                                    {promoDiscount > 0 && (
                                      <span className="text-xs text-green-600">
                                        -{formatPrice(promoDiscount)} discount
                                      </span>
                                    )}
                                    {promoCashback > 0 && (
                                      <span className="text-xs text-green-600">
                                        +{formatPrice(promoCashback)} cashback
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemovePromoCode}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                              {promoCodeError && (
                                <p className="text-xs text-red-600">{promoCodeError}</p>
                              )}
                              {promoDiscount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                  <span>Promo Discount</span>
                                  <div className="text-right">
                                    <span className="font-semibold">-{formatPrice(promoDiscount)}</span>
                                    {isNonEurCurrency && (
                                      <span className="block text-xs">-€{promoDiscount.toFixed(2)}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Cashback Display */}
                            {(totalCashback > 0 || promoCashback > 0) && (
                              <div className="flex justify-between text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                                <span className="text-green-700 font-medium">🎁 Cashback You'll Earn</span>
                                <div className="text-right">
                                  <span className="font-semibold text-green-700">
                                    {formatPrice(totalCashback + promoCashback)}
                                  </span>
                                  {isNonEurCurrency && (
                                    <span className="block text-xs text-green-600">
                                      €{(totalCashback + promoCashback).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Wallet Balance and Usage - Always show EUR base since wallet is stored in EUR */}
                            <div className="border-t border-gray-200 pt-4 space-y-3">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <Wallet className="h-4 w-4" />
                                  Robin Wallet Balance
                                </span>
                                <div className="text-right">
                                  <span className="font-semibold text-brand-blue">{formatPrice(walletBalance)}</span>
                                  {isNonEurCurrency && (
                                    <span className="block text-xs text-muted-foreground">€{walletBalance.toFixed(2)} (stored in EUR)</span>
                                  )}
                                </div>
                              </div>
                              {walletBalance > 0 ? (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="useWallet"
                                      checked={useWallet}
                                      onCheckedChange={(checked) => {
                                        setUseWallet(checked as boolean);
                                        if (checked) {
                                          const maxAmount = Math.min(walletBalance, subtotal + shipping);
                                          setWalletAmount(maxAmount);
                                        } else {
                                          setWalletAmount(0);
                                        }
                                      }}
                                    />
                                    <Label htmlFor="useWallet" className="text-sm font-medium cursor-pointer">
                                      Use wallet balance
                                    </Label>
                                  </div>
                                  {useWallet && (
                                    <div className="pl-6 space-y-2">
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Wallet Amount (EUR)</span>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max={Math.min(walletBalance, subtotal + shipping)}
                                          value={walletAmount}
                                          onChange={(e) => {
                                            const amount = parseFloat(e.target.value) || 0;
                                            const maxAmount = Math.min(walletBalance, subtotal + shipping);
                                            setWalletAmount(Math.min(amount, maxAmount));
                                          }}
                                          className="w-24 h-8 text-sm"
                                        />
                                      </div>
                                      <div className="flex justify-between text-sm text-green-600">
                                        <span>Wallet Discount</span>
                                        <div className="text-right">
                                          <span className="font-semibold">-{formatPrice(walletDiscount)}</span>
                                          {isNonEurCurrency && (
                                            <span className="block text-xs">-€{walletDiscount.toFixed(2)}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  No wallet balance available. You'll earn cashback on this purchase!
                                </p>
                              )}
                            </div>

                            <div className="border-t border-gray-200 pt-4 flex justify-between">
                              <span className="text-lg font-headline font-bold text-brand-blue">Total</span>
                              <div className="text-right">
                                <span className="text-lg font-headline font-bold text-brand-blue">
                                  {formatPrice(total)}
                                </span>
                                {isNonEurCurrency && (
                                  <span className="block text-xs text-muted-foreground">€{total.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            {useWallet && walletDiscount > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                                <p className="text-xs text-blue-700 text-center font-medium">
                                  {walletDiscount >= subtotal + shipping ? (
                                    <>✅ Order fully paid with wallet! No payment needed.</>
                                  ) : (
                                    <>💳 {formatPrice(total)} will be charged via payment gateway</>
                                  )}
                                </p>
                                {isNonEurCurrency && walletDiscount < subtotal + shipping && (
                                  <p className="text-xs text-blue-600 text-center mt-1">
                                    €{total.toFixed(2)} remaining after wallet payment
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                  <Button
                    size="lg"
                    onClick={handleProceedToPayment}
                    className={`w-full font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      paymentMethod === "paypal" 
                        ? "bg-[#0070ba] hover:bg-[#003087] text-white" 
                        : "bg-brand-teal hover:bg-brand-teal/90 text-white"
                    }`}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Processing...</span>
                      </>
                    ) : paymentMethod === "paypal" ? (
                      <>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.384a.77.77 0 01.76-.647h6.583c2.178 0 3.908.536 5.012 1.551 1.053.969 1.478 2.359 1.228 4.013-.342 2.256-1.465 3.922-3.239 4.811-1.41.706-3.139 1.056-5.134 1.056H7.57l-1.24 6.441a.75.75 0 01-.746.633l-.509.095z"/>
                        </svg>
                        <span>Pay with PayPal</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        <span>Pay with Card</span>
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By completing your purchase, you agree to our Terms of Service
                  </p>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

