import { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
// Rolled back to email-based credentials; rate limiting handled via separate API

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim();
        const password = String(credentials?.password || "").trim();
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email ?? null };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      const tok = token as JWT & { userId?: string; role?: string };
      const initialUserId = (user as { id?: string } | null)?.id;
      if (initialUserId && !tok.userId) tok.userId = String(initialUserId);
      const uid = String((tok.userId || (token as any).sub || initialUserId || ""));
      if (uid) {
        try {
          const me = await prisma.user.findUnique({ where: { id: uid } });
          tok.userId = uid;
          let role: string | undefined = (me as any)?.role;
          // Legacy roleId fallback removed
          if (!role) {
            const isAdminEmail = String(me?.email || "").toLowerCase() === "admin@sirket.com";
            role = (me?.username === "admin" || isAdminEmail) ? "admin" : "user";
          }
          tok.role = role;
        } catch { }
      }
      return tok;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: string; role?: string };
        if ((token as { userId?: string }).userId) u.id = (token as { userId?: string }).userId as string;
        if ((token as { role?: string }).role) u.role = (token as { role?: string }).role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};
