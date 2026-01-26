"use client";

import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chrome, Facebook, Loader2, Eye, EyeOff } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login page if already authenticated
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-4 text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md space-y-8">
        {/* Welcome back heading */}
        <h1 className="text-3xl font-semibold text-center text-gray-900">
          Welcome back
        </h1>

        {/* Error Message */}
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-5">
          <div className="space-y-2">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              disabled={isEmailLoading}
              className="h-12 text-base rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-end">
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot Password
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                disabled={isEmailLoading}
                className="h-12 text-base pr-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            disabled={isEmailLoading || isGoogleLoading || isFacebookLoading}
          >
            {isEmailLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              href="/signup" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Signup
            </Link>
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            type="button"
            onClick={handleFacebookSignIn}
            disabled={isEmailLoading || isGoogleLoading || isFacebookLoading}
            className="w-full h-12 text-base font-medium bg-black hover:bg-gray-900 text-white rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            {isFacebookLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Facebook className="h-5 w-5 fill-white" />
                Log in with Facebook
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isEmailLoading || isGoogleLoading || isFacebookLoading}
            className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Chrome className="h-5 w-5" />
                Log in with Google
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
