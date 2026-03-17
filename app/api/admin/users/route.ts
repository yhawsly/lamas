import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const UserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["LECTURER", "HOD", "ADMIN", "SUPER_ADMIN"]),
    departmentId: z.union([z.number(), z.string().transform(v => parseInt(v))]).optional().nullable(),
});

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: { department: true },
            orderBy: { createdAt: "desc" },
        });

        // Exclude passwords from response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const safeUsers = users.map(({ passwordHash: _hash, ...user }) => user);
        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Zod validation
        const validation = UserSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { name, email, password, role, departmentId } = validation.data;

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role,
                departmentId: departmentId || null,
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _hash, ...safeUser } = newUser;
        return NextResponse.json(safeUser, { status: 201 });
    } catch (error) {
        console.error("Failed to create user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
