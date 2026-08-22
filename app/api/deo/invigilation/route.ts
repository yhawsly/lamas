import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { assertTermIsActive } from "@/lib/term-guard";

export const dynamic = "force-dynamic";

// GET /api/deo/invigilation?termId=...
export async function GET(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const termIdParam = url.searchParams.get("termId");
        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = termIdParam ? parseInt(termIdParam) : activeTerm?.id;

        if (!termId) {
            return NextResponse.json({ data: [] });
        }

        const invigilations = await prisma.examSessionInvigilation.findMany({
            where: { termId },
            include: {
                hall: true,
                chiefInvigilator: {
                    select: { id: true, name: true, email: true, role: true }
                }
            },
            orderBy: [
                { examDate: "asc" },
                { timeSlot: "asc" },
                { courseCode: "asc" }
            ]
        });

        // Collect all assistant invigilator IDs to batch load user records
        const allAssistantIds: number[] = Array.from(
            new Set<number>(invigilations.flatMap((i: any) => i.assistantInvigilatorIds || []))
        );

        const assistantUsers = allAssistantIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: allAssistantIds } },
                select: { id: true, name: true, email: true }
            })
            : [];

        const assistantMap = new Map(assistantUsers.map((u: any) => [u.id, u]));

        const enriched = invigilations.map((inv: any) => ({
            ...inv,
            assistantInvigilators: (inv.assistantInvigilatorIds || [])
                .map((id: number) => assistantMap.get(id))
                .filter(Boolean)
        }));

        return NextResponse.json({ data: enriched });

    } catch (error: any) {
        console.error("Failed to fetch invigilations:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch invigilation timetable" }, { status: 500 });
    }
}

// POST /api/deo/invigilation — Create or update exam invigilation slot with Collision Detection
export async function POST(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const rateLimit = checkRateLimit(req, "general");
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user as any).role;
        if (!["DEO", "HOD", "ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const {
            id,
            termId: reqTermId,
            courseCode,
            courseTitle,
            examDate,
            timeSlot,
            sessionType,
            hallId,
            chiefInvigilatorId,
            assistantInvigilatorIds,
            targetClass,
            studentCount,
            notes
        } = body;

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = reqTermId ? parseInt(reqTermId) : activeTerm?.id;

        if (!termId) {
            return NextResponse.json({ error: "Academic term is required." }, { status: 400 });
        }

        // Server-side archive guard: mutations on historical archived terms are forbidden
        await assertTermIsActive(termId);

        if (!courseCode || !examDate || !timeSlot || !hallId) {
            return NextResponse.json({ error: "Course Code, Exam Date, Time Slot, and Hall are required." }, { status: 400 });
        }

        const parsedExamDate = new Date(examDate);
        const parsedHallId = parseInt(hallId);
        const parsedChiefId = chiefInvigilatorId ? parseInt(chiefInvigilatorId) : null;
        const parsedAssistantIds: number[] = Array.isArray(assistantInvigilatorIds)
            ? assistantInvigilatorIds.map(x => parseInt(x)).filter(Boolean)
            : [];
        const slotId = id ? parseInt(id) : undefined;

        // --- VALIDATE THAT EXAM DATE FALLS WITHIN SEMESTER DURATION ---
        const term = await prisma.academicTerm.findUnique({
            where: { id: termId }
        });
        if (!term) {
            return NextResponse.json({ error: "Academic term not found." }, { status: 404 });
        }

        const termStart = new Date(term.startDate);
        const termEnd = new Date(term.endDate);
        if (parsedExamDate < termStart || parsedExamDate > termEnd) {
            const startStr = termStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const endStr = termEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return NextResponse.json({
                error: `Exam Date must fall within the semester duration (${startStr} to ${endStr}).`
            }, { status: 400 });
        }

        // --- 1. VENUE COLLISION DETECTION ---
        const venueConflict = await prisma.examSessionInvigilation.findFirst({
            where: {
                termId,
                hallId: parsedHallId,
                examDate: parsedExamDate,
                timeSlot: timeSlot,
                ...(slotId ? { id: { not: slotId } } : {})
            },
            include: { hall: { select: { name: true } } }
        });

        if (venueConflict) {
            return NextResponse.json({
                error: `Venue Clash: ${venueConflict.hall.name} is already booked for ${venueConflict.courseCode} on this date at ${timeSlot}.`
            }, { status: 409 });
        }

        // --- 2. CHIEF INVIGILATOR CLASH DETECTION ---
        if (parsedChiefId) {
            const chiefConflict = await prisma.examSessionInvigilation.findFirst({
                where: {
                    termId,
                    examDate: parsedExamDate,
                    timeSlot: timeSlot,
                    OR: [
                        { chiefInvigilatorId: parsedChiefId },
                        { assistantInvigilatorIds: { has: parsedChiefId } }
                    ],
                    ...(slotId ? { id: { not: slotId } } : {})
                },
                include: {
                    chiefInvigilator: { select: { name: true } },
                    hall: { select: { name: true } }
                }
            });

            if (chiefConflict) {
                const lecturerName = chiefConflict.chiefInvigilator?.name || "The selected chief invigilator";
                return NextResponse.json({
                    error: `Invigilator Clash: ${lecturerName} is already assigned to ${chiefConflict.courseCode} in ${chiefConflict.hall.name} at ${timeSlot}.`
                }, { status: 409 });
            }
        }

        // --- 3. ASSISTANT INVIGILATORS CLASH DETECTION ---
        for (const astId of parsedAssistantIds) {
            const astConflict = await prisma.examSessionInvigilation.findFirst({
                where: {
                    termId,
                    examDate: parsedExamDate,
                    timeSlot: timeSlot,
                    OR: [
                        { chiefInvigilatorId: astId },
                        { assistantInvigilatorIds: { has: astId } }
                    ],
                    ...(slotId ? { id: { not: slotId } } : {})
                },
                include: {
                    hall: { select: { name: true } }
                }
            });

            if (astConflict) {
                const confUser = await prisma.user.findUnique({ where: { id: astId }, select: { name: true } });
                return NextResponse.json({
                    error: `Invigilator Clash: Assistant ${confUser?.name || 'Lecturer'} is already assigned to ${astConflict.courseCode} in ${astConflict.hall.name} at ${timeSlot}.`
                }, { status: 409 });
            }
        }

        // --- CREATE OR UPDATE RECORD ---
        let result: any;
        if (slotId) {
            result = await prisma.examSessionInvigilation.update({
                where: { id: slotId },
                data: {
                    courseCode: courseCode.trim().toUpperCase(),
                    courseTitle: courseTitle ? courseTitle.trim() : null,
                    examDate: parsedExamDate,
                    timeSlot: timeSlot.trim(),
                    sessionType: sessionType || "MAIN",
                    hallId: parsedHallId,
                    chiefInvigilatorId: parsedChiefId,
                    assistantInvigilatorIds: parsedAssistantIds,
                    targetClass: targetClass ? targetClass.trim() : null,
                    studentCount: studentCount ? parseInt(studentCount) : null,
                    notes: notes ? notes.trim() : null,
                },
                include: { hall: true, chiefInvigilator: true }
            });
        } else {
            result = await prisma.examSessionInvigilation.create({
                data: {
                    termId,
                    courseCode: courseCode.trim().toUpperCase(),
                    courseTitle: courseTitle ? courseTitle.trim() : null,
                    examDate: parsedExamDate,
                    timeSlot: timeSlot.trim(),
                    sessionType: sessionType || "MAIN",
                    hallId: parsedHallId,
                    chiefInvigilatorId: parsedChiefId,
                    assistantInvigilatorIds: parsedAssistantIds,
                    targetClass: targetClass ? targetClass.trim() : null,
                    studentCount: studentCount ? parseInt(studentCount) : null,
                    notes: notes ? notes.trim() : null,
                },
                include: { hall: true, chiefInvigilator: true }
            });
        }

        // --- DISPATCH IN-APP NOTIFICATIONS TO ASSIGNED INVIGILATORS ---
        const assignedLecturersToNotify: number[] = [];
        if (parsedChiefId) assignedLecturersToNotify.push(parsedChiefId);
        parsedAssistantIds.forEach(id => {
            if (!assignedLecturersToNotify.includes(id)) assignedLecturersToNotify.push(id);
        });

        const formattedDate = parsedExamDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const classInfo = result.targetClass ? ` for ${result.targetClass}` : "";
        const notificationsData = assignedLecturersToNotify.map(uid => ({
            userId: uid,
            message: `Invigilation Duty: You have been assigned as an invigilator for ${result.courseCode}${classInfo} on ${formattedDate} (${result.timeSlot}) at ${result.hall.name}.`
        }));

        if (notificationsData.length > 0) {
            await prisma.notification.createMany({ data: notificationsData });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Failed to save invigilation slot:", error);
        return NextResponse.json({ error: error.message || "Failed to schedule exam session" }, { status: 500 });
    }
}
