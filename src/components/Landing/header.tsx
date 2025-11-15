"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, User, Menu, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Landing/logo";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";
import { supportedLanguages } from "@/lib/languageData";
import { supportedCurrencies } from "@/lib/currencyData";
import { useCurrency } from "@/context/CurrencyContext";
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
  const [isScrolled, setIsScrolled] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to shop page with search query
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "#", label: "About" },
    { href: "#", label: "Contact" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-sm shadow-md"
          : "bg-transparent"
      )}
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
            <Logo className={cn(!isScrolled && "text-white")} />
          </div>
          
          {/* Center Section - Navigation Links */}
          <nav className="hidden lg:flex absolute left-[48%] top-1/2 -translate-x-1/2 -translate-y-1/2 items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                prefetch={true}
                className={cn(
                  "text-sm font-bold transition-colors whitespace-nowrap",
                  isScrolled 
                    ? 'text-black hover:text-primary' 
                    : 'text-black hover:text-black/80'
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
                  "absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 z-10 pointer-events-none", 
                  isScrolled ? 'text-muted-foreground' : 'text-black'
                )} 
              />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-7 pr-3 h-8 w-32 text-xs font-semibold",
                  isScrolled 
                    ? "bg-background border-input text-foreground" 
                    : "bg-white/10 border-white/20 text-black placeholder:text-black/50 backdrop-blur-sm"
                )}
              />
            </form>
            
            {/* Search Button for smaller screens */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("xl:hidden h-8 w-8 xl:h-10 xl:w-10", !isScrolled && 'text-black hover:bg-white/10 hover:text-black')}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-4 w-4 xl:h-5 xl:w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <LanguageSwitcher className={cn(isScrolled ? 'text-foreground border-foreground/20' : 'text-black border-black/30 font-bold')} />
            <CurrencySwitcher className={cn(isScrolled ? 'text-foreground border-foreground/20' : 'text-black border-black/30 font-bold')} />

            <Button variant="ghost" size="icon" className={cn("h-8 w-8 xl:h-10 xl:w-10", !isScrolled && 'text-black hover:bg-white/10 hover:text-black')}>
              <User className="h-4 w-4 xl:h-5 xl:w-5" />
              <span className="sr-only">Account</span>
            </Button>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8 xl:h-10 xl:w-10", !isScrolled && 'text-black hover:bg-white/10 hover:text-black')}>
              <ShoppingCart className="h-4 w-4 xl:h-5 xl:w-5" />
              <span className="sr-only">Cart</span>
            </Button>
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
                    !isScrolled 
                      ? 'text-white hover:bg-white/10 hover:text-white bg-black/20 backdrop-blur-sm' 
                      : 'text-foreground hover:bg-accent'
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
                        <Button variant="ghost" size="icon">
                        <User className="h-6 w-6" />
                        <span className="sr-only">Account</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                        <ShoppingCart className="h-6 w-6" />
                        <span className="sr-only">Cart</span>
                        </Button>
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
