"use client";

import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Chrome, Facebook, Loader2, ShoppingBag, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

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
        case "CredentialsSignin":
          setError("Invalid email or password. Please try again.");
          break;
        case "OAuthCallback":
          setError("Authentication failed. Please try again.");
          break;
        case "Configuration":
          setError("Authentication service error. Please try again later.");
          break;
        case "AccessDenied":
          setError("Access denied. You may have cancelled the login.");
          break;
        default:
          setError(`An error occurred: ${errorParam}. Please try again.`);
      }
    }
  }, [searchParams]);

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsEmailLoading(false);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Failed to sign in. Please try again.");
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      // NextAuth handles callbackUrl internally - just pass the relative path
      await signIn("google", { callbackUrl, redirect: true });
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
      // NextAuth handles callbackUrl internally - just pass the relative path
      await signIn("facebook", { callbackUrl, redirect: true });
    } catch (error) {
      console.error("Facebook sign in error:", error);
      setError("Failed to sign in with Facebook. Please try again.");
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-teal/5 via-white to-brand-blue/5 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-blue/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo and Brand Header */}
        <div className="text-center mb-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-3 mb-6 group transition-transform hover:scale-105"
          >
            <div className="p-2 bg-gradient-to-br from-brand-teal to-brand-blue rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <span className="text-4xl font-headline font-bold bg-gradient-to-r from-brand-teal to-brand-blue bg-clip-text text-transparent">
              FocusRobin
            </span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-brand-blue mb-2">
            Sign In
          </h1>
          <p className="text-muted-foreground text-base">
            Sign in to your account
          </p>
        </div>

        <Card className="shadow-2xl border border-border/50 bg-white/95 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-teal via-brand-blue to-brand-teal"></div>
          
          <CardHeader className="space-y-2 text-center pb-6 pt-8">
            <CardTitle className="text-2xl sm:text-3xl font-headline font-bold text-brand-blue">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base">
              Choose your preferred sign in method
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8">
            {/* Error Message */}
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-md animate-in slide-in-from-top-2">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* OAuth Providers */}
            <div className="space-y-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-base font-semibold gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md border-2"
                onClick={handleGoogleSignIn}
                disabled={isEmailLoading || isGoogleLoading || isFacebookLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Chrome className="h-5 w-5 text-[#4285F4]" />
                )}
                {isGoogleLoading ? "Connecting..." : "Continue with Google"}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-base font-semibold gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white border-[#1877F2] hover:border-[#166FE5] transition-all shadow-sm hover:shadow-md border-2"
                onClick={handleFacebookSignIn}
                disabled={isEmailLoading || isGoogleLoading || isFacebookLoading}
              >
                {isFacebookLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Facebook className="h-5 w-5 fill-current" />
                )}
                {isFacebookLoading ? "Connecting..." : "Continue with Facebook"}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white px-4 text-muted-foreground font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-brand-blue">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={isEmailLoading}
                  className="h-12 text-base border-2 focus:border-brand-teal focus:ring-brand-teal/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-brand-blue">
                    Password
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-brand-teal hover:text-brand-blue font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    disabled={isEmailLoading}
                    className="h-12 text-base pr-12 border-2 focus:border-brand-teal focus:ring-brand-teal/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-teal transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-brand-teal to-brand-blue hover:from-brand-teal/90 hover:to-brand-blue/90 text-white shadow-lg hover:shadow-xl transition-all mt-6"
                disabled={isEmailLoading || isGoogleLoading || isFacebookLoading}
              >
                {isEmailLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Privacy Notice */}
            <div className="text-center text-xs text-muted-foreground space-y-3 pt-4 border-t">
              <p className="leading-relaxed">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-brand-teal hover:text-brand-blue font-semibold underline-offset-2 hover:underline transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-brand-teal hover:text-brand-blue font-semibold underline-offset-2 hover:underline transition-colors">
                  Privacy Policy
                </Link>
              </p>
              <div className="flex items-center justify-center gap-2 text-brand-teal font-semibold">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secure authentication</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              href="/signup" 
              className="text-brand-teal hover:text-brand-blue font-bold transition-colors underline-offset-2 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-brand-teal transition-colors inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
