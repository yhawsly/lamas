import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        await prisma.submissionVersion.deleteMany({});
        await prisma.submission.deleteMany({});
        await prisma.observation.deleteMany({});
        await prisma.teachingObservation.deleteMany({});
        await prisma.examModeration.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.activityLog.deleteMany({});
        return NextResponse.json({ success: true, message: "Compliance data successfully cleared!" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
