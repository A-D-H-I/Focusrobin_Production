"use client";

import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { currency } = useCurrency();

  const subtotal = getCartTotal();
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;
  
  // Calculate cashback (5% of total)
  const cashback = total * 0.05;

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
              <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
              <h1 className="text-3xl sm:text-4xl font-headline font-bold text-brand-blue mb-4">
                Your Cart is Empty
              </h1>
              <p className="text-muted-foreground mb-8">
                Looks like you haven't added anything to your cart yet.
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
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-brand-blue mb-8">
            Shopping Cart
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items - Left Column (2/3 on desktop) */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const price = parseFloat(item.product.price.replace(/[^\d.,]/g, '').replace(',', '.'));
                const itemTotal = price * item.quantity;

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
                        <h3 className="text-lg font-semibold text-brand-blue mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Color: {item.variant.name}
                        </p>
                        <p className="text-lg font-bold text-brand-blue">
                          {formatPrice(itemTotal)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.variant.hex, item.quantity - 1)}
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
                            onClick={() => updateQuantity(item.product.id, item.variant.hex, item.quantity + 1)}
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
                  <div className="border-t border-border pt-4 flex justify-between">
                    <span className="text-lg font-headline font-bold text-brand-blue">Total</span>
                    <span className="text-lg font-headline font-bold text-brand-blue">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {/* Cashback Preview */}
                {cashback > 0 && (
                  <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-brand-blue font-semibold">
                      🎁 Robin Wallet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You will earn {formatPrice(cashback)} on this order
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
        </div>
      </main>
      <Footer />
    </div>
  );
}

