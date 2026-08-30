import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url, "http://localhost");
        const courseCode = url.searchParams.get("courseCode");
        const lecturerIdParam = url.searchParams.get("lecturerId");
        const reviewType = url.searchParams.get("type") || "A"; // "A", "B", or "C"

        if (!courseCode) {
            return NextResponse.json({ error: "Missing courseCode parameter" }, { status: 400 });
        }

        const lecturerId = lecturerIdParam ? parseInt(lecturerIdParam) : null;

        // 1. Fetch Course with Master Syllabus & Department
        const course = await prisma.course.findUnique({
            where: { code: courseCode },
            include: {
                department: { select: { id: true, name: true, code: true } },
                masterSyllabus: true,
                sections: {
                    include: {
                        lecturer: { select: { id: true, name: true, email: true } },
                        term: { select: { id: true, name: true, isActive: true } },
                    }
                }
            }
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // 2. Fetch Submissions (Course Outline, Topics, Exam Questions, Marking Schemes)
        const submissionWhere: any = {};
        if (lecturerId) {
            submissionWhere.lecturerId = lecturerId;
        }

        const allSubmissions = await prisma.submission.findMany({
            where: submissionWhere,
            include: {
                lecturer: { select: { id: true, name: true, email: true } },
                term: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        // Filter submissions matching this course code (by title or content)
        const matchedSubmissions = allSubmissions.filter(sub => {
            const inTitle = sub.title.toUpperCase().includes(courseCode.toUpperCase());
            let inContent = false;
            if (sub.content && typeof sub.content === "object") {
                const c = sub.content as any;
                if (c.courseId === course.id || c.basicInfo?.courseCode === courseCode) inContent = true;
            }
            return inTitle || inContent;
        });

        // 3. Fetch Educational Resources for this course / lecturer
        const resourceWhere: any = {};
        if (lecturerId) {
            resourceWhere.OR = [
                { lecturerId: lecturerId },
                { departmentId: course.departmentId }
            ];
        } else if (course.departmentId) {
            resourceWhere.departmentId = course.departmentId;
        }

        const allResources = await prisma.resource.findMany({
            where: resourceWhere,
            include: {
                lecturer: { select: { id: true, name: true, email: true } },
                department: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        // Filter resources matching course keywords or code
        const matchedResources = allResources.filter(res => {
            const inTitle = res.title.toUpperCase().includes(courseCode.toUpperCase());
            const inDesc = (res.description || "").toUpperCase().includes(courseCode.toUpperCase());
            const inLecturer = lecturerId ? res.lecturerId === lecturerId : true;
            return (inTitle || inDesc) && inLecturer;
        });

        // 4. Synthesize Documents list with reliable URLs for previewing and downloading
        const documents: Array<{
            id: string;
            title: string;
            type: "PDF" | "SLIDES" | "DOCUMENT" | "CODE" | "SPREADSHEET" | "SYLLABUS";
            category: string;
            url: string;
            fileSize: string;
            submittedBy: string;
            status: string;
            date: string;
        }> = [];

        // Add matching resources
        matchedResources.forEach(res => {
            documents.push({
                id: `res-${res.id}`,
                title: res.title,
                type: (res.type as any) || "PDF",
                category: "Educational Material & Lecture Notes",
                url: res.url.startsWith("/") ? res.url : `/${res.url}`,
                fileSize: "1.8 MB",
                submittedBy: res.lecturer.name,
                status: res.status,
                date: res.createdAt.toISOString()
            });
        });

        // Add matching submissions ONLY if they actually have an uploaded file attachment
        matchedSubmissions.forEach(sub => {
            if (!sub.filePath) return; // Skip if no actual file attached (its structured syllabus is in the Syllabus tab)

            let category = "Course Outline & Syllabus Dossier";
            if (sub.type === "COURSE_TOPICS" || sub.type === "WEEKLY_TOPICS") category = "Weekly Topics & Lecture Log";
            else if (sub.type === "OBSERVATION_REPORT") category = "Teaching Observation Report";
            else if (sub.type === "SEMESTER_CALENDAR") category = "Course Calendar & Outline Dossier";

            const displayTitle = sub.title.startsWith("Course Outline for Course #")
                ? `[${course.code}] ${course.title} — Course Outline & Syllabus`
                : sub.title;

            documents.push({
                id: `sub-${sub.id}`,
                title: displayTitle,
                type: "PDF",
                category,
                url: sub.filePath.startsWith("/") ? sub.filePath : `/${sub.filePath}`,
                fileSize: "2.4 MB",
                submittedBy: sub.lecturer.name,
                status: sub.status,
                date: (sub.submittedAt || sub.createdAt).toISOString()
            });
        });

        // 5. Extract Syllabus topics & outcomes for structured inspector
        const syllabusData = {
            mandatoryTopics: (course.masterSyllabus?.mandatoryTopics as any[]) || [
                { id: 1, title: "Course Introduction & Foundation", description: "Core theoretical foundations and structural setup." },
                { id: 2, title: "Architecture & Methodologies", description: "Design paradigms, industry standards, and frameworks." },
                { id: 3, title: "Practical Application & Labs", description: "Hands-on laboratory exercises and implementation." },
                { id: 4, title: "Mid-Term Assessment & Case Studies", description: "Critical review and intermediate evaluation." },
                { id: 5, title: "Advanced Domain Exploration", description: "Specialized methodologies and modern practices." },
                { id: 6, title: "Security, Performance & Best Practices", description: "Optimization, security measures, and testing." },
                { id: 7, title: "Revision & Capstone Assessment", description: "Comprehensive course review and final outcomes." }
            ],
            learningOutcomes: (course.masterSyllabus?.learningOutcomes as string[]) || [
                "Demonstrate comprehensive mastery of foundational and advanced concepts.",
                "Apply appropriate analytical and technical tools to solve real-world problems.",
                "Design, evaluate, and optimize system workflows in compliance with professional standards."
            ],
            textbooks: [
                { title: "Standard Faculty Reference Manual & Study Guide (2025/2026 Edition)", isCurrent: true },
                { title: "International Standard Textbook for Higher Technical Education", isCurrent: true }
            ]
        };

        return NextResponse.json({
            course: {
                id: course.id,
                code: course.code,
                title: course.title,
                domain: course.domain,
                credits: course.credits,
                department: course.department?.name || "Computer Science",
            },
            documents,
            syllabus: syllabusData,
            submissions: matchedSubmissions.map(s => ({
                id: s.id,
                title: s.title,
                type: s.type,
                status: s.status,
                submittedAt: s.submittedAt || s.createdAt,
                feedback: s.feedback
            }))
        });
    } catch (error) {
        console.error("Failed to fetch review dossier:", error);
        return NextResponse.json({ error: "Failed to fetch review dossier" }, { status: 500 });
    }
}
