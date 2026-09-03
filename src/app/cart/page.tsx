"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCart } from "@/app/actions/user";
import { usePrice } from "@/hooks/usePrice";
import TranslatableText from "@/components/ui/TranslatableText";

export default function CartPage() {
  const { data: session, status } = useSession();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, isLoading } = useCart();
  const { currency } = useCurrency();
  const { formatPrice, parseEurPrice } = usePrice();
  const [totalCashback, setTotalCashback] = useState<number>(0);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Debug: Log cart items whenever they change
  useEffect(() => {
    console.log('[CartPage] Cart items updated:', cartItems.length, 'items');
    console.log('[CartPage] Items:', cartItems.map(item => ({
      product: item.product.name,
      variant: item.variant.name,
      quantity: item.quantity,
      hasPrescription: !!item.prescriptionData
    })));
  }, [cartItems]);

  const subtotal = getCartTotal(); // This returns EUR value
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  // Check if any items are out of stock
  const hasOutOfStockItems = cartItems.some(item => {
    const stock = item.variant.stock;
    return stock !== undefined && stock !== null && stock === 0;
  });

  // Calculate cashback from actual product cashback amounts
  useEffect(() => {
    const calculateCashback = () => {
      if (!session?.user || !cartItems || cartItems.length === 0) {
        setTotalCashback(0);
        return;
      }

      let cashback = 0;
      for (const item of cartItems) {
        if (item.product.cashback) {
          const cashbackStr = typeof item.product.cashback === 'string' 
            ? item.product.cashback.replace(/[€,\s]/g, '').trim()
            : String(item.product.cashback);
          const cashbackAmount = parseFloat(cashbackStr);
          if (!isNaN(cashbackAmount) && cashbackAmount > 0) {
            cashback += cashbackAmount * item.quantity;
          }
        }
      }
      setTotalCashback(cashback);
    };

    calculateCashback();
  }, [cartItems, session]);

  // formatPrice is now provided by usePrice hook with full currency conversion

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-8 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="text-brand-h1 font-headline text-brand-blue mb-8 text-center">
            <TranslatableText text="Shopping Cart" />
          </h1>

          {(isLoading || status === 'loading') ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <Loader2 className="h-16 w-16 mx-auto text-brand-teal animate-spin mb-6" />
              <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                <TranslatableText text="Loading Your Cart..." />
              </h2>
              <p className="text-muted-foreground">
                <TranslatableText text="Please wait while we fetch your cart items." />
              </p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
              <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                <TranslatableText text="Your Cart is Empty" />
              </h2>
              <p className="text-muted-foreground mb-8">
                <TranslatableText text="Looks like you haven't added anything to your cart yet." />
              </p>
              <Link href="/shop" prefetch={true}>
                <Button size="lg" className="bg-brand-teal text-white hover:bg-brand-teal/90">
                  <TranslatableText text="Continue Shopping" />
                </Button>
              </Link>
            </div>
          ) : (
            <>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Cart Items - Left Column (2/3 on desktop) */}
                <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                  {cartItems.map((item, index) => {
                    // Parse EUR price from product (stored as "€XX.XX" string)
                    const framePrice = parseEurPrice(item.product.price);

                    // Check if item has prescription data
                    const hasPrescription = item.prescriptionData?.rxPriceBreakdown;
                    const prescriptionPrice = hasPrescription
                      ? item.prescriptionData.rxPriceBreakdown.totalNet
                      : 0;

                    // Calculate total price: frame + prescription (if any)
                    const itemPrice = hasPrescription ? prescriptionPrice : framePrice;
                    const itemTotalEur = itemPrice * item.quantity;

                    // Create unique key that includes prescription data hash
                    const prescriptionKey = item.prescriptionData
                      ? JSON.stringify(item.prescriptionData).slice(0, 20)
                      : 'no-rx';
                    const itemKey = `${item.product.id}-${item.variant.hex}-${prescriptionKey}-${index}`;

                    return (
                      <div
                        key={itemKey}
                        className="bg-white border border-border rounded-xl sm:rounded-lg shadow-sm sm:shadow-none overflow-hidden"
                      >
                        {/* Mobile: Compact Card Layout */}
                        <div className="block sm:hidden">
                          <div className="p-3 flex gap-3">
                            {/* Product Image - Mobile */}
                            <Link
                              href={`/shop/${item.product.slug}`}
                              className="relative w-20 h-20 flex-shrink-0 bg-muted rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                            >
                              <Image
                                src={item.variant.thumbnail || item.variant.images[0] || ''}
                                alt={`${item.product.name} - ${item.variant.name}`}
                                fill
                                className="object-contain p-1.5"
                                sizes="80px"
                              />
                            </Link>

                            {/* Product Info - Mobile */}
                            <div className="flex-grow min-w-0">
                              <Link
                                href={`/shop/${item.product.slug}`}
                                className="block"
                              >
                                <h3 className="text-base font-semibold text-brand-blue mb-0.5 hover:text-brand-teal transition-colors line-clamp-2 break-words">
                                  {item.product.name}
                                </h3>
                              </Link>
                              <p className="text-xs text-muted-foreground mb-1.5">
                                {item.variant.name}
                              </p>
                              {hasPrescription && (
                                <p className="text-xs text-primary font-medium mb-1">
                                  ✓ Prescription
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-base font-bold text-brand-blue">
                                  {formatPrice(itemTotalEur)}
                                </p>
                                {item.variant.stock !== undefined && item.variant.stock !== null && item.variant.stock === 0 && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                                    <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                    <TranslatableText text="Out of Stock" />
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Mobile: Quantity and Actions Row */}
                          <div className="px-3 pb-3 pt-2 border-t border-border/50 flex items-center justify-between gap-3">
                            <div className="flex items-center border border-border rounded-lg bg-muted/30">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-r-none"
                                disabled={item.quantity <= 1 || updatingItems.has(itemKey)}
                                onClick={async () => {
                                  setUpdatingItems(prev => new Set(prev).add(itemKey));
                                  try {
                                    await updateQuantity(item.product.id, item.variant.hex, item.quantity - 1, item.prescriptionData);
                                  } finally {
                                    setUpdatingItems(prev => {
                                      const next = new Set(prev);
                                      next.delete(itemKey);
                                      return next;
                                    });
                                  }
                                }}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="px-3 py-1.5 min-w-[2.5rem] text-center font-semibold text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-l-none"
                                disabled={
                                  updatingItems.has(itemKey) ||
                                  (item.variant.stock !== undefined && item.variant.stock !== null && item.variant.stock === 0)
                                }
                                onClick={async () => {
                                  setUpdatingItems(prev => new Set(prev).add(itemKey));
                                  try {
                                    await updateQuantity(item.product.id, item.variant.hex, item.quantity + 1, item.prescriptionData);
                                  } finally {
                                    setUpdatingItems(prev => {
                                      const next = new Set(prev);
                                      next.delete(itemKey);
                                      return next;
                                    });
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                              onClick={() => removeFromCart(item.product.id, item.variant.hex, item.prescriptionData)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Mobile: Prescription Details (if any) */}
                          {hasPrescription && item.prescriptionData?.rxConfig && (
                            <div className="px-3 pb-3 pt-2 border-t border-border/50">
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                {item.prescriptionData.rxConfig.lensType && (
                                  <p>
                                    Lens: {item.prescriptionData.rxConfig.lensType === "CLEAR" ? "Clear" :
                                      item.prescriptionData.rxConfig.lensType === "TINTED" ? "Tinted" :
                                        item.prescriptionData.rxConfig.lensType === "PHOTOCHROMIC_SOLIS" ? "Photochromic" :
                                          item.prescriptionData.rxConfig.lensType === "POLARIZED_NUPOLAR" ? "Polarized" : ""}
                                  </p>
                                )}
                                {item.prescriptionData.rxConfig.lensIndex && (
                                  <p>Index: {item.prescriptionData.rxConfig.lensIndex}</p>
                                )}
                              </div>
                              <div className="mt-2 space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Frame:</span>
                                  <span>{formatPrice(framePrice)}</span>
                                </div>
                                {item.prescriptionData?.rxPriceBreakdown && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rx Lenses:</span>
                                    <span>+{formatPrice(item.prescriptionData.rxPriceBreakdown.rxRetailNet)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Desktop: Original Layout */}
                        <div className="hidden sm:flex p-4 sm:p-6 gap-4">
                          {/* Product Image */}
                          <Link
                            href={`/shop/${item.product.slug}`}
                            className="relative w-32 h-32 flex-shrink-0 bg-muted rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <Image
                              src={item.variant.thumbnail || item.variant.images[0] || ''}
                              alt={`${item.product.name} - ${item.variant.name}`}
                              fill
                              className="object-contain p-2"
                              sizes="128px"
                            />
                          </Link>

                          {/* Product Details */}
                          <div className="flex-grow flex flex-col sm:flex-row sm:justify-between gap-4">
                            <div className="flex-grow">
                              <Link
                                href={`/shop/${item.product.slug}`}
                                className="block"
                              >
                                <h3 className="text-brand-h3 font-headline text-brand-blue mb-1 hover:text-brand-teal transition-colors cursor-pointer">
                                  {item.product.name}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm text-muted-foreground">
                                  Color: {item.variant.name}
                                </p>
                                {item.variant.stock !== undefined && item.variant.stock !== null && item.variant.stock === 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Out of Stock
                                  </Badge>
                                )}
                              </div>
                              {hasPrescription && (
                                <p className="text-xs text-primary font-medium mb-1">
                                  ✓ With Prescription Lenses
                                </p>
                              )}
                              {hasPrescription && item.prescriptionData?.rxConfig && (
                                <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                                  {item.prescriptionData.rxConfig.lensType && (
                                    <p>
                                      Lens: {item.prescriptionData.rxConfig.lensType === "CLEAR" ? "Clear" :
                                        item.prescriptionData.rxConfig.lensType === "TINTED" ? "Tinted" :
                                          item.prescriptionData.rxConfig.lensType === "PHOTOCHROMIC_SOLIS" ? "Photochromic" :
                                            item.prescriptionData.rxConfig.lensType === "POLARIZED_NUPOLAR" ? "Polarized" : ""}
                                    </p>
                                  )}
                                  {item.prescriptionData.rxConfig.lensIndex && (
                                    <p>Index: {item.prescriptionData.rxConfig.lensIndex}</p>
                                  )}
                                </div>
                              )}
                              <div className="space-y-1">
                                {hasPrescription && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Frame: </span>
                                    <span>{formatPrice(framePrice)}</span>
                                  </div>
                                )}
                                {hasPrescription && item.prescriptionData?.rxPriceBreakdown && (
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Rx Lenses: </span>
                                    <span>+{formatPrice(item.prescriptionData.rxPriceBreakdown.rxRetailNet)}</span>
                                  </div>
                                )}
                                <p className="text-lg font-bold text-brand-blue">
                                  {formatPrice(itemTotalEur)}
                                </p>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center border border-border rounded-md">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={item.quantity <= 1 || updatingItems.has(itemKey)}
                                  onClick={async () => {
                                    setUpdatingItems(prev => new Set(prev).add(itemKey));
                                    try {
                                      await updateQuantity(item.product.id, item.variant.hex, item.quantity - 1, item.prescriptionData);
                                    } finally {
                                      setUpdatingItems(prev => {
                                        const next = new Set(prev);
                                        next.delete(itemKey);
                                        return next;
                                      });
                                    }
                                  }}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="px-4 py-2 min-w-[3rem] text-center font-semibold">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={
                                    updatingItems.has(itemKey) ||
                                    (item.variant.stock !== undefined && item.variant.stock !== null && item.variant.stock === 0)
                                  }
                                  onClick={async () => {
                                    setUpdatingItems(prev => new Set(prev).add(itemKey));
                                    try {
                                      await updateQuantity(item.product.id, item.variant.hex, item.quantity + 1, item.prescriptionData);
                                    } finally {
                                      setUpdatingItems(prev => {
                                        const next = new Set(prev);
                                        next.delete(itemKey);
                                        return next;
                                      });
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Remove Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeFromCart(item.product.id, item.variant.hex, item.prescriptionData)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Summary - Right Column (1/3 on desktop) */}
                <div className="lg:col-span-1">
                  {/* Mobile: Sticky Bottom Summary */}
                  <div className="block sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-40 p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
                    <div className="max-w-7xl mx-auto">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-brand-blue"><TranslatableText text="Total" /></span>
                        <span className="text-xl font-bold text-brand-blue">
                          {formatPrice(total)}
                        </span>
                      </div>
                      <Link href="/checkout" prefetch={true} scroll={true} className="block">
                        <Button
                          size="lg"
                          className="w-full bg-brand-teal text-white hover:bg-brand-teal/90 font-semibold py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={hasOutOfStockItems}
                        >
                          {hasOutOfStockItems ? <TranslatableText text="CANNOT CHECKOUT" /> : <TranslatableText text="PROCEED TO CHECKOUT" />}
                        </Button>
                      </Link>
                      {totalCashback > 0 && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          🎁 Earn {formatPrice(totalCashback)} cashback
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mobile: Expandable Summary Card */}
                  <div className="block sm:hidden mb-24">
                    <details className="bg-white border border-border rounded-xl overflow-hidden">
                      <summary className="p-4 cursor-pointer flex items-center justify-between">
                        <span className="text-sm font-semibold text-brand-blue"><TranslatableText text="Order Summary" /></span>
                        <span className="text-sm font-bold text-brand-blue">{formatPrice(total)}</span>
                      </summary>
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-semibold text-brand-blue">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="font-semibold text-brand-blue">Free</span>
                        </div>
                        {totalCashback > 0 && (
                          <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-3 mt-2">
                            <p className="text-xs text-brand-blue font-semibold">
                              🎁 Robin Wallet
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You will earn {formatPrice(totalCashback)} on this order
                            </p>
                          </div>
                        )}
                        {hasOutOfStockItems && (
                          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg mt-2">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-red-900 mb-0.5">
                                  Some items are out of stock
                                </p>
                                <p className="text-[10px] text-red-700">
                                  Please remove out of stock items to proceed.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>

                  {/* Desktop: Original Summary */}
                  <div className="hidden sm:block">
                    <div className="bg-white border border-border rounded-lg p-6 sticky top-24">
                      <h2 className="text-brand-h2 font-headline text-brand-blue mb-6">
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
                        <div className="border-t border-border pt-4 flex justify-between">
                          <span className="text-lg font-headline font-bold text-brand-blue">Total</span>
                          <span className="text-lg font-headline font-bold text-brand-blue">
                            {formatPrice(total)}
                          </span>
                        </div>
                      </div>

                      {/* Cashback Preview */}
                      {totalCashback > 0 && (
                        <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4 mb-6">
                          <p className="text-sm text-brand-blue font-semibold">
                            🎁 Robin Wallet
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            You will earn {formatPrice(totalCashback)} on this order
                          </p>
                        </div>
                      )}

                      {hasOutOfStockItems && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-red-900 mb-1">
                                Some items are out of stock
                              </p>
                              <p className="text-xs text-red-700">
                                Please remove out of stock items from your cart to proceed with checkout.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <Link href="/checkout" prefetch={true} scroll={true} className="block">
                        <Button
                          size="lg"
                          className="w-full bg-brand-teal text-white hover:bg-brand-teal/90 font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={hasOutOfStockItems}
                        >
                          {hasOutOfStockItems ? "CANNOT CHECKOUT - OUT OF STOCK ITEMS" : "PROCEED TO CHECKOUT"}
                        </Button>
                      </Link>

                      <Link href="/shop" prefetch={true} className="block mt-4 text-center text-sm text-muted-foreground hover:text-brand-blue">
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
      {/* Spacer for mobile fixed bottom bar so footer can be scrolled above it */}
      <div className="block sm:hidden h-[150px] bg-brand-white" />
    </div>
  );
}

