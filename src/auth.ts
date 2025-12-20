import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Get environment variables with fallbacks
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const facebookClientId = process.env.AUTH_FACEBOOK_ID || process.env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = process.env.AUTH_FACEBOOK_SECRET || process.env.FACEBOOK_CLIENT_SECRET;

if (!authSecret) {
  throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required");
}

if (!googleClientId || !googleClientSecret) {
  console.warn("⚠️ Google OAuth credentials not found. Sign in with Google will not work.");
}

// Validate Facebook credentials
const hasFacebookCredentials = !!(facebookClientId && facebookClientSecret);
if (!hasFacebookCredentials) {
  console.warn("⚠️ Facebook OAuth credentials not found. Sign in with Facebook will not work.");
  console.warn("   Add AUTH_FACEBOOK_ID and AUTH_FACEBOOK_SECRET to your .env.local file.");
} else {
  // Validate Facebook credentials format
  if (facebookClientId && facebookClientId.length < 10) {
    console.warn("⚠️ Facebook App ID appears to be invalid (too short).");
  }
  if (facebookClientSecret && facebookClientSecret.length < 10) {
    console.warn("⚠️ Facebook App Secret appears to be invalid (too short).");
  }
  if (process.env.NODE_ENV === "development") {
    console.log("✅ Facebook OAuth credentials found. Facebook login is enabled.");
  }
}

// Build providers array with error handling
const providers: any[] = [];

// Add Google provider
if (googleClientId && googleClientSecret) {
  try {
    providers.push(
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      })
    );
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Google OAuth provider configured");
    }
  } catch (error) {
    console.error("❌ Error configuring Google provider:", error);
  }
}

// Add Facebook provider with enhanced error handling
if (facebookClientId && facebookClientSecret) {
  try {
    // Validate credentials before adding provider
    if (facebookClientId.length < 10 || facebookClientSecret.length < 10) {
      throw new Error("Facebook credentials appear to be invalid (too short)");
    }
    
    providers.push(
      Facebook({
        clientId: facebookClientId,
        clientSecret: facebookClientSecret,
        authorization: {
          params: {
            scope: "email public_profile",
          },
        },
        // Handle profile to ensure we always have an email
        profile(profile) {
          // Facebook may not return an email for some users
          // Generate a fallback email using their Facebook ID
          const email = profile.email || `${profile.id}@facebook.placeholder.com`;
          
          return {
            id: profile.id,
            name: profile.name,
            email: email,
            image: profile.picture?.data?.url,
          };
        },
      })
    );
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Facebook OAuth provider configured");
      console.log(`   App ID: ${facebookClientId.substring(0, 8)}...`);
    }
  } catch (error: any) {
    console.error("❌ Error configuring Facebook provider:", error?.message || error);
    console.error("   This will cause a 'Configuration' error when trying to sign in with Facebook.");
    console.error("   Please check your AUTH_FACEBOOK_ID and AUTH_FACEBOOK_SECRET values.");
  }
} else {
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️ Facebook provider not added - credentials missing");
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  secret: authSecret,
  trustHost: true, // Required for NextAuth v5 - allows dynamic host detection
  debug: process.env.NODE_ENV === "development", // Enable debug in development
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Log authentication attempt for debugging
      if (process.env.NODE_ENV === "development" && account) {
        console.log(`🔐 Sign in attempt: ${account.provider} - ${user?.email || 'using placeholder email'}`);
      }

      // Log if Facebook didn't return an email (we now handle this with a placeholder)
      if (account?.provider === "facebook" && user?.email?.includes('@facebook.placeholder.com')) {
        console.log("ℹ️ Facebook did not return email - using placeholder email for user");
      }

      // Process welcome bonus after user is created
      // Use setTimeout to ensure user is fully created by PrismaAdapter
      if (user?.email && account) {
        // Process welcome bonus asynchronously after a short delay
        setTimeout(async () => {
          try {
            // Find user by email (they should be created by now)
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email! },
              select: { id: true },
            });

            if (!dbUser) {
              console.log('User not found in database yet, welcome bonus will be processed on next login');
              return;
            }

            // Get or create wallet for user
            let wallet = await (prisma as any).wallet.findUnique({
              where: { userId: dbUser.id },
            });
            
            if (!wallet) {
              // Create wallet if it doesn't exist
              wallet = await (prisma as any).wallet.create({
                data: { userId: dbUser.id, balance: 0 },
              });
            }

            // Check if user has already received welcome bonus
            const hasWelcomeBonus = await (prisma as any).walletTransaction.findFirst({
              where: {
                walletId: wallet.id,
                description: { contains: 'Welcome bonus' },
              },
            });

            // If no welcome bonus transaction exists, give it
            if (!hasWelcomeBonus) {
              // Get welcome bonus amount from settings
              const welcomeBonusSetting = await (prisma as any).settings.findUnique({
                where: { key: 'welcome_bonus_amount' },
              });

              const welcomeBonusAmount = welcomeBonusSetting 
                ? parseFloat(welcomeBonusSetting.value) || 0 
                : 10.00; // Default to €10 if not set

              if (welcomeBonusAmount > 0) {
                // Update wallet balance
                await (prisma as any).wallet.update({
                  where: { id: wallet.id },
                  data: {
                    balance: {
                      increment: welcomeBonusAmount,
                    },
                  },
                });

                // Create transaction record
                await (prisma as any).walletTransaction.create({
                  data: {
                    walletId: wallet.id,
                    amount: welcomeBonusAmount,
                    type: 'CREDIT',
                    description: `Welcome bonus - €${welcomeBonusAmount.toFixed(2)}`,
                  },
                });

                console.log(`✅ Welcome bonus of €${welcomeBonusAmount.toFixed(2)} credited to user ${dbUser.id}`);
              }
            }
          } catch (error) {
            console.error('❌ Error processing welcome bonus:', error);
            // Don't block sign in if welcome bonus fails
          }
        }, 500); // Wait 500ms for user to be created
      }

      return true;
    },
    async session({ session, user }: any) {
      if (session?.user) {
        let userId: string | undefined;
        
        // Try to get user ID from user parameter (database strategy)
        if (user?.id) {
          userId = user.id;
        }
        // Fallback: fetch user by email
        else if (session.user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true },
          });
          if (dbUser) {
            userId = dbUser.id;
            session.user.role = dbUser.role;
          }
        }

        // Fetch user with role if we have userId
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
          });

          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;

            // Fallback: Check and process welcome bonus if user was created recently (within last 5 minutes)
            // This ensures welcome bonus is given even if signIn callback failed
            try {
              const userWithCreatedAt = await prisma.user.findUnique({
                where: { id: dbUser.id },
                select: { createdAt: true },
              });

              // Only check if user was created in the last 5 minutes (likely new user)
              if (userWithCreatedAt) {
                const userAge = Date.now() - new Date(userWithCreatedAt.createdAt).getTime();
                const fiveMinutes = 5 * 60 * 1000;

                if (userAge < fiveMinutes) {
                  let wallet = await (prisma as any).wallet.findUnique({
                    where: { userId: dbUser.id },
                  });
                  
                  if (!wallet) {
                    wallet = await (prisma as any).wallet.create({
                      data: { userId: dbUser.id, balance: 0 },
                    });
                  }

                  const hasWelcomeBonus = await (prisma as any).walletTransaction.findFirst({
                    where: {
                      walletId: wallet.id,
                      description: { contains: 'Welcome bonus' },
                    },
                  });

                  if (!hasWelcomeBonus) {
                    const welcomeBonusSetting = await (prisma as any).settings.findUnique({
                      where: { key: 'welcome_bonus_amount' },
                    });

                    const welcomeBonusAmount = welcomeBonusSetting 
                      ? parseFloat(welcomeBonusSetting.value) || 0 
                      : 10.00;

                    if (welcomeBonusAmount > 0) {
                      await (prisma as any).wallet.update({
                        where: { id: wallet.id },
                        data: {
                          balance: {
                            increment: welcomeBonusAmount,
                          },
                        },
                      });

                      await (prisma as any).walletTransaction.create({
                        data: {
                          walletId: wallet.id,
                          amount: welcomeBonusAmount,
                          type: 'CREDIT',
                          description: `Welcome bonus - €${welcomeBonusAmount.toFixed(2)}`,
                        },
                      });

                      console.log(`✅ Welcome bonus of €${welcomeBonusAmount.toFixed(2)} credited to user ${dbUser.id} (via session callback fallback)`);
                    }
                  }
                }
              }
            } catch (error) {
              // Silently fail - don't log to avoid spam
            }
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
});

