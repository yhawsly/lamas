import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id!);
        const { id } = await context.params;
        const obsId = parseInt(id);

        const observation = await prisma.observation.findUnique({
            where: { id: obsId },
        });

        if (!observation) {
            return NextResponse.json({ error: "Observation not found" }, { status: 404 });
        }

        // Only the assigned observer can complete the report
        if (observation.observerId !== userId) {
            return NextResponse.json(
                { error: "Forbidden: Only the assigned observer can submit the report" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { strengths, improvements, ratingKnowledge, ratingEngagement, ratingTech, ratingPunctuality } = body;

        if (!strengths || !improvements || !ratingKnowledge || !ratingEngagement || !ratingTech || !ratingPunctuality) {
            return NextResponse.json(
                { error: "Missing required fields for observation rubric" },
                { status: 400 }
            );
        }

        const updated = await prisma.observation.update({
            where: { id: obsId },
            data: {
                strengths: JSON.stringify(strengths),
                improvements: JSON.stringify(improvements),
                ratingKnowledge: parseInt(ratingKnowledge),
                ratingEngagement: parseInt(ratingEngagement),
                ratingTech: parseInt(ratingTech),
                ratingPunctuality: parseInt(ratingPunctuality),
                status: "COMPLETED",
            },
        });

        // Notify the observed lecturer
        await prisma.notification.create({
            data: {
                userId: observation.lecturerId,
                message: `Your class observation report has been submitted for review.`,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return handleApiError(error, "Failed to update observation");
    }
}
