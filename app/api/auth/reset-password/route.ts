import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { logAction } from "@/lib/audit";
import { z } from "zod";

const ResetSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id!);
        const body = await req.json();
        
        const validation = ResetSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { password } = validation.data;
        const passwordHash = await hashPassword(password);

        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                requirePasswordReset: false,
                updatedAt: new Date(),
            },
        });

        await logAction({
            userId,
            action: 'PASSWORD_RESET',
            details: 'User successfully performed a forced password reset.',
        });

        return NextResponse.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("Reset Password API Error:", error);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
