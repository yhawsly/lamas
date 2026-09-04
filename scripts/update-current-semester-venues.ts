import "dotenv/config";
import { prisma } from "../lib/prisma";
import { INSTITUTIONAL_VENUES } from "../lib/venues";

const VENUE_POOL = INSTITUTIONAL_VENUES.map(v => v.value); // ["AVIC LAB", "ARAD LAB", "MAIN OCTAGON", "FAD LAB", "BASEMENT", "DIGITAL LAB", "OCTAGON WING", "V BLOCK"]

async function main() {
    console.log("🚀 Updating Current Semester (Term 10) venues with realistic venues from Previous Semester (Term 1)...");

    const term1 = await prisma.academicTerm.findUnique({ where: { id: 1 } });
    const term10 = await prisma.academicTerm.findUnique({ where: { id: 10 } });

    if (!term1 || !term10) {
        console.error("Terms not found");
        return;
    }

    // 1. Map Previous Semester (Term 1) CourseSections by (courseCode + sectionName)
    const term1Sections = await prisma.courseSection.findMany({
        where: { termId: 1 },
        include: { course: true }
    });

    const venueMapByCourseAndName = new Map<string, string>();
    const venueMapByCourse = new Map<string, string[]>();

    for (const s of term1Sections) {
        if (s.venue) {
            const key = `${s.course.code}__${s.name.trim().toLowerCase()}`;
            venueMapByCourseAndName.set(key, s.venue);

            const list = venueMapByCourse.get(s.course.code) || [];
            list.push(s.venue);
            venueMapByCourse.set(s.course.code, list);
        }
    }

    // 2. Update Term 10 CourseSections
    const term10Sections = await prisma.courseSection.findMany({
        where: { termId: 10 },
        include: { course: true }
    });

    console.log(`Updating ${term10Sections.length} CourseSections in Term 10...`);
    let secIdx = 0;
    for (const s of term10Sections) {
        const key = `${s.course.code}__${s.name.trim().toLowerCase()}`;
        let realisticVenue = venueMapByCourseAndName.get(key);

        if (!realisticVenue) {
            const byCourse = venueMapByCourse.get(s.course.code);
            if (byCourse && byCourse.length > 0) {
                realisticVenue = byCourse[secIdx % byCourse.length];
            } else {
                realisticVenue = VENUE_POOL[secIdx % VENUE_POOL.length];
            }
        }

        await prisma.courseSection.update({
            where: { id: s.id },
            data: { venue: realisticVenue }
        });
        secIdx++;
    }
    console.log("✓ CourseSections updated successfully.");

    // 3. Map Previous Semester (Term 1) Observation Form A
    const term1ObsA = await prisma.observation.findMany({
        where: { termId: 1 }
    });
    const obsAMap = new Map<string, string>();
    term1ObsA.forEach(o => {
        if (o.venue) obsAMap.set(o.courseCode, o.venue);
    });

    const term10ObsA = await prisma.observation.findMany({
        where: { termId: 10 }
    });

    console.log(`Updating ${term10ObsA.length} Observation (Form A) in Term 10...`);
    let aIdx = 0;
    for (const a of term10ObsA) {
        let realisticVenue = obsAMap.get(a.courseCode);
        if (!realisticVenue) {
            const byCourse = venueMapByCourse.get(a.courseCode);
            if (byCourse && byCourse.length > 0) {
                realisticVenue = byCourse[aIdx % byCourse.length];
            } else {
                realisticVenue = VENUE_POOL[aIdx % VENUE_POOL.length];
            }
        }

        await prisma.observation.update({
            where: { id: a.id },
            data: { venue: realisticVenue }
        });
        aIdx++;
    }
    console.log("✓ Observation (Form A) updated successfully.");

    // 4. Map Previous Semester (Term 1) TeachingObservation Form B
    const term1ObsB = await prisma.teachingObservation.findMany({
        where: { termId: 1 }
    });
    const obsBMap = new Map<string, string>();
    term1ObsB.forEach(o => {
        if (o.venue) obsBMap.set(o.courseCode, o.venue);
    });

    const term10ObsB = await prisma.teachingObservation.findMany({
        where: { termId: 10 }
    });

    console.log(`Updating ${term10ObsB.length} TeachingObservation (Form B) in Term 10...`);
    let bIdx = 0;
    for (const b of term10ObsB) {
        let realisticVenue = obsBMap.get(b.courseCode);
        if (!realisticVenue) {
            const byCourse = venueMapByCourse.get(b.courseCode);
            if (byCourse && byCourse.length > 0) {
                realisticVenue = byCourse[bIdx % byCourse.length];
            } else {
                realisticVenue = VENUE_POOL[bIdx % VENUE_POOL.length];
            }
        }

        const bData = (b.formBData as any) || {};
        const updatedMetadata = {
            ...(bData.metadata || {}),
            venue: realisticVenue
        };

        await prisma.teachingObservation.update({
            where: { id: b.id },
            data: {
                venue: realisticVenue,
                formBData: {
                    ...bData,
                    metadata: updatedMetadata
                }
            }
        });
        bIdx++;
    }
    console.log("✓ TeachingObservation (Form B) updated successfully.");

    console.log("\n🎉 ALL CURRENT SEMESTER VENUES SYNCHRONIZED WITH REALISTIC VENUES!");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
