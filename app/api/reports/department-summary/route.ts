import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const rateLimit = checkRateLimit(req, 'general');
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 900) } }
            );
        }

        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        const departmentId = (session.user as any).departmentId;

        if (role !== "HOD" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!departmentId && role === "HOD") {
            return NextResponse.json({ error: "No department assigned to your account" }, { status: 400 });
        }

        const url = new URL(req.url);
        const termIdParam = url.searchParams.get("termId");
        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = termIdParam ? parseInt(termIdParam) : activeTerm?.id;

        const termFilter = termId ? { termId } : {};

        // Fetch department lecturers and their observation stats
        const lecturers = await prisma.user.findMany({
            where: {
                departmentId: departmentId,
                role: "LECTURER",
                isActive: true,
                deletedAt: null
            },
            select: {
                id: true,
                name: true,
                email: true,
                observedBy: {
                    where: termFilter,
                    select: { status: true }
                },
                teachingObserved: {
                    where: termFilter,
                    select: { status: true }
                },
                moderationsAsInternal: {
                    where: termFilter,
                    select: { status: true }
                }
            }
        });

        const data = lecturers.map(lec => {
            const peerTotal = lec.observedBy.length;
            const peerCompleted = lec.observedBy.filter(o => o.status === 'COMPLETED' || o.status === 'REVIEWED').length;
            
            const teachTotal = lec.teachingObserved.length;
            const teachCompleted = lec.teachingObserved.filter(o => o.status === 'COMPLETED' || o.status === 'REVIEWED').length;
            
            const modTotal = lec.moderationsAsInternal.length;
            const modCompleted = lec.moderationsAsInternal.filter(o => o.status === 'COMPLETED' || o.status === 'REVIEWED').length;

            return {
                id: lec.id,
                name: lec.name,
                email: lec.email,
                stats: {
                    peerObservation: `${peerCompleted}/${peerTotal}`,
                    teachingObservation: `${teachCompleted}/${teachTotal}`,
                    moderation: `${modCompleted}/${modTotal}`,
                    complianceScore: Math.min(100, Math.max(0, Math.round(((peerCompleted + teachCompleted + modCompleted) / Math.max(1, (peerTotal + teachTotal + modTotal))) * 100)))
                }
            };
        });

        return NextResponse.json({ data });

    } catch (error) {
        return handleApiError(error, "Failed to fetch department summary");
    }
}
