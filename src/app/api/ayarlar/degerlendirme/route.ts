import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAdminApi } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiError";

export async function GET(req: NextRequest) {
    try {
        const admin = await ensureAdminApi(req);
        if (!admin) return jsonError(403, "forbidden");

        const questions = await prisma.evaluationQuestion.findMany({
            orderBy: { sort: "asc" },
            include: {
                scoringType: true,
            }
        });

        const scoringTypes = await prisma.scoringType.findMany({
            where: { active: true },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ questions, scoringTypes });
    } catch (e) {
        console.error(e);
        return jsonError(500, "server_error");
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await ensureAdminApi(req);
        if (!admin) return jsonError(403, "forbidden");

        const body = await req.json();
        const text = String(body.text || "").trim();
        const type = String(body.type || "rating"); // rating, text, dropdown
        const scoringTypeId = body.scoringTypeId ? String(body.scoringTypeId) : null;
        const section = body.section ? String(body.section) : null;

        if (!text) return jsonError(400, "text_required");

        // Get max sort
        const agg = await prisma.evaluationQuestion.aggregate({ _max: { sort: true } });
        const nextSort = (agg._max.sort ?? 0) + 1;

        const question = await prisma.evaluationQuestion.create({
            data: {
                text,
                type,
                scoringTypeId,
                section,
                sort: nextSort,
                active: true,
                required: body.required ?? false,
            }
        });

        return NextResponse.json(question, { status: 201 });
    } catch (e) {
        console.error(e);
        return jsonError(500, "server_error");
    }
}

export async function PUT(req: NextRequest) {
    try {
        const admin = await ensureAdminApi(req);
        if (!admin) return jsonError(403, "forbidden");

        const body = await req.json();
        const id = String(body.id || "");
        if (!id) return jsonError(400, "id_required");

        const data: any = {};
        if (body.text !== undefined) data.text = String(body.text).trim();
        if (body.type !== undefined) data.type = String(body.type);
        if (body.scoringTypeId !== undefined) data.scoringTypeId = body.scoringTypeId || null;
        if (body.section !== undefined) data.section = body.section || null;
        if (body.active !== undefined) data.active = Boolean(body.active);
        if (body.required !== undefined) data.required = Boolean(body.required);
        if (body.sort !== undefined) data.sort = Number(body.sort);

        const question = await prisma.evaluationQuestion.update({
            where: { id },
            data
        });

        return NextResponse.json(question);
    } catch (e) {
        console.error(e);
        return jsonError(500, "server_error");
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const admin = await ensureAdminApi(req);
        if (!admin) return jsonError(403, "forbidden");

        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        if (!id) return jsonError(400, "id_required");

        // Check if used in answers
        const used = await prisma.supplierEvaluationAnswer.count({ where: { questionId: id } });
        if (used > 0) {
            // Soft delete (deactivate) if used
            await prisma.evaluationQuestion.update({ where: { id }, data: { active: false } });
            return NextResponse.json({ message: "deactivated" });
        } else {
            await prisma.evaluationQuestion.delete({ where: { id } });
            return NextResponse.json({ message: "deleted" });
        }
    } catch (e) {
        console.error(e);
        return jsonError(500, "server_error");
    }
}
