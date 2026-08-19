import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/deo/halls — List all examination halls / venues
export async function GET() {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const allHalls = await prisma.examHall.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { invigilations: true }
                }
            }
        });
        return NextResponse.json(allHalls);
    } catch (error: any) {
        console.error("Failed to fetch halls:", error);
        return NextResponse.json({ error: "Failed to fetch exam halls" }, { status: 500 });
    }
}

// POST /api/deo/halls — Add or update an examination hall
export async function POST(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const rateLimit = checkRateLimit(req, "general");
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user as any).role;
        if (!["DEO", "HOD", "ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { id, name, code, capacity, location } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Venue name is required." }, { status: 400 });
        }

        const cap = capacity ? parseInt(capacity) : 50;

        if (id) {
            const updated = await prisma.examHall.update({
                where: { id: parseInt(id) },
                data: {
                    name: name.trim(),
                    code: code ? code.trim() : null,
                    capacity: cap,
                    location: location ? location.trim() : null,
                }
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.examHall.create({
                data: {
                    name: name.trim(),
                    code: code ? code.trim() : null,
                    capacity: cap,
                    location: location ? location.trim() : null,
                }
            });
            return NextResponse.json(created);
        }
    } catch (error: any) {
        console.error("Failed to save hall:", error);
        return NextResponse.json({ error: error.message || "Failed to save exam hall" }, { status: 500 });
    }
}
