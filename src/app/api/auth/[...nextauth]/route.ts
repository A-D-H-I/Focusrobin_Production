import { handlers } from "@/auth";

// Export handlers directly - NextAuth v5 handles errors internally
// Configuration errors will be logged in auth.ts during provider setup
export const { GET, POST } = handlers;

