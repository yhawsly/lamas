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

            // Schedule Date Validation: Observation must be scheduled and cannot be submitted before scheduled session date
            const targetSessionDate = body.sessionDate ? new Date(body.sessionDate) : existingObs.sessionDate;
            if (!targetSessionDate) {
                return NextResponse.json({
                    error: "Review blocked: Observation session must be scheduled with a date and time before the review can be conducted and submitted."
                }, { status: 400 });
            }

            if (new Date() < new Date(targetSessionDate)) {
                const formattedDate = new Date(targetSessionDate).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
                return NextResponse.json({
                    error: `Review blocked: Review cannot be submitted before the scheduled session date (${formattedDate}).`
                }, { status: 400 });
            }

            // All field completeness validation before submission
            const meta = formBData.metadata || {};
            const missingMeta: string[] = [];
            if (!meta.programme?.trim()) missingMeta.push("Programme");
            if (!meta.lessonTopic?.trim()) missingMeta.push("Lesson Topic");
            if (!meta.modeOfDelivery?.trim()) missingMeta.push("Mode of Delivery");
            if (!meta.venue?.trim()) missingMeta.push("Venue");
            if (!meta.lessonPeriodFrom?.trim() || !meta.lessonPeriodTo?.trim()) missingMeta.push("Lesson Period (From/To)");
            if (!meta.observationPeriodFrom?.trim() || !meta.observationPeriodTo?.trim()) missingMeta.push("Observation Period (From/To)");
            if (!meta.natureOfTeaching?.trim()) missingMeta.push("Nature of Teaching");

            if (missingMeta.length > 0) {
                return NextResponse.json({
                    error: `Submission rejected: All metadata fields must be filled before submission. Missing: ${missingMeta.join(", ")}.`
                }, { status: 400 });
            }

            // Validate all 21 criteria across 4 sections
            const requiredCriteria: Record<string, string[]> = {
                startOfLesson: ["suitablyDressed", "punctual", "rapport", "reviewedPrevious", "explainedObjectives"],
                delivery: ["audible", "modeAppropriate", "paceAppropriate", "movementEquitable", "sustainedAttention", "allowedContributions", "allowedQuestions", "deliveryEthical"],
                conclusion: ["summarizedSatisfactorily", "encouragedExploration", "gaveAssignment"],
                contentKnowledge: ["knowledgeable", "connectedRealLife", "deliveredClearly", "usedRelevantMaterials", "respondedQuestions"],
            };

            const unratedCriteria: string[] = [];
            for (const [section, fields] of Object.entries(requiredCriteria)) {
                const secObj = formBData.criteria?.[section] || {};
                for (const f of fields) {
                    const val = secObj[f];
                    if (typeof val !== "number" || val < 1 || val > 3) {
                        unratedCriteria.push(`${section}.${f}`);
                    }
                }
            }

            if (unratedCriteria.length > 0) {
                return NextResponse.json({
                    error: `Submission rejected: All 21 evaluation criteria must be rated before submission (${21 - unratedCriteria.length}/21 completed). Missing ${unratedCriteria.length} rating(s).`
                }, { status: 400 });
            }

            const sw = formBData.strengthsWeaknesses || {};
            if (!sw.strengths?.trim() || !sw.weaknesses?.trim()) {
                return NextResponse.json({
                    error: "Submission rejected: Observed Strengths and Weaknesses must both be completed before submission."
                }, { status: 400 });
            }

            if (!formBData.recommendations?.trim()) {
                return NextResponse.json({
                    error: "Submission rejected: Actionable recommendations must be provided before submission."
                }, { status: 400 });
            }

            if (!formBData.overallRating || !["Excellent", "Very Good", "Good", "Fair", "Poor"].includes(formBData.overallRating)) {
                return NextResponse.json({
                    error: "Submission rejected: An Overall Performance Rating must be selected."
                }, { status: 400 });
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
                status: body.status || (isSubmittingReview ? "COMPLETED" : undefined),
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
