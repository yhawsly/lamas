/**
 * Pure client-safe pairing utilities.
 * No server/Prisma imports — safe to use in client components.
 */

/**
 * Builds reciprocal peer pairings:
 * For each department, pairs lecturers 1-to-1 (A ⇄ B) so:
 * - Lecturer B reviews Lecturer A's courses (Form A, B, C)
 * - Lecturer A reviews Lecturer B's courses (Form A, B, C)
 *
 * If odd number of lecturers in a department: forms a balanced circular triad (A -> B -> C -> A).
 */
export function buildReciprocalPairingMap(
    faculty: { id: number; name: string; departmentId: number | null; specializations?: string[] }[]
): Record<number, number> {
    const partnerMap: Record<number, number> = {};

    // Group faculty by department
    const deptGroups: Record<string, typeof faculty> = {};
    faculty.forEach(f => {
        const key = f.departmentId ? String(f.departmentId) : "GENERAL";
        if (!deptGroups[key]) deptGroups[key] = [];
        deptGroups[key].push(f);
    });

    Object.values(deptGroups).forEach(group => {
        const n = group.length;
        if (n <= 1) {
            // Only 1 faculty in this department, try to match with any other available faculty
            const otherFaculty = faculty.filter(f => f.id !== group[0]?.id);
            if (otherFaculty.length > 0 && group[0]) {
                partnerMap[group[0].id] = otherFaculty[0].id;
            }
            return;
        }

        if (n % 2 === 0) {
            // Even: perfect 1-to-1 reciprocal pairs (A ⇄ B, C ⇄ D)
            for (let i = 0; i < n; i += 2) {
                const u1 = group[i];
                const u2 = group[i + 1];
                partnerMap[u1.id] = u2.id;
                partnerMap[u2.id] = u1.id;
            }
        } else {
            // Odd: pair first n-3 in pairs, last 3 in a circular triad
            for (let i = 0; i < n - 3; i += 2) {
                const u1 = group[i];
                const u2 = group[i + 1];
                partnerMap[u1.id] = u2.id;
                partnerMap[u2.id] = u1.id;
            }
            // Last 3 in a circular triad (A -> B -> C -> A)
            const u1 = group[n - 3];
            const u2 = group[n - 2];
            const u3 = group[n - 1];
            partnerMap[u1.id] = u2.id; // u1 is observed by u2
            partnerMap[u2.id] = u3.id; // u2 is observed by u3
            partnerMap[u3.id] = u1.id; // u3 is observed by u1
        }
    });

    return partnerMap;
}
