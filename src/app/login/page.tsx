"use client";

import { signIn, getProviders } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Chrome, Facebook, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<any>(null);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Load available providers with retry logic
  useEffect(() => {
    const loadProviders = async (retry = 0) => {
      setProvidersLoading(true);
      try {
        // Try getProviders first
        const availableProviders = await getProviders();
        console.log("Available providers:", availableProviders);
        if (availableProviders && Object.keys(availableProviders).length > 0) {
          setProviders(availableProviders);
          setProvidersLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error loading providers with getProviders:", error);
      }

      // Fallback: try to fetch providers from API directly
      try {
        const response = await fetch("/api/auth/providers", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Providers from API:", data);
          if (data && Object.keys(data).length > 0) {
            setProviders(data);
            setProvidersLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.error("Error fetching providers from API:", apiError);
      }

      // If still no providers and we haven't retried too many times, retry
      if (retry < 2) {
        console.log(`Retrying provider load (attempt ${retry + 1})...`);
        setTimeout(() => {
          loadProviders(retry + 1);
        }, 1000 * (retry + 1)); // Exponential backoff
      } else {
        setProvidersLoading(false);
        // Set default providers if we know they should be available
        // This ensures buttons show even if API fails
        setProviders({
          google: { id: "google", name: "Google", type: "oauth" },
          facebook: { id: "facebook", name: "Facebook", type: "oauth" },
        });
      }
    };
    loadProviders();
  }, [retryCount]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  // Check for error in URL
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "OAuthAccountNotLinked":
          setError("This email is already associated with another account. Please sign in using your original method.");
          break;
        case "OAuthCallback":
          setError("Authentication failed. Please try again.");
          break;
        case "Configuration":
          setError("Authentication failed. Please try again. If the problem persists, contact support.");
          break;
        case "AccessDenied":
          setError("Access denied. You may have cancelled the login or the app doesn't have permission.");
          break;
        case "OAuthSignin":
          setError("Error initiating sign in. Please try again.");
          break;
        case "OAuthCreateAccount":
          setError("Could not create account. Please try again.");
          break;
        default:
          setError(`An error occurred during sign in: ${errorParam}. Please try again.`);
      }
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      
      // Get the current origin to handle both ngrok and localhost
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}${callbackUrl}`;
      
      await signIn("google", { 
        callbackUrl: redirectUrl,
        redirect: true 
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setIsFacebookLoading(true);
      setError(null);
      
      // Get the current origin to handle both ngrok and localhost
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}${callbackUrl}`;
      
      console.log("Attempting Facebook sign in with callback URL:", redirectUrl);
      
      await signIn("facebook", { 
        callbackUrl: redirectUrl,
        redirect: true 
      });
    } catch (error: any) {
      console.error("Facebook sign in error:", error);
      const errorMessage = error?.message || "Failed to sign in with Facebook. Please try again.";
      setError(`Facebook login error: ${errorMessage}. Make sure your Facebook app is configured correctly and the redirect URI matches.`);
      setIsFacebookLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login page if already authenticated
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600" />
          <p className="mt-4 text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-teal-600 hover:text-teal-700 transition-colors">
            <ShoppingBag className="h-8 w-8" />
            FocusRobin
          </Link>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Choose your preferred sign in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Loading providers */}
            {providersLoading && !providers && (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-600" />
                <p className="mt-2 text-sm text-muted-foreground">Loading sign in options...</p>
              </div>
            )}

            {/* Show available providers - Always show both buttons once loading is complete */}
            {!providersLoading && (
              <div className="space-y-3">
                {/* Google Sign In - Always show */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-base font-semibold gap-3 hover:bg-gray-50 transition-all"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isFacebookLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Chrome className="h-5 w-5" />
                  )}
                  {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                </Button>

                {/* Facebook Sign In - Always show */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-base font-semibold gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white border-[#1877F2] hover:border-[#166FE5] transition-all disabled:opacity-50"
                  onClick={handleFacebookSignIn}
                  disabled={isGoogleLoading || isFacebookLoading}
                >
                  {isFacebookLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Facebook className="h-5 w-5 fill-current" />
                  )}
                  {isFacebookLoading ? "Connecting..." : "Continue with Facebook"}
                </Button>

                {/* Retry button if providers failed to load */}
                {!providers && !providersLoading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setRetryCount(prev => prev + 1);
                      setProvidersLoading(true);
                    }}
                  >
                    Retry loading providers
                  </Button>
                )}

                {/* Debug info in development */}
                {process.env.NODE_ENV === "development" && providers && (
                  <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                    Debug: Providers loaded - Google: {providers.google ? "✓" : "✗"}, Facebook: {providers.facebook ? "✓" : "✗"}
                  </div>
                )}
              </div>
            )}

            {/* Show message if Facebook is not configured */}
            {providers && providers.google && !providers.facebook && (
              <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                <p className="font-semibold">Facebook login not configured yet</p>
                <p className="text-xs mt-1">Add AUTH_FACEBOOK_ID and AUTH_FACEBOOK_SECRET to your .env.local file. See FACEBOOK_LOGIN_SETUP.md for instructions.</p>
              </div>
            )}

            {/* Show helpful message if no providers are available */}
            {providers && Object.keys(providers).length === 0 && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <p className="font-semibold">No authentication providers configured</p>
                <p className="text-xs mt-1">Please configure at least one OAuth provider (Google or Facebook) in your .env.local file.</p>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Secure Sign In
                </span>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="text-center text-xs text-muted-foreground space-y-2 pt-2">
              <p>
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
              </p>
              <p className="flex items-center justify-center gap-1 text-teal-600 font-medium">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secure authentication with OAuth 2.0
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
