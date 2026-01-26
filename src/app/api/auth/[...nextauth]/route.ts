import { handlers } from "@/auth";

// Explicitly set runtime to Node.js since we use Node.js modules (crypto, bcrypt, etc.)
export const runtime = 'nodejs';

// Export handlers directly - NextAuth v5 handles errors internally
// Configuration errors will be logged in auth.ts during provider setup
export const { GET, POST } = handlers;

