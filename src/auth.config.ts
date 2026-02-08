import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    providers: [], // Providers are configured in auth.ts
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            // This is called by the middleware to check authorization
            // We handle complex logic in middleware.ts, so we just return true here
            // and let middleware handle redirects/protection
            return true;
        },
        jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;
                if ((user as any).role) {
                    token.role = (user as any).role;
                }
            }

            // Handle session updates (e.g. client side update() call)
            if (trigger === "update" && session) {
                return { ...token, ...session };
            }

            return token;
        },
        session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id as string;
                if (token.role) {
                    session.user.role = token.role as string;
                }
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
