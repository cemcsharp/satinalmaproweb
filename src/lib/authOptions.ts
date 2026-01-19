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
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "").trim();

        if (!email || !password) {
          return null;
        }

        // Brute-force protection
        if (loginLimiter.isBlocked(email)) {
          console.warn(`[Auth] Blocked: ${email}`);
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

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

        const ok = await verifyPassword(password, user.passwordHash);

        if (!ok) {
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

        // Check if user is active
        if (!user.isActive) {
          console.warn(`[Auth] User inactive/pending approval: ${email}`);
          return null;
        }

        // Check associated tenant (organization) status
        if (user.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId }
          });
          if (!tenant || !tenant.isActive) {
            console.warn(`[Auth] Organization account inactive: ${email}`);
            return null;
          }
          if (tenant.planExpiresAt && new Date(tenant.planExpiresAt) < new Date()) {
            console.warn(`[Auth] Organization subscription expired: ${email}`);
            return null;
          }
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
        return {
          id: user.id,
          email: user.email ?? null,
          role: "user", // Initial fallback, JWT callback will sync the real role from DB
          isSuperAdmin: !!user.isSuperAdmin,
          tenantId: user.tenantId || undefined,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      const tok = token as JWT & {
        userId?: string;
        role?: string;
        tenantId?: string;
        supplierId?: string;
        isSuperAdmin?: boolean;
      };

      const initialUserId = (user as { id?: string } | null)?.id;
      if (initialUserId && !tok.userId) tok.userId = String(initialUserId);

      const uid = String((tok.userId || (token as any).sub || initialUserId || ""));
      if (uid) {
        try {
          // Fetch actual user with their Role relation and tenant/supplier info
          const me = await prisma.user.findUnique({
            where: { id: uid },
            include: { roleRef: true }
          });

          if (me) {
            tok.userId = uid;
            tok.role = me.roleRef?.key || "user";
            tok.tenantId = me.tenantId || undefined;
            tok.isSuperAdmin = !!me.isSuperAdmin;
          }
        } catch (err) {
          console.error('[Auth JWT] Sync error:', err);
        }
      }
      return tok;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as {
          id?: string;
          role?: string;
          tenantId?: string;
          supplierId?: string;
          isSuperAdmin?: boolean;
        };

        const tok = token as {
          userId?: string;
          role?: string;
          tenantId?: string;
          supplierId?: string;
          isSuperAdmin?: boolean;
        };

        if (tok.userId) u.id = tok.userId;
        if (tok.role) u.role = tok.role;
        if (tok.tenantId) u.tenantId = tok.tenantId;
        u.isSuperAdmin = !!tok.isSuperAdmin;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};
