import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const observation = await prisma.teachingObservation.findUnique({
            where: { id: parseInt(id) },
            include: { lecturer: true, observer: true, deo: true },
        });
        if (!observation) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const isAssigned = await prisma.courseSection.findFirst({
            where: {
                lecturerId: observation.lecturerId,
                course: {
                    code: observation.courseCode
                }
            }
        });

        if (!isAssigned) {
            const { notifyDeoIfMismatch } = await import("@/lib/deo-notification");
            notifyDeoIfMismatch("B", observation.id, observation.lecturer.name, observation.courseCode).catch(console.error);
        }

        return NextResponse.json({
            ...observation,
            isObserveeAssigned: !!isAssigned
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch observation" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(session.user.id);
    const role = (session.user as any).role;

    try {
        const body = await req.json();
        const { formBData } = body;
        
        const { id } = await params;
        const existingObs = await prisma.teachingObservation.findUnique({
            where: { id: parseInt(id) }
        });
        if (!existingObs) return NextResponse.json({ error: "Teaching observation not found" }, { status: 404 });

        const isSubmittingReview = formBData !== undefined && formBData !== null;

        // Security check:
        if (isSubmittingReview) {
            const isAssigned = await prisma.courseSection.findFirst({
                where: {
                    lecturerId: existingObs.lecturerId,
                    course: {
                        code: existingObs.courseCode
                    }
                }
            });

            if (!isAssigned) {
                return NextResponse.json({ error: "Review blocked: Lecturer is not assigned to this course." }, { status: 400 });
            }

            // Security: only the assigned observer or HOD/DEO/Admin can submit review
            if (existingObs.observerId !== userId && !["HOD", "DEO", "ADMIN", "SUPER_ADMIN"].includes(role)) {
                return NextResponse.json({ error: "Forbidden: Only the assigned observer may submit this form." }, { status: 403 });
            }
        } else {
            // For scheduling / session date / venue updates:
            // Allowed: the assigned observer, the observed lecturer, or administrative roles (HOD, DEO, ADMIN, SUPER_ADMIN)
            const canSchedule = existingObs.observerId === userId ||
                                existingObs.lecturerId === userId ||
                                ["HOD", "DEO", "ADMIN", "SUPER_ADMIN"].includes(role);
            if (!canSchedule) {
                return NextResponse.json({ error: "Forbidden: You do not have permission to update this teaching observation schedule." }, { status: 403 });
            }
        }

        if (formBData?.metadata?.venue) {
            formBData.metadata.venue = formBData.metadata.venue.toUpperCase();
        }

        let sessionDate: Date | undefined = undefined;
        if (body.sessionDate) {
            sessionDate = new Date(body.sessionDate);
            if (isNaN(sessionDate.getTime())) {
                return NextResponse.json({ error: "Invalid date or time provided for schedule." }, { status: 400 });
            }
        }

        const venue = body.venue !== undefined ? (body.venue && body.venue.trim() !== "" ? body.venue.trim().toUpperCase() : null) : undefined;

        const observation = await prisma.teachingObservation.update({
            where: { id: parseInt(id) },
            data: {
                ...(formBData !== undefined && { formBData }),
                ...(sessionDate && { sessionDate }),
                ...(venue !== undefined && { venue }),
                ...(body.status && { status: body.status }),
            },
            include: { lecturer: true, observer: true, deo: true }
        });

        const isAssigned = await prisma.courseSection.findFirst({
            where: {
                lecturerId: observation.lecturerId,
                course: {
                    code: observation.courseCode
                }
            }
        });

        return NextResponse.json({
            ...observation,
            isObserveeAssigned: !!isAssigned
        });
    } catch (e) {
        console.error("Teaching Observation PATCH Error:", e);
        return NextResponse.json({ error: "Failed to update observation" }, { status: 500 });
    }
}
