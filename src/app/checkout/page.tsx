"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaPaypal, FaApplePay, FaGooglePay } from 'react-icons/fa';
import { SiRevolut } from 'react-icons/si';
import { useCart } from "@/context/CartContext";
import { getCart } from "@/app/actions/user";
import { useCurrency } from "@/context/CurrencyContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createOrder } from "@/app/actions/orders";
import { getAddresses, addAddress, getWalletBalance, getCart } from "@/app/actions/user";
import { Checkbox } from "@/components/ui/checkbox";
import { getShippingProvider, getShippingProviderDisplayName } from "@/lib/shipping-provider";

type PaymentMethod = 
  | "card" 
  | "apple-pay" 
  | "google-pay" 
  | "revolut-pay" 
  | "paypal" 
  | "bank-transfer";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { currency } = useCurrency();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [saveAddress, setSaveAddress] = useState(false); // Option to save new address
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState<number>(0);
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

  // Calculate cashback and update wallet amount when cart changes
  useEffect(() => {
    calculateCashback();
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
      // Get cart with product details to calculate cashback
      const cart = await getCart();
      if (!cart || !cart.items || cart.items.length === 0) {
        setTotalCashback(0);
        return;
      }

      let cashback = 0;
      for (const item of cart.items) {
        if (item.Product && (item.Product as any).cashbackAmount) {
          const cashbackAmount = Number((item.Product as any).cashbackAmount || 0);
          if (cashbackAmount > 0) {
            cashback += cashbackAmount * item.quantity;
          }
        }
      }
      setTotalCashback(cashback);
    } catch (error) {
      console.error("Error calculating cashback:", error);
      setTotalCashback(0);
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

  const handleCompleteOrder = async () => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

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

      // Create the order
      const result = await createOrder({
        paymentMethod: useWallet && walletDiscount >= total ? "wallet" : selectedPaymentMethod,
        walletAmount: useWallet ? walletDiscount : 0,
        shippingProvider: shippingProvider, // Auto-determined based on country
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
      });

      if (result.success && result.order) {
        // Clear cart after successful order
        clearCart();
        // Redirect to order confirmation
        router.push(`/account?order=${result.order.orderNumber}&tab=orders`);
      } else {
        alert(result.error || "Failed to create order. Please try again.");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
    return `${symbol}${price.toFixed(2)}`;
  };

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

                {/* Express Payment Options */}
                <div>
                  <h2 className="text-xl font-headline font-semibold text-brand-blue mb-4">
                    Express Checkout
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => setSelectedPaymentMethod("apple-pay")}
                      className={cn(
                        "p-4 border-2 rounded-lg transition-all text-left",
                        selectedPaymentMethod === "apple-pay"
                          ? "border-brand-teal bg-brand-teal/5"
                          : "border-gray-200 hover:border-brand-teal/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded flex items-center justify-center">
                          <FaApplePay className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-brand-blue">Apple Pay</p>
                          <p className="text-xs text-muted-foreground">Quick & Secure</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod("google-pay")}
                      className={cn(
                        "p-4 border-2 rounded-lg transition-all text-left",
                        selectedPaymentMethod === "google-pay"
                          ? "border-brand-teal bg-brand-teal/5"
                          : "border-gray-200 hover:border-brand-teal/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded flex items-center justify-center">
                          <FaGooglePay className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-brand-blue">Google Pay</p>
                          <p className="text-xs text-muted-foreground">Quick & Secure</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod("revolut-pay")}
                      className={cn(
                        "p-4 border-2 rounded-lg transition-all text-left",
                        selectedPaymentMethod === "revolut-pay"
                          ? "border-brand-teal bg-brand-teal/5"
                          : "border-gray-200 hover:border-brand-teal/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0075EB] rounded flex items-center justify-center">
                          <SiRevolut className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-brand-blue">Revolut Pay</p>
                          <p className="text-xs text-muted-foreground">Quick & Secure</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <h2 className="text-xl font-headline font-semibold text-brand-blue mb-4">
                    Payment Method
                  </h2>

                  {/* Credit/Debit Card */}
                  <Card
                    className={cn(
                      "mb-4 cursor-pointer transition-all",
                      selectedPaymentMethod === "card"
                        ? "border-2 border-brand-teal bg-brand-teal/5"
                        : "border border-gray-200 hover:border-brand-teal/50"
                    )}
                    onClick={() => setSelectedPaymentMethod("card")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-brand-teal" />
                          <h3 className="font-headline font-semibold text-brand-blue">
                            Credit/Debit Card
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <div className="px-2 py-1 bg-white border border-gray-200 rounded flex items-center justify-center">
                            <FaCcVisa className="h-6 w-6 text-brand-blue" />
                          </div>
                          <div className="px-2 py-1 bg-white border border-gray-200 rounded flex items-center justify-center">
                            <FaCcMastercard className="h-6 w-6 text-brand-blue" />
                          </div>
                          <div className="px-2 py-1 bg-white border border-gray-200 rounded flex items-center justify-center">
                            <FaCcAmex className="h-6 w-6 text-brand-blue" />
                          </div>
                        </div>
                      </div>
                      {selectedPaymentMethod === "card" && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                          <div>
                            <Label htmlFor="cardNumber" className="text-brand-blue font-semibold mb-2 block">
                              Card Number
                            </Label>
                            <Input
                              id="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              className="bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry" className="text-brand-blue font-semibold mb-2 block">
                                Expiry Date
                              </Label>
                              <Input
                                id="expiry"
                                placeholder="MM/YY"
                                className="bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv" className="text-brand-blue font-semibold mb-2 block">
                                CVV
                              </Label>
                              <Input
                                id="cvv"
                                placeholder="123"
                                className="bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            🔒 Secured by Stripe. Your payment information is encrypted.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* PayPal */}
                  <Card
                    className={cn(
                      "mb-4 cursor-pointer transition-all",
                      selectedPaymentMethod === "paypal"
                        ? "border-2 border-brand-teal bg-brand-teal/5"
                        : "border border-gray-200 hover:border-brand-teal/50"
                    )}
                    onClick={() => setSelectedPaymentMethod("paypal")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FFC439] rounded flex items-center justify-center">
                            <FaPaypal className="h-8 w-8 text-[#003087]" />
                          </div>
                          <div>
                            <h3 className="font-headline font-semibold text-brand-blue">
                              PayPal
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Pay with your PayPal account
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bank Transfer / Local Methods */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="bank-methods" className="border border-gray-200 rounded-lg">
                      <AccordionTrigger
                        className={cn(
                          "px-6 py-4 hover:no-underline",
                          selectedPaymentMethod === "bank-transfer" && "text-brand-teal"
                        )}
                        onClick={() => setSelectedPaymentMethod("bank-transfer")}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-6 w-6 text-brand-teal" />
                          <h3 className="font-headline font-semibold text-brand-blue">
                            Bank Transfer / Local Methods
                          </h3>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground mb-4">
                            Select your preferred payment method:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button className="p-3 border border-gray-200 rounded-lg hover:border-brand-teal/50 transition-colors text-center">
                              <div className="text-xs font-semibold text-brand-blue mb-1">SEPA</div>
                              <div className="text-xs text-muted-foreground">Bank Transfer</div>
                            </button>
                            <button className="p-3 border border-gray-200 rounded-lg hover:border-brand-teal/50 transition-colors text-center">
                              <div className="text-xs font-semibold text-brand-blue mb-1">Bancontact</div>
                              <div className="text-xs text-muted-foreground">Belgium</div>
                            </button>
                            <button className="p-3 border border-gray-200 rounded-lg hover:border-brand-teal/50 transition-colors text-center">
                              <div className="text-xs font-semibold text-brand-blue mb-1">iDEAL</div>
                              <div className="text-xs text-muted-foreground">Netherlands</div>
                            </button>
                            <button className="p-3 border border-gray-200 rounded-lg hover:border-brand-teal/50 transition-colors text-center">
                              <div className="text-xs font-semibold text-brand-blue mb-1">P24</div>
                              <div className="text-xs text-muted-foreground">Poland</div>
                            </button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>

                      {/* Right Column - Order Summary */}
                      <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                          <h2 className="text-xl font-headline font-bold text-brand-blue mb-6">
                            Order Summary
                          </h2>

                          <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="font-semibold text-brand-blue">{formatPrice(subtotal)}</span>
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
                                <span className="font-semibold text-green-700">{formatPrice(totalCashback)}</span>
                              </div>
                            )}

                            {/* Wallet Balance and Usage */}
                            {walletBalance > 0 && (
                              <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Robin Wallet Balance
                                  </span>
                                  <span className="font-semibold text-brand-blue">{formatPrice(walletBalance)}</span>
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
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Wallet Amount</span>
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
                                      <span className="font-semibold">-{formatPrice(walletDiscount)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="border-t border-gray-200 pt-4 flex justify-between">
                              <span className="text-lg font-headline font-bold text-brand-blue">Total</span>
                              <span className="text-lg font-headline font-bold text-brand-blue">
                                {formatPrice(total)}
                              </span>
                            </div>
                            {useWallet && walletDiscount < total && (
                              <p className="text-xs text-muted-foreground text-center">
                                {formatPrice(total)} remaining after wallet payment
                              </p>
                            )}
                          </div>

                  <Button
                    size="lg"
                    onClick={handleCompleteOrder}
                    className="w-full bg-brand-teal text-white hover:bg-brand-teal/90 font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedPaymentMethod || isProcessing}
                  >
                    {isProcessing ? "Processing Order..." : "Complete Order"}
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

