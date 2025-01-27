import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Extended User type to include 'role'.
   */
  interface User extends DefaultUser {
    role: string; // Add role field
  }

  /**
   * Extended Session type to include 'user.role'.
   */
  interface Session extends DefaultSession {
    user: {
      role: string; // Add role field
    } & DefaultSession["user"];
  }

  /**
   * Extended JWT type to include 'role'.
   */
  interface JWT {
    role: string; // Add role field
  }
}