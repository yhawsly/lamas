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

        const userId = parseInt(session.user.id!);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, departmentId: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const url = new URL(req.url, "http://localhost");
        const filterDeptId = url.searchParams.get("departmentId");

        // Admins and DEOs see all users capable of being observed/observing
        // HODs/Lecturers see everyone in their department
        const whereClause: any = { isActive: true };

        if (filterDeptId) {
            whereClause.departmentId = parseInt(filterDeptId);
        } else if (!["ADMIN", "SUPER_ADMIN", "DEO"].includes(user.role)) {
            if (user.departmentId) {
                whereClause.departmentId = user.departmentId;
            }
        }

        let lecturers = await prisma.user.findMany({
            where: whereClause,
            select: { 
                id: true, 
                name: true, 
                email: true, 
                role: true, 
                departmentId: true,
                specializations: true,
                department: { select: { id: true, name: true, code: true } }
            },
            orderBy: { name: "asc" }
        });

        if (lecturers.length === 0) {
            // Fallback: return all active faculty across departments so dropdowns are never empty
            lecturers = await prisma.user.findMany({
                where: { isActive: true },
                select: { 
                    id: true, 
                    name: true, 
                    email: true, 
                    role: true, 
                    departmentId: true,
                    specializations: true,
                    department: { select: { id: true, name: true, code: true } }
                },
                orderBy: { name: "asc" }
            });
        }

        return NextResponse.json(lecturers, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });
    } catch (error) {
        console.error("Failed to fetch lecturers:", error);
        return NextResponse.json(
            { error: "Failed to fetch lecturers" },
            { status: 500 }
        );
    }
}
