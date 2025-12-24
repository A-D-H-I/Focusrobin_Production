"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, Search, Heart, User } from "lucide-react";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/auth/UserMenu";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Landing/logo";
import PromotionalBanner from "@/components/Landing/promotional-banner";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";
import ShopMegaMenu from "@/components/Landing/shop-mega-menu";
import { supportedLanguages } from "@/lib/languageData";
import { supportedCurrencies } from "@/lib/currencyData";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getNavbarSettings } from "@/app/actions/navbarSettings";
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
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(!isHomePage);
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const { wishlistItems } = useWishlist();
  const { getCartItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const sidebarSearchInputRef = useRef<HTMLInputElement>(null);
  const shopMenuRef = useRef<HTMLDivElement>(null);

  // Close shop menu when sidebar closes
  useEffect(() => {
    if (!isSidebarOpen) {
      setIsShopMenuOpen(false);
    }
  }, [isSidebarOpen]);

  // Handle click outside for shop menu on desktop
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isShopMenuOpen &&
        shopMenuRef.current &&
        !shopMenuRef.current.contains(event.target as Node) &&
        window.innerWidth >= 1280
      ) {
        setIsShopMenuOpen(false);
      }
    }

    if (isShopMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShopMenuOpen]);
  const [navbarSettings, setNavbarSettings] = useState<{
    iconColorNotScrolled: string;
    logoColorNotScrolled: string;
  } | null>(null);

  // Load navbar settings
  useEffect(() => {
    const loadSettings = async () => {
      const result = await getNavbarSettings();
      if (result.success && result.settings) {
        setNavbarSettings(result.settings);
      }
    };
    loadSettings();
  }, []);

  // Helper function to get icon color class
  const getIconColorClass = () => {
    if (isSidebarOpen) {
      return 'text-brand-blue'; // Match sidebar text color
    }
    if (!isScrolled && navbarSettings) {
      if (navbarSettings.iconColorNotScrolled === 'white' || !navbarSettings) {
        return 'text-white';
      }
      if (navbarSettings.iconColorNotScrolled === 'black') {
        return 'text-black';
      }
    }
    return 'text-brand-blue';
  };

  // Helper function to get icon color style
  const getIconColorStyle = () => {
    if (isSidebarOpen) {
      return undefined; // Use default brand-blue
    }
    if (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black') {
      return { color: navbarSettings.iconColorNotScrolled };
    }
    return undefined;
  };

  // Helper function to get logo filter
  const getLogoFilter = () => {
    if (!isScrolled && navbarSettings) {
      const logoColor = navbarSettings.logoColorNotScrolled.toLowerCase();
      if (logoColor === 'white' || logoColor === '#ffffff') {
        return 'brightness-0 invert';
      } else if (logoColor === 'black' || logoColor === '#000000') {
        return 'brightness-0';
      }
      // For custom colors, you might need to use CSS filters or inline styles
      return '';
    }
    return '';
  };

  useEffect(() => {
    // On home page, check scroll to hide banner and move header
    // On other pages, banner is always visible, so header should always be below it
    // But on other pages, header should have the same styling as scrolled state on home page
    if (isHomePage) {
      // Set initial state - check scroll position on home page
      setIsScrolled(window.scrollY > 50);
      
      let ticking = false;
      let lastScrollY = window.scrollY;
      
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            // Hide banner and move header to top when scrolled more than 50px (only on home page)
            // Only update if scroll position changed significantly (reduces re-renders)
            if (Math.abs(currentScrollY - lastScrollY) > 5) {
              setIsScrolled(currentScrollY > 50);
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
    } else {
      // On other pages, banner is always visible, so header should always be below it
      // But header should have scrolled styling (white background) like on landing page when scrolled
      setIsScrolled(true); // This will apply the scrolled styling
    }
  }, [isHomePage]);

  // Prevent search input from auto-focusing when sidebar opens on mobile/tablet
  useEffect(() => {
    if (!isSidebarOpen || window.innerWidth >= 1024) return;
    
    // Small delay to ensure DOM is ready, then blur if focused
    const timer = setTimeout(() => {
      if (sidebarSearchInputRef.current && document.activeElement === sidebarSearchInputRef.current) {
        sidebarSearchInputRef.current.blur();
      }
    }, 100);
    
    // Prevent any focus attempts for the first second after opening
    const input = sidebarSearchInputRef.current;
    if (input) {
      const preventFocus = (e: FocusEvent) => {
        const timeSinceOpen = (window as any).sidebarOpenTime ? Date.now() - (window as any).sidebarOpenTime : 0;
        if (timeSinceOpen < 1000) {
          e.preventDefault();
          input.blur();
        }
      };
      input.addEventListener('focus', preventFocus, { capture: true });
      
      return () => {
        clearTimeout(timer);
        input.removeEventListener('focus', preventFocus, { capture: true });
      };
    }
    
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

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
    <>
      <PromotionalBanner />
      <header
        className={cn(
          "fixed left-0 right-0 z-[100] w-full transition-all duration-300",
          // Always stay below the scrolling banner which is fixed at top
          "top-[40px] sm:top-[44px]",
          "isolate", // Create new stacking context to ensure header stays above everything
        isSidebarOpen
          ? "bg-[#EFFAFA] backdrop-blur-md shadow-sm"
          : isScrolled || !isHomePage
          ? "bg-white/90 backdrop-blur-md shadow-sm"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-full">
          {/* Desktop Layout (xl and up) - Flexbox with justified space between logo and right section */}
          <div
          className={cn(
            "hidden xl:flex items-center justify-between w-full transition-all duration-300",
            isSidebarOpen 
              ? "h-16" 
              : !isHomePage 
                ? "h-20 sm:h-20"
                : (isScrolled ? "h-16" : "h-24")
          )}
        >
          {/* Left Section - Logo */}
          <div className="flex items-center z-10 flex-1">
            <Logo 
              className={cn(
                "transition-all duration-300",
                isSidebarOpen && "max-h-8"
              )}
              logoColor={isSidebarOpen ? undefined : (!isScrolled && navbarSettings ? navbarSettings.logoColorNotScrolled : undefined)}
            />
          </div>
          
          {/* Center Section - Navigation Links - Centered between logo and right section */}
          <nav className="flex items-center justify-center gap-8 z-20 flex-1">
            {/* Shop Link with Mega Menu */}
            <div
              ref={shopMenuRef}
              className="relative"
              onMouseEnter={() => {
                if (window.innerWidth >= 1280) {
                  setIsShopMenuOpen(true);
                }
              }}
              onMouseLeave={() => {
                // Don't close immediately - let the menu handle its own close with delay
              }}
            >
              <button
                type="button"
                onClick={() => setIsShopMenuOpen(!isShopMenuOpen)}
                className={cn(
                  "text-sm font-bold whitespace-nowrap cursor-pointer py-2 px-2 relative bg-transparent border-none",
                  "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-brand-teal after:transition-all after:duration-300 hover:after:w-full",
                  isSidebarOpen || isScrolled
                    ? 'text-brand-blue hover:text-brand-teal'
                    : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? 'text-white hover:text-brand-teal'
                      : navbarSettings?.iconColorNotScrolled === 'black'
                        ? 'text-black hover:text-brand-teal'
                        : 'text-brand-blue hover:text-brand-teal'
                )}
                style={!isScrolled && !isSidebarOpen && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                  ? { color: navbarSettings.iconColorNotScrolled }
                  : undefined
                }
              >
                Shop
              </button>
              <ShopMegaMenu
                isOpen={isShopMenuOpen}
                onClose={() => setIsShopMenuOpen(false)}
                isScrolled={isScrolled}
              />
            </div>

            {/* About Link */}
            <Link
              href="/about"
              prefetch={true}
              className={cn(
                "text-sm font-bold whitespace-nowrap py-2 px-2 relative",
                "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-brand-teal after:transition-all after:duration-300 hover:after:w-full",
                isSidebarOpen || isScrolled
                  ? 'text-brand-blue hover:text-brand-teal'
                  : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                    ? 'text-white hover:text-brand-teal'
                    : navbarSettings?.iconColorNotScrolled === 'black'
                      ? 'text-black hover:text-brand-teal'
                      : 'text-brand-blue hover:text-brand-teal'
              )}
              style={!isScrolled && !isSidebarOpen && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                ? { color: navbarSettings.iconColorNotScrolled }
                : undefined
              }
            >
              About
            </Link>

            {/* Contact Link */}
            <Link
              href="/contact"
              prefetch={true}
              className={cn(
                "text-sm font-bold whitespace-nowrap py-2 px-2 relative",
                "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-brand-teal after:transition-all after:duration-300 hover:after:w-full",
                isSidebarOpen || isScrolled
                  ? 'text-brand-blue hover:text-brand-teal'
                  : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                    ? 'text-white hover:text-brand-teal'
                    : navbarSettings?.iconColorNotScrolled === 'black'
                      ? 'text-black hover:text-brand-teal'
                      : 'text-brand-blue hover:text-brand-teal'
              )}
              style={!isScrolled && !isSidebarOpen && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                ? { color: navbarSettings.iconColorNotScrolled }
                : undefined
              }
            >
              Contact
            </Link>
          </nav>

          {/* Right Section - Search, Language, Currency, Icons */}
          <div className="flex justify-end items-center space-x-2 xl:space-x-4 z-10 flex-1">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative hidden xl:block">
              <Search 
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 z-10 pointer-events-none transition-colors duration-300", 
                  isSidebarOpen
                    ? 'text-brand-blue'
                    : isScrolled 
                    ? 'text-brand-blue' 
                    : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? 'text-white'
                      : navbarSettings.iconColorNotScrolled === 'black'
                      ? 'text-black'
                      : ''
                )}
                style={isSidebarOpen
                  ? undefined
                  : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black' 
                  ? { color: navbarSettings.iconColorNotScrolled }
                  : undefined)
                }
              />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-7 pr-3 h-8 w-32 text-xs font-semibold transition-colors duration-300 backdrop-blur-sm",
                  isSidebarOpen
                    ? "bg-white border-gray-200 text-brand-blue placeholder:text-brand-blue/50"
                    : isScrolled 
                    ? "bg-gray-100 border-brand-blue/20 text-brand-blue placeholder:text-brand-blue/50" 
                    : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? "bg-white/15 border-white/30 text-white placeholder:text-white/70"
                      : navbarSettings.iconColorNotScrolled === 'black'
                      ? "bg-black/15 border-black/30 text-black placeholder:text-black/70"
                      : "bg-white/15 border-white/30"
                )}
                style={isSidebarOpen
                  ? undefined
                  : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                  ? { 
                      color: navbarSettings.iconColorNotScrolled,
                      borderColor: `${navbarSettings.iconColorNotScrolled}30`,
                      backgroundColor: `${navbarSettings.iconColorNotScrolled}15`
                    }
                  : undefined)
                }
              />
            </form>
            
            {/* Search Button for smaller screens */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "xl:hidden h-7 w-7 transition-colors duration-300",
                  isSidebarOpen
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue'
                    : isScrolled 
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                    : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? 'text-white hover:bg-white/10 hover:text-white'
                      : navbarSettings.iconColorNotScrolled === 'black'
                      ? 'text-black hover:bg-black/10 hover:text-black'
                      : ''
                )}
                style={isSidebarOpen
                  ? undefined
                  : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                  ? { color: navbarSettings.iconColorNotScrolled }
                  : undefined)
                }
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
              <Search className="h-2.5 w-2.5" />
              <span className="sr-only">Search</span>
            </Button>

            <div
              className={cn(
                "transition-colors duration-300",
                isSidebarOpen
                  ? 'text-brand-blue'
                  : isScrolled 
                  ? 'text-brand-blue' 
                  : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                    ? 'text-white'
                    : navbarSettings.iconColorNotScrolled === 'black'
                    ? 'text-black'
                    : ''
              )}
              style={isSidebarOpen
                ? undefined
                : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                ? { color: navbarSettings.iconColorNotScrolled }
                : undefined)
              }
            >
              <LanguageSwitcher className={cn(
                "transition-colors duration-300",
                isSidebarOpen
                  ? 'text-brand-blue border-foreground/20'
                  : isScrolled 
                  ? 'text-brand-blue border-foreground/20' 
                  : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                    ? 'text-white border-white/30 font-bold'
                    : navbarSettings.iconColorNotScrolled === 'black'
                    ? 'text-black border-black/30 font-bold'
                    : ''
              )} />
            </div>
            <div
              className={cn(
                "transition-colors duration-300",
                isSidebarOpen
                  ? 'text-brand-blue'
                  : isScrolled 
                  ? 'text-brand-blue' 
                  : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                    ? 'text-white'
                    : navbarSettings.iconColorNotScrolled === 'black'
                    ? 'text-black'
                    : ''
              )}
              style={isSidebarOpen
                ? undefined
                : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                ? { color: navbarSettings.iconColorNotScrolled }
                : undefined)
              }
            >
              <CurrencySwitcher className={cn(
                "transition-colors duration-300",
                isSidebarOpen
                  ? 'text-brand-blue border-foreground/20'
                  : isScrolled 
                  ? 'text-brand-blue border-foreground/20' 
                  : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                    ? 'text-white border-white/30 font-bold'
                    : navbarSettings.iconColorNotScrolled === 'black'
                    ? 'text-black border-black/30 font-bold'
                    : ''
              )} />
            </div>

            <Link href="/wishlist" prefetch={true}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-7 w-7 transition-colors duration-300 relative",
                  isSidebarOpen
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue'
                    : isScrolled 
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                    : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? 'text-white hover:bg-white/10 hover:text-white'
                      : navbarSettings.iconColorNotScrolled === 'black'
                      ? 'text-black hover:bg-black/10 hover:text-black'
                      : ''
                )}
                style={isSidebarOpen
                  ? undefined
                  : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                  ? { color: navbarSettings.iconColorNotScrolled }
                  : undefined)
                }
              >
                <Heart className="h-3.5 w-3.5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#F56278] rounded-full border-2 border-white"></span>
                )}
                <span className="sr-only">Wishlist</span>
              </Button>
            </Link>

            <Link href="/cart" prefetch={true}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-7 w-7 transition-colors duration-300 relative",
                  isSidebarOpen
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue'
                    : isScrolled 
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                    : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? 'text-white hover:bg-white/10 hover:text-white'
                      : navbarSettings.iconColorNotScrolled === 'black'
                      ? 'text-black hover:bg-black/10 hover:text-black'
                      : ''
                )}
                style={isSidebarOpen
                  ? undefined
                  : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                  ? { color: navbarSettings.iconColorNotScrolled }
                  : undefined)
                }
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#F56278] rounded-full border-2 border-white"></span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>

            <div className={cn(
              "transition-colors duration-300",
              isSidebarOpen
                ? 'text-brand-blue'
                : isScrolled 
                ? 'text-brand-blue' 
                : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                  ? 'text-white'
                  : navbarSettings.iconColorNotScrolled === 'black'
                  ? 'text-black'
                  : ''
            )}>
              <UserMenu />
            </div>
          </div>
          
          {/* Search Input for smaller desktop screens */}
          {isSearchOpen && (
            <div className={cn(
              "hidden xl:block absolute top-full left-0 right-0 w-full p-4 backdrop-blur-sm border-b z-50",
              isSidebarOpen
                ? "bg-[#EFFAFA]/95"
                : "bg-background/95"
            )}>
              <div className="container mx-auto px-4 sm:px-6">
                  <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
                  <Search className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300",
                    isSidebarOpen
                      ? 'text-brand-blue'
                      : isScrolled 
                      ? 'text-muted-foreground' 
                      : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                        ? 'text-white'
                        : navbarSettings.iconColorNotScrolled === 'black'
                        ? 'text-black'
                        : ''
                  )}
                  style={isSidebarOpen
                    ? undefined
                    : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                    ? { color: navbarSettings.iconColorNotScrolled }
                    : undefined)
                  } />
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
        </div>

          {/* Mobile/Tablet Layout (below xl) */}
          <div
            className={cn(
              "xl:hidden flex items-center justify-between w-full transition-all duration-300",
              isSidebarOpen 
                ? "h-16" 
                : !isHomePage 
                  ? "h-20 sm:h-20"
                  : (isScrolled ? "h-16" : "h-24")
            )}
          >
            {/* Mobile Logo */}
            <div className="flex-shrink-0 min-w-[120px] sm:min-w-[140px]">
              <Logo 
                className={cn(
                  "transition-all duration-300",
                  isSidebarOpen && "max-h-8"
                )}
                logoColor={isSidebarOpen ? undefined : (!isScrolled && navbarSettings ? navbarSettings.logoColorNotScrolled : undefined)}
              />
            </div>

            {/* Mobile Right Icons */}
            <div className="flex items-center gap-2">
            {/* Right Icons for Mobile/Tablet - Account, Cart, Wishlist */}
            <Link href="/wishlist" prefetch={true} className="xl:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "h-8 w-8 transition-colors duration-300 relative",
                  isSidebarOpen
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue'
                    : isScrolled 
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                    : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? 'text-white hover:bg-white/10 hover:text-white'
                      : navbarSettings.iconColorNotScrolled === 'black'
                      ? 'text-black hover:bg-black/10 hover:text-black'
                      : ''
                )}
                style={isSidebarOpen
                  ? undefined
                  : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                  ? { color: navbarSettings.iconColorNotScrolled }
                  : undefined)
                }
              >
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#F56278] rounded-full border-2 border-white"></span>
                )}
                <span className="sr-only">Wishlist</span>
              </Button>
            </Link>
            
            <Link href="/cart" prefetch={true} className="xl:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "h-8 w-8 transition-colors duration-300 relative",
                  isSidebarOpen
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue'
                    : isScrolled 
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                    : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? 'text-white hover:bg-white/10 hover:text-white'
                      : navbarSettings.iconColorNotScrolled === 'black'
                      ? 'text-black hover:bg-black/10 hover:text-black'
                      : ''
                )}
                style={isSidebarOpen
                  ? undefined
                  : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                  ? { color: navbarSettings.iconColorNotScrolled }
                  : undefined)
                }
              >
                <ShoppingCart className="h-5 w-5" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#F56278] rounded-full border-2 border-white"></span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>

            <Link href={session?.user ? "/account" : "/login"} prefetch={true} className="xl:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "h-8 w-8 transition-colors duration-300",
                  isSidebarOpen
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue'
                    : isScrolled 
                    ? 'text-brand-blue hover:bg-accent hover:text-brand-blue' 
                    : navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? 'text-white hover:bg-white/10 hover:text-white'
                      : navbarSettings.iconColorNotScrolled === 'black'
                      ? 'text-black hover:bg-black/10 hover:text-black'
                      : ''
                )}
                style={isSidebarOpen
                  ? undefined
                  : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                  ? { color: navbarSettings.iconColorNotScrolled }
                  : undefined)
                }
              >
                <User className="h-5 w-5" />
                <span className="sr-only">{session?.user ? "Account" : "Login"}</span>
              </Button>
            </Link>

            {/* Hamburger Menu */}
            <Sheet open={isSidebarOpen} onOpenChange={(open) => {
              setIsSidebarOpen(open);
              if (open && window.innerWidth < 1024) {
                // Track when sidebar opens to prevent immediate focus
                (window as any).sidebarOpenTime = Date.now();
              }
            }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setIsSidebarOpen(!isSidebarOpen);
                  if (!isSidebarOpen && window.innerWidth < 1024) {
                    // Track when sidebar opens to prevent immediate focus
                    (window as any).sidebarOpenTime = Date.now();
                  }
                }}
                className={cn(
                  "transition-colors duration-300 rounded-full p-2",
                  isSidebarOpen
                    ? 'text-brand-blue hover:bg-gray-100 hover:text-brand-blue bg-transparent'
                    : !isScrolled 
                    ? navbarSettings?.iconColorNotScrolled === 'white' || !navbarSettings
                      ? 'text-white hover:bg-white/10 hover:text-white bg-[#EFFAFA]/20'
                      : navbarSettings.iconColorNotScrolled === 'black'
                      ? 'text-black hover:bg-gray-100 hover:text-black bg-[#EFFAFA]/20'
                      : 'bg-[#EFFAFA]/20 hover:bg-gray-100'
                    : 'text-brand-blue hover:bg-gray-100 hover:text-brand-blue'
                )}
                style={isSidebarOpen
                  ? undefined
                  : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                  ? { color: navbarSettings.iconColorNotScrolled }
                  : undefined)
                }
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">{isSidebarOpen ? "Close menu" : "Open menu"}</span>
              </Button>
              <SheetContent 
                side="right" 
                className="w-[300px] sm:w-[400px] md:w-[280px] md:max-w-[280px] overflow-y-auto p-6 md:p-4 flex flex-col z-[150]"
              >
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Logo with more margin-bottom */}
                    <div className="mb-8 flex-shrink-0">
                      <Logo />
                    </div>
                    
                    {/* Search Input for Mobile - Pill-shaped */}
                    <div className="mb-8 flex-shrink-0">
                      <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          ref={sidebarSearchInputRef}
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-11 pr-4 h-11 w-full rounded-full bg-white border-0 shadow-sm focus:border-0 focus:ring-1 focus:ring-brand-teal focus:ring-offset-0"
                          autoFocus={false}
                          autoComplete="off"
                          inputMode="text"
                        />
                      </form>
                    </div>
                    
                    {/* Language and Currency - Moved above navigation */}
                    <div className="mb-8 space-y-3 flex-shrink-0">
                      <div className="w-full relative" style={{ zIndex: 150 }}>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="w-full bg-transparent border-0 shadow-none h-8 px-2 py-1 text-sm text-foreground cursor-pointer hover:bg-transparent transition-colors [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-70">
                            <SelectValue>
                              {supportedLanguages.find(l => l.code === language)?.nativeName || language}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent 
                            position="popper" 
                            side="bottom" 
                            sideOffset={8}
                            align="start"
                            className="max-h-[300px] w-[var(--radix-select-trigger-width)] overflow-y-auto bg-white"
                            style={{ zIndex: 200 }}
                          >
                            {supportedLanguages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.nativeName} {lang.name !== lang.nativeName && `(${lang.name})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full relative" style={{ zIndex: 140 }}>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="w-full bg-transparent border-0 shadow-none h-8 px-2 py-1 text-sm text-foreground cursor-pointer hover:bg-transparent transition-colors [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-70">
                            <SelectValue>
                              {supportedCurrencies.find(c => c.code === currency)?.name || currency}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent 
                            position="popper" 
                            side="bottom" 
                            sideOffset={8}
                            align="start"
                            className="max-h-[200px] w-[var(--radix-select-trigger-width)] overflow-y-auto bg-white"
                            style={{ zIndex: 190 }}
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
                    
                    {/* Navigation Links - Chillax font, text-2xl, bold, with dividers */}
                    <nav className="flex flex-col flex-1 overflow-y-auto">
                        {navLinks.map((link, index) => {
                          if (link.label === "Shop") {
                            return (
                              <div key={link.href + link.label}>
                                {index > 0 && (
                                  <div className="border-t border-gray-200 my-3"></div>
                                )}
                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsShopMenuOpen(prev => !prev);
                                    }}
                                    className="font-body text-2xl font-bold hover:text-primary active:text-primary transition-colors text-foreground py-2 flex-shrink-0 w-full text-left flex items-center justify-between cursor-pointer relative z-10 touch-manipulation select-none"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                  >
                                    <span>{link.label}</span>
                                    <span className="text-lg select-none ml-2 pointer-events-none">
                                      {isShopMenuOpen ? '−' : '+'}
                                    </span>
                                  </button>
                                  {isShopMenuOpen && (
                                    <div className="pl-4 space-y-2 border-l-2 border-gray-200">
                                      <Link href="/shop" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSidebarOpen(false);
                                      }}>
                                        All Sunglasses
                                      </Link>
                                      <Link href="/shop/women" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSidebarOpen(false);
                                      }}>
                                        Women&apos;s
                                      </Link>
                                      <Link href="/shop/men" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSidebarOpen(false);
                                      }}>
                                        Men&apos;s
                                      </Link>
                                      <Link href="/shop/kids" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSidebarOpen(false);
                                      }}>
                                        Kids
                                      </Link>
                                      <Link href="/shop?filter=bestsellers" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSidebarOpen(false);
                                      }}>
                                        Best Sellers
                                      </Link>
                                      <Link href="/shop?filter=new-arrivals" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSidebarOpen(false);
                                      }}>
                                        New Arrivals
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={link.href + link.label}>
                              {index > 0 && (
                                <div className="border-t border-gray-200 my-3"></div>
                              )}
                              <Link
                                href={link.href}
                                className="font-body text-2xl font-bold hover:text-primary transition-colors text-foreground py-2 flex-shrink-0"
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                {link.label}
                              </Link>
                            </div>
                          );
                        })}
                    </nav>
                </div>
              </SheetContent>
            </Sheet>
            </div>
          </div>
        </div>
    </header>
    </>
  );
}
