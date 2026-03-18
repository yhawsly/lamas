import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { cachedQuery, cacheKeys } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
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
            select: { departmentId: true }
        });

        if (!user?.departmentId) {
            return NextResponse.json({ data: [], meta: { totalCount: 0, page: 1, limit: 10, totalPages: 0 } });
        }

        // Pagination params
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        // Create a cache key that includes page number
        const cacheKeyWithPage = `${cacheKeys.departmentColleagues(user.departmentId)}:p${page}:l${limit}`;

        const cachedResult = await cachedQuery(
            cacheKeyWithPage,
            async () => {
                const [colleagues, totalCount] = await Promise.all([
                    prisma.user.findMany({
                        where: {
                            departmentId: user.departmentId,
                            isActive: true,
                            id: { not: userId },
                            role: "LECTURER"
                        },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                        orderBy: { name: "asc" },
                        skip,
                        take: limit,
                    }),
                    prisma.user.count({
                        where: {
                            departmentId: user.departmentId,
                            isActive: true,
                            id: { not: userId },
                            role: "LECTURER"
                        }
                    })
                ]);

                return { colleagues, totalCount };
            },
            300 // Cache for 5 minutes
        );

        return NextResponse.json({
            data: cachedResult.colleagues,
            meta: {
                totalCount: cachedResult.totalCount,
                page,
                limit,
                totalPages: Math.ceil(cachedResult.totalCount / limit)
            }
        });
    } catch (error) {
        console.error("Failed to fetch colleagues:", error);
        return NextResponse.json(
            { error: "Failed to fetch colleagues" },
            { status: 500 }
        );
    }
}
