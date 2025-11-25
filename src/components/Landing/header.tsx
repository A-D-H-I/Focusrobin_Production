"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Menu, Search, Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Landing/logo";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";
import { supportedLanguages } from "@/lib/languageData";
import { supportedCurrencies } from "@/lib/currencyData";
import { useCurrency } from "@/context/CurrencyContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(!isHomePage);
  const { currency, setCurrency } = useCurrency();
  const { wishlistItems } = useWishlist();
  const { getCartItemCount } = useCart();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Only track scroll on home page
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }

    // Set initial state
    setIsScrolled(window.scrollY > 10);
    
    let ticking = false;
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          // Only update if scroll position changed significantly (reduces re-renders)
          if (Math.abs(currentScrollY - lastScrollY) > 5) {
            setIsScrolled(currentScrollY > 10);
            lastScrollY = currentScrollY;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHomePage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to shop page with search query
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] w-full transition-colors duration-300 will-change-[transform,background-color]",
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm"
          : "bg-transparent border-transparent"
      )}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        display: 'block',
        visibility: 'visible',
        margin: 0,
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-full">
        <div
          className={cn(
            "relative flex items-center justify-between w-full transition-all duration-300",
            isScrolled ? "h-16" : "h-24"
          )}
        >
          {/* Left Section - Logo */}
          <div className="flex-shrink-0 flex-1">
            <Logo className={cn(
              "transition-all duration-300",
              !isScrolled && "brightness-0 invert"
            )} />
          </div>
          
          {/* Center Section - Navigation Links */}
          <nav className="hidden lg:flex absolute left-[48%] top-1/2 -translate-x-1/2 -translate-y-1/2 items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                prefetch={true}
                className={cn(
                  "text-sm font-bold transition-colors duration-300 whitespace-nowrap",
                  isScrolled 
                    ? 'text-brand-blue hover:text-primary' 
                    : 'text-white hover:text-white/80'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section - Search, Language, Currency, Icons */}
          <div className="hidden lg:flex flex-shrink-0 flex-1 justify-end items-center space-x-2 xl:space-x-4">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative hidden xl:block">
              <Search 
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 z-10 pointer-events-none transition-colors duration-300", 
                  isScrolled ? 'text-brand-blue' : 'text-white'
                )} 
              />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-7 pr-3 h-8 w-32 text-xs font-semibold transition-colors duration-300 backdrop-blur-sm",
                  isScrolled 
                    ? "bg-gray-100 border-brand-blue/20 text-brand-blue placeholder:text-brand-blue/50" 
                    : "bg-white/15 border-white/30 text-white placeholder:text-white/70"
                )}
              />
            </form>
            
            {/* Search Button for smaller screens */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "xl:hidden h-8 w-8 xl:h-10 xl:w-10 transition-colors duration-300",
                isScrolled 
                  ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                  : 'text-white hover:bg-white/10 hover:text-white'
              )}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-4 w-4 xl:h-5 xl:w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <LanguageSwitcher className={cn(
              "transition-colors duration-300",
              isScrolled 
                ? 'text-brand-blue border-foreground/20' 
                : 'text-white border-white/30 font-bold'
            )} />
            <CurrencySwitcher className={cn(
              "transition-colors duration-300",
              isScrolled 
                ? 'text-brand-blue border-foreground/20' 
                : 'text-white border-white/30 font-bold'
            )} />

            <Link href="/wishlist" prefetch={true}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 xl:h-10 xl:w-10 transition-colors duration-300 relative",
                  isScrolled 
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                    : 'text-white hover:bg-white/10 hover:text-white'
                )}
              >
                <Heart className="h-4 w-4 xl:h-5 xl:w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                )}
                <span className="sr-only">Wishlist</span>
              </Button>
            </Link>

            <Link href="/account" prefetch={true}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 xl:h-10 xl:w-10 transition-colors duration-300",
                  isScrolled 
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                    : 'text-white hover:bg-white/10 hover:text-white'
                )}
              >
                <User className="h-4 w-4 xl:h-5 xl:w-5" />
                <span className="sr-only">Account</span>
              </Button>
            </Link>
            <Link href="/cart" prefetch={true}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 xl:h-10 xl:w-10 transition-colors duration-300 relative",
                  isScrolled 
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                    : 'text-white hover:bg-white/10 hover:text-white'
                )}
              >
                <ShoppingCart className="h-4 w-4 xl:h-5 xl:w-5" />
                {getCartItemCount() > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          </div>
          
          {/* Search Input for smaller desktop screens */}
          {isSearchOpen && (
            <div className="hidden lg:block xl:hidden absolute top-full left-0 right-0 w-full p-4 bg-background/95 backdrop-blur-sm border-b z-50">
              <div className="container mx-auto px-4 sm:px-6">
                <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 h-9 w-full"
                    autoFocus
                  />
                </form>
              </div>
            </div>
          )}

          <div className="lg:hidden flex-1 flex justify-end">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "transition-colors duration-300",
                    !isScrolled 
                      ? 'text-white hover:bg-white/10 hover:text-white bg-black/20 backdrop-blur-sm' 
                      : 'text-brand-blue hover:bg-accent hover:text-brand-blue'
                  )}
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full p-6">
                    <Logo />
                    {/* Search Input for Mobile */}
                    <div className="mt-6">
                      <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-4 h-10 w-full"
                        />
                      </form>
                    </div>
                    
                    <nav className="flex flex-col space-y-6 mt-12 text-lg">
                        {navLinks.map((link) => (
                        <Link
                            key={link.href + link.label}
                            href={link.href}
                            className="font-medium hover:text-primary transition-colors"
                        >
                            {link.label}
                        </Link>
                        ))}
                    </nav>
                    <div className="mt-8 space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Language</label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent 
                            position="popper" 
                            side="bottom" 
                            sideOffset={4}
                            align="start"
                            className="max-h-[200px] w-[var(--radix-select-trigger-width)] overflow-y-auto"
                          >
                            {supportedLanguages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Currency</label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent 
                            position="popper" 
                            side="bottom" 
                            sideOffset={4}
                            align="start"
                            className="max-h-[200px] w-[var(--radix-select-trigger-width)] overflow-y-auto"
                          >
                            {supportedCurrencies.map((curr) => (
                              <SelectItem key={curr.code} value={curr.code}>
                                {curr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center space-x-4 pt-6 border-t">
                        <Link href="/wishlist" prefetch={true} className="flex-1">
                          <Button variant="ghost" size="icon" className="w-full relative">
                            <Heart className="h-6 w-6" />
                            {wishlistItems.length > 0 && (
                              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                            )}
                            <span className="sr-only">Wishlist</span>
                          </Button>
                        </Link>
                        <Link href="/account" prefetch={true} className="flex-1">
                          <Button variant="ghost" size="icon" className="w-full">
                            <User className="h-6 w-6" />
                            <span className="sr-only">Account</span>
                          </Button>
                        </Link>
                        <Link href="/cart" prefetch={true} className="flex-1">
                          <Button variant="ghost" size="icon" className="w-full relative">
                            <ShoppingCart className="h-6 w-6" />
                            {getCartItemCount() > 0 && (
                              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                            )}
                            <span className="sr-only">Cart</span>
                          </Button>
                        </Link>
                    </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
