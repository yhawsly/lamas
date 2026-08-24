import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { handleApiError } from "@/lib/api-error";
import { isAdmin, hasHodPrivileges } from "@/lib/permissions";

export async function GET(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (!hasHodPrivileges(role)) {
            return NextResponse.json(
                { error: "You do not have permission to view audit logs" },
                { status: 403 }
            );
        }

        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;
        const actionQuery = url.searchParams.get("action");
        const userIdQuery = url.searchParams.get("userId");

        if (page < 1 || limit < 1) {
            return NextResponse.json(
                { error: "Invalid pagination parameters" },
                { status: 400 }
            );
        }

        const where: any = {};
        if (actionQuery) where.action = actionQuery;

        if (hasHodPrivileges(role) && !isAdmin(role)) {
            const departmentId = (session.user as any).departmentId;
            if (departmentId) {
                where.user = { departmentId };
            } else {
                return NextResponse.json({
                    data: [],
                    meta: { totalCount: 0, page: 1, limit, totalPages: 0 }
                });
            }
        }

        if (userIdQuery) {
            const targetId = parseInt(userIdQuery);
            // Security check: HOD can only see logs for their department members
            if (hasHodPrivileges(role) && !isAdmin(role)) {
                const targetUser = await prisma.user.findUnique({
                    where: { id: targetId },
                    select: { departmentId: true }
                });
                if (targetUser?.departmentId !== (session.user as any).departmentId) {
                    return NextResponse.json(
                        { error: "You do not have permission to view these logs" },
                        { status: 403 }
                    );
                }
            }
            where.userId = targetId;
        }

        const [logs, totalCount] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            name: true,
                            role: true,
                            department: { select: { name: true } }
                        }
                    }
                }
            }),
            prisma.activityLog.count({ where })
        ]);

        const formattedLogs = logs.map(log => {
            let detailText = "";
            if (typeof log.detail === "string" && log.detail.trim()) {
                detailText = log.detail;
            } else if (log.detail && typeof log.detail === "object") {
                const d = log.detail as Record<string, any>;
                detailText = d.message || d.details || d.description || d.title || d.note || (d.courseCode ? `Course ${d.courseCode}` : "") || JSON.stringify(log.detail);
            }

            if (!detailText) {
                switch (log.action) {
                    case "SUBMISSION_CREATED":
                        detailText = "Submitted new academic syllabus / course outline";
                        break;
                    case "SUBMISSION_UPDATED":
                        detailText = "Updated course syllabus content & weekly topics";
                        break;
                    case "SUBMISSION_REVIEWED":
                        detailText = "HOD completed submission review & grading";
                        break;
                    case "OBSERVATION_ASSIGNED":
                        detailText = "Assigned peer teaching observation duty";
                        break;
                    case "OBSERVATION_COMPLETED":
                        detailText = "Completed and submitted Form B observation rubric";
                        break;
                    case "RESOURCE_UPLOADED":
                        detailText = "Uploaded departmental teaching resource";
                        break;
                    case "DEPARTMENT_BROADCAST":
                        detailText = "Broadcasted priority notice to departmental faculty";
                        break;
                    case "DIRECT_NOTIFICATION":
                        detailText = "Sent direct system communication";
                        break;
                    case "LOGIN":
                        detailText = "Authenticated user session started";
                        break;
                    case "LOGOUT":
                        detailText = "User session terminated / signed out";
                        break;
                    case "ADMIN_ACTION":
                        detailText = "Applied administrative system configuration";
                        break;
                    default:
                        detailText = log.action.replace(/_/g, " ").toLowerCase();
                }
            }

            return {
                ...log,
                details: detailText,
            };
        });

        return NextResponse.json({
            data: formattedLogs,
            meta: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        return handleApiError(error, "Failed to fetch audit logs");
    }
}
