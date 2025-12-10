import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const userCount = await prisma.user.count();
        const firstUser = await prisma.user.findFirst();
        return NextResponse.json({ status: "ok", userCount, firstUser });
    } catch (e: any) {
        return NextResponse.json({ status: "error", message: e.message, details: e }, { status: 500 });
    }
}
