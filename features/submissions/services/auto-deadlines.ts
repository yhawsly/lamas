import { prisma } from "@/lib/prisma";
import { SubmissionType } from "@prisma/client";

export interface AutomatedMilestoneConfig {
    type: SubmissionType;
    label: string;
    targetWeek: number;
    description: string;
}

/**
 * Currently implemented academic milestones in LAMAS:
 * 1. Week 2: Semester Teaching Plan & Calendar (SEMESTER_CALENDAR)
 * 2. Week 3: Course Topics & Syllabus Outline (COURSE_TOPICS)
 * 3. Week 8: Mid-Semester Continuous Assessment & Topics Log (WEEKLY_TOPICS)
 * 4. Week 9: Peer Teaching Observation APR Form A (OBSERVATION_REPORT)
 */
export const ACTIVE_MILESTONES: AutomatedMilestoneConfig[] = [
    {
        type: "SEMESTER_CALENDAR",
        label: "Semester Teaching Plan & Calendar (Week 2)",
        targetWeek: 2,
        description: "Course schedules, teaching weeks outline, and lecture timetable confirmation.",
    },
    {
        type: "COURSE_TOPICS",
        label: "Course Topics & Syllabus Outline (Week 3)",
        targetWeek: 3,
        description: "14-week topic distribution, learning outcomes, lab sessions, and reading materials.",
    },
    {
        type: "WEEKLY_TOPICS",
        label: "Mid-Semester Continuous Assessment & Topics Log (Week 8)",
        targetWeek: 8,
        description: "Interim topic progress log and mid-semester continuous assessment score returns.",
    },
    {
        type: "OBSERVATION_REPORT",
        label: "Peer Teaching Observation APR Form A (Week 9)",
        targetWeek: 9,
        description: "Classroom peer review, instructional assessment, and observer report submission.",
    },
];

/**
 * Automatically creates the 4 standard active milestones for an academic term
 * based on its start date, aligning each due date to Friday 23:59:59 of that week.
 */
export async function generateAutomatedDeadlinesForTerm(termId: number, adminUserId?: number) {
    const term = await prisma.academicTerm.findUnique({
        where: { id: termId },
        include: { deadlines: true }
    });

    if (!term) throw new Error(`Academic Term #${termId} not found`);

    const startDate = new Date(term.startDate);
    const endDate = new Date(term.endDate);
    const existingTypes = new Set(term.deadlines.map(d => d.type));
    const createdDeadlines = [];

    for (const milestone of ACTIVE_MILESTONES) {
        // Avoid duplicate deadlines of the same type for this term
        if (!existingTypes.has(milestone.type)) {
            // Target date: Start date + (targetWeek * 7 days)
            const targetDate = new Date(startDate.getTime() + milestone.targetWeek * 7 * 24 * 60 * 60 * 1000);
            
            // Align to Friday (day 5 of week) at 23:59:59
            const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
            const diffToFriday = 5 - dayOfWeek;
            targetDate.setDate(targetDate.getDate() + diffToFriday);
            targetDate.setHours(23, 59, 59, 999);

            // Clamp so due date never exceeds term end date
            const finalDueDate = targetDate > endDate 
                ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) 
                : targetDate;

            const newDeadline = await prisma.deadline.create({
                data: {
                    termId: term.id,
                    type: milestone.type,
                    label: milestone.label,
                    dueDate: finalDueDate,
                    createdBy: adminUserId || term.createdBy,
                }
            });
            createdDeadlines.push(newDeadline);
        }
    }

    return createdDeadlines;
}
