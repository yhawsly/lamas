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
        // Always do a live DB lookup for departmentId — JWT can be stale if HOD was
        // assigned to a department after their last login.
        let departmentId: number | null = (session.user as any).departmentId ?? null;
        if ((hasHodPrivileges(role) || role === ROLES.DEO) && !['ADMIN','SUPER_ADMIN'].includes(role)) {
            const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
            departmentId = dbUser?.departmentId ?? null;
        }

        // Pagination params with defaults
        const url = new URL(req?.url || "http://localhost/api/observations");
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const termIdParam = url.searchParams.get("termId");
        const all = url.searchParams.get("all") === "true";

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();

        // Build term filter — scope to active term by default
        let termFilter: any = {};
        if (termIdParam) {
            termFilter = { termId: parseInt(termIdParam) };
        } else if (activeTerm) {
            termFilter = { termId: activeTerm.id };
        }
        // If no active term and no explicit termId — no restriction (show all)


        // Build role-scoped where clause
        let where: any;
        if (role === ROLES.LECTURER) {
            // Lecturers only see their own observations (as observed or observer)
            where = {
                ...termFilter,
                OR: [{ lecturerId: userId }, { observerId: userId }],
            };
        } else {
            // HOD, DEO, ADMIN, SUPER_ADMIN — see all observations within the term
            // HODs need full visibility for scheduling and oversight
            where = { ...termFilter };
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
        if (!hasHodPrivileges(role) && role !== ROLES.DEO) {
            return NextResponse.json(
                { error: "You do not have permission to assign observations" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { lecturerId, observerId, courseCode } = body;

        if (!lecturerId || !observerId || !courseCode) {
            return NextResponse.json(
                { error: "Missing required fields: lecturerId, observerId, courseCode" },
                { status: 400 }
            );
        }

        if (lecturerId === observerId) {
            return NextResponse.json(
                { error: "Lecturer and observer cannot be the same person" },
                { status: 400 }
            );
        }

        // Validate that the lecturer is assigned to the course
        const isAssigned = await prisma.courseSection.findFirst({
            where: {
                lecturerId: Number(lecturerId),
                course: {
                    code: courseCode
                }
            }
        });

        if (!isAssigned) {
            return NextResponse.json(
                { error: `Assignment blocked: The observed lecturer is not assigned to course ${courseCode}.` },
                { status: 400 }
            );
        }

        const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });

        // Prevent duplicate observations for the same lecturer+observer+course+term
        const existingObservation = await prisma.observation.findFirst({
            where: {
                lecturerId,
                observerId,
                courseCode,
                termId: activeTerm?.id || null,
            },
        });

        if (existingObservation) {
            return NextResponse.json(
                { error: `An observation for this lecturer-observer pair on course ${courseCode} already exists this term.` },
                { status: 409 }
            );
        }

        const observation = await prisma.observation.create({
            data: {
                lecturerId,
                observerId,
                courseCode,
                termId: activeTerm?.id || null,
                status: ObservationStatus.PENDING,
            },
        });

        const message = `Peer observation assigned for course ${courseCode}. Please negotiate and schedule a date with your peer.`;
        await prisma.notification.createMany({
            data: [
                { userId: lecturerId, message },
                { userId: observerId, message },
            ],
        });

        // Trigger Resend Email Alerts
        const { sendNotificationEmail } = await import("@/lib/email");
        const [lec, obs] = await Promise.all([
            prisma.user.findUnique({ where: { id: lecturerId }, select: { email: true } }),
            prisma.user.findUnique({ where: { id: observerId }, select: { email: true } })
        ]);

        if (lec?.email) sendNotificationEmail(lec.email, "New Observation Scheduled", message).catch(console.error);
        if (obs?.email) sendNotificationEmail(obs.email, "Observation Assignment", message).catch(console.error);

        return NextResponse.json(observation, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Failed to create observation");
    }
}
