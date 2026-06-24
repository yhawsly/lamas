import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const rateLimit = checkRateLimit(req, "login");
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Too many password update attempts. Please try again after 15 minutes." },
                {
                    status: 429,
                    headers: { "Retry-After": String(rateLimit.retryAfter || 900) }
                }
            );
        }

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Both current and new passwords are required" }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
        }

        const newPasswordHash = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { 
                passwordHash: newPasswordHash,
                requirePasswordReset: false // clear this flag if it was set
            }
        });

        return NextResponse.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        return handleApiError(error, "Failed to update password");
    }
}
