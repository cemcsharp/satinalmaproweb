import { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loginLimiter } from "@/lib/rateLimit";
import { headers } from "next/headers";

// Email-based authentication with rate limiting and LoginAttempt tracking
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        console.log('[Auth Debug] ====== LOGIN ATTEMPT ======');
        console.log('[Auth Debug] Credentials:', { email: credentials?.email, hasPassword: !!credentials?.password });

        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "").trim();

        console.log('[Auth Debug] Processed:', { email, passwordLength: password.length });

        if (!email || !password) {
          console.log('[Auth Debug] FAIL: Empty email or password');
          return null;
        }

        // Brute-force protection
        if (loginLimiter.isBlocked(email)) {
          console.warn(`[Auth] Blocked: ${email}`);
          return null;
        }

        console.log('[Auth Debug] Fetching user from DB...');
        const user = await prisma.user.findUnique({ where: { email } });
        console.log('[Auth Debug] User found:', user ? `Yes (${user.username})` : 'No');

        // Get request metadata for logging
        let ip = null;
        let userAgent = null;
        try {
          const hdrs = await headers();
          ip = (hdrs.get("x-forwarded-for") || hdrs.get("x-real-ip") || "").split(",")[0] || null;
          userAgent = hdrs.get("user-agent") || null;
        } catch (err) {
          console.warn('[Auth] Failed to get headers:', err);
        }

        if (!user) {
          // Record failed attempt - user not found
          loginLimiter.recordAttempt(email, false);
          try {
            await prisma.loginAttempt.create({
              data: {
                email,
                ip,
                userAgent,
                success: false,
                reason: "user_not_found"
              }
            });
          } catch (err) {
            console.error('[Auth] LoginAttempt log error:', err);
          }
          return null;
        }

        console.log('[Auth Debug] Verifying password...');
        const ok = await verifyPassword(password, user.passwordHash);
        console.log('[Auth Debug] Password verify result:', ok);

        if (!ok) {
          console.log('[Auth Debug] FAIL: Invalid password');
          // Record failed attempt - invalid password
          loginLimiter.recordAttempt(email, false);
          try {
            await prisma.loginAttempt.create({
              data: {
                email,
                ip,
                userAgent,
                success: false,
                reason: "invalid_password"
              }
            });
          } catch (err) {
            console.error('[Auth] LoginAttempt log error:', err);
          }
          return null;
        }

        // Successful login: reset limiter and log
        loginLimiter.recordAttempt(email, true);
        try {
          await Promise.all([
            prisma.loginAttempt.create({
              data: {
                email,
                ip,
                userAgent,
                success: true,
                reason: null
              }
            }),
            prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() }
            })
          ]);
        } catch (err) {
          console.error('[Auth] Login success update error:', err);
        }
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
          // Fetch actual user with their Role relation
          const me = await prisma.user.findUnique({
            where: { id: uid },
            include: { roleRef: true }
          });

          tok.userId = uid;

          // Prioritize roleRef.key, fallback to flat role field
          const role = me?.roleRef?.key || me?.role || "user";
          tok.role = role;
        } catch (err) {
          console.error('[Auth JWT] Sync error:', err);
        }
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
