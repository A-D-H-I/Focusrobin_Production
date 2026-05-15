"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, Search, Heart, User, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/auth/UserMenu";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Landing/logo";
import PromotionalBanner from "@/components/Landing/promotional-banner";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";
import { getAvailableFrameColors, type AvailableColor } from "@/app/actions/getAvailableColors";
import { getAvailableGlassShapes, type AvailableGlassShape } from "@/app/actions/getAvailableGlassShapes";
import { getAvailableBrands, type AvailableBrand } from "@/app/actions/getAvailableBrands";
import ShopMegaMenu from "@/components/Landing/shop-mega-menu";
import TranslatableText from "@/components/ui/TranslatableText";
import { supportedLanguages } from "@/lib/languageData";
import { supportedCurrencies } from "@/lib/currencyData";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getNavbarSettings } from "@/app/actions/navbarSettings";
import { trackMetaEvent } from "@/components/analytics/MetaPixel";
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

interface HeaderProps {
  initialBanners?: string[];
}

export default function Header({ initialBanners = [] }: HeaderProps) {
  const pathname = usePathname();
  // Hide header on auth pages
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/verify-email'].includes(pathname);

  if (isAuthPage) return null;

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
  const [isSunglassesMenuOpen, setIsSunglassesMenuOpen] = useState(false);
  const [isEyeglassesMenuOpen, setIsEyeglassesMenuOpen] = useState(false);
  const [mobileSunglassesOpen, setMobileSunglassesOpen] = useState(false);
  const [mobileEyeglassesOpen, setMobileEyeglassesOpen] = useState(false);

  // Data for mega menus
  const [sunglassesColors, setSunglassesColors] = useState<AvailableColor[]>([]);
  const [sunglassesShapes, setSunglassesShapes] = useState<AvailableGlassShape[]>([]);
  const [sunglassesBrands, setSunglassesBrands] = useState<AvailableBrand[]>([]);
  const [eyeglassesColors, setEyeglassesColors] = useState<AvailableColor[]>([]);
  const [eyeglassesShapes, setEyeglassesShapes] = useState<AvailableGlassShape[]>([]);
  const [eyeglassesBrands, setEyeglassesBrands] = useState<AvailableBrand[]>([]);

  // Fetch mega menu data on mount
  useEffect(() => {
    async function fetchMenuData() {
      try {
        const [
          sgColors,
          sgShapes,
          sgBrands,
          egColors,
          egShapes,
          egBrands
        ] = await Promise.all([
          getAvailableFrameColors('sunglasses'),
          getAvailableGlassShapes('sunglasses'),
          getAvailableBrands('sunglasses'),
          getAvailableFrameColors('eyeglasses'),
          getAvailableGlassShapes('eyeglasses'),
          getAvailableBrands('eyeglasses')
        ]);

        setSunglassesColors(sgColors);
        setSunglassesShapes(sgShapes);
        setSunglassesBrands(sgBrands);
        setEyeglassesColors(egColors);
        setEyeglassesShapes(egShapes);
        setEyeglassesBrands(egBrands);
      } catch (error) {
        console.error("Error fetching menu data:", error);
      }
    }

    fetchMenuData();
  }, []);

  // Refs
  const sunglassesMenuRef = useRef<HTMLDivElement>(null);
  const eyeglassesMenuRef = useRef<HTMLDivElement>(null);
  const sidebarSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search State
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [navbarSettings, setNavbarSettings] = useState<{
    iconColorNotScrolled: string;
    logoColorNotScrolled: string;
  } | null>(null);

  // Timer for closing mega menus with delay
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startCloseMenuTimer = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setIsSunglassesMenuOpen(false);
      setIsEyeglassesMenuOpen(false);
    }, 300); // 300ms delay to allow moving between link and menu
  };

  const stopCloseMenuTimer = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleLinkEnter = (menu: 'sunglasses' | 'eyeglasses') => {
    stopCloseMenuTimer();
    if (window.innerWidth >= 1280) {
      if (menu === 'sunglasses') {
        setIsSunglassesMenuOpen(true);
        setIsEyeglassesMenuOpen(false);
      } else {
        setIsEyeglassesMenuOpen(true);
        setIsSunglassesMenuOpen(false);
      }
    }
  };

  // Close menus when sidebar closes
  useEffect(() => {
    if (!isSidebarOpen) {
      setIsSunglassesMenuOpen(false);
      setIsEyeglassesMenuOpen(false);
    }
  }, [isSidebarOpen]);

  // Handle click outside for menus on desktop
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (window.innerWidth >= 1280) {
        const target = event.target as HTMLElement;

        // If the click is on an anchor tag or inside one, let it navigate - don't close
        if (target.tagName === 'A' || target.closest('a')) {
          return;
        }

        // Also check if click is inside a mega menu (z-[110] elements)
        const clickedElement = document.elementFromPoint(event.clientX, event.clientY);
        if (clickedElement && clickedElement.closest('[class*="z-[110]"]')) {
          return;
        }

        if (
          isSunglassesMenuOpen &&
          sunglassesMenuRef.current &&
          !sunglassesMenuRef.current.contains(event.target as Node)
        ) {
          setIsSunglassesMenuOpen(false);
        }
        if (
          isEyeglassesMenuOpen &&
          eyeglassesMenuRef.current &&
          !eyeglassesMenuRef.current.contains(event.target as Node)
        ) {
          setIsEyeglassesMenuOpen(false);
        }
      }
    }

    if (isSunglassesMenuOpen || isEyeglassesMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSunglassesMenuOpen, isEyeglassesMenuOpen]);

  // Load navbar settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await getNavbarSettings();
        if (result.success && result.settings) {
          setNavbarSettings(result.settings);
        }
      } catch (error) {
        // Silently fail and use default settings
        console.error('Failed to load navbar settings:', error);
        setNavbarSettings({
          iconColorNotScrolled: 'white',
          logoColorNotScrolled: 'white',
        });
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
      const getScrollY = () => {
        // Use multiple methods for better browser compatibility
        return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      };

      const updateScrollState = () => {
        const scrollY = getScrollY();
        const shouldBeScrolled = scrollY > 50;
        setIsScrolled(shouldBeScrolled);
        return scrollY;
      };

      // Check immediately on mount
      updateScrollState();

      let lastScrollY = getScrollY();
      let rafId: number | null = null;

      const handleScroll = () => {
        // Cancel previous RAF if it exists
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }

        rafId = window.requestAnimationFrame(() => {
          const currentScrollY = updateScrollState();
          lastScrollY = currentScrollY;
          rafId = null;
        });
      };

      // Use multiple event types for maximum compatibility
      window.addEventListener("scroll", handleScroll, { passive: true });
      document.addEventListener("scroll", handleScroll, { passive: true });
      document.documentElement.addEventListener("scroll", handleScroll, { passive: true });

      // Also listen to touchmove for mobile
      window.addEventListener("touchmove", handleScroll, { passive: true });

      // Polling as absolute fallback (check every 100ms)
      const pollInterval = setInterval(() => {
        const currentScrollY = getScrollY();
        if (Math.abs(currentScrollY - lastScrollY) > 5) {
          updateScrollState();
          lastScrollY = currentScrollY;
        }
      }, 100);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        document.removeEventListener("scroll", handleScroll);
        document.documentElement.removeEventListener("scroll", handleScroll);
        window.removeEventListener("touchmove", handleScroll);
        clearInterval(pollInterval);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
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

  // Debounced search suggestions with AbortController to cancel stale requests
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
      return;
    }

    // Show loading state immediately
    setIsLoadingSuggestions(true);
    setShowSuggestions(true);

    // AbortController cancels the previous in-flight request when the user types again
    const abortController = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`, {
          cache: 'no-store',
          signal: abortController.signal,
        });
        const data = await response.json();
        setSearchSuggestions(data.suggestions || []);
      } catch (error: any) {
        // Don't log abort errors — they are expected when the user types fast
        if (error?.name !== 'AbortError') {
          console.error('Error fetching suggestions:', error);
          setSearchSuggestions([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 300); // 300ms debounce — balances responsiveness vs DB load

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      // Track Search event with Meta Pixel
      try {
        trackMetaEvent('Search', {
          search_string: searchQuery.trim(),
        });
      } catch (trackError) {
        console.error('[Header] Meta Pixel tracking error:', trackError);
      }
      // Navigate to shop page with search query, preserving the current category context
      const searchBasePath = pathname?.includes('/prescription-glasses')
        ? '/shop/prescription-glasses'
        : '/shop';
      window.location.href = `${searchBasePath}?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    window.location.href = `/shop/${slug}`;
  };

  const navLinks = [
    { href: "/shop", label: "Sunglasses" },
    { href: "/shop/prescription-glasses", label: "Eyeglasses" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <PromotionalBanner banners={initialBanners} />
      <header
        className={cn(
          "fixed left-0 right-0 z-[100] w-full transition-all duration-300",
          // Only apply top offset if there are banners
          initialBanners.length > 0 ? "top-[40px] sm:top-[44px]" : "top-0",
          "isolate", // Create new stacking context to ensure header stays above everything
          isSidebarOpen
            ? "bg-[#EFFAFA] backdrop-blur-md shadow-sm"
            : isScrolled || !isHomePage
              ? "bg-white/90 backdrop-blur-md shadow-sm"
              : "bg-transparent border-transparent"
        )}
        style={{
          // Ensure scroll events can pass through when hovering over navbar
          touchAction: 'pan-y',
        }}
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
                  : (isScrolled ? "h-20" : "h-24")
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
              {/* Sunglasses Link with Mega Menu */}
              <div
                ref={sunglassesMenuRef}
                className="relative"
                onMouseEnter={() => handleLinkEnter('sunglasses')}
                onMouseLeave={startCloseMenuTimer}
              >
                <Link
                  href="/shop"
                  onClick={() => {
                    setIsSunglassesMenuOpen(false);
                  }}
                  className={cn(
                    "text-sm font-bold whitespace-nowrap cursor-pointer py-2 px-2 relative bg-transparent border-none block",
                    "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-brand-teal after:transition-all after:duration-300 hover:after:w-full",
                    (isSidebarOpen || isScrolled)
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
                  <TranslatableText text="Sunglasses" />
                </Link>


              </div >

              {/* Eyeglasses Link with Mega Menu */}
              < div
                ref={eyeglassesMenuRef}
                className="relative"
                onMouseEnter={() => handleLinkEnter('eyeglasses')}
                onMouseLeave={startCloseMenuTimer}
              >
                <Link
                  href="/shop/prescription-glasses"
                  onClick={() => {
                    setIsEyeglassesMenuOpen(false);
                  }}
                  className={cn(
                    "text-sm font-bold whitespace-nowrap cursor-pointer py-2 px-2 relative bg-transparent border-none block",
                    "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-brand-teal after:transition-all after:duration-300 hover:after:w-full",
                    (isSidebarOpen || isScrolled)
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
                  <TranslatableText text="Eyeglasses" />
                </Link>

              </div >

              {/* About Link */}


              {/* Contact Link */}
              < Link
                href="/contact"
                prefetch={true}
                className={
                  cn(
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
                <TranslatableText text="Contact" />
              </Link >
            </nav >

            {/* Right Section - Search, Language, Currency, Icons */}
            < div className="flex justify-end items-center space-x-3 xl:space-x-5 z-10 flex-1" >
              {/* Search Input with Suggestions */}
              < div ref={searchContainerRef} className="relative hidden xl:block" >
                <form onSubmit={handleSearch} className="relative">
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      if (value.trim().length >= 2) {
                        setShowSuggestions(true);
                      } else {
                        setShowSuggestions(false);
                        setSearchSuggestions([]);
                      }
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
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

                {/* Search Suggestions Dropdown */}
                {
                  showSuggestions && (searchSuggestions.length > 0 || isLoadingSuggestions) && (
                    <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                      {isLoadingSuggestions ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Searching...</p>
                        </div>
                      ) : searchSuggestions.length > 0 ? (
                        <div className="py-2">
                          {searchSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() => handleSuggestionClick(suggestion.slug)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                            >
                              {suggestion.image && (
                                <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                                  <Image
                                    src={suggestion.image}
                                    alt={suggestion.name}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{suggestion.name}</p>
                                {suggestion.category && (
                                  <p className="text-xs text-muted-foreground">{suggestion.category}</p>
                                )}
                                <p className="text-sm font-semibold text-brand-blue mt-0.5">
                                  €{suggestion.price.toFixed(2)}
                                </p>
                              </div>
                            </button>
                          ))}
                          <div className="border-t border-border pt-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleSearch(e as any);
                              }}
                              className="w-full px-4 py-2 text-sm font-medium text-brand-teal hover:bg-muted/50 transition-colors text-left"
                            >
                              View all results for "{searchQuery}"
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                }
              </div >

              {/* Search Button for smaller screens */}
              < Button
                variant="ghost"
                size="icon"
                className={
                  cn(
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
                style={
                  isSidebarOpen
                    ? undefined
                    : (!isScrolled && navbarSettings && navbarSettings.iconColorNotScrolled !== 'white' && navbarSettings.iconColorNotScrolled !== 'black'
                      ? { color: navbarSettings.iconColorNotScrolled }
                      : undefined)
                }
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="h-2.5 w-2.5" />
                <span className="sr-only">Search</span>
              </Button >

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
                  <Heart className="h-4 w-4" />
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
                  <ShoppingCart className="h-4 w-4" />
                  {getCartItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#F56278] rounded-full border-2 border-white"></span>
                  )}
                  <span className="sr-only">Cart</span>
                </Button>
              </Link>

              <UserMenu
                isScrolled={isScrolled || isSidebarOpen}
                iconColorNotScrolled={navbarSettings?.iconColorNotScrolled}
              />
            </div >

            {/* Search Input for smaller desktop screens */}
            {
              isSearchOpen && (
                <div className={cn(
                  "hidden xl:block absolute top-full left-0 right-0 w-full p-4 backdrop-blur-sm border-b z-50",
                  isSidebarOpen
                    ? "bg-[#EFFAFA]/95"
                    : "bg-background/95"
                )}>
                  <div className="container mx-auto px-4 sm:px-6">
                    <div className="relative max-w-md mx-auto">
                      <form onSubmit={handleSearch} className="relative">
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
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.trim().length >= 2) {
                              setShowSuggestions(true);
                            } else {
                              setShowSuggestions(false);
                            }
                          }}
                          onFocus={() => {
                            if (searchQuery.trim().length >= 2 && searchSuggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                          className="pl-9 pr-4 h-9 w-full"
                          autoFocus
                        />
                      </form>

                      {/* Search Suggestions Dropdown */}
                      {showSuggestions && (searchSuggestions.length > 0 || isLoadingSuggestions) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                          {isLoadingSuggestions ? (
                            <div className="p-4 text-center text-muted-foreground">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Searching...</p>
                            </div>
                          ) : searchSuggestions.length > 0 ? (
                            <div className="py-2">
                              {searchSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion.id}
                                  onClick={() => handleSuggestionClick(suggestion.slug)}
                                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                                >
                                  {suggestion.image && (
                                    <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                                      <Image
                                        src={suggestion.image}
                                        alt={suggestion.name}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{suggestion.name}</p>
                                    {suggestion.category && (
                                      <p className="text-xs text-muted-foreground">{suggestion.category}</p>
                                    )}
                                    <p className="text-sm font-semibold text-brand-blue mt-0.5">
                                      €{suggestion.price.toFixed(2)}
                                    </p>
                                  </div>
                                </button>
                              ))}
                              <div className="border-t border-border pt-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSearch(e as any);
                                  }}
                                  className="w-full px-4 py-2 text-sm font-medium text-brand-teal hover:bg-muted/50 transition-colors text-left"
                                >
                                  View all results for "{searchQuery}"
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }
          </div >

          {/* Mobile/Tablet Layout (below xl) */}
          < div
            className={
              cn(
                "xl:hidden flex items-center justify-between w-full transition-all duration-300 px-2 sm:px-4",
                isSidebarOpen
                  ? "h-14 sm:h-16"
                  : !isHomePage
                    ? "h-16 sm:h-20"
                    : (isScrolled ? "h-16 sm:h-20" : "h-20 sm:h-24")
              )}
          >
            {/* Mobile Logo */}
            < div className="flex-shrink-0 min-w-[100px] sm:min-w-[120px] md:min-w-[140px]" >
              <Logo
                className={cn(
                  "transition-all duration-300 max-h-7 sm:max-h-8",
                  isSidebarOpen && "max-h-7"
                )}
                logoColor={isSidebarOpen ? undefined : (!isScrolled && navbarSettings ? navbarSettings.logoColorNotScrolled : undefined)}
              />
            </div >

            {/* Mobile Right Icons */}
            < div className="flex items-center gap-1 sm:gap-2" >
              {/* Right Icons for Mobile/Tablet - Account, Cart, Wishlist */}
              < Link href="/wishlist" prefetch={true} className="xl:hidden" >
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 transition-colors duration-300 relative",
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
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3 w-3 sm:h-4 sm:w-4 bg-[#F56278] rounded-full border border-white sm:border-2"></span>
                  )}
                  <span className="sr-only">Wishlist</span>
                </Button>
              </Link >

              <Link href="/cart" prefetch={true} className="xl:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 transition-colors duration-300 relative",
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
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {getCartItemCount() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3 w-3 sm:h-4 sm:w-4 bg-[#F56278] rounded-full border border-white sm:border-2"></span>
                  )}
                  <span className="sr-only">Cart</span>
                </Button>
              </Link>

              <Link href={session?.user ? "/account" : "/login"} prefetch={true} className="xl:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 transition-colors duration-300",
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
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
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
                    "transition-colors duration-300 rounded-full p-1.5 sm:p-2 h-7 w-7 sm:h-8 sm:w-8",
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
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
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
                    <div className="mb-8 flex-shrink-0 relative">
                      <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          ref={sidebarSearchInputRef}
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.trim().length >= 2) {
                              setShowSuggestions(true);
                            } else {
                              setShowSuggestions(false);
                            }
                          }}
                          onFocus={() => {
                            if (searchQuery.trim().length >= 2 && searchSuggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                          className="pl-11 pr-4 h-11 w-full rounded-full bg-white border-0 shadow-sm focus:border-0 focus:ring-1 focus:ring-brand-teal focus:ring-offset-0"
                          autoFocus={false}
                          autoComplete="off"
                          inputMode="text"
                        />
                      </form>

                      {/* Search Suggestions Dropdown - Mobile */}
                      {showSuggestions && (searchSuggestions.length > 0 || isLoadingSuggestions) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-[200] max-h-96 overflow-y-auto">
                          {isLoadingSuggestions ? (
                            <div className="p-4 text-center text-muted-foreground">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Searching...</p>
                            </div>
                          ) : searchSuggestions.length > 0 ? (
                            <div className="py-2">
                              {searchSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion.id}
                                  onClick={() => handleSuggestionClick(suggestion.slug)}
                                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                                >
                                  {suggestion.image && (
                                    <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                                      <Image
                                        src={suggestion.image}
                                        alt={suggestion.name}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{suggestion.name}</p>
                                    {suggestion.category && (
                                      <p className="text-xs text-muted-foreground">{suggestion.category}</p>
                                    )}
                                    <p className="text-sm font-semibold text-brand-blue mt-0.5">
                                      €{suggestion.price.toFixed(2)}
                                    </p>
                                  </div>
                                </button>
                              ))}
                              <div className="border-t border-border pt-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSearch(e as any);
                                  }}
                                  className="w-full px-4 py-2 text-sm font-medium text-brand-teal hover:bg-muted/50 transition-colors text-left"
                                >
                                  View all results for "{searchQuery}"
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
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
                        if (link.label === "Sunglasses") {
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
                                    setMobileSunglassesOpen(prev => !prev);
                                  }}
                                  className="font-body text-2xl font-bold hover:text-primary active:text-primary transition-colors text-foreground py-2 flex-shrink-0 w-full text-left flex items-center justify-between cursor-pointer relative z-10 touch-manipulation select-none"
                                  style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                  <span><TranslatableText text={link.label} /></span>
                                  <span className="text-lg select-none ml-2 pointer-events-none">
                                    {mobileSunglassesOpen ? '−' : '+'}
                                  </span>
                                </button>
                                {mobileSunglassesOpen && (
                                  <div className="pl-4 space-y-2 border-l-2 border-gray-200">
                                    <Link href="/shop" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="All Sunglasses" />
                                    </Link>
                                    <Link href="/shop/women" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="Women's" />
                                    </Link>
                                    <Link href="/shop/men" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="Men's" />
                                    </Link>
                                    <Link href="/shop/kids" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="Kids" />
                                    </Link>
                                    <Link href="/shop?filter=bestsellers" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="Best Sellers" />
                                    </Link>
                                    <Link href="/shop?filter=new-arrivals" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="New Arrivals" />
                                    </Link>

                                    {/* Shop By Brand - Sunglasses */}
                                    {sunglassesBrands.length > 0 && (
                                      <>
                                        <div className="pt-4 pb-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                          <TranslatableText text="Shop by Brand" />
                                        </div>
                                        {sunglassesBrands.map((brand) => (
                                          <Link
                                            key={brand.brand}
                                            href={`/shop?brand=${encodeURIComponent(brand.brand)}`}
                                            className="block text-lg hover:text-primary transition-colors text-foreground py-1 pl-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setIsSidebarOpen(false);
                                            }}
                                          >
                                            <TranslatableText text={brand.brand} />
                                          </Link>
                                        ))}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        if (link.label === "Eyeglasses") {
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
                                    setMobileEyeglassesOpen(prev => !prev);
                                  }}
                                  className="font-body text-2xl font-bold hover:text-primary active:text-primary transition-colors text-foreground py-2 flex-shrink-0 w-full text-left flex items-center justify-between cursor-pointer relative z-10 touch-manipulation select-none"
                                  style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                  <span><TranslatableText text={link.label} /></span>
                                  <span className="text-lg select-none ml-2 pointer-events-none">
                                    {mobileEyeglassesOpen ? '−' : '+'}
                                  </span>
                                </button>
                                {mobileEyeglassesOpen && (
                                  <div className="pl-4 space-y-2 border-l-2 border-gray-200">
                                    <Link href="/shop/prescription-glasses" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="All Eyeglasses" />
                                    </Link>
                                    <Link href="/shop/prescription-glasses/women" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="Women's" />
                                    </Link>
                                    <Link href="/shop/prescription-glasses/men" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="Men's" />
                                    </Link>
                                    <Link href="/shop/prescription-glasses/kids" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="Kids" />
                                    </Link>
                                    <Link href="/shop/prescription-glasses?filter=bestsellers" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="Best Sellers" />
                                    </Link>
                                    <Link href="/shop/prescription-glasses?filter=new-arrivals" className="block text-lg hover:text-primary transition-colors text-foreground py-1" onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSidebarOpen(false);
                                    }}>
                                      <TranslatableText text="New Arrivals" />
                                    </Link>

                                    {/* Shop By Brand - Eyeglasses */}
                                    {eyeglassesBrands.length > 0 && (
                                      <>
                                        <div className="pt-4 pb-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                          <TranslatableText text="Shop by Brand" />
                                        </div>
                                        {eyeglassesBrands.map((brand) => (
                                          <Link
                                            key={brand.brand}
                                            href={`/shop/prescription-glasses?brand=${encodeURIComponent(brand.brand)}`}
                                            className="block text-lg hover:text-primary transition-colors text-foreground py-1 pl-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setIsSidebarOpen(false);
                                            }}
                                          >
                                            <TranslatableText text={brand.brand} />
                                          </Link>
                                        ))}
                                      </>
                                    )}
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
                              <TranslatableText text={link.label} />
                            </Link>
                          </div>
                        );
                      })}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div >
          </div >
        </div >

        {/* Mega Menus Rendered Here for proper positioning */}
        <ShopMegaMenu
          isOpen={isSunglassesMenuOpen}
          onClose={() => setIsSunglassesMenuOpen(false)}
          isScrolled={isScrolled}
          type="sunglasses"
          initialColors={sunglassesColors}
          initialShapes={sunglassesShapes}
          initialBrands={sunglassesBrands}
          onMouseEnter={stopCloseMenuTimer}
          onMouseLeave={startCloseMenuTimer}
        />
        <ShopMegaMenu
          isOpen={isEyeglassesMenuOpen}
          onClose={() => setIsEyeglassesMenuOpen(false)}
          isScrolled={isScrolled}
          type="eyeglasses"
          initialColors={eyeglassesColors}
          initialShapes={eyeglassesShapes}
          initialBrands={eyeglassesBrands}
          onMouseEnter={stopCloseMenuTimer}
          onMouseLeave={startCloseMenuTimer}
        />
      </header >
    </>
  );
}
