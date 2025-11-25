"use client";

import { useState } from "react";
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
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaPaypal, FaApplePay, FaGooglePay } from 'react-icons/fa';
import { SiRevolut } from 'react-icons/si';
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

type PaymentMethod = 
  | "card" 
  | "apple-pay" 
  | "google-pay" 
  | "revolut-pay" 
  | "paypal" 
  | "bank-transfer";

export default function CheckoutPage() {
  const { cartItems, getCartTotal } = useCart();
  const { currency } = useCurrency();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const subtotal = getCartTotal();
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  const formatPrice = (price: number) => {
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
    return `${symbol}${price.toFixed(2)}`;
  };

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
                    <div className="border-t border-gray-200 pt-4 flex justify-between">
                      <span className="text-lg font-headline font-bold text-brand-blue">Total</span>
                      <span className="text-lg font-headline font-bold text-brand-blue">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-brand-teal text-white hover:bg-brand-teal/90 font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedPaymentMethod}
                  >
                    Complete Order
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

