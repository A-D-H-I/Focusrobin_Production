"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { getCart } from "@/app/actions/user";
import { usePrice } from "@/hooks/usePrice";

export default function CartPage() {
  const { data: session } = useSession();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { currency } = useCurrency();
  const { formatPrice, parseEurPrice } = usePrice();
  const [totalCashback, setTotalCashback] = useState<number>(0);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const subtotal = getCartTotal(); // This returns EUR value
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  // Calculate cashback from actual product cashback amounts
  useEffect(() => {
    const calculateCashback = async () => {
      if (!session?.user || !cartItems || cartItems.length === 0) {
        setTotalCashback(0);
        return;
      }

      try {
        const cart = await getCart();
        
        if (!cart || !cart.items || cart.items.length === 0) {
          // Fallback: try to parse from cartItems if available
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

        // Calculate from database values (cashbackAmount is already a number)
        let cashback = 0;
        for (const item of cart.items) {
          if (item.Product) {
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
        setTotalCashback(0);
      }
    };

    calculateCashback();
  }, [cartItems, session]);

  // formatPrice is now provided by usePrice hook with full currency conversion

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="text-brand-h1 font-headline text-brand-blue mb-8">
            Shopping Cart
          </h1>

          {cartItems.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
              <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                Your Cart is Empty
              </h2>
              <p className="text-muted-foreground mb-8">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link href="/shop" prefetch={true}>
                <Button size="lg" className="bg-brand-teal text-white hover:bg-brand-teal/90">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items - Left Column (2/3 on desktop) */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                // Parse EUR price from product (stored as "€XX.XX" string)
                const priceInEur = parseEurPrice(item.product.price);
                const itemTotalEur = priceInEur * item.quantity;

                return (
                  <div
                    key={`${item.product.id}-${item.variant.hex}`}
                    className="bg-white border border-border rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row gap-4"
                  >
                    {/* Product Image */}
                    <div className="relative w-full sm:w-32 h-32 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={item.variant.thumbnail || item.variant.images[0] || ''}
                        alt={`${item.product.name} - ${item.variant.name}`}
                        fill
                        className="object-contain p-2"
                        sizes="128px"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow flex flex-col sm:flex-row sm:justify-between gap-4">
                      <div className="flex-grow">
                        <h3 className="text-brand-h3 font-headline text-brand-blue mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Color: {item.variant.name}
                        </p>
                        <p className="text-lg font-bold text-brand-blue">
                          {formatPrice(itemTotalEur)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={item.quantity <= 1 || updatingItems.has(`${item.product.id}-${item.variant.hex}`)}
                            onClick={async () => {
                              const itemKey = `${item.product.id}-${item.variant.hex}`;
                              setUpdatingItems(prev => new Set(prev).add(itemKey));
                              try {
                                await updateQuantity(item.product.id, item.variant.hex, item.quantity - 1);
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
                            disabled={updatingItems.has(`${item.product.id}-${item.variant.hex}`)}
                            onClick={async () => {
                              const itemKey = `${item.product.id}-${item.variant.hex}`;
                              setUpdatingItems(prev => new Set(prev).add(itemKey));
                              try {
                                await updateQuantity(item.product.id, item.variant.hex, item.quantity + 1);
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
                          onClick={() => removeFromCart(item.product.id, item.variant.hex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary - Right Column (1/3 on desktop) */}
            <div className="lg:col-span-1">
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

                <Link href="/checkout" prefetch={true} className="block">
                  <Button
                    size="lg"
                    className="w-full bg-brand-teal text-white hover:bg-brand-teal/90 font-semibold py-6 text-lg"
                  >
                    PROCEED TO CHECKOUT
                  </Button>
                </Link>

                <Link href="/shop" prefetch={true} className="block mt-4 text-center text-sm text-muted-foreground hover:text-brand-blue">
                  Continue Shopping
                </Link>
              </div>
            </div>
            </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

