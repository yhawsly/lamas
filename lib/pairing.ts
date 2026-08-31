import { prisma } from "./prisma";
export { buildReciprocalPairingMap } from "./pairing-utils";

export interface ReviewerMatchResult {
    id: number;
    name: string;
    email: string;
    departmentId: number | null;
    specializations: string[];
    isDomainMatch: boolean;
    matchedDomain?: string;
    activeReviewsCount: number;
    isRecommended: boolean;
}

/**
 * Normalizes and checks whether a course domain matches any of a reviewer's specializations.
 */
export function isDomainSpecializationMatch(
    courseDomain?: string | null,
    reviewerSpecializations: string[] = []
): { isMatch: boolean; matchedSpecialization?: string } {
    if (!courseDomain || !reviewerSpecializations || reviewerSpecializations.length === 0) {
        return { isMatch: false };
    }

    const cleanDomain = courseDomain.toLowerCase().trim();
    const domainKeywords = cleanDomain
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && !["and", "the", "for", "systems", "practices"].includes(w));

    for (const spec of reviewerSpecializations) {
        const cleanSpec = spec.toLowerCase().trim();
        
        // Exact or substring match
        if (cleanDomain.includes(cleanSpec) || cleanSpec.includes(cleanDomain)) {
            return { isMatch: true, matchedSpecialization: spec };
        }

        // Keyword overlap match (e.g., "Web", "Database", "AI", "Algorithms", "Network", "DevOps")
        const specKeywords = cleanSpec
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter(w => w.length > 2 && !["and", "the", "for", "systems", "practices"].includes(w));

        const hasOverlap = domainKeywords.some(dk => 
            specKeywords.some(sk => dk === sk || (dk.length >= 4 && sk.startsWith(dk)) || (sk.length >= 4 && dk.startsWith(sk)))
        );

        if (hasOverlap) {
            return { isMatch: true, matchedSpecialization: spec };
        }
    }

    return { isMatch: false };
}

/**
 * Validates Department-Level Boundary (Approach 1):
 * Ensures that peer reviewers belong to the same department that offers the course.
 */
export async function validateDepartmentBoundary(params: {
    courseCode: string;
    lecturerId: number;
    reviewerId: number;
}): Promise<{ valid: boolean; error?: string; course?: any; reviewer?: any }> {
    const { courseCode, lecturerId, reviewerId } = params;

    if (lecturerId === reviewerId) {
        return {
            valid: false,
            error: "Conflict of Interest: A lecturer cannot be assigned to review or observe their own course."
        };
    }

    const course = await prisma.course.findUnique({
        where: { code: courseCode },
        include: { department: true }
    });

    if (!course) {
        return {
            valid: false,
            error: `Course with code ${courseCode} not found.`
        };
    }

    const [lecturer, reviewer] = await Promise.all([
        prisma.user.findUnique({
            where: { id: lecturerId },
            include: { department: true }
        }),
        prisma.user.findUnique({
            where: { id: reviewerId },
            include: { department: true }
        })
    ]);

    if (!lecturer) {
        return { valid: false, error: "Observed lecturer not found." };
    }

    if (!reviewer) {
        return { valid: false, error: "Assigned reviewer not found." };
    }

    // If course is bound to a department, enforce strict department boundary
    if (course.departmentId) {
        if (reviewer.departmentId && reviewer.departmentId !== course.departmentId) {
            const courseDeptName = course.department?.name || `Department #${course.departmentId}`;
            const reviewerDeptName = reviewer.department?.name || `Department #${reviewer.departmentId}`;
            return {
                valid: false,
                error: `Department Mismatch: Reviewer ${reviewer.name} (${reviewerDeptName}) cannot review ${course.code} (${courseDeptName}). Peer reviewers must belong to the same academic department.`
            };
        }

        if (lecturer.departmentId && lecturer.departmentId !== course.departmentId) {
            const courseDeptName = course.department?.name || `Department #${course.departmentId}`;
            const lecturerDeptName = lecturer.department?.name || `Department #${lecturer.departmentId}`;
            return {
                valid: false,
                error: `Department Mismatch: Lecturer ${lecturer.name} belongs to ${lecturerDeptName}, but course ${course.code} belongs to ${courseDeptName}.`
            };
        }
    }

    return { valid: true, course, reviewer };
}

/**
 * Gets ranked, department-matched reviewers for a course (Approach 1 + Approach 2).
 */
export async function getDepartmentReviewerRecommendations(params: {
    courseCode: string;
    excludeLecturerId?: number;
}): Promise<ReviewerMatchResult[]> {
    const { courseCode, excludeLecturerId } = params;

    const course = await prisma.course.findUnique({
        where: { code: courseCode },
        select: { id: true, code: true, domain: true, departmentId: true }
    });

    if (!course) return [];

    const activeTerm = await prisma.academicTerm.findFirst({
        where: { isActive: true },
        select: { id: true }
    });

    // Fetch candidate lecturers in the course's department
    const candidateLecturers = await prisma.user.findMany({
        where: {
            isActive: true,
            role: "LECTURER",
            ...(course.departmentId ? { departmentId: course.departmentId } : {}),
            ...(excludeLecturerId ? { id: { not: excludeLecturerId } } : {})
        },
        select: {
            id: true,
            name: true,
            email: true,
            departmentId: true,
            specializations: true,
        }
    });

    // Count pending reviews for workload balancing
    const candidateIds = candidateLecturers.map(c => c.id);
    const [pendingObs, pendingTeach, pendingMods] = await Promise.all([
        prisma.observation.groupBy({
            by: ["observerId"],
            where: {
                observerId: { in: candidateIds },
                status: "PENDING",
                ...(activeTerm ? { termId: activeTerm.id } : {})
            },
            _count: { id: true }
        }),
        prisma.teachingObservation.groupBy({
            by: ["observerId"],
            where: {
                observerId: { in: candidateIds },
                status: "PENDING",
                ...(activeTerm ? { termId: activeTerm.id } : {})
            },
            _count: { id: true }
        }),
        prisma.examModeration.groupBy({
            by: ["moderatorId"],
            where: {
                moderatorId: { in: candidateIds },
                status: "PENDING",
                ...(activeTerm ? { termId: activeTerm.id } : {})
            },
            _count: { id: true }
        })
    ]);

    const reviewCountMap = new Map<number, number>();
    for (const item of pendingObs) {
        reviewCountMap.set(item.observerId, (reviewCountMap.get(item.observerId) || 0) + item._count.id);
    }
    for (const item of pendingTeach) {
        reviewCountMap.set(item.observerId, (reviewCountMap.get(item.observerId) || 0) + item._count.id);
    }
    for (const item of pendingMods) {
        reviewCountMap.set(item.moderatorId, (reviewCountMap.get(item.moderatorId) || 0) + item._count.id);
    }

    const results: ReviewerMatchResult[] = candidateLecturers.map(lecturer => {
        const domainCheck = isDomainSpecializationMatch(course.domain, lecturer.specializations);
        const activeCount = reviewCountMap.get(lecturer.id) || 0;

        return {
            id: lecturer.id,
            name: lecturer.name,
            email: lecturer.email,
            departmentId: lecturer.departmentId,
            specializations: lecturer.specializations,
            isDomainMatch: domainCheck.isMatch,
            matchedDomain: domainCheck.matchedSpecialization,
            activeReviewsCount: activeCount,
            isRecommended: domainCheck.isMatch
        };
    });

    // Sort: Domain matches first, then lowest active workload, then alphabetical
    return results.sort((a, b) => {
        if (a.isDomainMatch && !b.isDomainMatch) return -1;
        if (!a.isDomainMatch && b.isDomainMatch) return 1;
        if (a.activeReviewsCount !== b.activeReviewsCount) {
            return a.activeReviewsCount - b.activeReviewsCount;
        }
        return a.name.localeCompare(b.name);
    });
}

export interface ReciprocalPairInfo {
    lecturer1: { id: number; name: string; email?: string; departmentId: number | null };
    lecturer2: { id: number; name: string; email?: string; departmentId: number | null };
    lecturer1Courses: string[];
    lecturer2Courses: string[];
}
