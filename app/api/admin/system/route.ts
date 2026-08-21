import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cache, invalidateCache } from "@/lib/cache";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const cacheStats = cache.getStats();
        const usersCount = await prisma.user.count({ where: { isActive: true } });
        const coursesCount = await prisma.course.count();
        const logsCount = await prisma.activityLog.count();
        const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });

        return NextResponse.json({
            cache: {
                size: cacheStats.size,
                entries: cacheStats.entries,
                status: "HEALTHY",
            },
            database: {
                poolMax: parseInt(process.env.DATABASE_POOL_MAX || "5"),
                activeUsers: usersCount,
                totalCourses: coursesCount,
                auditLogs: logsCount,
                activeTerm: activeTerm ? activeTerm.name : "None",
            },
            emailService: {
                configured: !!process.env.RESEND_API_KEY,
                provider: "Resend Email Dispatcher",
                status: process.env.RESEND_API_KEY ? "CONFIGURED" : "DEV_MOCK",
            }
        });
    } catch (error: any) {
        console.error("System status API error:", error);
        return NextResponse.json({ error: "Failed to fetch system metrics" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, email } = body;

        if (action === "PURGE_CACHE") {
            invalidateCache.all();
            return NextResponse.json({ success: true, message: "In-memory cache successfully purged." });
        }

        if (action === "TEST_EMAIL") {
            const targetEmail = email || session.user?.email || "superadmin@lamas.edu.gh";
            const sent = await sendEmail({
                to: targetEmail,
                subject: "HTU LAMAS - System Email Diagnostics Test",
                html: `<div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 12px;">
                    <h2 style="color: #1e3a8a;">HTU LAMAS System Diagnostics</h2>
                    <p>This is an automated test verifying that the Resend Email Service is operational.</p>
                    <p style="font-size: 12px; color: #64748b;">Timestamp: ${new Date().toISOString()}</p>
                </div>`
            });
            return NextResponse.json({ 
                success: sent, 
                message: sent ? `Test email sent to ${targetEmail}` : "Failed to dispatch email (check Resend API key)" 
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("System action API error:", error);
        return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
    }
}
