import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { auth } from "@/auth";
import { headers, cookies } from "next/headers";
import { getDepartmentReviewerRecommendations } from "@/lib/pairing";

export async function GET(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const courseCode = url.searchParams.get("courseCode");
        const excludeLecturerId = url.searchParams.get("excludeLecturerId");

        if (!courseCode) {
            return NextResponse.json({ error: "courseCode query parameter is required" }, { status: 400 });
        }

        const recommendations = await getDepartmentReviewerRecommendations({
            courseCode,
            excludeLecturerId: excludeLecturerId ? parseInt(excludeLecturerId) : undefined
        });

        return NextResponse.json(recommendations);
    } catch (error) {
        console.error("Failed to get reviewer recommendations:", error);
        return NextResponse.json(
            { error: "Failed to calculate reviewer recommendations" },
            { status: 500 }
        );
    }
}
