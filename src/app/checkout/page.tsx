"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import Link from "next/link";
import { createCheckoutSession } from "@/app/actions/checkout";
import { getAddresses, addAddress, getWalletBalance, getCart } from "@/app/actions/user";
import { Checkbox } from "@/components/ui/checkbox";
import { getShippingProvider, getShippingProviderDisplayName } from "@/lib/shipping-provider";
import { usePrice } from "@/hooks/usePrice";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { cartItems, getCartTotal } = useCart();
  const { currency } = useCurrency();
  const { formatPrice, rate, parseEurPrice } = usePrice();
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

  const subtotal = getCartTotal();
  const shipping = 0; // Free shipping
  const walletDiscount = useWallet ? Math.min(walletAmount, subtotal + shipping) : 0;
  const total = Math.max(0, subtotal + shipping - walletDiscount);
  
  // Determine shipping provider based on country (non-editable, auto-set)
  const shippingProvider = getShippingProvider(shippingForm.country);

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

  // Update wallet amount when useWallet or total changes
  useEffect(() => {
    if (useWallet && walletBalance > 0) {
      const maxWalletAmount = Math.min(walletBalance, subtotal + shipping);
      setWalletAmount(prev => Math.min(prev || maxWalletAmount, maxWalletAmount));
    } else {
      setWalletAmount(0);
    }
  }, [useWallet, walletBalance, subtotal, shipping]);

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
    const validationError = validateShippingForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsProcessing(true);

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

      // Create Stripe Checkout Session
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
        });
      } catch (apiError: any) {
        console.error("Error calling createCheckoutSession:", apiError);
        alert("Failed to create checkout session. Please try again.");
        setIsProcessing(false);
        return;
      }

      console.log("Checkout session result:", result);
      console.log("Result type:", typeof result);
      console.log("Result is null?", result === null);
      console.log("Result is undefined?", result === undefined);
      if (result) {
        console.log("Result keys:", Object.keys(result));
        console.log("Result.success:", (result as any).success);
        console.log("Result.url:", (result as any).url);
        console.log("Result.error:", (result as any).error);
      }

      // Check for error first
      if (result && 'error' in result) {
        console.error("Checkout session error:", result.error);
        alert(result.error || "Failed to create checkout session. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Check if result has success and url
      if (result && 'success' in result && result.success && 'url' in result && result.url) {
        // Validate URL before redirecting
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

        // Validate URL format
        try {
          const url = new URL(checkoutUrl);
          if (url.protocol !== 'https:' && url.protocol !== 'http:') {
            throw new Error('Invalid URL protocol: ' + url.protocol);
          }
          
          // Ensure it's a Stripe checkout URL
          if (!checkoutUrl.includes('checkout.stripe.com')) {
            console.warn("URL doesn't appear to be a Stripe checkout URL:", checkoutUrl);
          }
          
          // Redirect to Stripe Checkout using assign for better error handling
          console.log("Redirecting to Stripe Checkout:", checkoutUrl);
          try {
            window.location.assign(checkoutUrl);
          } catch (redirectError: any) {
            console.error("Failed to redirect:", redirectError);
            // Fallback to href
            window.location.href = checkoutUrl;
          }
        } catch (urlError: any) {
          console.error("Invalid URL from Stripe:", checkoutUrl, urlError);
          alert(`Invalid checkout URL: ${urlError.message || 'Invalid format'}. Please try again or contact support.`);
          setIsProcessing(false);
        }
      } else {
        console.error("Missing URL in response:", result);
        console.error("Response structure:", JSON.stringify(result, null, 2));
        alert("Failed to create checkout session. No valid URL received. Please try again.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("An error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  // formatPrice is now provided by usePrice hook with full currency conversion
  // Wallet balance and amounts are stored/processed in EUR
  const isNonEurCurrency = currency !== 'EUR';

  // Check if user is logged in
  if (!session?.user) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-white">
        <Header />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center py-16">
              <h1 className="text-3xl sm:text-4xl font-headline font-bold text-brand-blue mb-4">
                Sign In Required
              </h1>
              <p className="text-muted-foreground mb-8">
                Please sign in to proceed with checkout.
              </p>
              <Link href="/api/auth/signin" prefetch={true}>
                <Button size="lg" className="bg-brand-teal text-white hover:bg-brand-teal/90">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-white">
        <Header />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center py-16">
              <h1 className="text-3xl sm:text-4xl font-headline font-bold text-brand-blue mb-4">
                Your Cart is Empty
              </h1>
              <p className="text-muted-foreground mb-8">
                Add items to your cart to proceed to checkout.
              </p>
              <Link href="/shop" prefetch={true}>
                <Button size="lg" className="bg-brand-teal text-white hover:bg-brand-teal/90">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-headline font-bold text-brand-blue mb-8">
              Checkout
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address */}
                <div>
                  <h2 className="text-xl font-headline font-semibold text-brand-blue mb-4">
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
                        <Input
                          id="shippingCountry"
                          value={shippingForm.country}
                          onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                          className="bg-white border-gray-200 focus:border-brand-teal"
                          placeholder="Ireland"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Delivery Provider: <span className="font-semibold text-brand-blue">{getShippingProviderDisplayName(shippingProvider)}</span>
                          {shippingProvider === 'Omniva' && ' (Latvia, Lithuania, Estonia)'}
                          {shippingProvider === 'DHL' && ' (Other countries)'}
                        </p>
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
                  <h2 className="text-xl font-headline font-semibold text-brand-blue mb-4">
                    Payment
                  </h2>
                  <Card className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Lock className="h-6 w-6 text-brand-teal" />
                        <div>
                          <h3 className="font-headline font-semibold text-brand-blue">
                            Secure Payment
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Your payment will be processed securely by Stripe
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-2">
                          🔒 Secured by Stripe
                        </p>
                        <p className="text-xs text-muted-foreground">
                          We accept all major credit and debit cards. Your payment information is encrypted and secure.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

                      {/* Right Column - Order Summary */}
                      <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                          <h2 className="text-xl font-headline font-bold text-brand-blue mb-6">
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
                            
                            {/* Cashback Display */}
                            {totalCashback > 0 && (
                              <div className="flex justify-between text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                                <span className="text-green-700 font-medium">🎁 Cashback You'll Earn</span>
                                <div className="text-right">
                                  <span className="font-semibold text-green-700">{formatPrice(totalCashback)}</span>
                                  {isNonEurCurrency && (
                                    <span className="block text-xs text-green-600">€{totalCashback.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Wallet Balance and Usage - Always show EUR base since wallet is stored in EUR */}
                            {walletBalance > 0 && (
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
                              </div>
                            )}

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
                            {useWallet && walletDiscount < total && (
                              <p className="text-xs text-muted-foreground text-center">
                                {formatPrice(total)} remaining after wallet payment
                              </p>
                            )}
                          </div>

                  <Button
                    size="lg"
                    onClick={handleProceedToPayment}
                    className="w-full bg-brand-teal text-white hover:bg-brand-teal/90 font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        <span>Proceed to Secure Payment</span>
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By completing your purchase, you agree to our Terms of Service
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

