import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import { ObservationStatus } from "@prisma/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { ROLES, hasHodPrivileges } from "@/lib/permissions";

// GET /api/observations
export async function GET(req?: any) {
    await headers();
    await cookies();
    try {
        // Rate limiting: 20 requests per 15 minutes
        if (req instanceof NextRequest) {
            const rateLimit = checkRateLimit(req, 'general');
            if (!rateLimit.allowed) {
                return NextResponse.json(
                    { error: "Rate limit exceeded. Please try again later." },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': String(rateLimit.retryAfter || 900),
                        }
                    }
                );
            }
        }

        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = parseInt(session.user.id!);
        const role = (session.user as any).role;
        const departmentId = (session.user as any).departmentId;

        // Pagination params with defaults
        const url = new URL(req?.url || "http://localhost/api/observations");
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        let where: any = {};
        if (role === ROLES.LECTURER) {
            where = { OR: [{ lecturerId: userId }, { observerId: userId }] };
        } else if (hasHodPrivileges(role) && !["ADMIN", "SUPER_ADMIN"].includes(role) && departmentId) {
            where = {
                OR: [
                    { lecturer: { departmentId: departmentId } },
                    { observer: { departmentId: departmentId } }
                ]
            };
        }

        const [observations, totalCount] = await Promise.all([
            prisma.observation.findMany({
                where,
                include: {
                    lecturer: { select: { name: true, email: true } },
                    observer: { select: { name: true, email: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.observation.count({ where })
        ]);

        return NextResponse.json({
            data: observations,
            meta: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        return handleApiError(error, "Failed to fetch observations");
    }
}

// POST /api/observations — Assign an observation (HOD/Admin only)
export async function POST(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const rateLimit = checkRateLimit(req, "general");
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter || 900) } }
            );
        }

        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (!hasHodPrivileges(role)) {
            return NextResponse.json(
                { error: "You do not have permission to assign observations" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { lecturerId, observerId, sessionDate, courseCode } = body;

        if (!lecturerId || !observerId || !sessionDate || !courseCode) {
            return NextResponse.json(
                { error: "Missing required fields: lecturerId, observerId, sessionDate, courseCode" },
                { status: 400 }
            );
        }

        if (lecturerId === observerId) {
            return NextResponse.json(
                { error: "Lecturer and observer cannot be the same person" },
                { status: 400 }
            );
        }

        const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });

        const observation = await prisma.observation.create({
            data: {
                lecturerId,
                observerId,
                sessionDate: new Date(sessionDate),
                courseCode,
                termId: activeTerm?.id || null,
                status: ObservationStatus.PENDING,
            },
        });

        // Notify both parties
        await prisma.notification.createMany({
            data: [
                {
                    userId: lecturerId,
                    message: `You have been scheduled for a classroom observation on ${new Date(sessionDate).toLocaleDateString()}.`,
                },
                {
                    userId: observerId,
                    message: `You have been assigned to observe a class session on ${new Date(sessionDate).toLocaleDateString()}.`,
                },
            ],
        });

        return NextResponse.json(observation, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Failed to create observation");
    }
}
