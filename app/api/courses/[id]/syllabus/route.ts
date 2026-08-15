import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { logAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const resolvedParams = await params;
        const courseId = parseInt(resolvedParams.id);

        if (isNaN(courseId)) {
            return NextResponse.json({ error: "Invalid Course ID" }, { status: 400 });
        }

        const url = new URL(req.url);
        const versionIdParam = url.searchParams.get("versionId");

        // Handle specific version retrieval
        if (versionIdParam) {
            const versionId = parseInt(versionIdParam);
            if (!isNaN(versionId)) {
                const ver = await prisma.submissionVersion.findUnique({
                    where: { id: versionId }
                });
                if (ver) {
                    const snapshot: any = typeof ver.snapshot === "string" ? JSON.parse(ver.snapshot) : ver.snapshot;
                    return NextResponse.json({ lecturer: snapshot });
                }
            }
        }

        const syllabus = await prisma.masterSyllabus.findUnique({
            where: { courseId },
            include: { course: { select: { code: true, title: true, credits: true } } }
        });

        const termIdParam = url.searchParams.get("termId");

        const subWhere: any = {
            lecturerId: userId,
            type: "COURSE_TOPICS"
        };
        if (termIdParam) {
            subWhere.termId = parseInt(termIdParam);
        } else {
            const { checkAndGetActiveTerm } = await import("@/lib/active-term");
            const activeTerm = await checkAndGetActiveTerm();
            if (activeTerm) subWhere.termId = activeTerm.id;
        }

        // Fetch lecturer's personalized topics/classes if any for the specified term
        const allSubmissions = await prisma.submission.findMany({
            where: subWhere,
            orderBy: { createdAt: 'desc' }
        });

        let lecturerData = null;
        let submissionRecord = null;
        for (const sub of allSubmissions) {
            const parsed: any = typeof sub.content === "string" ? JSON.parse(sub.content) : sub.content;
            if (parsed && parsed.courseId === courseId) {
                lecturerData = parsed;
                submissionRecord = sub;
                break;
            }
        }

        if (!syllabus && !lecturerData) {
            return NextResponse.json({ error: "No Master Syllabus found for this course." }, { status: 404 });
        }

        let versionsList: any[] = [];
        if (submissionRecord) {
            versionsList = await prisma.submissionVersion.findMany({
                where: { submissionId: submissionRecord.id },
                select: { id: true, savedAt: true, isDraft: true },
                orderBy: { savedAt: 'desc' }
            });
        }

        return NextResponse.json({ 
            master: syllabus, 
            lecturer: lecturerData,
            status: submissionRecord?.status || "DRAFT",
            feedback: submissionRecord?.feedback || null,
            versions: versionsList
        });
    } catch (error) {
        console.error("Syllabus fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch syllabus" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const resolvedParams = await params;
        const courseId = parseInt(resolvedParams.id);

        if (isNaN(courseId)) {
            return NextResponse.json({ error: "Invalid Course ID" }, { status: 400 });
        }

        const { topics, classes, basicInfo, assessments, outcomes, submit, termId } = await req.json();

        // Check backend term archive guard
        const { assertTermIsActive } = await import("@/lib/term-guard");
        const termGuard = await assertTermIsActive(termId);
        if (!termGuard.allowed) {
            return NextResponse.json(
                { error: termGuard.reason || "Read-Only Archive: Course syllabus updates cannot be saved for archived terms." },
                { status: 403 }
            );
        }

        // Check for existing submission for this specific course
        const allSubmissions = await prisma.submission.findMany({
            where: {
                lecturerId: userId,
                type: "COURSE_TOPICS"
            }
        });

        const existing = allSubmissions.find(sub => {
            const content: any = typeof sub.content === "string" ? JSON.parse(sub.content) : sub.content;
            return content && content.courseId === courseId;
        });

        const contentToSave = {
            courseId,
            topics,
            classes,
            basicInfo,
            assessments,
            outcomes
        };

        const targetStatus = submit ? "SUBMITTED" : (existing?.status === "REJECTED" ? "DRAFT" : existing?.status || "DRAFT");
        const targetSubmittedAt = submit ? new Date() : (existing?.submittedAt || null);

        let result;
        if (existing) {
            result = await prisma.submission.update({
                where: { id: existing.id },
                data: { 
                    content: contentToSave as any,
                    status: targetStatus,
                    submittedAt: targetSubmittedAt
                }
            });
        } else {
            result = await prisma.submission.create({
                data: {
                    lecturerId: userId,
                    title: `Course Outline for Course #${courseId}`,
                    type: "COURSE_TOPICS",
                    termId: termId ? parseInt(termId) : undefined,
                    content: contentToSave as any,
                    status: targetStatus,
                    submittedAt: targetSubmittedAt
                }
            });
        }

        // Save version snapshot
        await prisma.submissionVersion.create({
            data: {
                submissionId: result.id,
                snapshot: contentToSave as any,
                isDraft: !submit,
            },
        });

        // Trigger notifications and audit logging if submitted
        if (submit) {
            const lecturerUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { 
                    name: true,
                    department: {
                        select: {
                            id: true,
                            name: true,
                            hodId: true
                        }
                    }
                }
            });

            if (lecturerUser?.department?.hodId) {
                await prisma.notification.create({
                    data: {
                        userId: lecturerUser.department.hodId,
                        message: `Lecturer ${lecturerUser.name} submitted the Course Outline for ${basicInfo.courseCode || `Course #${courseId}`}.`,
                    }
                });
            }

            await logAction({
                userId: userId,
                action: 'SUBMISSION_CREATED',
                details: `Submitted Course Outline for Course #${courseId}`,
            });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Syllabus save error:", error);
        return NextResponse.json({ error: "Failed to save syllabus" }, { status: 500 });
    }
}
