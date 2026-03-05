import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/password-reset-request
 * Request a password reset link via email
 */
export async function POST(req: NextRequest) {
    try {
        // Rate limiting: 3 attempts per 30 minutes
        const rateLimit = checkRateLimit(req, 'passwordReset');
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Too many password reset requests. Please try again later." },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimit.retryAfter || 1800),
                        'X-RateLimit-Remaining': String(rateLimit.remaining),
                        'X-RateLimit-Reset': String(new Date(rateLimit.resetTime).toISOString()),
                    }
                }
            );
        }

        const body = await req.json();
        const { email } = body;

        if (!email || !email.trim()) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, name: true, email: true }
        });

        if (!user) {
            // Return generic message for security (don't reveal if email exists)
            return NextResponse.json(
                { message: "If an account exists with this email, you will receive a password reset link shortly." },
                { status: 200 }
            );
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");

        // Store reset token in database with expiry
        await prisma.passwordReset.upsert({
            where: { userId: user.id },
            update: {
                token: resetToken,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
            create: {
                userId: user.id,
                token: resetToken,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            }
        });

        // Send reset email
        const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
        await sendEmail({
            to: user.email,
            subject: "LAMAS - Password Reset Request",
            html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${user.name},</p>
                <p>You requested a password reset for your LAMAS account.</p>
                <p>
                    <a href="${resetUrl}" style="
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #3b82f6;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                    ">
                        Reset Password
                    </a>
                </p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
            `
        });

        return NextResponse.json(
            { message: "If an account exists with this email, you will receive a password reset link shortly." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Password reset request failed:", error);
        return NextResponse.json(
            { error: "Failed to process password reset request" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
export async function PATCH(req: NextRequest) {
    try {
        // Rate limiting: 3 attempts per 30 minutes (prevent brute force of tokens)
        const rateLimit = checkRateLimit(req, 'passwordReset');
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Too many password reset attempts. Please try again later." },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimit.retryAfter || 1800),
                        'X-RateLimit-Remaining': String(rateLimit.remaining),
                        'X-RateLimit-Reset': String(new Date(rateLimit.resetTime).toISOString()),
                    }
                }
            );
        }

        const body = await req.json();
        const { token, password, confirmPassword } = body;

        if (!token || !password || !confirmPassword) {
            return NextResponse.json(
                { error: "Token and password are required" },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: "Passwords do not match" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Find and validate reset token
        const resetRecord = await prisma.passwordReset.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() } // Token not expired
            },
            include: { user: true }
        });

        if (!resetRecord) {
            return NextResponse.json(
                { error: "Invalid or expired reset token" },
                { status: 400 }
            );
        }

        // Hash password before storing
        const hashedPassword = await hashPassword(password);

        // Update password with hashed value
        await prisma.user.update({
            where: { id: resetRecord.userId },
            data: { passwordHash: hashedPassword }
        });

        // Mark reset token as used
        await prisma.passwordReset.delete({
            where: { userId: resetRecord.userId }
        });

        return NextResponse.json(
            { message: "Password reset successfully. Please log in with your new password." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Password reset failed:", error);
        return NextResponse.json(
            { error: "Failed to reset password" },
            { status: 500 }
        );
    }
}
