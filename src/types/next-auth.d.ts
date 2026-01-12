import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            tenantId?: string;
            supplierId?: string;
            isSuperAdmin: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: string;
        tenantId?: string;
        supplierId?: string;
        isSuperAdmin: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId: string;
        role: string;
        tenantId?: string;
        supplierId?: string;
        isSuperAdmin: boolean;
    }
}
