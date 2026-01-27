"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerUser(formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // Validate input
    const validation = signupSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
      };
    }

    const { name, email, password } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10); // OTP expires in 10 minutes

    // Store signup data temporarily with OTP in VerificationToken
    // Token contains JSON with OTP and signup data
    const signupData = JSON.stringify({
      otp,
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    // Delete any existing OTP tokens for this email first
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
        // Also check if it's a signup token (contains OTP in JSON)
      },
    });

    // Store OTP and signup data
    await prisma.verificationToken.create({
      data: {
        identifier: `SIGNUP_${normalizedEmail}`, // Use prefix to distinguish from password reset tokens
        token: signupData, // JSON string with OTP and signup data
        expires,
      },
    });

    // Send OTP email
    const { sendOTPEmail } = await import("@/lib/otp-email");
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      // Clean up token if email fails
      await prisma.verificationToken.deleteMany({
        where: { identifier: `SIGNUP_${normalizedEmail}` },
      });
      return {
        success: false,
        error: "Failed to send verification email. Please try again.",
      };
    }

    return {
      success: true,
      email: normalizedEmail, // Return email for OTP verification page
      message: "Verification code sent to your email. Please check your inbox.",
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }
}

export async function verifyOTPAndRegister(email: string, otp: string) {
  try {
    const normalizedEmail = email.toLowerCase();
    const identifier = `SIGNUP_${normalizedEmail}`;

    // Find OTP token
    const verificationTokens = await prisma.verificationToken.findMany({
      where: { identifier },
    });

    // Find valid token (not expired)
    let validToken = null;
    for (const token of verificationTokens) {
      if (token.expires > new Date()) {
        try {
          const signupData = JSON.parse(token.token);
          if (signupData.otp === otp) {
            validToken = { ...token, signupData };
            break;
          }
        } catch {
          // Invalid JSON, skip
          continue;
        }
      }
    }

    if (!validToken) {
      return {
        success: false,
        error: "Invalid or expired verification code. Please request a new one.",
      };
    }

    const { name, email: storedEmail, password: hashedPassword } = validToken.signupData;

    // Check if user already exists (in case of race condition)
    const existingUser = await prisma.user.findUnique({
      where: { email: storedEmail },
    });

    if (existingUser) {
      // Clean up token
      await prisma.verificationToken.delete({
        where: { token: validToken.token },
      });
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    // Create user account
    const user = await prisma.user.create({
      data: {
        name,
        email: storedEmail,
        password: hashedPassword,
        role: "USER",
        emailVerified: new Date(), // Mark email as verified
      },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { token: validToken.token },
    });

    // Clean up any expired tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    return {
      success: true,
      message: "Account created successfully! Please sign in.",
    };
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return {
      success: false,
      error: "Failed to verify code. Please try again.",
    };
  }
}

export async function resendOTP(email: string) {
  try {
    const normalizedEmail = email.toLowerCase();
    const identifier = `SIGNUP_${normalizedEmail}`;

    // Find existing signup token
    const verificationTokens = await prisma.verificationToken.findMany({
      where: { identifier },
    });

    let existingToken = null;
    for (const token of verificationTokens) {
      if (token.expires > new Date()) {
        try {
          const signupData = JSON.parse(token.token);
          existingToken = { ...token, signupData };
          break;
        } catch {
          continue;
        }
      }
    }

    if (!existingToken) {
      return {
        success: false,
        error: "No pending signup found. Please start the registration process again.",
      };
    }

    // Generate new OTP
    const newOTP = generateOTP();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    // Update token with new OTP
    const updatedSignupData = {
      ...existingToken.signupData,
      otp: newOTP,
    };

    // Delete old token
    await prisma.verificationToken.delete({
      where: { token: existingToken.token },
    });

    // Create new token
    await prisma.verificationToken.create({
      data: {
        identifier,
        token: JSON.stringify(updatedSignupData),
        expires,
      },
    });

    // Send new OTP email
    const { sendOTPEmail } = await import("@/lib/otp-email");
    const emailResult = await sendOTPEmail(normalizedEmail, newOTP);

    if (!emailResult.success) {
      return {
        success: false,
        error: "Failed to send verification email. Please try again.",
      };
    }

    return {
      success: true,
      message: "Verification code resent to your email.",
    };
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return {
      success: false,
      error: "Failed to resend code. Please try again.",
    };
  }
}

export async function verifyCredentials(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        image: true,
      },
    });

    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Credential verification error:", error);
    return null;
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    // Delete any existing tokens for this email first
    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() },
    });

    // Store new token in database
    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: resetToken,
        expires,
      },
    });

    // Send reset email
    const { sendPasswordResetEmail } = await import("@/lib/password-reset-email");
    await sendPasswordResetEmail(email, resetToken);

    return {
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    };
  } catch (error: any) {
    console.error("Password reset request error:", error);
    return {
      success: true, // Still return success to prevent enumeration
      message: "If an account exists with that email, a password reset link has been sent.",
    };
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    // Validate password
    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters",
      };
    }

    // Find token in database
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return {
        success: false,
        error: "Invalid or expired reset token",
      };
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return {
        success: false,
        error: "Reset token has expired. Please request a new one.",
      };
    }

    // Find user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return {
      success: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error: "Failed to reset password. Please try again.",
    };
  }
}
