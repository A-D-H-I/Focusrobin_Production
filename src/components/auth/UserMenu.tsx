"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { User, LogOut, ShoppingBag, Heart, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  isScrolled?: boolean;
  iconColorNotScrolled?: string;
}

export default function UserMenu({ isScrolled = false, iconColorNotScrolled }: UserMenuProps = {}) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    // Redirect to login page instead of directly signing in
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
    const loginUrl = `/login${currentUrl !== '/' && currentUrl !== '/login' ? `?callbackUrl=${encodeURIComponent(currentUrl)}` : ''}`;
    window.location.href = loginUrl;
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // Use current origin to ensure redirect works with ngrok
      const callbackUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/`
        : "/";
      await signOut({ callbackUrl });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session?.user) {
    // Determine button styling based on scroll state and navbar settings
    const isWhite = iconColorNotScrolled === 'white' || (!iconColorNotScrolled && !isScrolled);
    const isBlack = iconColorNotScrolled === 'black';
    
    return (
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        variant={isScrolled ? "outline" : "default"}
        size="sm"
        className={cn(
          "gap-2 transition-colors duration-300",
          isScrolled
            ? "border-brand-blue text-brand-blue hover:bg-accent hover:text-brand-blue"
            : isWhite
            ? "bg-white text-brand-blue hover:bg-white/90 border-white"
            : isBlack
            ? "bg-black text-white hover:bg-black/90 border-black"
            : "bg-white text-brand-blue hover:bg-white/90 border-white"
        )}
        style={!isScrolled && iconColorNotScrolled && iconColorNotScrolled !== 'white' && iconColorNotScrolled !== 'black'
          ? {
              backgroundColor: iconColorNotScrolled,
              color: '#0d9488', // brand-blue for contrast
              borderColor: iconColorNotScrolled,
            }
          : undefined
        }
      >
        <User className="h-4 w-4" />
        Sign In
      </Button>
    );
  }

  const user = session.user;
  const userRole = (user as any)?.role;
  const isAdmin = userRole === "ADMIN";
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user.email?.[0].toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 z-[110]"
        sideOffset={8}
        alignOffset={-8}
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/cart" className="flex items-center cursor-pointer">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Cart
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wishlist" className="flex items-center cursor-pointer">
            <Heart className="mr-2 h-4 w-4" />
            Wishlist
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

