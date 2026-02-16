"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chrome, Facebook, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerUser } from "@/app/actions/auth";
import { trackMetaEvent } from "@/components/analytics/MetaPixel";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    // Check if passwords match
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerUser(formData);

      if (result.success) {
        setSuccess(result.message || "Verification code sent to your email!");
        // Track CompleteRegistration event with Meta Pixel
        try {
          trackMetaEvent('CompleteRegistration', {
            content_name: 'Email Signup',
            status: 'pending_verification',
          });
        } catch (trackError) {
          console.error('[Signup] Meta Pixel tracking error:', trackError);
        }
        // Redirect to OTP verification page after 1 second
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(result.email || "")}`);
        }, 1000);
      } else {
        setError(result.error || "Failed to send verification code");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      await signIn("google", { callbackUrl: "/" });
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
      await signIn("facebook", { callbackUrl: "/" });
    } catch (error) {
      console.error("Facebook sign in error:", error);
      setError("Failed to sign in with Facebook. Please try again.");
      setIsFacebookLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md space-y-8">
        {/* Heading */}
        <h1 className="text-3xl font-semibold text-center text-gray-900">
          Create your account
        </h1>

        {/* Error Message */}
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
            <p>{success}</p>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Full name"
              required
              disabled={isLoading}
              className="h-12 text-base rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              disabled={isLoading}
              className="h-12 text-base rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                required
                minLength={6}
                disabled={isLoading}
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
            <p className="text-xs text-gray-500 pl-1">
              Must be at least 6 characters
            </p>
          </div>

          <div className="space-y-2">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              required
              minLength={6}
              disabled={isLoading}
              className="h-12 text-base rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            disabled={isLoading || isGoogleLoading || isFacebookLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {/* Privacy Notice */}
        <div className="text-center text-xs text-gray-500">
          <p>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            type="button"
            onClick={handleFacebookSignIn}
            disabled={isLoading || isGoogleLoading || isFacebookLoading}
            className="w-full h-12 text-base font-medium bg-black hover:bg-gray-900 text-white rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            {isFacebookLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Facebook className="h-5 w-5 fill-white" />
                Sign up with Facebook
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading || isFacebookLoading}
            className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Chrome className="h-5 w-5" />
                Sign up with Google
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
