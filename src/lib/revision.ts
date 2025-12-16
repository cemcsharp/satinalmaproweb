import { prisma } from "@/lib/db";

export type RevisionAction = "create" | "update" | "status_change" | "approve" | "reject" | "cancel";

export async function logRequestRevision({
    requestId,
    userId,
    action,
    fieldName,
    oldValue,
    newValue,
    comment
}: {
    requestId: string;
    userId: string;
    action: RevisionAction;
    fieldName?: string;
    oldValue?: string | null;
    newValue?: string | null;
    comment?: string;
}) {
    try {
        await prisma.requestRevision.create({
            data: {
                requestId,
                userId,
                action,
                fieldName,
                oldValue: oldValue ? String(oldValue).substring(0, 2000) : null,
                newValue: newValue ? String(newValue).substring(0, 2000) : null,
                comment: comment ? String(comment).substring(0, 500) : null,
            }
        });
    } catch (error) {
        console.error(`[RevisionLog] Error logging revision for request ${requestId}:`, error);
        // Don't throw, just log error so main flow isn't interrupted
    }
}
