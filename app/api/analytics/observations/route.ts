import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user as any).role;
        if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id!) } });

        const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
        const termId = activeTerm?.id;

        const obsWhere: any = { status: { in: ["COMPLETED", "REVIEWED"] } };
        if (termId) obsWhere.termId = termId;

        if (role === "HOD" && user?.departmentId) {
            obsWhere.lecturer = { departmentId: user.departmentId };
        }

        const [formAObservations, formBObservations] = await Promise.all([
            prisma.observation.findMany({
                where: obsWhere,
                select: { reviewData: true, feedback: true, status: true }
            }),
            prisma.teachingObservation.findMany({
                where: obsWhere,
                select: { formBData: true, status: true }
            })
        ]);

        const scoresMap: Record<string, number[]> = {
            Engagement: [],
            Knowledge: [],
            Organization: [],
            Delivery: [],
            Activities: [],
            Technology: []
        };

        // Extract ratings from Form B (Classroom Teaching Observation)
        formBObservations.forEach(o => {
            const data = o.formBData as any;
            if (!data?.criteria) return;
            const c = data.criteria;

            if (c.contentKnowledge) {
                const kVals = [
                    c.contentKnowledge.knowledgeable,
                    c.contentKnowledge.deliveredClearly,
                    c.contentKnowledge.connectedRealLife,
                    c.contentKnowledge.respondedQuestions
                ].filter((v): v is number => typeof v === "number");
                if (kVals.length > 0) scoresMap.Knowledge.push(...kVals);

                if (typeof c.contentKnowledge.usedRelevantMaterials === "number") {
                    scoresMap.Technology.push(c.contentKnowledge.usedRelevantMaterials);
                }
            }

            if (c.delivery) {
                const engVals = [
                    c.delivery.sustainedAttention,
                    c.delivery.allowedQuestions,
                    c.delivery.allowedContributions,
                    c.delivery.movementEquitable
                ].filter((v): v is number => typeof v === "number");
                if (engVals.length > 0) scoresMap.Engagement.push(...engVals);

                const delVals = [
                    c.delivery.audible,
                    c.delivery.deliveryEthical,
                    c.delivery.modeAppropriate,
                    c.delivery.paceAppropriate
                ].filter((v): v is number => typeof v === "number");
                if (delVals.length > 0) scoresMap.Delivery.push(...delVals);
            }

            if (c.startOfLesson) {
                const orgVals = [
                    c.startOfLesson.punctual,
                    c.startOfLesson.suitablyDressed,
                    c.startOfLesson.reviewedPrevious,
                    c.startOfLesson.explainedObjectives,
                    c.startOfLesson.rapport
                ].filter((v): v is number => typeof v === "number");
                if (orgVals.length > 0) scoresMap.Organization.push(...orgVals);
            }

            if (c.conclusion) {
                const actVals = [
                    c.conclusion.gaveAssignment,
                    c.conclusion.encouragedExploration,
                    c.conclusion.summarizedSatisfactorily
                ].filter((v): v is number => typeof v === "number");
                if (actVals.length > 0) scoresMap.Activities.push(...actVals);
            }
        });

        // Extract ratings from Form A (Course Material Review)
        formAObservations.forEach(o => {
            const data = o.reviewData as any;
            if (!data?.criteria) return;
            const c = data.criteria;

            if (c.courseOutline) {
                const outlineVals = [
                    c.courseOutline.objSpecific,
                    c.courseOutline.descConforms,
                    c.courseOutline.formatConforms,
                    c.courseOutline.topicsRelevant,
                    c.courseOutline.outcomesAchievable
                ].filter((v): v is number => typeof v === "number");
                if (outlineVals.length > 0) scoresMap.Organization.push(...outlineVals);
            }

            if (c.lectureNotes) {
                const noteVals = [
                    c.lectureNotes.clear,
                    c.lectureNotes.concise,
                    c.lectureNotes.wellOrganized,
                    c.lectureNotes.linkedToContent
                ].filter((v): v is number => typeof v === "number");
                if (noteVals.length > 0) scoresMap.Delivery.push(...noteVals);
            }

            if (c.mainTextbook) {
                const bookVals = [
                    c.mainTextbook.isCurrent,
                    c.mainTextbook.isAccessible,
                    c.mainTextbook.coversContent
                ].filter((v): v is number => typeof v === "number");
                if (bookVals.length > 0) scoresMap.Knowledge.push(...bookVals);
            }

            if (c.otherTLMs) {
                const tlmVals = [
                    c.otherTLMs.relevant,
                    c.otherTLMs.suitable
                ].filter((v): v is number => typeof v === "number");
                if (tlmVals.length > 0) scoresMap.Technology.push(...tlmVals);
            }
        });

        const benchmarkScores: Record<string, number> = {
            Engagement: 4.5,
            Knowledge: 4.5,
            Organization: 4.8,
            Delivery: 4.2,
            Activities: 4.7,
            Technology: 4.0
        };

        const subjects = ["Engagement", "Knowledge", "Organization", "Delivery", "Activities", "Technology"];
        const data = subjects.map(subject => {
            const arr = scoresMap[subject] || [];
            const score = arr.length > 0
                ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1))
                : benchmarkScores[subject];
            return {
                subject,
                A: score,
                fullMark: 5
            };
        });

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
