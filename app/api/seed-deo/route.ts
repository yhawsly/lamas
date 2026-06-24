import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function GET() {
    try {
        const hash = await hashPassword("password123");
        const cs = await prisma.department.findFirst({ where: { code: "CS" } });
        
        const deo = await prisma.user.upsert({
            where: { email: "deo@lamas.edu" },
            update: {},
            create: {
                name: "Department Exam Officer",
                email: "deo@lamas.edu",
                passwordHash: hash,
                role: "DEO",
                departmentId: cs?.id,
                requirePasswordReset: true,
            },
        });
        
        return NextResponse.json({ success: true, deo });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
