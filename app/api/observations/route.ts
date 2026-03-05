import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

// GET /api/observations
export async function GET(req?: any) {
    try {
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
        if (role === "LECTURER") {
            where = { OR: [{ lecturerId: userId }, { observerId: userId }] };
        } else if (role === "HOD" && departmentId) {
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

// POST /api/observations — Assign an observation
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const role = (session.user as any).role;
        if (!["HOD", "ADMIN", "SUPER_ADMIN"].includes(role)) {
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

        const observation = await prisma.observation.create({
            data: {
                lecturerId,
                observerId,
                sessionDate: new Date(sessionDate),
                courseCode,
                status: "PENDING",
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
