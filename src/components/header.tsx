"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, User, Menu, Globe, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
    { code: 'EN', name: 'English' },
    { code: 'ES', name: 'Español' },
    { code: 'FR', name: 'Français' },
];

const currencies = [
    { code: 'USD', name: 'United States Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navLinks = [
    { href: "#", label: "Shop" },
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
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "relative flex items-center justify-between transition-all duration-300",
            isScrolled ? "h-16" : "h-24"
          )}
        >
          <div className="flex justify-start">
            <Logo className={cn(!isScrolled && "text-white")} />
          </div>
          
          <nav className="hidden md:flex justify-center items-center space-x-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={cn("text-sm font-medium transition-colors", isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex justify-end items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("text-sm", !isScrolled && 'text-white hover:bg-white/10 hover:text-white')}>
                  <Globe className="h-4 w-4 mr-1" />
                  {selectedLanguage.code}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem key={lang.code} onSelect={() => setSelectedLanguage(lang)}>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("text-sm", !isScrolled && 'text-white hover:bg-white/10 hover:text-white')}>
                  {selectedCurrency.code}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currencies.map((currency) => (
                  <DropdownMenuItem key={currency.code} onSelect={() => setSelectedCurrency(currency)}>
                    {currency.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className={cn(!isScrolled && 'text-white hover:bg-white/10 hover:text-white')}>
              <User className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Button>
            <Button variant="ghost" size="icon" className={cn(!isScrolled && 'text-white hover:bg-white/10 hover:text-white')}>
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Cart</span>
            </Button>
          </div>

          <div className="md:hidden flex-1 flex justify-end">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={cn(!isScrolled && 'text-white hover:bg-white/10 hover:text-white')}>
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full p-6">
                    <Logo />
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
                    <div className="mt-auto flex items-center space-x-4">
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
